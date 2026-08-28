"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { archiveOrganization, unarchiveOrganization, deleteOrganization } from "../actions";

export function OrganizationDangerZone({
  organizationId,
  name,
  archived,
}: {
  organizationId: string;
  name: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Archiveren & verwijderen</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        {archived ? (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => startTransition(() => unarchiveOrganization(organizationId))}
          >
            <ArchiveRestore className="size-4" /> Herstellen
          </Button>
        ) : (
          <Button variant="outline" disabled={pending} onClick={() => setConfirmArchive(true)}>
            <Archive className="size-4" /> Archiveren
          </Button>
        )}
        <Button
          variant="ghost"
          disabled={pending}
          className="text-red-600 hover:bg-red-50"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="size-4" /> Definitief verwijderen
        </Button>
      </CardContent>

      <ConfirmDialog
        open={confirmArchive}
        title="Organisatie archiveren"
        description={`"${name}" wordt uit het standaardoverzicht gehaald. Data en gebruikers blijven bestaan.`}
        confirmLabel="Archiveren"
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            await archiveOrganization(organizationId);
            router.push("/admin/organisaties");
          })
        }
        onCancel={() => setConfirmArchive(false)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Organisatie definitief verwijderen"
        description={`Weet je zeker dat je "${name}" definitief wilt verwijderen? Alle offertes, klanten en gebruikers van deze organisatie worden permanent verwijderd. Dit kan niet ongedaan gemaakt worden.`}
        confirmLabel="Definitief verwijderen"
        danger
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            await deleteOrganization(organizationId);
            router.push("/admin/organisaties");
          })
        }
        onCancel={() => setConfirmDelete(false)}
      />
    </Card>
  );
}
