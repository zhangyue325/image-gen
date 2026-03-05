import { createClient } from "../../../lib/supabase/server";

export default async function Test() {
  const supabase = await createClient();

  const { data: template, error: templateError } = await supabase
    .from("template")
    .select("id,purpose,prompt,sample_image");

  if (templateError) {
    return <pre>{JSON.stringify({ templateError }, null, 2)}</pre>;
  }

  console.log(template);

  return (
    <div>
      <h2>template: {template?.length ?? 0}</h2>
    </div>
  );
}