import { ShieldCheck, Download } from "lucide-react";
import type { Database } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type Signature = Database["public"]["Tables"]["signatures"]["Row"];

export function SignatureInfoCard({ signature, shareToken }: { signature: Signature; shareToken: string }) {
  return (
    <Card className="border-teal-200 bg-teal-50/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-teal-600" />
          <CardTitle>Digitaal ondertekend</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-ink-400">Ondertekend door</dt>
            <dd className="font-medium text-ink-500">{signature.signer_name}</dd>
          </div>
          <div>
            <dt className="text-ink-400">E-mailadres</dt>
            <dd className="font-medium text-ink-500">{signature.signer_email}</dd>
          </div>
          <div>
            <dt className="text-ink-400">Op</dt>
            <dd className="font-medium text-ink-500">{formatDate(signature.signed_at)}</dd>
          </div>
          <div>
            <dt className="text-ink-400">Methode</dt>
            <dd className="font-medium capitalize text-ink-500">
              {signature.method === "canvas" ? "Getekend" : "Naam getypt"}
            </dd>
          </div>
        </dl>
        <p className="mt-3 truncate rounded-brand-sm bg-white px-3 py-2 font-mono text-[11px] text-ink-400">
          {signature.document_hash}
        </p>
        <a
          href={`/offerte/${shareToken}/certificaat`}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800"
        >
          <Download className="size-3.5" /> Download ondertekeningscertificaat (PDF)
        </a>
      </CardContent>
    </Card>
  );
}
