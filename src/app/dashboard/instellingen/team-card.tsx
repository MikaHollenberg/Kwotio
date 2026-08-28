"use client";

import { useState, useTransition } from "react";
import { UserPlus, Trash2 } from "lucide-react";
import type { UserRole } from "@/lib/types/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { inviteTeamMember, updateMemberRole, removeMember } from "./actions";

export type TeamMember = {
  id: string;
  fullName: string | null;
  email: string;
  role: UserRole;
};

export function TeamCard({ members, currentUserId }: { members: TeamMember[]; currentUserId: string }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("member");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Team & rechten</CardTitle>
          <CardDescription>
            Eigenaar/admin kunnen alles; teamlid kan offertes maken en versturen; alleen-lezen kan alleen bekijken.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col divide-y divide-ink-100">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-500">{m.fullName || m.email}</p>
                <p className="truncate text-xs text-ink-400">{m.email}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {m.role === "owner" ? (
                  <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-800">
                    Eigenaar
                  </span>
                ) : (
                  <select
                    value={m.role}
                    onChange={(e) =>
                      startTransition(() => updateMemberRole(m.id, e.target.value as UserRole))
                    }
                    className="h-8 rounded-brand-sm border border-ink-200 bg-white px-2 text-xs text-ink-500 outline-none focus:border-teal-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Teamlid</option>
                    <option value="readonly">Alleen-lezen</option>
                  </select>
                )}
                {m.role !== "owner" && m.id !== currentUserId && (
                  <button
                    onClick={() => setRemoveTarget(m)}
                    className="flex size-8 items-center justify-center rounded-brand-sm text-ink-300 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
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
                await inviteTeamMember(inviteEmail.trim(), inviteRole);
                setInviteEmail("");
              } catch {
                setError("Uitnodigen mislukt. Controleer het e-mailadres.");
              }
            });
          }}
        >
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink-400">E-mailadres teamlid</label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="collega@feestaanhetwater.nl"
              className="h-10 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as UserRole)}
            className="h-10 rounded-brand-sm border border-ink-200 bg-white px-2.5 text-sm text-ink-500 outline-none focus:border-teal-500"
          >
            <option value="admin">Admin</option>
            <option value="member">Teamlid</option>
            <option value="readonly">Alleen-lezen</option>
          </select>
          <Button type="submit" size="md" disabled={pending}>
            <UserPlus className="size-4" /> Uitnodigen
          </Button>
        </form>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>

      <ConfirmDialog
        open={!!removeTarget}
        title="Teamlid verwijderen"
        description={`Weet je zeker dat je ${removeTarget?.fullName || removeTarget?.email} uit het team wilt verwijderen?`}
        confirmLabel="Verwijderen"
        danger
        pending={pending}
        onConfirm={() => {
          if (!removeTarget) return;
          startTransition(async () => {
            await removeMember(removeTarget.id);
            setRemoveTarget(null);
          });
        }}
        onCancel={() => setRemoveTarget(null)}
      />
    </Card>
  );
}
