import { ThumbsDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DeclineInfoCard({
  declineReason,
  declineNote,
}: {
  declineReason: string | null;
  declineNote: string | null;
}) {
  if (!declineReason && !declineNote) return null;

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ThumbsDown className="size-4 text-red-600" />
          <CardTitle>Offerte afgewezen</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-3 text-sm">
          {declineReason && (
            <div>
              <dt className="text-ink-400">Reden</dt>
              <dd className="font-medium text-ink-500">{declineReason}</dd>
            </div>
          )}
          {declineNote && (
            <div>
              <dt className="text-ink-400">Toelichting</dt>
              <dd className="whitespace-pre-wrap font-medium text-ink-500">{declineNote}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
