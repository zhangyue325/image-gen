"use client";

import { useMemo, useState } from "react";
import {
  PURPOSES,
  Purpose,
  useCreativeStore,
} from "../lib/creative-store";

export default function GenerationPage() {
  const { settings, history, addHistory } = useCreativeStore();

  const [mode, setMode] = useState<"image" | "video">("image");
  const [prompt, setPrompt] = useState("");
  const [fineTunePrompt, setFineTunePrompt] = useState("");
  const [purpose, setPurpose] = useState<Purpose>("ads creative");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [size, setSize] = useState("1024");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [fineTuneSource, setFineTuneSource] = useState<"last" | "upload">(
    "last"
  );
  const [fineTuneFile, setFineTuneFile] = useState<File | null>(null);

  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const lastImage = useMemo(
    () => history.find((item) => item.type === "image"),
    [history]
  );

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      setStatus("Add a prompt before generating.");
      return;
    }
    if (!logoFile || !productFile) {
      setStatus("Upload both a brand logo and product image.");
      return;
    }

    setIsBusy(true);
    setStatus("Generating image with Gemini...");

    const form = new FormData();
    form.set("prompt", prompt);
    form.set("mainPrompt", settings.mainPrompt);
    form.set("purpose", purpose);
    form.set("purposePrompt", settings.purposePrompts[purpose]);
    form.set("aspectRatio", aspectRatio);
    form.set("imageSize", size);
    form.set("logo", logoFile);
    form.set("product", productFile);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Generation failed");

      addHistory({
        id: crypto.randomUUID(),
        type: "image",
        url: data.url,
        prompt,
        createdAt: new Date().toISOString(),
        purpose,
      });
      setStatus("Image generated and saved locally.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsBusy(false);
    }
  };

  const handleFineTuneImage = async () => {
    if (!fineTunePrompt.trim()) {
      setStatus("Add a fine-tune prompt before refining.");
      return;
    }
    if (!logoFile || !productFile) {
      setStatus("Upload both a brand logo and product image.");
      return;
    }

    let previousImage: File | null = null;
    if (fineTuneSource === "upload") {
      previousImage = fineTuneFile;
    } else if (lastImage) {
      const blob = await fetch(lastImage.url).then((r) => r.blob());
      previousImage = new File([blob], "previous.png", { type: blob.type });
    }

    if (!previousImage) {
      setStatus("Select a source image to refine.");
      return;
    }

    setIsBusy(true);
    setStatus("Refining image with Gemini...");

    const form = new FormData();
    form.set("prompt", fineTunePrompt);
    form.set("mainPrompt", settings.mainPrompt);
    form.set("purpose", purpose);
    form.set("purposePrompt", settings.purposePrompts[purpose]);
    form.set("aspectRatio", aspectRatio);
    form.set("imageSize", size);
    form.set("logo", logoFile);
    form.set("product", productFile);
    form.set("previousImage", previousImage);
    form.set("mode", "fine-tune");

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Refine failed");

      addHistory({
        id: crypto.randomUUID(),
        type: "image",
        url: data.url,
        prompt: fineTunePrompt,
        createdAt: new Date().toISOString(),
        purpose,
      });
      setStatus("Refined image saved locally.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Refine failed");
    } finally {
      setIsBusy(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!prompt.trim()) {
      setStatus("Add a prompt before generating.");
      return;
    }
    if (!productFile) {
      setStatus("Upload a product image for video reference.");
      return;
    }

    setIsBusy(true);
    setStatus("Generating video with Veo. This can take a few minutes...");

    const form = new FormData();
    form.set("prompt", prompt);
    form.set("fineTunePrompt", fineTunePrompt);
    form.set("mainPrompt", settings.mainPrompt);
    form.set("purpose", purpose);
    form.set("purposePrompt", settings.purposePrompts[purpose]);
    form.set("aspectRatio", aspectRatio);
    form.set("size", size);
    form.set("product", productFile);

    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Video failed");

      addHistory({
        id: crypto.randomUUID(),
        type: "video",
        url: data.url,
        prompt,
        createdAt: new Date().toISOString(),
        purpose,
      });
      setStatus("Video generated and saved locally.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Video failed");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section className="surface-card p-6 flex flex-col gap-6">
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === "image"
                ? "bg-[color:var(--accent)] text-white"
                : "bg-[color:var(--surface-2)]"
            }`}
            onClick={() => setMode("image")}
          >
            Image Studio
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === "video"
                ? "bg-[color:var(--accent-2)] text-white"
                : "bg-[color:var(--surface-2)]"
            }`}
            onClick={() => setMode("video")}
          >
            Video Studio
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Purpose</label>
            <select
              className="rounded-2xl border border-[color:var(--ring)] bg-white px-3 py-2 text-sm"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as Purpose)}
            >
              {PURPOSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Aspect</label>
              <input
                className="rounded-2xl border border-[color:var(--ring)] bg-white px-3 py-2 text-sm"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Size</label>
              <input
                className="rounded-2xl border border-[color:var(--ring)] bg-white px-3 py-2 text-sm"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Prompt</label>
          <textarea
            className="min-h-[120px] rounded-2xl border border-[color:var(--ring)] bg-[color:var(--surface-2)] p-3 text-sm"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        {mode === "image" ? (
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-2 text-sm font-medium">
                Brand logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="text-sm"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Product image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProductFile(e.target.files?.[0] || null)}
                  className="text-sm"
                />
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Fine-tune prompt</label>
              <textarea
                className="min-h-[80px] rounded-2xl border border-[color:var(--ring)] bg-white p-3 text-sm"
                value={fineTunePrompt}
                onChange={(e) => setFineTunePrompt(e.target.value)}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Refine source</label>
                <select
                  className="rounded-2xl border border-[color:var(--ring)] bg-white px-3 py-2 text-sm"
                  value={fineTuneSource}
                  onChange={(e) =>
                    setFineTuneSource(e.target.value as "last" | "upload")
                  }
                >
                  <option value="last">Last generated image</option>
                  <option value="upload">Upload source image</option>
                </select>
              </div>
              {fineTuneSource === "upload" ? (
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Source image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFineTuneFile(e.target.files?.[0] || null)}
                    className="text-sm"
                  />
                </label>
              ) : (
                <div className="flex flex-col gap-2 text-sm text-[color:var(--ink-muted)]">
                  <span>Using the latest generated image.</span>
                  <span>{lastImage ? "Ready to refine." : "Generate an image first."}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-[color:var(--accent)] px-5 py-2 text-sm font-semibold text-white shadow"
                disabled={isBusy}
                onClick={handleGenerateImage}
              >
                Generate image
              </button>
              <button
                className="rounded-full border border-[color:var(--ring)] px-5 py-2 text-sm font-semibold"
                disabled={isBusy}
                onClick={handleFineTuneImage}
              >
                Refine image
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <label className="flex flex-col gap-2 text-sm font-medium">
              Product image (reference)
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProductFile(e.target.files?.[0] || null)}
                className="text-sm"
              />
            </label>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Fine-tune prompt</label>
              <textarea
                className="min-h-[80px] rounded-2xl border border-[color:var(--ring)] bg-white p-3 text-sm"
                value={fineTunePrompt}
                onChange={(e) => setFineTunePrompt(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white"
                disabled={isBusy}
                onClick={handleGenerateVideo}
              >
                Generate video
              </button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-[color:var(--ring)] bg-white p-4 text-sm text-[color:var(--ink-muted)]">
          {status || "Ready."}
        </div>

        <div className="grid gap-4">
          <h3 className="text-sm font-semibold">Recent outputs</h3>
          <div className="grid gap-3">
            {history.length === 0 && (
              <div className="text-sm text-[color:var(--ink-muted)]">
                Generated images and videos will show up here.
              </div>
            )}
            {history.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-2xl border border-[color:var(--ring)] bg-[color:var(--surface-2)] p-3"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--ink-muted)]">
                  <span className="uppercase tracking-[0.2em]">
                    {item.type}
                  </span>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                  <span className="rounded-full bg-white px-2 py-1">
                    {item.purpose}
                  </span>
                </div>
                <div className="text-sm font-medium">{item.prompt}</div>
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt="Generated output"
                    className="w-full rounded-2xl border border-[color:var(--ring)] object-cover"
                  />
                ) : (
                  <video
                    src={item.url}
                    controls
                    className="w-full rounded-2xl border border-[color:var(--ring)]"
                  />
                )}
                <div className="flex gap-2 text-xs">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[color:var(--ring)] px-3 py-1"
                  >
                    Open file
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
