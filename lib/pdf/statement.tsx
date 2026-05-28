import {
  Document,
  Page,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { styles, fmt, fmtDate, colors } from "./styles";

export type StatementData = {
  statementNo: string;
  generatedAt: Date;
  period: { from: Date; to: Date };
  customer: { name: string; phone: string; email: string };
  applications: {
    id: string;
    productTitle: string;
    total: number;
    paid: number;
    outstanding: number;
    status: string;
  }[];
  payments: {
    id: string;
    type: string;
    method: string;
    amount: number;
    paidAt: Date;
    referenceNo: string;
    applicationId: string;
  }[];
  upcomingInstallments: {
    sequence: number;
    amount: number;
    dueDate: Date;
    applicationId: string;
    status: string;
  }[];
};

export async function renderStatement(data: StatementData): Promise<Buffer> {
  const totalPaid = data.payments.reduce((s, p) => s + p.amount, 0);
  const totalOutstanding = data.applications.reduce(
    (s, a) => s + a.outstanding,
    0
  );

  const doc = (
    <Document
      title={`Statement ${data.statementNo}`}
      author="PT. Manggala Utama Indonesia"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.brand}>MANGGALA</Text>
            <Text style={styles.brandSub}>
              PT. Manggala Utama Indonesia
            </Text>
          </View>
          <View>
            <Text style={styles.docTitle}>STATEMENT BULANAN</Text>
            <Text style={styles.docMeta}>No. {data.statementNo}</Text>
            <Text style={styles.docMeta}>
              {fmtDate(data.period.from)} — {fmtDate(data.period.to)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>
            {data.customer.name}
          </Text>
          <Text style={{ color: colors.muted }}>
            {data.customer.phone} · {data.customer.email}
          </Text>
        </View>

        {/* Summary */}
        <View
          style={[
            styles.section,
            { flexDirection: "row", gap: 16 },
          ]}
        >
          <View
            style={{
              flex: 1,
              borderWidth: 0.5,
              borderColor: colors.border,
              borderRadius: 8,
              padding: 12,
            }}
          >
            <Text style={{ fontSize: 8, color: colors.muted }}>
              Total Dibayar
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Helvetica-Bold",
                marginTop: 4,
              }}
            >
              {fmt(totalPaid)}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              borderWidth: 0.5,
              borderColor: colors.border,
              borderRadius: 8,
              padding: 12,
            }}
          >
            <Text style={{ fontSize: 8, color: colors.muted }}>
              Outstanding
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Helvetica-Bold",
                marginTop: 4,
                color: colors.primary,
              }}
            >
              {fmt(totalOutstanding)}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              borderWidth: 0.5,
              borderColor: colors.border,
              borderRadius: 8,
              padding: 12,
            }}
          >
            <Text style={{ fontSize: 8, color: colors.muted }}>
              Cicilan Aktif
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Helvetica-Bold",
                marginTop: 4,
              }}
            >
              {data.applications.filter((a) => a.outstanding > 0).length}
            </Text>
          </View>
        </View>

        {/* Applications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplikasi Cicilan</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 1 }]}>App ID</Text>
              <Text style={[styles.th, { flex: 3 }]}>Produk</Text>
              <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>
                Total
              </Text>
              <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>
                Outstanding
              </Text>
              <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>
                Status
              </Text>
            </View>
            {data.applications.length === 0 ? (
              <View style={styles.tableRowLast}>
                <Text style={{ flex: 1, color: colors.muted }}>
                  Tidak ada aplikasi
                </Text>
              </View>
            ) : null}
            {data.applications.map((a, idx) => (
              <View
                key={a.id}
                style={
                  idx === data.applications.length - 1
                    ? styles.tableRowLast
                    : styles.tableRow
                }
              >
                <Text style={{ flex: 1, fontFamily: "Courier", fontSize: 8 }}>
                  {a.id}
                </Text>
                <Text style={{ flex: 3 }}>{a.productTitle}</Text>
                <Text style={{ flex: 1, textAlign: "right" }}>
                  {fmt(a.total)}
                </Text>
                <Text style={{ flex: 1, textAlign: "right" }}>
                  {fmt(a.outstanding)}
                </Text>
                <Text
                  style={{ flex: 1, textAlign: "right", fontSize: 8 }}
                >
                  {a.status}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pembayaran Periode Ini</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 2 }]}>Tanggal</Text>
              <Text style={[styles.th, { flex: 2 }]}>Reference</Text>
              <Text style={[styles.th, { flex: 1 }]}>Type</Text>
              <Text style={[styles.th, { flex: 1 }]}>Method</Text>
              <Text style={[styles.th, { flex: 2, textAlign: "right" }]}>
                Jumlah
              </Text>
            </View>
            {data.payments.length === 0 ? (
              <View style={styles.tableRowLast}>
                <Text style={{ flex: 1, color: colors.muted }}>
                  Tidak ada pembayaran
                </Text>
              </View>
            ) : null}
            {data.payments.map((p, idx) => (
              <View
                key={p.id}
                style={
                  idx === data.payments.length - 1
                    ? styles.tableRowLast
                    : styles.tableRow
                }
              >
                <Text style={{ flex: 2, fontSize: 9 }}>
                  {fmtDate(p.paidAt)}
                </Text>
                <Text style={{ flex: 2, fontSize: 8, fontFamily: "Courier" }}>
                  {p.referenceNo}
                </Text>
                <Text style={{ flex: 1, fontSize: 9 }}>{p.type}</Text>
                <Text style={{ flex: 1, fontSize: 9 }}>{p.method}</Text>
                <Text
                  style={{
                    flex: 2,
                    textAlign: "right",
                    fontFamily: "Helvetica-Bold",
                  }}
                >
                  {fmt(p.amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Upcoming */}
        {data.upcomingInstallments.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cicilan Mendatang</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 2 }]}>Application</Text>
                <Text style={[styles.th, { flex: 1 }]}>#</Text>
                <Text style={[styles.th, { flex: 2 }]}>Jatuh Tempo</Text>
                <Text style={[styles.th, { flex: 1 }]}>Status</Text>
                <Text style={[styles.th, { flex: 2, textAlign: "right" }]}>
                  Nominal
                </Text>
              </View>
              {data.upcomingInstallments.map((u, idx) => (
                <View
                  key={`${u.applicationId}-${u.sequence}`}
                  style={
                    idx === data.upcomingInstallments.length - 1
                      ? styles.tableRowLast
                      : styles.tableRow
                  }
                >
                  <Text style={{ flex: 2, fontFamily: "Courier", fontSize: 8 }}>
                    {u.applicationId}
                  </Text>
                  <Text style={{ flex: 1 }}>Ke-{u.sequence}</Text>
                  <Text style={{ flex: 2, fontSize: 9 }}>
                    {fmtDate(u.dueDate)}
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 9,
                      color:
                        u.status === "overdue"
                          ? colors.danger
                          : colors.muted,
                    }}
                  >
                    {u.status}
                  </Text>
                  <Text
                    style={{
                      flex: 2,
                      textAlign: "right",
                      fontFamily: "Helvetica-Bold",
                    }}
                  >
                    {fmt(u.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <Text
          style={{
            fontSize: 8,
            color: colors.muted,
            marginTop: 16,
          }}
        >
          Statement ini di-generate otomatis pada {fmtDate(data.generatedAt)}.
          Hubungi support@manggala.id jika ada koreksi yang diperlukan.
        </Text>

        <View style={styles.footer} fixed>
          <Text>PT. Manggala Utama Indonesia · Statement</Text>
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
