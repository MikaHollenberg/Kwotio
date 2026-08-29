import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BlockTemplateEditor } from "./block-template-editor";

export default async function BlockTemplateEditorPage({
  params,
}: {
  params: Promise<{ blockTemplateId: string }>;
}) {
  const { blockTemplateId } = await params;
  const supabase = await createClient();

  const [{ data: blockTemplate }, { data: userData }] = await Promise.all([
    supabase.from("block_templates").select("*").eq("id", blockTemplateId).maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (!blockTemplate) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userData.user?.id ?? "")
    .single();

  return (
    <BlockTemplateEditor
      blockTemplate={blockTemplate}
      organizationId={profile?.organization_id ?? blockTemplate.organization_id}
    />
  );
}
