import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadTemplateBlocks } from "@/lib/blocks/persistence";
import { TemplateEditor } from "./template-editor";

export default async function TemplateEditorPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const supabase = await createClient();

  const [{ data: template }, { data: profile }] = await Promise.all([
    supabase.from("templates").select("*").eq("id", templateId).maybeSingle(),
    supabase
      .from("profiles")
      .select("organization_id")
      .eq(
        "id",
        (await supabase.auth.getUser()).data.user?.id ?? "",
      )
      .single(),
  ]);

  if (!template) notFound();

  const organizationId = profile?.organization_id ?? template.organization_id;

  const [blocks, { data: blockTemplates }] = await Promise.all([
    loadTemplateBlocks(supabase, templateId),
    supabase
      .from("block_templates")
      .select("id, type, name, content")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
  ]);

  return (
    <TemplateEditor
      template={template}
      initialBlocks={blocks}
      organizationId={organizationId}
      initialBlockTemplates={blockTemplates ?? []}
    />
  );
}
