"use client";

import { useState, useTransition } from "react";
import { UserPlus, Trash2, KeyRound } from "lucide-react";
import type { UserRole } from "@/lib/types/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  addOrganizationMember,
  updateOrganizationMemberRole,
  removeOrganizationMember,
  resetOrganizationMemberPassword,
} from "../actions";

export type Member = { id: string; fullName: string | null; email: string; role: UserRole };

export function OrganizationMembersCard({ organizationId, members }: { organizationId: string; members: Member[] }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("owner");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [tempPassword, setTempPassword] = useState<{ email: string; password: string } | null>(null);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Sub-accounts</CardTitle>
          <CardDescription>Gebruikers van deze organisatie.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {tempPassword && (
          <div className="flex flex-col gap-1 rounded-brand-sm border border-teal-200 bg-teal-50 p-3 text-sm text-ink-500">
            <p>
              Nieuw wachtwoord voor <span className="font-semibold">{tempPassword.email}</span>:{" "}
              <span className="font-mono">{tempPassword.password}</span>
            </p>
            <p className="text-xs text-ink-400">Dit wordt hierna nergens meer getoond — stuur het nu door.</p>
          </div>
        )}

        <div className="flex flex-col divide-y divide-ink-100">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-500">{m.fullName || m.email}</p>
                <p className="truncate text-xs text-ink-400">{m.email}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <select
                  value={m.role}
                  onChange={(e) =>
                    startTransition(() => updateOrganizationMemberRole(m.id, e.target.value as UserRole))
                  }
                  className="h-8 rounded-brand-sm border border-ink-200 bg-white px-2 text-xs text-ink-500 outline-none focus:border-teal-500"
                >
                  <option value="owner">Eigenaar</option>
                  <option value="admin">Admin</option>
                  <option value="member">Teamlid</option>
                  <option value="readonly">Alleen-lezen</option>
                </select>
                <button
                  onClick={() =>
                    startTransition(async () => {
                      const res = await resetOrganizationMemberPassword(m.id);
                      setTempPassword({ email: m.email, password: res.tempPassword });
                    })
                  }
                  title="Wachtwoord resetten"
                  className="flex size-8 items-center justify-center rounded-brand-sm text-ink-300 hover:bg-sand-200 hover:text-ink-500"
                >
                  <KeyRound className="size-3.5" />
                </button>
                <button
                  onClick={() => setRemoveTarget(m)}
                  className="flex size-8 items-center justify-center rounded-brand-sm text-ink-300 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <form
          className="flex flex-wrap items-end gap-2 border-t border-ink-100 pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            startTransition(async () => {
              try {
                const res = await addOrganizationMember(organizationId, {
                  email: email.trim(),
                  fullName: fullName.trim(),
                  role,
                });
                setTempPassword({ email: email.trim(), password: res.tempPassword });
                setEmail("");
                setFullName("");
              } catch {
                setError("Toevoegen mislukt. Controleer het e-mailadres.");
              }
            });
          }}
        >
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink-400">Naam</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-10 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink-400">E-mailadres</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="h-10 rounded-brand-sm border border-ink-200 bg-white px-2.5 text-sm text-ink-500 outline-none focus:border-teal-500"
          >
            <option value="owner">Eigenaar</option>
            <option value="admin">Admin</option>
            <option value="member">Teamlid</option>
            <option value="readonly">Alleen-lezen</option>
          </select>
          <Button type="submit" size="md" disabled={pending}>
            <UserPlus className="size-4" /> Toevoegen
          </Button>
        </form>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>

      <ConfirmDialog
        open={!!removeTarget}
        title="Gebruiker verwijderen"
        description={`Weet je zeker dat je ${removeTarget?.fullName || removeTarget?.email} wilt verwijderen?`}
        confirmLabel="Verwijderen"
        danger
        pending={pending}
        onConfirm={() => {
          if (!removeTarget) return;
          startTransition(async () => {
            await removeOrganizationMember(organizationId, removeTarget.id);
            setRemoveTarget(null);
          });
        }}
        onCancel={() => setRemoveTarget(null)}
      />
    </Card>
  );
}
