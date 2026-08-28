import Link from "next/link";
import { Plus, Archive } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getOrganizationsList } from "@/lib/admin/queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrganizationRowActions } from "./organization-row-actions";

const STATUS_LABELS = { proefperiode: "Proefperiode", actief: "Actief", opgezegd: "Opgezegd" } as const;
const STATUS_TONES = { proefperiode: "yellow", actief: "green", opgezegd: "red" } as const;

export default async function AdminOrganisatiesPage() {
  const organizations = await getOrganizationsList();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-400">Hoofdaccount</p>
          <h2 className="font-display text-2xl font-semibold text-ink-500">Organisaties</h2>
        </div>
        <div className="flex items-center gap-2">
          <ButtonLink href="/admin/organisaties/archief" variant="outline">
            <Archive className="size-4" /> Archief
          </ButtonLink>
          <ButtonLink href="/admin/organisaties/nieuw" variant="primary">
            <Plus className="size-4" /> Nieuwe organisatie
          </ButtonLink>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {organizations.length === 0 ? (
            <p className="p-6 text-sm text-ink-400">Nog geen klant-organisaties aangemaakt.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                    <th className="px-6 py-3">Naam</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3 text-right">Gebruikers</th>
                    <th className="px-4 py-3 text-right">Maandbedrag</th>
                    <th className="px-4 py-3 text-right">Aangemaakt</th>
                    <th className="px-4 py-3 text-right">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org) => (
                    <tr key={org.id} className="border-b border-ink-50 last:border-0 hover:bg-sand-100">
                      <td className="px-6 py-3">
                        <Link href={`/admin/organisaties/${org.id}`} className="font-medium text-ink-500 hover:underline">
                          {org.name}
                        </Link>
                        <p className="text-xs text-ink-400">{org.brandName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={STATUS_TONES[org.status]}>{STATUS_LABELS[org.status]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-400">{org.plan ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-ink-500">{org.memberCount}</td>
                      <td className="px-4 py-3 text-right font-medium text-ink-500">
                        {formatCurrency(org.monthlyPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-ink-400">{formatDate(org.createdAt)}</td>
                      <td className="px-4 py-3">
                        <OrganizationRowActions organizationId={org.id} name={org.name} archived={false} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
