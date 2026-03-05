import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";
import TemplateCtaButton from "./templateDesignButton";

export default async function TemplatePage() {
  const supabase = await createClient();

  const { data: templates, error } = await supabase
    .from("template")
    .select("id,prompt,descriptive_image")
    .order("id");

  if (error) return <pre>{JSON.stringify(error, null, 2)}</pre>;

  return (
    <section className="p-6 grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
      {templates?.map((t) => (
        <div key={t.id} className="border rounded-xl p-3 flex flex-col gap-2">
          {t.descriptive_image && (
            <div className="w-full h-56 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
              <img
                src={t.descriptive_image}
                className="max-h-full max-w-full object-contain"
                alt=""
              />
            </div>
          )}

          <h3 className="font-medium text-sm">Template {t.id}</h3>
          <p className="text-xs text-gray-600 line-clamp-3">{t.prompt}</p>

          <TemplateCtaButton
            draft={{
              templateId: t.id,
              prompt: t.prompt ?? "",
              // ratio: "4:5",
              // size: "1024",
            }}
          />
        </div>
      ))}
    </section>
  );
}