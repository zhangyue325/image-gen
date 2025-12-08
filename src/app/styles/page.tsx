'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { StyleOption, useWizard } from "../providers/WizardProvider";

export default function StylesPage() {
  const router = useRouter();
  const { allStyles, selectedStyles, setSelectedStyleIds, setGlobalError } = useWizard();

  const orderedStyles = useMemo<StyleOption[]>(() => allStyles, [allStyles]);

  const handleStyleClick = (styleId: string) => {
    setSelectedStyleIds([styleId]);
    setGlobalError(null);
    router.push("/upload");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Step 1 of 3
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Choose your styles
            </h1>
            <p className="mt-2 text-base text-slate-600">
              Tap a style to jump to aspect ratio and product upload. You can switch styles later.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span className="text-blue-600">1. Styles</span>
            <span aria-hidden="true">-&gt;</span>
            <span>2. Aspect & product</span>
            <span aria-hidden="true">-&gt;</span>
            <span>3. Results</span>
          </div>
        </div>

        <div className="mt-10 rounded-3xl bg-white/95 p-8 shadow-lg shadow-slate-200/80 backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Select a style to continue</h2>
              <p className="mt-1 text-sm text-slate-500">
                Each card shows the before/after reference. Clicking takes you to the next step.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {selectedStyles.length} selected
            </span>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {orderedStyles.map((style) => {
              return (
                <button
                  type="button"
                  key={style.id}
                  onClick={() => handleStyleClick(style.id)}
                  className={[
                    "flex h-full w-full flex-col gap-4 rounded-2xl border bg-white p-5 text-left shadow-sm transition",
                    "border-slate-200 hover:border-blue-200 hover:shadow-lg"
                  ].join(" ")}
                >
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner">
                    <img
                      src={style.sampleResult || style.sampleOriginal || "/samples/dummy_image.jpg"}
                      alt={`${style.title} example`}
                      className="h-48 w-full object-contain bg-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-900">{style.title}</h3>
                    <p className="text-sm text-slate-500">{style.description}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                      Continue
                    </span>
                    <span>Tap to move to upload</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
            <Link href="/upload" className="font-semibold text-blue-600 hover:text-blue-700">
              Skip ahead to upload
            </Link>
            <span>You can change styles on the next step if needed.</span>
          </div>

        </div>
      </main>
    </div>
  );
}
