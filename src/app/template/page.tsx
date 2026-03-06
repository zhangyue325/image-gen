import { createClient } from "../../../lib/supabase/server";
import TemplateCtaButton from "./templateDesignButton";
import CreateTemplateCard from "./createTemplateCard";
import DeleteTemplateButton from "./deleteTemplateButton";

export default async function TemplatePage() {
  const supabase = await createClient();

  const [{ data: templates, error }, { data: settingData }] = await Promise.all([
    supabase
      .from("template")
      .select("id,template_name,purpose,prompt,descriptive_image,ratio,model,author,type")
      .or("deleted.is.null,deleted.eq.false")
      .order("id"),
    supabase
      .from("setting")
      .select("purpose_prompt")
      .eq("user_name", "Pazzion")
      .single(),
  ]);

  if (error) return <pre>{JSON.stringify(error, null, 2)}</pre>;

  const unique = (values: Array<string | null | undefined>) =>
    Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));

  const dbPurposeOptions =
    settingData?.purpose_prompt && typeof settingData.purpose_prompt === "object"
      ? Object.keys(settingData.purpose_prompt as Record<string, unknown>)
      : [];

  const purposeOptions = unique([
    ...dbPurposeOptions,
    ...(templates?.map((item) => item.purpose) ?? []),
  ]);
  const typeOptions = unique(templates?.map((item) => item.type) ?? []);
  const modelOptions = unique(templates?.map((item) => item.model) ?? []);
  const ratioOptions = unique(templates?.map((item) => item.ratio) ?? []);

  return (
    <section className="p-6 grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
      <CreateTemplateCard
        purposeOptions={purposeOptions}
        typeOptions={typeOptions}
        modelOptions={modelOptions}
        ratioOptions={ratioOptions}
      />

      {templates?.map((t) => (
        <div key={t.id} className="relative border rounded-xl p-3 flex flex-col gap-2">
          <DeleteTemplateButton templateId={t.id} />
          {t.descriptive_image && (
            <div className="w-full h-56 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
              <img
                src={t.descriptive_image}
                className="max-h-full max-w-full object-contain"
                alt=""
              />
            </div>
          )}

          <h3 className="font-medium text-sm">{t.template_name || `Template ${t.id}`}</h3>
          <p className="text-xs text-gray-500">{t.type || "image"} | {t.purpose || "-"}</p>
          <p className="text-xs text-gray-500">{t.model || "-"}</p>
          <p className="text-xs text-gray-500">ratio: {t.ratio || "-"}</p>
          <p className="text-xs text-gray-500">author: {t.author || "-"}</p>
          <p className="text-xs text-gray-600 line-clamp-3">{t.prompt}</p>

          <TemplateCtaButton
            draft={{
              templateId: t.id,
              prompt: t.prompt ?? "",
              purpose: t.purpose ?? undefined,
              type: (t.type as "image" | "video") ?? "image",
              model: t.model ?? undefined,
              ratio: t.ratio ?? undefined,
            }}
          />
        </div>
      ))}
    </section>
  );
}
