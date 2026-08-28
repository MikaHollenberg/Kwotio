"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

function toCsvValue(value: unknown): string {
  const str = String(value ?? "");
  if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function ExportCsvButton<T extends Record<string, unknown>>({
  rows,
  filename,
  label = "Exporteer CSV",
}: {
  rows: T[];
  filename: string;
  label?: string;
}) {
  function handleExport() {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const lines = [
      headers.join(";"),
      ...rows.map((row) => headers.map((h) => toCsvValue(row[h])).join(";")),
    ];
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={rows.length === 0}>
      <Download className="size-4" /> {label}
    </Button>
  );
}
