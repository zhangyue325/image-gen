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
      JSON.parse(raw) as DraftPayload;
      setMode("image");
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
              : "border border-(--ring) bg-white text-[color:var(--ink-muted)]"
          }`}
        >
          Image
        </button>
        <button
          type="button"
          disabled
          className={`relative rounded-xl px-4 py-2 text-sm font-semibold ${
            mode === "video"
              ? "bg-black text-white"
              : "border border-(--ring) bg-white text-[color:var(--ink-muted)]"
          } opacity-60 cursor-not-allowed`}
        >
          Video
          <span className="absolute -right-2 -top-2 rounded-full border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-amber-900">
            beta
          </span>
        </button>
      </div>

      {mode === "image" ? <ImageGenerationForm /> : <VideoGenerationForm />}
    </section>
  );
}
