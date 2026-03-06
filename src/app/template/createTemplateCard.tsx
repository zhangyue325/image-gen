"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "../../../lib/supabase/client";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image."));
    reader.readAsDataURL(file);
  });
}

export default function CreateTemplateCard() {
  const router = useRouter();
  const [purpose, setPurpose] = useState("ads creative");
  const [prompt, setPrompt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const onCreate = async () => {
    if (!prompt.trim()) {
      setMessage("Prompt is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    let descriptiveImage: string | null = null;
    if (imageFile) {
      descriptiveImage = await fileToDataUrl(imageFile);
    }

    const supabase = createClient();
    const { error } = await supabase.from("template").insert([
      {
        purpose,
        prompt,
        descriptive_image: descriptiveImage,
      },
    ]);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setPrompt("");
    setImageFile(null);
    setMessage("Template created.");
    setSaving(false);
    router.refresh();
  };

  return (
    <div className="border rounded-xl p-3 flex flex-col gap-3 bg-[color:var(--surface-2)]">
      <h3 className="font-semibold text-sm">Create your template</h3>

      <select
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
        className="rounded-lg border border-[color:var(--ring)] bg-white px-2 py-2 text-xs"
      >
        <option value="ads creative">ads creative</option>
        <option value="email">email</option>
        <option value="social media">social media</option>
      </select>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[90px] rounded-lg border border-[color:var(--ring)] bg-white p-2 text-xs"
        placeholder="Template prompt..."
      />

      <select
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
        className="rounded-lg border border-[color:var(--ring)] bg-white px-2 py-2 text-xs"
      >
        <option value="1:1">1:1</option>
        <option value="2:3">2:3</option>
        <option value="3:2">3:2</option>
        <option value="9:16">9:16</option>
        <option value="16:9">16:9</option>
        <option value="21:9">21:9</option>
      </select>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        className="text-xs"
      />

      <button
        type="button"
        disabled={saving}
        onClick={onCreate}
        className="inline-flex items-center justify-center rounded-xl bg-black px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
      >
        {saving ? "Creating..." : "Create template"}
      </button>

      {message && <p className="text-xs text-[color:var(--ink-muted)]">{message}</p>}
    </div>
  );
}
