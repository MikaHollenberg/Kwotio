import { Plus, Trash2, Star } from "lucide-react";
import type { PackagesBlockContent } from "@/lib/blocks/types";
import { newPackage, newAddon } from "@/lib/blocks/types";
import { Field, TextInput, TextArea } from "@/components/builder/field";
import { ImageUploadField } from "@/components/builder/image-upload-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PackagesBlockEditor({
  content,
  onChange,
  organizationId,
}: {
  content: PackagesBlockContent;
  onChange: (content: PackagesBlockContent) => void;
  organizationId: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Titel">
          <TextInput
            value={content.heading}
            onChange={(e) => onChange({ ...content, heading: e.target.value })}
          />
        </Field>
        <Field label="Introtekst (optioneel)">
          <TextInput
            value={content.intro}
            onChange={(e) => onChange({ ...content, intro: e.target.value })}
          />
        </Field>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold text-ink-500">Pakketten</h4>
        <div className="flex flex-col gap-4">
          {content.packages.map((pkg, i) => (
            <div key={pkg.id} className="grid grid-cols-[128px_1fr] gap-4 rounded-brand-sm border border-ink-100 bg-sand-50 p-4">
              <ImageUploadField
                value={pkg.photoUrl}
                onChange={(url) => {
                  const packages = [...content.packages];
                  packages[i] = { ...pkg, photoUrl: url };
                  onChange({ ...content, packages });
                }}
                organizationId={organizationId}
                aspect="aspect-square"
              />
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <TextInput
                    value={pkg.name}
                    onChange={(e) => {
                      const packages = [...content.packages];
                      packages[i] = { ...pkg, name: e.target.value };
                      onChange({ ...content, packages });
                    }}
                    className="flex-1 font-medium"
                    placeholder="Pakketnaam"
                  />
                  <div className="flex items-center gap-1.5 whitespace-nowrap rounded-brand-sm border border-ink-200 px-2.5 py-2">
                    <span className="text-sm text-ink-400">€</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={pkg.price}
                      onChange={(e) => {
                        const packages = [...content.packages];
                        packages[i] = { ...pkg, price: Number(e.target.value) };
                        onChange({ ...content, packages });
                      }}
                      className="w-20 text-sm text-ink-500 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({ ...content, packages: content.packages.filter((p) => p.id !== pkg.id) })
                    }
                    className="flex size-9 shrink-0 items-center justify-center rounded-brand-sm text-ink-300 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <TextArea
                  value={pkg.description}
                  onChange={(e) => {
                    const packages = [...content.packages];
                    packages[i] = { ...pkg, description: e.target.value };
                    onChange({ ...content, packages });
                  }}
                  placeholder="Wat zit er in dit pakket?"
                  className="min-h-16"
                />
                <button
                  type="button"
                  onClick={() => {
                    const packages = content.packages.map((p) => ({
                      ...p,
                      isDefaultSelected: p.id === pkg.id,
                    }));
                    onChange({ ...content, packages });
                  }}
                  className={cn(
                    "flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-200 ease-brand",
                    pkg.isDefaultSelected
                      ? "border-yellow-300 bg-yellow-100 text-yellow-800"
                      : "border-ink-200 text-ink-400 hover:border-yellow-300 hover:text-yellow-700",
                  )}
                >
                  <Star className={cn("size-3.5", pkg.isDefaultSelected && "fill-yellow-500 text-yellow-500")} />
                  {pkg.isDefaultSelected ? "Meest gekozen" : "Markeer als 'meest gekozen'"}
                </button>
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => onChange({ ...content, packages: [...content.packages, newPackage()] })}
        >
          <Plus className="size-4" /> Pakket toevoegen
        </Button>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold text-ink-500">Opties (add-ons)</h4>
        <p className="mb-3 text-xs text-ink-400">
          De klant kan deze zelf aan- of uitvinken; het totaal beweegt live mee.
        </p>
        <div className="flex flex-col gap-2">
          {content.addons.map((addon, i) => (
            <div key={addon.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded-brand-sm border border-ink-100 bg-sand-50 p-3">
              <div className="flex flex-col gap-1">
                <TextInput
                  value={addon.name}
                  onChange={(e) => {
                    const addons = [...content.addons];
                    addons[i] = { ...addon, name: e.target.value };
                    onChange({ ...content, addons });
                  }}
                  placeholder="Naam van de optie"
                  className="h-9"
                />
                <TextInput
                  value={addon.description}
                  onChange={(e) => {
                    const addons = [...content.addons];
                    addons[i] = { ...addon, description: e.target.value };
                    onChange({ ...content, addons });
                  }}
                  placeholder="Korte omschrijving (optioneel)"
                  className="h-8 text-xs"
                />
              </div>
              <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-ink-400">
                <input
                  type="checkbox"
                  checked={addon.quantityEditable}
                  onChange={(e) => {
                    const addons = [...content.addons];
                    addons[i] = { ...addon, quantityEditable: e.target.checked };
                    onChange({ ...content, addons });
                  }}
                  className="size-3.5 accent-teal-600"
                />
                Aantal
              </label>
              <div className="flex items-center gap-1.5 whitespace-nowrap rounded-brand-sm border border-ink-200 px-2.5 py-2">
                <span className="text-sm text-ink-400">€</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={addon.price}
                  onChange={(e) => {
                    const addons = [...content.addons];
                    addons[i] = { ...addon, price: Number(e.target.value) };
                    onChange({ ...content, addons });
                  }}
                  className="w-16 text-sm text-ink-500 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => onChange({ ...content, addons: content.addons.filter((a) => a.id !== addon.id) })}
                className="flex size-9 shrink-0 items-center justify-center rounded-brand-sm text-ink-300 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => onChange({ ...content, addons: [...content.addons, newAddon()] })}
        >
          <Plus className="size-4" /> Optie toevoegen
        </Button>
      </div>
    </div>
  );
}
