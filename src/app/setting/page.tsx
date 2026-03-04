"use client";

import { useState } from "react";
import { useCreativeStore } from "../lib/creative-store";

export default function SettingPage() {
  const { settings, setSettings, resetLocalData } = useCreativeStore();
  const [status, setStatus] = useState<string | null>(null);

  const handleReset = () => {
    resetLocalData();
    setStatus("Local data reset.");
  };

  return (
    <section className="surface-card p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Core Settings</h2>
        <p className="text-sm text-[color:var(--ink-muted)]">
          Main prompt and local storage management.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">Main prompt</label>
        <textarea
          className="min-h-[120px] rounded-2xl border border-[color:var(--ring)] bg-[color:var(--surface-2)] p-3 text-sm"
          value={settings.mainPrompt}
          onChange={(e) =>
            setSettings((prev) => ({
              ...prev,
              mainPrompt: e.target.value,
            }))
          }
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-full border border-[color:var(--ring)] px-5 py-2 text-sm font-semibold"
          onClick={handleReset}
        >
          Reset local data
        </button>
      </div>

      <div className="rounded-2xl border border-dashed border-[color:var(--ring)] p-4 text-xs text-[color:var(--ink-muted)]">
        API key is read from server environment `GEMINI_API_KEY`. Generated files are saved to
        `public/generated`.
      </div>

      {status && (
        <div className="rounded-2xl border border-[color:var(--ring)] bg-white p-4 text-sm text-[color:var(--ink-muted)]">
          {status}
        </div>
      )}
    </section>
  );
}
