import "server-only";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DashboardKpis } from "@/lib/stats/queries";
import type { QuoteStatus } from "@/lib/types/database";
import { STATUS_LABELS } from "@/components/ui/badge";

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 10, color: "#1E2E38" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  brand: { fontSize: 16, fontWeight: 700, color: "#5890B1" },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#46626E", marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginTop: 18, marginBottom: 8 },
  kpiRow: { flexDirection: "row", gap: 12, marginBottom: 4 },
  kpiBox: { flex: 1, backgroundColor: "#F3EBDA", borderRadius: 6, padding: 10 },
  kpiLabel: { fontSize: 8, color: "#46626E", marginBottom: 2 },
  kpiValue: { fontSize: 14, fontWeight: 700 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E9DCC2", paddingVertical: 6 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#1E2E38", paddingBottom: 6, marginBottom: 2 },
  colLabel: { flex: 2, fontWeight: 700 },
  colValue: { flex: 1, textAlign: "right" },
  footer: { position: "absolute", bottom: 32, left: 48, right: 48, fontSize: 8, color: "#7C8F97", textAlign: "center" },
});

export type PipelineReportData = {
  organizationName: string;
  kpis: DashboardKpis;
  pipelineCounts: Record<QuoteStatus, { count: number; value: number }>;
};

const PIPELINE_ORDER: QuoteStatus[] = [
  "concept",
  "verzonden",
  "bekeken",
  "in_overleg",
  "geaccepteerd",
  "verlopen",
  "geweigerd",
];

function PipelineReportDocument({ data }: { data: PipelineReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>{data.organizationName}</Text>
        </View>

        <Text style={styles.title}>Pipeline-rapportage</Text>
        <Text style={styles.subtitle}>Gegenereerd op {formatDate(new Date().toISOString())}</Text>

        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Offertes deze maand</Text>
            <Text style={styles.kpiValue}>{data.kpis.quotesThisMonth}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Conversieratio</Text>
            <Text style={styles.kpiValue}>
              {data.kpis.conversionRate === null ? "—" : `${Math.round(data.kpis.conversionRate * 100)}%`}
            </Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Gem. doorlooptijd</Text>
            <Text style={styles.kpiValue}>
              {data.kpis.avgDaysToAccept === null ? "—" : `${data.kpis.avgDaysToAccept.toFixed(1)} dagen`}
            </Text>
          </View>
        </View>
        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Gem. offertewaarde</Text>
            <Text style={styles.kpiValue}>{formatCurrency(data.kpis.avgQuoteValue)}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Verwachte omzet in pipeline</Text>
            <Text style={styles.kpiValue}>{formatCurrency(data.kpis.pipelineValue)}</Text>
          </View>
          <View style={styles.kpiBox} />
        </View>

        <Text style={styles.sectionTitle}>Pipeline per status</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.colLabel}>Status</Text>
          <Text style={styles.colValue}>Aantal</Text>
          <Text style={styles.colValue}>Waarde</Text>
        </View>
        {PIPELINE_ORDER.map((status) => (
          <View key={status} style={styles.tableRow}>
            <Text style={styles.colLabel}>{STATUS_LABELS[status]}</Text>
            <Text style={styles.colValue}>{data.pipelineCounts[status]?.count ?? 0}</Text>
            <Text style={styles.colValue}>{formatCurrency(data.pipelineCounts[status]?.value ?? 0)}</Text>
          </View>
        ))}

        {data.kpis.topTemplates.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Best converterende templates</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.colLabel}>Template</Text>
              <Text style={styles.colValue}>Verstuurd</Text>
              <Text style={styles.colValue}>Geaccepteerd</Text>
              <Text style={styles.colValue}>Ratio</Text>
            </View>
            {data.kpis.topTemplates.map((t) => (
              <View key={t.templateId} style={styles.tableRow}>
                <Text style={styles.colLabel}>{t.name}</Text>
                <Text style={styles.colValue}>{t.sentCount}</Text>
                <Text style={styles.colValue}>{t.acceptedCount}</Text>
                <Text style={styles.colValue}>{Math.round(t.rate * 100)}%</Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.footer}>{data.organizationName} · Automatisch gegenereerd rapport</Text>
      </Page>
    </Document>
  );
}

export async function renderPipelineReportPdf(data: PipelineReportData): Promise<Buffer> {
  return renderToBuffer(<PipelineReportDocument data={data} />);
}
