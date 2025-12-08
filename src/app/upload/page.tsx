'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import { useWizard } from "../providers/WizardProvider";

export default function UploadPage() {
  const router = useRouter();
  const {
    ratio,
    ratioOptions,
    setRatio,
    productPreview,
    productFile,
    setProductImage,
    selectedStyles,
    globalError,
    setGlobalError,
    isGenerating,
    startGeneration
  } = useWizard();

  const [localError, setLocalError] = useState<string | null>(null);
  const hasSelections = selectedStyles.length > 0;

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setLocalError(null);
    setGlobalError(null);
    setProductImage(file);
  };

  const handleGenerate = async () => {
    setLocalError(null);
    const started = await startGeneration();
    if (!started) {
      setLocalError("Please add a product image and choose at least one style.");
      return;
    }
    router.push("/results");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Step 2 of 3
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Choose aspect ratio & product image
            </h1>
            <p className="mt-2 text-base text-slate-600">
              Upload the product photo and select a canvas that fits your campaign.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Link href="/styles" className="hover:text-slate-700">
              1. Styles
            </Link>
            <span aria-hidden="true">-&gt;</span>
            <span className="text-blue-600">2. Aspect & product</span>
            <span aria-hidden="true">-&gt;</span>
            <span>3. Results</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-6 rounded-3xl bg-white/95 p-6 shadow-lg shadow-slate-200/80 backdrop-blur">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="ratio"
                  className="text-sm font-semibold uppercase tracking-wide text-slate-500"
                >
                  Aspect Ratio
                </label>
                <span className="text-xs text-slate-500">
                  {selectedStyles.length} styles selected
                </span>
              </div>
              <select
                id="ratio"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={ratio}
                onChange={(event) => setRatio(event.target.value)}
              >
                {ratioOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                Choose the canvas that matches your channel. You can change this later and regenerate.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Product Image
                </span>
                <Link
                  href="/styles"
                  className="text-xs font-semibold uppercase tracking-wide text-blue-600 hover:text-blue-700"
                >
                  Edit styles
                </Link>
              </div>
              <label className="flex h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-100/80 text-center text-slate-500 transition hover:border-blue-400 hover:bg-blue-50/70">
                <span className="text-sm font-medium">
                  {productFile ? "Replace product image" : "Drag & drop or click to upload"}
                </span>
                <span className="mt-1 text-xs text-slate-500">PNG, JPG, or WebP up to 10 MB</span>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={onFileChange}
                />
              </label>
              {productPreview ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-inner">
                  <img
                    src={productPreview}
                    alt="Uploaded product preview"
                    className="max-h-64 w-full object-cover"
                  />
                </div>
              ) : null}
            </div>
          </div>

          {globalError || localError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {globalError || localError}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/styles"
              className="text-center text-sm font-semibold text-slate-600 transition hover:text-slate-800"
            >
              ← Back to styles
            </Link>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <p className="text-xs text-slate-500">
                You&apos;ll generate with {selectedStyles.length} style
                {selectedStyles.length === 1 ? "" : "s"} at a {ratio} canvas.
              </p>
              <button
                className={[
                  "w-full rounded-xl px-5 py-3 text-sm font-semibold shadow-lg transition sm:w-auto",
                  productFile && hasSelections
                    ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl"
                    : "cursor-not-allowed bg-slate-300 text-slate-600 shadow-none",
                  isGenerating ? "opacity-80" : ""
                ].join(" ")}
                disabled={!productFile || !hasSelections || isGenerating}
                onClick={handleGenerate}
              >
                {isGenerating ? "Generating creatives..." : "Generate creatives"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
