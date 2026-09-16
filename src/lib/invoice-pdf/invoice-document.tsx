import "server-only";
import { Document, Page, Text, View, Image, Link, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/lib/utils";
import { registerInvoiceFonts } from "./fonts";
import { groupLinesByVat } from "./group-lines-by-vat";

const useCustomFonts = registerInvoiceFonts();
const FONT_BODY = useCustomFonts ? "Manrope" : "Helvetica";
const FONT_DISPLAY = useCustomFonts ? "Bricolage Grotesque" : "Helvetica-Bold";

// Kwotio's eigen ontwerptaal (app/src/app/globals.css) -- ink/sand-neutralen
// + typografie, met de organisatie's eigen accentkleur (resolveAccentColor())
// voor bedragen/nadruk. Niet de losse, verouderde COLORS-constante die de
// offerte-PDF nog gebruikt -- deze herontwerp-scope raakt alleen de factuur.
const COLORS = {
  ink500: "#1E2E38",
  ink400: "#46626E",
  ink300: "#7C8F97",
  ink200: "#AAB6BC",
  ink100: "#D7DDE0",
  ink50: "#EEF1F2",
  sand100: "#FBF6EC",
  sand200: "#F3EBDA",
  sand300: "#E9DCC2",
  white: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: FONT_BODY, fontSize: 9.5, color: COLORS.ink500 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 4 },
  logoImage: { height: 30, maxWidth: 130, objectFit: "contain" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 },
  orgBlock: { alignItems: "flex-end", maxWidth: "45%" },
  orgLine: { fontSize: 8.5, color: COLORS.ink400, textAlign: "right" },
  badge: {
    fontFamily: FONT_DISPLAY,
    fontWeight: 700,
    backgroundColor: COLORS.sand200,
    color: COLORS.ink500,
    fontSize: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  eyebrow: { fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 9, color: COLORS.ink300, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  clientName: { fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 19, color: COLORS.ink500 },
  clientLine: { fontSize: 9.5, color: COLORS.ink400, marginTop: 1 },
  metaBox: { alignItems: "flex-end" },
  metaRow: { flexDirection: "row", justifyContent: "flex-end", gap: 6, marginBottom: 2 },
  metaLabel: { fontSize: 8.5, color: COLORS.ink300 },
  metaValue: { fontSize: 8.5, fontWeight: 700, color: COLORS.ink500 },
  payDivider: { flexDirection: "row", gap: 16, marginBottom: 20 },
  payBox: {
    flex: 1.3,
    backgroundColor: COLORS.sand200,
    borderRadius: 10,
    padding: 14,
  },
  payLabel: { fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 8, color: COLORS.ink300, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  payAmount: { fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 22, marginBottom: 2 },
  payDue: { fontSize: 8.5, color: COLORS.ink400, marginBottom: 10 },
  payFieldRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  payFieldLabel: { fontSize: 8.5, color: COLORS.ink400 },
  payFieldValue: { fontSize: 8.5, fontWeight: 700, color: COLORS.ink500, textAlign: "right" },
  tableHeaderRow: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: COLORS.ink500, paddingBottom: 5, marginTop: 4 },
  tableRow: { flexDirection: "row", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: COLORS.ink50 },
  headerCell: { fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 7.5, color: COLORS.ink300, textTransform: "uppercase", letterSpacing: 0.3 },
  colDescription: { flex: 3, fontSize: 9.5 },
  colQty: { flex: 0.7, fontSize: 9.5, textAlign: "right" },
  colPrice: { flex: 1.1, fontSize: 9.5, textAlign: "right" },
  colTotal: { flex: 1.1, fontSize: 9.5, fontWeight: 700, textAlign: "right" },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", gap: 20, marginTop: 14 },
  vatTable: { flex: 1.3 },
  vatTableHeaderRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLORS.ink200, paddingBottom: 3, marginBottom: 3 },
  vatTableRow: { flexDirection: "row", paddingVertical: 2 },
  vatCellRate: { flex: 1, fontSize: 8.5, color: COLORS.ink400 },
  vatCellBasis: { flex: 1, fontSize: 8.5, color: COLORS.ink400, textAlign: "right" },
  vatCellAmount: { flex: 1, fontSize: 8.5, color: COLORS.ink400, textAlign: "right" },
  totalsBox: { flex: 1, alignItems: "flex-end" },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", width: 190, marginBottom: 3 },
  totalsLabel: { fontSize: 9, color: COLORS.ink400 },
  totalsValue: { fontSize: 9, fontWeight: 700, color: COLORS.ink500 },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", width: 190, marginTop: 5, paddingTop: 5, borderTopWidth: 1, borderTopColor: COLORS.ink200 },
  grandTotalLabel: { fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, color: COLORS.ink500 },
  grandTotalValue: { fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13 },
  noteBox: { backgroundColor: COLORS.sand200, borderRadius: 8, padding: 10, marginTop: 14 },
  noteTitle: { fontWeight: 700, fontSize: 9, color: COLORS.ink500, marginBottom: 3 },
  noteText: { fontSize: 8.5, color: COLORS.ink400, lineHeight: 1.5 },
  qrBlock: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  qrImage: { width: 38, height: 38 },
  qrCaption: { fontSize: 8, color: COLORS.ink400, maxWidth: 260 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 70, fontSize: 7.5, color: COLORS.ink300 },
  pageNumber: { position: "absolute", bottom: 24, right: 40, fontSize: 7.5, color: COLORS.ink300 },
});

