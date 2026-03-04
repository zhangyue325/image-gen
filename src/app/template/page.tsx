"use client";

import { useState } from "react";
import { PURPOSES, Purpose, useCreativeStore } from "../lib/creative-store";

const templateArt = (title: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns='http://www.w3.org/2000/svg' width='640' height='400'>
  <defs>
    <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#ffe2b8'/>
      <stop offset='100%' stop-color='#c2f1e4'/>
    </linearGradient>
  </defs>
  <rect width='100%' height='100%' rx='28' fill='url(#g)'/>
  <rect x='32' y='36' width='220' height='28' rx='14' fill='rgba(0,0,0,0.12)'/>
  <rect x='32' y='86' width='360' height='20' rx='10' fill='rgba(0,0,0,0.18)'/>
  <rect x='32' y='120' width='280' height='20' rx='10' fill='rgba(0,0,0,0.18)'/>
  <rect x='32' y='280' width='160' height='40' rx='20' fill='rgba(0,0,0,0.22)'/>
  <text x='32' y='250' font-size='28' font-family='Arial' fill='rgba(0,0,0,0.7)'>${title}</text>
</svg>
`)}`;

const TEMPLATES = [
  {
    id: "bold-launch",
    name: "Bold Launch",
    prompt:
      "High-contrast layout with a bold headline, oversized product hero, and clear call-to-action. Use clean geometric shapes and a confident, premium tone.",
    sample: templateArt("Bold Launch"),
  },
  {
    id: "editorial-soft",
    name: "Editorial Soft",
    prompt:
      "Soft lighting, calm palette, and ample whitespace. Emphasize readability for email, with subtle texture and understated typography.",
    sample: templateArt("Editorial Soft"),
  },
  {
    id: "social-burst",
    name: "Social Burst",
    prompt:
      "Vibrant, scroll-stopping layout with playful asymmetry. Use punchy contrast, layered stickers, and a sense of motion.",
    sample: templateArt("Social Burst"),
  },
];

export default function TemplatePage() {
  const { settings, setSettings } = useCreativeStore();
  const [selectedPurpose, setSelectedPurpose] =
    useState<Purpose>("ads creative");

  const applyTemplate = (prompt: string) => {
    setSettings((prev) => ({
      ...prev,
      purposePrompts: { ...prev.purposePrompts, [selectedPurpose]: prompt },
    }));
  };

  return (
    <section className="surface-card p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Template Gallery</h2>
        <p className="text-sm text-[color:var(--ink-muted)]">
          Browse designed templates. Pick a purpose and apply a prompt with one
          click.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">
          Apply to purpose
        </span>
        <select
          className="rounded-2xl border border-[color:var(--ring)] bg-white px-3 py-2 text-sm"
          value={selectedPurpose}
          onChange={(e) => setSelectedPurpose(e.target.value as Purpose)}
        >
          {PURPOSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <div className="text-xs text-[color:var(--ink-muted)]">
          Current prompt: {settings.purposePrompts[selectedPurpose]}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {TEMPLATES.map((template) => (
          <div
            key={template.id}
            className="rounded-2xl border border-[color:var(--ring)] bg-white p-4 flex flex-col gap-4"
          >
            <img
              src={template.sample}
              alt={`${template.name} sample`}
              className="w-full rounded-2xl border border-[color:var(--ring)] object-cover"
            />
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">{template.name}</h3>
              <p className="text-sm text-[color:var(--ink-muted)]">
                {template.prompt}
              </p>
            </div>
            <button
              className="rounded-full border border-[color:var(--ring)] px-4 py-2 text-sm font-semibold"
              onClick={() => applyTemplate(template.prompt)}
            >
              Use for {selectedPurpose}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
