"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

export default function SettingPage() {
  const supabase = createClient();

  const [setting, setSetting] = useState<any>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("setting")
        .select("id,user_name,main_prompt,logo")
        .eq("user_name", "Pazzion")
        .single();

      if (!error && data) {
        setSetting(data);
        setPrompt(data.main_prompt);
      }

      setLoading(false);
    }

    load();
  }, []);

  async function save() {
    if (!setting) return;

    await supabase
      .from("setting")
      .update({ main_prompt: prompt })
      .eq("id", setting.id);

    alert("Saved");
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <section className="surface-card p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">Main prompt</label>

        <textarea
          className="min-h-[250px] rounded-2xl border p-3 text-sm"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <label className="text-sm font-medium">Logo</label>
      <img src={setting.logo} alt="logo" style={{ width: 200 }} />

      <button onClick={save} className="border rounded-xl px-4 py-2 w-fit">
        Save
      </button>
    </section>
  );
}