import "server-only";
import { Document, Page, Text, View, Image, Link, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/lib/utils";
import { parseHtmlNodes, type HtmlNode } from "./html-nodes";
import type {
  BlockDraft,
  CoverBlockContent,
  TextBlockContent,
  GalleryBlockContent,
  PackagesBlockContent,
  TimelineBlockContent,
  SignatureBlockContent,
} from "@/lib/blocks/types";
import type { Selections } from "@/lib/blocks/pricing";

// Zelfde merkkleuren als het ondertekeningscertificaat
// (src/lib/signing/pdf-certificate.tsx), voor visuele consistentie tussen
// beide PDF's. Helvetica is een ingebouwde PDF-standaardfont, geen
// Font.register nodig.
const COLORS = {
  ink: "#1E2E38",
  brand: "#5890B1",
  yellow: "#E9C04E",
  muted: "#46626E",
  sand: "#F3EBDA",
  sandBorder: "#E9DCC2",
  footerGray: "#7C8F97",
};

const HEADING_SIZES: Record<number, number> = { 1: 15, 2: 13, 3: 12, 4: 11, 5: 10, 6: 10 };

const styles = StyleSheet.create({
  page: { padding: 44, fontFamily: "Helvetica", fontSize: 9.5, color: COLORS.ink },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  brand: { fontSize: 14, fontWeight: 700, color: COLORS.brand },
  logo: { height: 28, objectFit: "contain" },
  badge: {
    backgroundColor: COLORS.sand,
    color: COLORS.ink,
    fontSize: 8,
    fontWeight: 700,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  coverEyebrow: { fontSize: 9, fontWeight: 700, color: COLORS.brand, marginBottom: 6 },
  coverTitle: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
  coverSubtitle: { fontSize: 10.5, color: COLORS.muted, marginBottom: 10 },
  heroImage: { width: "100%", height: 160, borderRadius: 6, marginBottom: 10, objectFit: "cover" },
  sectionHeading: { fontSize: 13, fontWeight: 700, marginTop: 16, marginBottom: 8, color: COLORS.ink },
  sectionIntro: { fontSize: 9.5, color: COLORS.muted, marginBottom: 8 },
  paragraph: { fontSize: 9.5, color: COLORS.muted, marginBottom: 6, lineHeight: 1.5 },
  listRow: { flexDirection: "row", marginBottom: 4, paddingLeft: 2 },
  listBullet: { width: 14, fontSize: 9.5, color: COLORS.muted },
  listText: { flex: 1, fontSize: 9.5, color: COLORS.muted, lineHeight: 1.5 },
  divider: { borderBottomWidth: 1, borderBottomColor: COLORS.sandBorder, marginVertical: 12 },
  galleryGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 4, gap: 8 },
  galleryItem: { width: "31%" },
  galleryImage: { width: "100%", height: 80, borderRadius: 4, objectFit: "cover" },
  galleryCaption: { fontSize: 7.5, color: COLORS.muted, marginTop: 2 },
  packageCard: {
    borderWidth: 1,
    borderColor: COLORS.sandBorder,
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  packageCardSelected: { borderColor: COLORS.brand, borderWidth: 1.5, backgroundColor: COLORS.sand },
  packageHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  packageName: { fontSize: 11, fontWeight: 700, color: COLORS.ink },
  packagePrice: { fontSize: 11, fontWeight: 700, color: COLORS.brand },
  packageDesc: { fontSize: 9, color: COLORS.muted, marginTop: 3 },
  selectedBadge: { fontSize: 7.5, fontWeight: 700, color: COLORS.brand, marginTop: 4 },
  addonsHeading: { fontSize: 9, fontWeight: 700, color: COLORS.muted, marginTop: 4, marginBottom: 4 },
  addonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sandBorder,
  },
  addonName: { fontSize: 9.5, color: COLORS.ink },
  addonPrice: { fontSize: 9.5, fontWeight: 700, color: COLORS.ink },
  timelineRow: { flexDirection: "row", marginBottom: 8 },
  timelineTime: { width: 46, fontSize: 9.5, fontWeight: 700, color: COLORS.brand },
  timelineTitle: { fontSize: 9.5, fontWeight: 700, color: COLORS.ink },
  timelineDesc: { fontSize: 8.5, color: COLORS.muted, marginTop: 1 },
  totalsBox: { marginTop: 18, borderTopWidth: 1, borderTopColor: COLORS.sandBorder, paddingTop: 10 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  totalsLabel: { fontSize: 9.5, color: COLORS.muted },
  totalsValue: { fontSize: 9.5, fontWeight: 700, color: COLORS.ink },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  grandTotalLabel: { fontSize: 12, fontWeight: 700, color: COLORS.ink },
  grandTotalValue: { fontSize: 14, fontWeight: 700, color: COLORS.brand },
  footer: {
    position: "absolute",
    bottom: 26,
    left: 44,
    right: 74,
    fontSize: 8,
    color: COLORS.footerGray,
  },
  pageNumber: {
    position: "absolute",
    bottom: 26,
    right: 44,
    fontSize: 8,
    color: COLORS.footerGray,
  },
  infoHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  infoBlock: { maxWidth: "48%" },
  infoLabel: { fontSize: 7.5, fontWeight: 700, color: COLORS.footerGray, marginBottom: 3, textTransform: "uppercase" },
  infoLine: { fontSize: 9, color: COLORS.muted },
  infoLineStrong: { fontSize: 9.5, fontWeight: 700, color: COLORS.ink },
});

export type QuotePdfData = {
  organizationName: string;
  organizationLogoUrl?: string | null;
  organizationAddress?: { street?: string; postalCode?: string; city?: string; country?: string } | null;
  organizationKvk?: string | null;
  organizationBtw?: string | null;
  organizationEmail?: string | null;
  organizationPhone?: string | null;
  handledByName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientCompany?: string | null;
  referenceNumber?: string | null;
  quoteTitle: string;
  clientName: string;
  eventDate: string | null;
  currency: string;
  priceDisplayLabel: string;
  pricePerPerson?: boolean;
  blocks: BlockDraft[];
  selections: Selections;
  subtotal: number;
  discountAmount: number;
  total: number;
  generatedAt: string;
  termsUrl: string | null;
};

function Run({ run }: { run: { text: string; bold: boolean; italic: boolean } }) {
  return (
    <Text style={{ fontWeight: run.bold ? 700 : 400, fontStyle: run.italic ? "italic" : "normal" }}>
      {run.text}
    </Text>
  );
}

function HtmlNodes({ nodes }: { nodes: HtmlNode[] }) {
  return (
    <>
      {nodes.map((node, i) => {
        if (node.type === "heading") {
          return (
            <Text
              key={i}
              style={{ ...styles.paragraph, fontWeight: 700, color: COLORS.ink, fontSize: HEADING_SIZES[node.level] ?? 10 }}
            >
              {node.runs.map((run, j) => (
                <Run key={j} run={run} />
              ))}
            </Text>
          );
        }
        if (node.type === "listItem") {
          return (
            <View key={i} style={styles.listRow}>
              <Text style={styles.listBullet}>{node.ordered ? `${node.index}.` : "•"}</Text>
              <Text style={styles.listText}>
                {node.runs.map((run, j) => (
                  <Run key={j} run={run} />
                ))}
              </Text>
            </View>
          );
        }
        return (
          <Text key={i} style={styles.paragraph}>
            {node.runs.map((run, j) => (
              <Run key={j} run={run} />
            ))}
          </Text>
        );
      })}
    </>
  );
}

function QuoteDocument({ data }: { data: QuotePdfData }) {
  const sorted = [...data.blocks].sort((a, b) => a.position - b.position);

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header} fixed>
          {data.organizationLogoUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image is a PDF primitive, not an <img>; it has no alt prop
            <Image src={data.organizationLogoUrl} style={styles.logo} />
          ) : (
            <Text style={styles.brand}>{data.organizationName}</Text>
          )}
          <Text style={styles.badge}>OFFERTE</Text>
        </View>

        <View style={styles.infoHeader}>
          <View style={styles.infoBlock}>
            {(data.clientName || data.clientCompany || data.clientEmail || data.clientPhone || data.referenceNumber) && (
              <>
                <Text style={styles.infoLabel}>Offerte voor</Text>
                {data.clientName && <Text style={styles.infoLineStrong}>{data.clientName}</Text>}
                {data.clientCompany && <Text style={styles.infoLine}>{data.clientCompany}</Text>}
                {data.clientEmail && <Text style={styles.infoLine}>{data.clientEmail}</Text>}
                {data.clientPhone && <Text style={styles.infoLine}>{data.clientPhone}</Text>}
                {data.referenceNumber && <Text style={styles.infoLine}>Ref: {data.referenceNumber}</Text>}
              </>
            )}
          </View>
          <View style={[styles.infoBlock, { alignItems: "flex-end" }]}>
            <Text style={[styles.infoLineStrong, { textAlign: "right" }]}>{data.organizationName}</Text>
            {(() => {
              const addr = data.organizationAddress;
              const addressLine = addr
                ? [addr.street, [addr.postalCode, addr.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")
                : "";
              return addressLine ? (
                <Text style={[styles.infoLine, { textAlign: "right" }]}>{addressLine}</Text>
              ) : null;
            })()}
            {(data.organizationKvk || data.organizationBtw) && (
              <Text style={[styles.infoLine, { textAlign: "right" }]}>
                {data.organizationKvk && `KvK ${data.organizationKvk}`}
                {data.organizationKvk && data.organizationBtw && " · "}
                {data.organizationBtw && `Btw ${data.organizationBtw}`}
              </Text>
            )}
            {data.organizationEmail && <Text style={[styles.infoLine, { textAlign: "right" }]}>{data.organizationEmail}</Text>}
            {data.organizationPhone && <Text style={[styles.infoLine, { textAlign: "right" }]}>{data.organizationPhone}</Text>}
            {data.handledByName && (
              <Text style={[styles.infoLine, { textAlign: "right", marginTop: 3 }]}>Behandeld door: {data.handledByName}</Text>
            )}
          </View>
        </View>

        {sorted.map((block) => {
          switch (block.type) {
            case "cover": {
              const c = block.content as CoverBlockContent;
              return (
                <View key={block.id} wrap={false}>
                  {c.eyebrow && <Text style={styles.coverEyebrow}>{c.eyebrow}</Text>}
                  <Text style={styles.coverTitle}>{data.quoteTitle}</Text>
                  <Text style={styles.coverSubtitle}>
                    {data.clientName || "—"}
                    {data.eventDate ? ` · ${formatDate(data.eventDate)}` : c.eventDateLabel ? ` · ${c.eventDateLabel}` : ""}
                  </Text>
                  {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image is a PDF primitive, not an <img>; it has no alt prop */}
                  {c.heroImageUrl && <Image src={c.heroImageUrl} style={styles.heroImage} />}
                  <View style={styles.divider} />
                </View>
              );
            }

            case "text":
            case "terms": {
              const c = block.content as TextBlockContent;
              const nodes = parseHtmlNodes(c.html);
              if (!c.heading && nodes.length === 0) return null;
              return (
                <View key={block.id}>
                  {c.heading && <Text style={styles.sectionHeading}>{c.heading}</Text>}
                  <HtmlNodes nodes={nodes} />
                </View>
              );
            }

            case "gallery": {
              const c = block.content as GalleryBlockContent;
              const images = c.images.filter((img) => img.url);
              if (images.length === 0) return null;
              return (
                <View key={block.id}>
                  {c.heading && <Text style={styles.sectionHeading}>{c.heading}</Text>}
                  <View style={styles.galleryGrid}>
                    {images.map((img) => (
                      <View key={img.id} style={styles.galleryItem}>
                        {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image is a PDF primitive, not an <img>; it has no alt prop */}
                        <Image src={img.url} style={styles.galleryImage} />
                        {img.caption && <Text style={styles.galleryCaption}>{img.caption}</Text>}
                      </View>
                    ))}
                  </View>
                </View>
              );
            }

            case "packages": {
              const c = block.content as PackagesBlockContent;
              const selectedAddons = c.addons.filter((addon) => (data.selections.addonQuantities?.[addon.id] ?? 0) > 0);
              return (
                <View key={block.id}>
                  {c.heading && <Text style={styles.sectionHeading}>{c.heading}</Text>}
                  {c.intro && <Text style={styles.sectionIntro}>{c.intro}</Text>}

                  {c.packages.map((pkg) => {
                    const isSelected = data.selections.packageIdByBlock[block.id] === pkg.id;
                    return (
                      <View key={pkg.id} style={[styles.packageCard, isSelected ? styles.packageCardSelected : {}]} wrap={false}>
                        <View style={styles.packageHeaderRow}>
                          <Text style={styles.packageName}>{pkg.name}</Text>
                          <Text style={styles.packagePrice}>
                            {formatCurrency(pkg.price, data.currency)}
                            {data.pricePerPerson ? " p.p." : ""}
                          </Text>
                        </View>
                        {pkg.description && <Text style={styles.packageDesc}>{pkg.description}</Text>}
                        {isSelected && <Text style={styles.selectedBadge}>GESELECTEERD PAKKET</Text>}
                      </View>
                    );
                  })}

                  {selectedAddons.length > 0 && (
                    <View>
                      <Text style={styles.addonsHeading}>EXTRA OPTIES</Text>
                      {selectedAddons.map((addon) => {
                        const qty = data.selections.addonQuantities[addon.id] ?? 0;
                        return (
                          <View key={addon.id} style={styles.addonRow}>
                            <Text style={styles.addonName}>
                              {addon.name}
                              {addon.quantityEditable ? ` × ${qty}` : ""}
                            </Text>
                            <Text style={styles.addonPrice}>
                              {formatCurrency(addon.price * qty, data.currency)}
                              {data.pricePerPerson && !addon.quantityEditable ? " p.p." : ""}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            }

            case "timeline": {
              const c = block.content as TimelineBlockContent;
              if (c.items.length === 0) return null;
              return (
                <View key={block.id}>
                  {c.heading && <Text style={styles.sectionHeading}>{c.heading}</Text>}
                  {c.items.map((item) => (
                    <View key={item.id} style={styles.timelineRow} wrap={false}>
                      <Text style={styles.timelineTime}>{item.time}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.timelineTitle}>{item.title}</Text>
                        {item.description && <Text style={styles.timelineDesc}>{item.description}</Text>}
                      </View>
                    </View>
                  ))}
                </View>
              );
            }

            case "signature": {
              const c = block.content as SignatureBlockContent;
              return (
                <View key={block.id}>
                  {c.heading && <Text style={styles.sectionHeading}>{c.heading}</Text>}
                  {c.intro && <Text style={styles.paragraph}>{c.intro}</Text>}
                </View>
              );
            }

            default:
              return null;
          }
        })}

        <View style={styles.totalsBox} wrap={false}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotaal</Text>
            <Text style={styles.totalsValue}>{formatCurrency(data.subtotal, data.currency)}</Text>
          </View>
          {data.discountAmount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Korting</Text>
              <Text style={styles.totalsValue}>-{formatCurrency(data.discountAmount, data.currency)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>
              Totaal{data.pricePerPerson ? " p.p." : ""} ({data.priceDisplayLabel})
            </Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(data.total, data.currency)}
              {data.pricePerPerson ? " p.p." : ""}
            </Text>
          </View>
        </View>

        <Text style={styles.footer} fixed>
          {data.organizationName}
          {data.termsUrl && (
            <>
              {" · Op deze offerte zijn de "}
              <Link src={data.termsUrl} style={{ color: COLORS.footerGray, textDecoration: "underline" }}>
                algemene voorwaarden
              </Link>
              {` van ${data.organizationName} van toepassing`}
            </>
          )}
          {` · Gegenereerd op ${formatDate(data.generatedAt)}, kan nadien nog wijzigen.`}
        </Text>
        <Text style={styles.pageNumber} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </Page>
    </Document>
  );
}

export async function renderQuotePdf(data: QuotePdfData): Promise<Buffer> {
  return renderToBuffer(<QuoteDocument data={data} />);
}
