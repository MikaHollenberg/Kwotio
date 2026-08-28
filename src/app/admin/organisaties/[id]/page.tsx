import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { getOrganizationDetail, getOrganizationMembers } from "@/lib/admin/queries";
import { OrganizationEditForm } from "./organization-edit-form";
import { OrganizationLogoUploader } from "./organization-logo-uploader";
import { OrganizationLogoPreference } from "./organization-logo-preference";
import { OrganizationMembersCard } from "./organization-members-card";
import { OrganizationDangerZone } from "./organization-danger-zone";

const STATUS_LABELS = { proefperiode: "Proefperiode", actief: "Actief", opgezegd: "Opgezegd" } as const;
const STATUS_TONES = { proefperiode: "yellow", actief: "green", opgezegd: "red" } as const;

export default async function AdminOrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [organization, members] = await Promise.all([getOrganizationDetail(id), getOrganizationMembers(id)]);
  if (!organization) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink-400">Hoofdaccount · Organisaties</p>
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl font-semibold text-ink-500">{organization.name}</h2>
            <Badge tone={STATUS_TONES[organization.status]}>{STATUS_LABELS[organization.status]}</Badge>
          </div>
          <p className="text-sm text-ink-400">
            {organization.memberCount} gebruiker(s) · {formatCurrency(organization.monthlyPrice)}/mnd
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Logo&apos;s</CardTitle>
            <CardDescription>
              Horizontaal logo verschijnt in de menubalk van deze organisatie. Het hoofdlogo hieronder bepaalt wat op
              offertes en PDF&apos;s getoond wordt.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <OrganizationLogoUploader
              organizationId={organization.id}
              field="horizontal"
              label="Horizontaal logo (menubalk)"
              aspectClassName="aspect-[3/1]"
              initialLogoUrl={organization.logoHorizontalUrl}
            />
            <OrganizationLogoUploader
              organizationId={organization.id}
              field="square"
              label="Vierkant logo"
              aspectClassName="aspect-square"
              initialLogoUrl={organization.logoSquareUrl}
            />
          </div>
          <OrganizationLogoPreference organizationId={organization.id} initialPreference={organization.logoPreference} />
        </CardContent>
      </Card>

      <OrganizationEditForm
        organizationId={organization.id}
        initial={{
          name: organization.name,
          brandName: organization.brandName,
          domain: organization.domain ?? "",
          kvkNumber: organization.kvkNumber ?? "",
          btwNumber: organization.btwNumber ?? "",
          iban: organization.iban ?? "",
          contactEmail: organization.contactEmail ?? "",
          contactPhone: organization.contactPhone ?? "",
          address: {
            street: organization.address?.street ?? "",
            postalCode: organization.address?.postalCode ?? "",
            city: organization.address?.city ?? "",
            country: organization.address?.country ?? "Nederland",
          },
          plan: organization.plan ?? "",
          monthlyPrice: organization.monthlyPrice,
          status: organization.status,
        }}
      />

      <OrganizationMembersCard organizationId={organization.id} members={members} />

      <OrganizationDangerZone
        organizationId={organization.id}
        name={organization.name}
        archived={!!organization.archivedAt}
      />
    </div>
  );
}
