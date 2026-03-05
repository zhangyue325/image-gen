"use client";

import { useEffect, useState } from "react";
import GeneratedImagePanel from "./generated-image-panel";
import ReferenceImageList from "./reference-image-list";
import { fileNameWithoutExt, fileToBase64 } from "./utils";

export default function GenerationPage() {
  type DraftPayload = {
    prompt?: string;
    ratio?: string;
    size?: string;
    templateId?: number;
  };

  type UploadItem = {
    id: string;
    file: File;
    name: string;
  };

  type ReferenceImagePayload = {
    name: string;
    mimeType: string;
    data: string;
  };

  const DRAFT_KEY = "generate:draft";

  const RATIO_OPTIONS = ["1:1", "2:3", "3:2", "4:5", "5:4", "9:16", "16:9", "21:9"] as const;
  const RESOLUTION_OPTIONS = ["1K", "2K", "3K"] as const;

  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState<string>("9:16");
  const [resolution, setResolution] = useState<string>("1K");
  const [images, setImages] = useState<UploadItem[]>([]);
  const [resultImageUrl, setResultImageUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fineTuningPrompt, setFineTuningPrompt] = useState("");
  const [fineTuningLoading, setFineTuningLoading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;

    try {
      const draft = JSON.parse(raw) as DraftPayload;
      setPrompt(draft.prompt ?? "");
      setRatio(draft.ratio ?? "9:16");
      setResolution(draft.size ?? "1K");
    } catch {
      // ignore invalid draft
    }
  }, []);

  const onUploadImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const nextItems: UploadItem[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      name: fileNameWithoutExt(file.name),
    }));

    setImages((prev) => [...prev, ...nextItems]);
  };

  const onChangeImageName = (id: string, nextName: string) => {
    setImages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: nextName } : item))
    );
  };

  const onRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((item) => item.id !== id));
  };

  const onGenerate = async () => {
    setLoading(true);
    setError("");
    setResultImageUrl("");

    try {
      const referenceImages: ReferenceImagePayload[] = await Promise.all(
        images.map(async (item) => ({
          name: item.name,
          mimeType: item.file.type || "image/png",
          data: await fileToBase64(item.file),
        }))
      );

      const res = await fetch("/api/generate_image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          ratio,
          resolution,
          referenceImages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed");
        return;
      }

      setResultImageUrl(`data:image/png;base64,${data.imageBase64}`);
    } catch {
      setError("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const onDownload = () => {
    if (!resultImageUrl) return;
    const link = document.createElement("a");
    link.href = resultImageUrl;
    link.download = "generated-image.png";
    link.click();
  };

  const onFineTune = async () => {
    if (!resultImageUrl || !fineTuningPrompt.trim()) return;

    const [header, data = ""] = resultImageUrl.split(",");
    const mimeMatch = header.match(/data:(.*?);base64/);
    const imageMimeType = mimeMatch?.[1] || "image/png";

    setFineTuningLoading(true);
    setError("");

    try {
      const res = await fetch("/api/fine_tune_image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fineTuningPrompt,
          imageBase64: data,
          imageMimeType,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Fine-tuning failed");
        return;
      }

      setResultImageUrl(`data:image/png;base64,${result.imageBase64}`);
    } catch {
      setError("Fine-tuning failed");
    } finally {
      setFineTuningLoading(false);
    }
  };

  return (
    <section className="surface-card p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Generation</h2>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what to generate..."
          className=" rounded-xl border p-3 text-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Ratio</label>
          <select
            value={ratio}
            onChange={(e) => setRatio(e.target.value)}
            className="rounded-xl border bg-white px-3 py-2 text-sm"
          >
            {RATIO_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Resolution</label>
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className="rounded-xl border bg-white px-3 py-2 text-sm"
          >
            {RESOLUTION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Upload reference images</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => onUploadImages(e.target.files)}
          className="rounded-xl border bg-white px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-3">
        <ReferenceImageList
          images={images}
          onChangeImageName={onChangeImageName}
          onRemoveImage={onRemoveImage}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading || !prompt.trim()}
          className="rounded-xl bg-black px-5 py-2 text-sm font-semibold text-white"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>

      {error ? <pre className="text-sm text-red-600">{error}</pre> : null}
      <GeneratedImagePanel
        resultImageUrl={resultImageUrl}
        fineTuningPrompt={fineTuningPrompt}
        fineTuningLoading={fineTuningLoading}
        onDownload={onDownload}
        onFineTune={onFineTune}
        onChangeFineTuningPrompt={setFineTuningPrompt}
      />
    </section>
  );
}
