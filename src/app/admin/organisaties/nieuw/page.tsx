import { NewOrganizationForm } from "./new-organization-form";

export default function NewOrganizationPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-ink-400">Hoofdaccount</p>
        <h2 className="font-display text-2xl font-semibold text-ink-500">Nieuwe organisatie</h2>
      </div>
      <NewOrganizationForm />
    </div>
  );
}
