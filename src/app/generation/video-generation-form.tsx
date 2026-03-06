"use client";

import { useEffect, useState } from "react";
import ReferenceImageList from "./reference-image-list";
import { DraftPayload, ReferenceImagePayload, UploadItem } from "./types";
import { fileNameWithoutExt, fileToBase64 } from "./utils";

export default function VideoGenerationForm() {
  const DRAFT_KEY = "generate:draft";
  const PURPOSE_OPTIONS = ["ads creative", "email", "social media"] as const;
  const ASPECT_OPTIONS = ["16:9", "9:16"] as const;
  const VIDEO_LENGTH_OPTIONS = ["8"] as const;
  const RESOLUTION_OPTIONS = ["720p", "1080p"] as const;

  const [prompt, setPrompt] = useState("");
  const [purpose, setPurpose] = useState<string>("ads creative");
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [videoLength, setVideoLength] = useState<string>("8");
  const [resolution, setResolution] = useState<string>("720p");
  const [images, setImages] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultVideoUrl, setResultVideoUrl] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;

    try {
      const draft = JSON.parse(raw) as DraftPayload;
      setPrompt(draft.prompt ?? "");
      setPurpose(draft.purpose ?? "ads creative");
      setAspectRatio(draft.ratio ?? "16:9");
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

  const buildReferenceImages = async (): Promise<ReferenceImagePayload[]> => {
    return Promise.all(
      images.map(async (item) => ({
        name: item.name,
        mimeType: item.file.type || "image/png",
        data: await fileToBase64(item.file),
      }))
    );
  };

  const onGenerateVideo = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");
    setResultVideoUrl("");

    try {
      const referenceImages = await buildReferenceImages();

      const res = await fetch("/api/generate_video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          purpose,
          aspectRatio,
          videoLength,
          resolution,
          referenceImages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Video generation failed");
        return;
      }

      setResultVideoUrl(
        `data:${data.mimeType || "video/mp4"};base64,${data.videoBase64}`
      );
    } catch {
      setError("Video generation failed");
    } finally {
      setLoading(false);
    }
  };

  const onDownloadVideo = () => {
    if (!resultVideoUrl) return;
    const link = document.createElement("a");
    link.href = resultVideoUrl;
    link.download = "generated-video.mp4";
    link.click();
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what to generate..."
          className="min-h-[150px] rounded-xl border p-3 text-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Model</label>
          <select
            className="rounded-xl border border-[color:var(--ring)] bg-white px-3 py-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            defaultValue="veo-3.1-fast-generate-preview"
            disabled
          >
            <option value="veo-3.1-fast-generate-preview">veo-3.1-fast-generate-preview</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Purpose</label>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="rounded-xl border bg-white px-3 py-2 text-sm"
          >
            {PURPOSE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Aspect ratio</label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="rounded-xl border bg-white px-3 py-2 text-sm"
          >
            {ASPECT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Video length</label>
          <select
            value={videoLength}
            onChange={(e) => setVideoLength(e.target.value)}
            className="rounded-xl border bg-white px-3 py-2 text-sm"
          >
            {VIDEO_LENGTH_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}s
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

      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled
          className="rounded-xl border border-[color:var(--ring)] bg-white px-5 py-2 text-sm font-semibold text-[color:var(--ink-muted)] opacity-60 cursor-not-allowed"
        >
          Refine prompt
        </button>
        <button
          type="button"
          onClick={onGenerateVideo}
          disabled={loading || !prompt.trim()}
          className="rounded-xl bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Generating..." : "Generate video"}
        </button>
      </div>

      {error ? <pre className="text-sm text-red-600">{error}</pre> : null}

      {resultVideoUrl ? (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">Generated video</h3>
          <video src={resultVideoUrl} controls className="w-full max-w-xl rounded-xl border" />
          <div>
            <button
              type="button"
              onClick={onDownloadVideo}
              className="rounded-xl border px-4 py-2 text-sm font-medium"
            >
              Download
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