export type InvoicePdfLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  vatAmount: number;
  lineTotal: number;
};

export type InvoicePdfData = {
  accentColor: string;
  /** Hoofdlogo + tot 2 extra logo's (zusterbedrijf/afdeling) -- samen max. 3
   * op de factuurkop. */
  logoUrls: string[];
  organizationName: string;
  organizationAddress?: { street?: string; postalCode?: string; city?: string; country?: string } | null;
  organizationKvk?: string | null;
  organizationBtw?: string | null;
  organizationIban?: string | null;
  organizationEmail?: string | null;
  organizationPhone?: string | null;
  invoiceNumber: string;
  invoiceTypeLabel: string;
  invoiceDate: string;
  dueDate: string;
  deliveryDate?: string | null;
  clientName: string;
  clientCompany?: string | null;
  clientAddress?: { street?: string; postalCode?: string; city?: string; country?: string } | null;
  clientEmail?: string | null;
  clientNumber?: number | null;
  lines: InvoicePdfLine[];
  subtotalExclVat: number;
  vatAmount: number;
  totalInclVat: number;
  currency: string;
  /** Alleen bij `type === "creditnota"`: het nummer van de gecrediteerde
   * factuur -- vervangt het IBAN-betaalblok door een crediteringsnotitie. */
  creditForInvoiceNumber?: string | null;
  depositSummary?: {
    depositInvoiceNumber: string;
    depositExclVat: number;
    depositVat: number;
    depositInclVat: number;
  } | null;
  paymentUrl?: string | null;
  qrCodeDataUri?: string | null;
  termsUrl?: string | null;
  generatedAt: string;
};

