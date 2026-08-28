import "server-only";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/lib/utils";

// Helvetica is een ingebouwde PDF-standaardfont (geen @react-pdf/renderer
// Font.register nodig, geen netwerkverzoek).

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 10, color: "#1E2E38" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  brand: { fontSize: 16, fontWeight: 700, color: "#5890B1" },
  badge: {
    backgroundColor: "#E9C04E",
    color: "#1E2E38",
    fontSize: 9,
    fontWeight: 700,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#46626E", marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginTop: 18, marginBottom: 8, color: "#1E2E38" },
  row: { flexDirection: "row", marginBottom: 5 },
  label: { width: 160, color: "#46626E" },
  value: { flex: 1, fontWeight: 700 },
  hashBox: {
    backgroundColor: "#F3EBDA",
    padding: 10,
    borderRadius: 6,
    fontSize: 8,
    fontFamily: "Helvetica",
    marginTop: 4,
  },
  footer: { position: "absolute", bottom: 32, left: 48, right: 48, fontSize: 8, color: "#7C8F97", textAlign: "center" },
  divider: { borderBottomWidth: 1, borderBottomColor: "#E9DCC2", marginVertical: 14 },
});

export type CertificateData = {
  organizationName: string;
  quoteTitle: string;
  clientName: string;
  selectedPackageName: string | null;
  total: number;
  currency: string;
  priceDisplayLabel: string;
  signerName: string;
  signerEmail: string;
  method: "canvas" | "typed";
  typedName: string | null;
  ipAddress: string;
  userAgent: string;
  documentHash: string;
  termsUrl: string;
  signedAt: string;
  versionNumber: number;
};

function CertificateDocument({ data }: { data: CertificateData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>{data.organizationName}</Text>
          <Text style={styles.badge}>DIGITAAL ONDERTEKEND</Text>
        </View>

        <Text style={styles.title}>Ondertekeningscertificaat</Text>
        <Text style={styles.subtitle}>
          Audit-trail voor offerte &quot;{data.quoteTitle}&quot; — versie {data.versionNumber}
        </Text>

        <Text style={styles.sectionTitle}>Offerte</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Titel</Text>
          <Text style={styles.value}>{data.quoteTitle}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Klant</Text>
          <Text style={styles.value}>{data.clientName || "—"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Gekozen pakket</Text>
          <Text style={styles.value}>{data.selectedPackageName ?? "—"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Totaalbedrag</Text>
          <Text style={styles.value}>
            {formatCurrency(data.total, data.currency)} ({data.priceDisplayLabel})
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Ondertekenaar</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Naam</Text>
          <Text style={styles.value}>{data.signerName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>E-mailadres</Text>
          <Text style={styles.value}>{data.signerEmail}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Methode</Text>
          <Text style={styles.value}>
            {data.method === "canvas" ? "Getekende handtekening (canvas)" : `Getypte naam: "${data.typedName}"`}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tijdstempel</Text>
          <Text style={styles.value}>{formatDate(data.signedAt)} {new Date(data.signedAt).toLocaleTimeString("nl-NL")}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>IP-adres</Text>
          <Text style={styles.value}>{data.ipAddress}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>User-agent</Text>
          <Text style={styles.value}>{data.userAgent}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Documentintegriteit</Text>
        <Text style={{ color: "#46626E" }}>
          Onderstaande cryptografische hash (SHA-256) is berekend over de exacte
          inhoud van de offerte op het moment van ondertekenen. Elke latere
          wijziging aan de offerte-inhoud is hiermee aantoonbaar.
        </Text>
        <Text style={styles.hashBox}>{data.documentHash}</Text>

        <View style={styles.divider} />

        <Text style={{ color: "#46626E" }}>
          Bij het plaatsen van deze handtekening heeft de ondertekenaar expliciet
          ingestemd met de algemene voorwaarden van {data.organizationName} (zie
          {" "}{data.termsUrl}). Dit certificaat is
          een eenvoudige elektronische handtekening (SES) onder de
          eIDAS-verordening (EU) nr. 910/2014.
        </Text>

        <Text style={styles.footer}>
          {data.organizationName} · Automatisch gegenereerd op {formatDate(new Date().toISOString())}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderCertificatePdf(data: CertificateData): Promise<Buffer> {
  return renderToBuffer(<CertificateDocument data={data} />);
}
