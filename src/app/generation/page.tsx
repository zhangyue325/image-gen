"use client";

import { useEffect, useState } from "react";
import ImageGenerationForm from "./image-generation-form";
import VideoGenerationForm from "./video-generation-form";
import { DraftPayload } from "./types";

export default function GenerationPage() {
  const DRAFT_KEY = "generate:draft";
  const [mode, setMode] = useState<"image" | "video">("image");

  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;

    try {
      const draft = JSON.parse(raw) as DraftPayload;
      if (draft.type === "video") {
        setMode("video");
      } else {
        setMode("image");
      }
    } catch {
      // ignore invalid draft
    }
  }, []);

  return (
    <section className="surface-card p-6 flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("image")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            mode === "image"
              ? "bg-black text-white"
              : "border border-[color:var(--ring)] bg-white text-[color:var(--ink-muted)]"
          }`}
        >
          Image
        </button>
        <button
          type="button"
          onClick={() => setMode("video")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            mode === "video"
              ? "bg-black text-white"
              : "border border-[color:var(--ring)] bg-white text-[color:var(--ink-muted)]"
          }`}
        >
          Video
        </button>
      </div>

      {mode === "image" ? <ImageGenerationForm /> : <VideoGenerationForm />}
    </section>
  );
}