function addressLine(addr?: { street?: string; postalCode?: string; city?: string } | null): string {
  if (!addr) return "";
  return [addr.street, [addr.postalCode, addr.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const vatSummary = groupLinesByVat(data.lines);

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.headerRow} fixed>
          <View style={styles.logoRow}>
            {data.logoUrls.length > 0 ? (
              data.logoUrls.map((url, i) => (
                // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image is a PDF primitive, not an <img>; it has no alt prop
                <Image key={i} src={url} style={styles.logoImage} />
              ))
            ) : (
              <Text style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14, color: data.accentColor }}>
                {data.organizationName}
              </Text>
            )}
          </View>
          <View style={styles.orgBlock}>
            <Text style={[styles.orgLine, { fontWeight: 700, color: COLORS.ink500 }]}>{data.organizationName}</Text>
            {addressLine(data.organizationAddress) && <Text style={styles.orgLine}>{addressLine(data.organizationAddress)}</Text>}
            {(data.organizationKvk || data.organizationBtw) && (
              <Text style={styles.orgLine}>
                {data.organizationKvk && `KvK ${data.organizationKvk}`}
                {data.organizationKvk && data.organizationBtw && " · "}
                {data.organizationBtw && `Btw ${data.organizationBtw}`}
              </Text>
            )}
            {data.organizationPhone && <Text style={styles.orgLine}>{data.organizationPhone}</Text>}
            {data.organizationEmail && <Text style={styles.orgLine}>{data.organizationEmail}</Text>}
          </View>
        </View>

        <View style={styles.titleRow}>
          <View>
            <Text style={styles.eyebrow}>{data.invoiceTypeLabel}</Text>
            <Text style={styles.clientName}>{data.clientName}</Text>
            {data.clientCompany && <Text style={styles.clientLine}>{data.clientCompany}</Text>}
            {addressLine(data.clientAddress) && <Text style={styles.clientLine}>{addressLine(data.clientAddress)}</Text>}
            {data.clientEmail && <Text style={styles.clientLine}>{data.clientEmail}</Text>}
          </View>
          <View style={styles.metaBox}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Factuurnummer</Text>
              <Text style={styles.metaValue}>{data.invoiceNumber}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Factuurdatum</Text>
              <Text style={styles.metaValue}>{formatDate(data.invoiceDate)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Betalingstermijn</Text>
              <Text style={styles.metaValue}>{formatDate(data.dueDate)}</Text>
            </View>
            {data.clientNumber != null && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Klantnummer</Text>
                <Text style={styles.metaValue}>{data.clientNumber}</Text>
              </View>
            )}
            {data.deliveryDate && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Leverdatum</Text>
                <Text style={styles.metaValue}>{formatDate(data.deliveryDate)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.payDivider} wrap={false}>
          <View style={styles.payBox}>
            {data.creditForInvoiceNumber ? (
              <>
                <Text style={styles.payLabel}>Creditnota</Text>
                <Text style={[styles.payAmount, { color: data.accentColor }]}>{formatCurrency(data.totalInclVat, data.currency)}</Text>
                <Text style={styles.payDue}>Crediteert factuur {data.creditForInvoiceNumber}</Text>
              </>
            ) : (
              <>
                <Text style={styles.payLabel}>Betaalgegevens</Text>
                <Text style={[styles.payAmount, { color: data.accentColor }]}>{formatCurrency(data.totalInclVat, data.currency)}</Text>
                <Text style={styles.payDue}>Te betalen vóór {formatDate(data.dueDate)}</Text>
                {data.organizationIban && (
                  <View style={styles.payFieldRow}>
                    <Text style={styles.payFieldLabel}>Naar IBAN</Text>
                    <Text style={styles.payFieldValue}>{data.organizationIban}</Text>
                  </View>
                )}
                <View style={styles.payFieldRow}>
                  <Text style={styles.payFieldLabel}>Op naam van</Text>
                  <Text style={styles.payFieldValue}>{data.organizationName}</Text>
                </View>
                <View style={styles.payFieldRow}>
                  <Text style={styles.payFieldLabel}>Omschrijving</Text>
                  <Text style={styles.payFieldValue}>{data.invoiceNumber}</Text>
                </View>
              </>
            )}
          </View>
          <View style={{ flex: 1 }} />
        </View>

        <View style={styles.tableHeaderRow}>
          <Text style={[styles.headerCell, { flex: 3 }]}>Omschrijving</Text>
          <Text style={[styles.headerCell, { flex: 0.7, textAlign: "right" }]}>Aantal</Text>
          <Text style={[styles.headerCell, { flex: 1.1, textAlign: "right" }]}>Prijs</Text>
          <Text style={[styles.headerCell, { flex: 1.1, textAlign: "right" }]}>Totaal</Text>
        </View>
        {data.lines.map((line, i) => (
          <View key={i} style={styles.tableRow} wrap={false}>
            <Text style={styles.colDescription}>{line.description}</Text>
            <Text style={styles.colQty}>{line.quantity}</Text>
            <Text style={styles.colPrice}>{formatCurrency(line.unitPrice, data.currency)}</Text>
            <Text style={styles.colTotal}>{formatCurrency(line.lineTotal, data.currency)}</Text>
          </View>
        ))}

        <View style={styles.bottomRow} wrap={false}>
          <View style={styles.vatTable}>
            <View style={styles.vatTableHeaderRow}>
              <Text style={[styles.headerCell, { flex: 1 }]}>Btw %</Text>
              <Text style={[styles.headerCell, { flex: 1, textAlign: "right" }]}>Grondslag</Text>
              <Text style={[styles.headerCell, { flex: 1, textAlign: "right" }]}>Bedrag</Text>
            </View>
            {vatSummary.map((row) => (
              <View key={row.vatRate} style={styles.vatTableRow}>
                <Text style={styles.vatCellRate}>{row.vatRate.toFixed(2)}%</Text>
                <Text style={styles.vatCellBasis}>{formatCurrency(row.basisExclVat, data.currency)}</Text>
                <Text style={styles.vatCellAmount}>{formatCurrency(row.vatAmount, data.currency)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Totaal excl. btw</Text>
              <Text style={styles.totalsValue}>{formatCurrency(data.subtotalExclVat, data.currency)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Totaal btw</Text>
              <Text style={styles.totalsValue}>{formatCurrency(data.vatAmount, data.currency)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>{data.creditForInvoiceNumber ? "Totaal" : "Te betalen"}</Text>
              <Text style={[styles.grandTotalValue, { color: data.accentColor }]}>
                {formatCurrency(data.totalInclVat, data.currency)}
              </Text>
            </View>
          </View>
        </View>

        {data.depositSummary && (
          <View style={styles.noteBox} wrap={false}>
            <Text style={styles.noteTitle}>Al aanbetaald via factuur {data.depositSummary.depositInvoiceNumber}</Text>
            <Text style={styles.noteText}>
              {formatCurrency(data.depositSummary.depositExclVat, data.currency)} excl. btw + {formatCurrency(data.depositSummary.depositVat, data.currency)} btw = {formatCurrency(data.depositSummary.depositInclVat, data.currency)} incl. btw (al afgedragen). Deze slotfactuur toont uitsluitend het resterende bedrag.
            </Text>
          </View>
        )}

        {data.qrCodeDataUri && data.paymentUrl && (
          <View style={styles.qrBlock} wrap={false}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image is a PDF primitive, not an <img>; it has no alt prop */}
            <Image src={data.qrCodeDataUri} style={styles.qrImage} />
            <Text style={styles.qrCaption}>Scan om direct online te betalen, of ga naar {data.paymentUrl}</Text>
          </View>
        )}

        <Text style={styles.footer} fixed>
          {data.organizationName}
          {data.termsUrl && (
            <>
              {" · Op deze factuur zijn de "}
              <Link src={data.termsUrl} style={{ color: COLORS.ink300, textDecoration: "underline" }}>
                algemene voorwaarden
              </Link>
              {` van ${data.organizationName} van toepassing`}
            </>
          )}
          {` · Gegenereerd op ${formatDate(data.generatedAt)}.`}
        </Text>
        <Text style={styles.pageNumber} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument data={data} />);
}
