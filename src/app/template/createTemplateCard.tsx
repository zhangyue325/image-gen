"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

type CreateTemplateCardProps = {
  purposeOptions: string[];
  typeOptions: string[];
  imageModelOptions: string[];
  videoModelOptions: string[];
  imageRatioOptions: string[];
  videoRatioOptions: string[];
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image."));
    reader.readAsDataURL(file);
  });
}

export default function CreateTemplateCard({
  purposeOptions,
  typeOptions,
  imageModelOptions,
  videoModelOptions,
  imageRatioOptions,
  videoRatioOptions,
}: CreateTemplateCardProps) {
  const router = useRouter();
  const [templateName, setTemplateName] = useState("");
  const [type, setType] = useState(typeOptions[0] ?? "");
  const [purpose, setPurpose] = useState(purposeOptions[0] ?? "");
  const [model, setModel] = useState(imageModelOptions[0] ?? videoModelOptions[0] ?? "");
  const [ratio, setRatio] = useState(imageRatioOptions[0] ?? videoRatioOptions[0] ?? "");
  const [author, setAuthor] = useState("");
  const [prompt, setPrompt] = useState("");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const activeModelOptions = type === "video" ? videoModelOptions : imageModelOptions;
  const activeRatioOptions = type === "video" ? videoRatioOptions : imageRatioOptions;

  useEffect(() => {
    setModel(activeModelOptions[0] ?? "");
  }, [type, activeModelOptions]);

  useEffect(() => {
    setRatio(activeRatioOptions[0] ?? "");
  }, [type, activeRatioOptions]);

  useEffect(() => {
    setReferenceFile(null);
  }, [type]);

  const onCreate = async () => {
    if (!prompt.trim()) {
      setMessage("Prompt is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    let descriptiveImage: string | null = null;
    if (referenceFile) {
      descriptiveImage = await fileToDataUrl(referenceFile);
    }

    const supabase = createClient();
    const { error } = await supabase.from("template").insert([
      {
        template_name: templateName || null,
        type: type || null,
        purpose: purpose || null,
        model: model || null,
        ratio: ratio || null,
        author: author || null,
        prompt,
        descriptive_image: descriptiveImage,
      },
    ]);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setTemplateName("");
    setPrompt("");
    setAuthor("");
    setReferenceFile(null);
    setMessage("Template created.");
    setSaving(false);
    router.refresh();
  };

  return (
    <div className="border rounded-xl p-3 flex flex-col gap-3 bg-[color:var(--surface-2)]">
      <h3 className="font-semibold text-sm">Create your template</h3>

      <input
        value={templateName}
        onChange={(e) => setTemplateName(e.target.value)}
        placeholder="Template name"
        className="rounded-lg border border-(--ring) bg-white px-2 py-2 text-xs"
      />

      <div className="grid gap-2 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[color:var(--ink-muted)]">type</label>
          {typeOptions.length > 0 ? (
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border border-(--ring) bg-white px-2 py-2 text-xs"
            >
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Type"
              className="rounded-lg border border-(--ring) bg-white px-2 py-2 text-xs"
            />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-[color:var(--ink-muted)]">purpose</label>
          {purposeOptions.length > 0 ? (
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="rounded-lg border border-(--ring) bg-white px-2 py-2 text-xs"
            >
              {purposeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Purpose"
              className="rounded-lg border border-(--ring) bg-white px-2 py-2 text-xs"
            />
          )}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[color:var(--ink-muted)]">model</label>
          {activeModelOptions.length > 0 ? (
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="rounded-lg border border-(--ring) bg-white px-2 py-2 text-xs"
            >
              {activeModelOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Model"
              className="rounded-lg border border-(--ring) bg-white px-2 py-2 text-xs"
            />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-[color:var(--ink-muted)]">ratio</label>
          {activeRatioOptions.length > 0 ? (
            <select
              value={ratio}
              onChange={(e) => setRatio(e.target.value)}
              className="rounded-lg border border-(--ring) bg-white px-2 py-2 text-xs"
            >
              {activeRatioOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={ratio}
              onChange={(e) => setRatio(e.target.value)}
              placeholder="Ratio"
              className="rounded-lg border border-(--ring) bg-white px-2 py-2 text-xs"
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[color:var(--ink-muted)]">author</label>
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Author"
          className="rounded-lg border border-(--ring) bg-white px-2 py-2 text-xs"
        />
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[160px] rounded-lg border border-(--ring) bg-white p-2 text-xs"
        placeholder="Template prompt..."
      />

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[color:var(--ink-muted)]">
          {type === "video" ? "Reference video" : "Reference image"}
        </label>
        <input
          type="file"
          accept={type === "video" ? "video/*" : "image/*"}
          onChange={(e) => setReferenceFile(e.target.files?.[0] || null)}
          className="text-xs"
        />
      </div>

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
