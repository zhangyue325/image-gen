'use client';

import Link from "next/link";
import { useMemo } from "react";
import { StyleId, StyleOption, useWizard } from "../providers/WizardProvider";

export default function ResultsPage() {
  const {
    ratio,
    selectedStyles,
    requestedStyles,
    stylesLookup,
    results,
    productFile,
    productPreview,
    globalError,
    styleFeedback,
    updateStyleFeedback,
    startGeneration,
    isGenerating,
    downloadImage
  } = useWizard();

  const displayedStyleIds = requestedStyles.length ? requestedStyles : selectedStyles;
  const orderedStyles = useMemo(
    () =>
      displayedStyleIds
        .map((styleId) => stylesLookup[styleId])
        .filter((style): style is StyleOption => Boolean(style)),
    [displayedStyleIds, stylesLookup]
  );

  const handleRegenerate = (styleId: StyleId) => {
    void startGeneration([styleId], { includeFeedback: false });
  };

  const handleFineTune = (styleId: StyleId) => {
    void startGeneration([styleId], { includeFeedback: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Step 3 of 3
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Generated ad set
            </h1>
            <p className="mt-2 text-base text-slate-600">
              Regenerate any look to explore variations or fine-tune with instructions.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Link href="/styles" className="hover:text-slate-700">
              1. Styles
            </Link>
            <span aria-hidden="true">-&gt;</span>
            <Link href="/upload" className="hover:text-slate-700">
              2. Aspect & product
            </Link>
            <span aria-hidden="true">-&gt;</span>
            <span className="text-blue-600">3. Results</span>
          </div>
        </div>

        <section className="mt-10 rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/80">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Aspect ratio {ratio}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {displayedStyleIds.length} style{displayedStyleIds.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Link
                href="/upload"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
              >
                Back to inputs
              </Link>
            </div>
          </div>

          {productPreview ? (
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-inner sm:flex-row sm:items-center sm:gap-5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Product input
              </span>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner sm:w-48">
                <img
                  src={productPreview}
                  alt="Uploaded product preview"
                  className="h-40 w-full object-cover"
                />
              </div>
            </div>
          ) : null}

          {globalError ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {globalError}
            </div>
          ) : null}

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {orderedStyles.length ? (
              orderedStyles.map((style) => {
                const result = results[style.id];
                const feedbackId = `feedback-${style.id.replace(/\s+/g, "-")}`;
                return (
                  <div
                    key={style.id}
                    className={[
                      "flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm",
                      selectedStyles.includes(style.id) ? "ring-1 ring-blue-200" : ""
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{style.title}</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {style.description ||
                            (style.kind === "custom"
                              ? "Generated with your custom instructions."
                              : "")}
                        </p>
                        {style.kind === "custom" ? (
                          <div className="mt-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            <span className="font-semibold">Prompt instructions</span>
                            <p className="mt-1 whitespace-pre-wrap text-amber-900">{style.prompt}</p>
                          </div>
                        ) : null}
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {result?.status === "idle" && "Waiting"}
                        {result?.status === "loading" && "Generating"}
                        {result?.status === "ready" && "Ready"}
                        {result?.status === "error" && "Error"}
                      </span>
                    </div>

                    {result?.error ? (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {result.error}
                      </div>
                    ) : null}

                    {result?.imageUrl ? (
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner">
                        <img
                          src={result.imageUrl}
                          alt={`${style.title} creative`}
                          className="w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-400">
                        {result?.status === "loading"
                          ? "Rendering your creative..."
                          : "Generate to see this style."}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label
                        htmlFor={feedbackId}
                        className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        Tell the AI how to improve this creative
                      </label>
                      <textarea
                        id={feedbackId}
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="E.g. brighten the background, add more focus on the shoes..."
                        value={styleFeedback[style.id] ?? ""}
                        onChange={(event) => updateStyleFeedback(style.id, event.target.value)}
                      />
                      <p className="text-xs text-slate-400">
                        This note is used when you choose Fine-tune with prompt.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <button
                        className={[
                          "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition",
                          result?.status === "loading" || isGenerating
                            ? "cursor-not-allowed border-slate-300 text-slate-400"
                            : "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100"
                        ].join(" ")}
                        onClick={() => handleRegenerate(style.id)}
                        disabled={!productFile || result?.status === "loading" || isGenerating}
                      >
                        {result?.status === "loading" ? "Working..." : "Generate new"}
                      </button>
                      <button
                        className={[
                          "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition",
                          result?.status === "loading" || isGenerating
                            ? "cursor-not-allowed border-slate-300 text-slate-400"
                            : styleFeedback[style.id]?.trim()
                                ? "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100"
                                : "border-slate-200 bg-slate-100 text-slate-400"
                        ].join(" ")}
                        onClick={() => handleFineTune(style.id)}
                        disabled={
                          !productFile ||
                          result?.status === "loading" ||
                          isGenerating ||
                          !styleFeedback[style.id]?.trim()
                        }
                      >
                        {result?.status === "loading" ? "Working..." : "Fine-tune with prompt"}
                      </button>
                      <button
                        className={[
                          "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition",
                          result?.imageUrl
                            ? "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                            : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                        ].join(" ")}
                        onClick={() => downloadImage(style.id)}
                        disabled={!result?.imageUrl}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center text-sm text-slate-500">
                Run a generation first to see results here.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
