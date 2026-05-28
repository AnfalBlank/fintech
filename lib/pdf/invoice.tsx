import {
  Document,
  Page,
  Text,
  View,
  Image,
  renderToBuffer,
} from "@react-pdf/renderer";
import { styles, fmt, fmtDate, colors } from "./styles";

export type InvoiceData = {
  type: "dp" | "installment";
  invoiceNo: string;
  paidAt: Date;
  customer: { name: string; phone: string; email: string; address?: string };
  product: { title: string; marketplace: string };
  application: {
    id: string;
    tenor: number;
    total: number;
    dpAmount: number;
    monthly: number;
  };
  amountPaid: number;
  paymentMethod: string;
  channel?: string;
  referenceNo: string;
  installmentSeq?: number;
};

export async function renderInvoice(data: InvoiceData): Promise<Buffer> {
  const isDp = data.type === "dp";

  const doc = (
    <Document
      title={`Invoice ${data.invoiceNo}`}
      author="PT. Manggala Utama Indonesia"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.brand}>MANGGALA</Text>
            <Text style={styles.brandSub}>
              PT. Manggala Utama Indonesia
            </Text>
            <Text style={styles.brandSub}>
              Verified Delivery Financing Platform
            </Text>
          </View>
          <View>
            <Text style={styles.docTitle}>
              {isDp ? "INVOICE DP" : "RECEIPT CICILAN"}
            </Text>
            <Text style={styles.docMeta}>No. {data.invoiceNo}</Text>
            <Text style={styles.docMeta}>
              Tanggal {fmtDate(data.paidAt)}
            </Text>
          </View>
        </View>

        {/* Status badge */}
        <View style={styles.section}>
          <Text style={styles.badgeSuccess}>LUNAS / PAID</Text>
        </View>

        {/* Bill To + Application */}
        <View style={[styles.section, { flexDirection: "row", gap: 24 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Tagih Kepada</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 2 }}>
              {data.customer.name}
            </Text>
            <Text style={{ color: colors.muted }}>{data.customer.phone}</Text>
            <Text style={{ color: colors.muted }}>{data.customer.email}</Text>
            {data.customer.address ? (
              <Text style={{ color: colors.muted, marginTop: 4 }}>
                {data.customer.address}
              </Text>
            ) : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Aplikasi</Text>
            <View style={styles.row}>
              <Text style={styles.label}>ID</Text>
              <Text style={styles.value}>{data.application.id}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Produk</Text>
              <Text
                style={[styles.value, { maxWidth: 140, textAlign: "right" }]}
              >
                {data.product.title}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Marketplace</Text>
              <Text style={styles.value}>{data.product.marketplace}</Text>
            </View>
            <View style={styles.rowLast}>
              <Text style={styles.label}>Tenor</Text>
              <Text style={styles.value}>
                {data.application.tenor} bulan
              </Text>
            </View>
          </View>
        </View>

        {/* Line Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rincian</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 4 }]}>Deskripsi</Text>
              <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>
                Jumlah
              </Text>
            </View>
            <View style={styles.tableRowLast}>
              <Text style={{ flex: 4 }}>
                {isDp
                  ? `Down Payment ${data.application.id} (${data.product.title})`
                  : `Cicilan ke-${data.installmentSeq ?? "-"} ${data.application.id}`}
              </Text>
              <Text
                style={{
                  flex: 1,
                  textAlign: "right",
                  fontFamily: "Helvetica-Bold",
                }}
              >
                {fmt(data.amountPaid)}
              </Text>
            </View>
          </View>

          <View style={[styles.row, { marginTop: 8 }]}>
            <Text style={styles.label}>Subtotal</Text>
            <Text style={styles.value}>{fmt(data.amountPaid)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Biaya admin</Text>
            <Text style={styles.value}>{fmt(0)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL DIBAYAR</Text>
            <Text style={styles.totalValue}>{fmt(data.amountPaid)}</Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pembayaran</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Metode</Text>
            <Text style={styles.value}>
              {data.paymentMethod.toUpperCase()}
              {data.channel ? ` · ${data.channel}` : ""}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Reference No.</Text>
            <Text style={[styles.value, { fontFamily: "Courier" }]}>
              {data.referenceNo}
            </Text>
          </View>
          <View style={styles.rowLast}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.value, { color: colors.emerald }]}>
              Terkonfirmasi
            </Text>
          </View>
        </View>

        {/* Outstanding (only for installment) */}
        {!isDp ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sisa Cicilan</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Total pembiayaan</Text>
              <Text style={styles.value}>{fmt(data.application.total)}</Text>
            </View>
            <View style={styles.rowLast}>
              <Text style={styles.label}>Cicilan per bulan</Text>
              <Text style={styles.value}>
                {fmt(data.application.monthly)}
              </Text>
            </View>
          </View>
        ) : null}

        <Text style={{ fontSize: 8, color: colors.muted, marginTop: 24 }}>
          Dokumen ini di-generate otomatis oleh sistem dan sah tanpa tanda
          tangan basah. Simpan dokumen ini sebagai bukti pembayaran resmi.
        </Text>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>
            PT. Manggala Utama Indonesia · Verified Financing Platform
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Halaman ${pageNumber} dari ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );

  return await renderToBuffer(doc);
}
