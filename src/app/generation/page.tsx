"use client";

import { useEffect, useState } from "react";

const DRAFT_KEY = "generate:draft";

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

const RATIO_OPTIONS = ["1:1", "2:3", "3:2", "4:5", "5:4", "9:16", "16:9", "21:9"] as const;
const RESOLUTION_OPTIONS = ["1K", "2K", "3K"] as const;

function fileNameWithoutExt(filename: string) {
  const index = filename.lastIndexOf(".");
  return index > 0 ? filename.slice(0, index) : filename;
}

export default function GenerationPage() {
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState<string>("9:16");
  const [resolution, setResolution] = useState<string>("1K");
  const [images, setImages] = useState<UploadItem[]>([]);

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

  const onGenerate = () => {
    console.log({
      prompt,
      ratio,
      resolution,
      images: images.map((item) => ({
        name: item.name,
        filename: item.file.name,
        type: item.file.type,
      })),
    });
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
        <h3 className="text-sm font-medium">Reference Image list</h3>
        {images.length === 0 ? (
          <div className="rounded-xl border border-dashed p-4 text-sm">
            No images uploaded yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {images.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border  bg-white p-3 grid gap-3 md:grid-cols-[1fr_220px_100px]"
              >
                <div className="text-sm">
                  <div className="font-medium">{item.file.name}</div>
                  <div className="text-xs ">{item.file.type || "image"}</div>
                </div>

                <input
                  value={item.name}
                  onChange={(e) => onChangeImageName(item.id, e.target.value)}
                  placeholder="Image name"
                  className="rounded-lg border px-3 py-2 text-sm"
                />

                <button
                  type="button"
                  onClick={() => onRemoveImage(item.id)}
                  className="rounded-lg border px-3 py-2 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onGenerate}
          className="rounded-xl bg-black px-5 py-2 text-sm font-semibold text-white"
        >
          Generate
        </button>
      </div>
    </section>
  );
}
