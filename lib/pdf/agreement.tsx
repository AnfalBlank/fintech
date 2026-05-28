import {
  Document,
  Page,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { styles, fmt, fmtDate, colors } from "./styles";

export type AgreementData = {
  agreementNo: string;
  signedAt: Date;
  customer: {
    name: string;
    phone: string;
    email: string;
    address?: string;
    ktpNumber?: string;
  };
  application: {
    id: string;
    tenor: number;
    total: number;
    dpAmount: number;
    monthly: number;
    marginPct: number;
    financed: number;
  };
  product: { title: string; marketplace: string; price: number };
  schedule: { sequence: number; amount: number; dueDate: Date }[];
};

export async function renderAgreement(data: AgreementData): Promise<Buffer> {
  const doc = (
    <Document
      title={`Perjanjian Cicilan ${data.agreementNo}`}
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
          </View>
          <View>
            <Text style={styles.docTitle}>PERJANJIAN CICILAN DIGITAL</Text>
            <Text style={styles.docMeta}>No. {data.agreementNo}</Text>
            <Text style={styles.docMeta}>
              Ditandatangani {fmtDate(data.signedAt)}
            </Text>
          </View>
        </View>

        {/* Pihak */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Para Pihak</Text>
          <Text style={styles.paragraph}>
            Perjanjian Cicilan Digital ini ("Perjanjian") dibuat dan
            ditandatangani secara elektronik pada tanggal{" "}
            {fmtDate(data.signedAt)} oleh dan antara:
          </Text>

          <View style={{ marginTop: 8, marginBottom: 8 }}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              PIHAK PERTAMA — Penyedia Pembiayaan:
            </Text>
            <Text>PT. Manggala Utama Indonesia</Text>
            <Text style={{ color: colors.muted }}>
              Platform Verified Delivery Financing
            </Text>
          </View>

          <View>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              PIHAK KEDUA — Penerima Pembiayaan:
            </Text>
            <Text>{data.customer.name}</Text>
            {data.customer.ktpNumber ? (
              <Text style={{ color: colors.muted }}>
                NIK: {data.customer.ktpNumber}
              </Text>
            ) : null}
            <Text style={{ color: colors.muted }}>
              {data.customer.phone} · {data.customer.email}
            </Text>
            {data.customer.address ? (
              <Text style={{ color: colors.muted }}>
                {data.customer.address}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Objek pembiayaan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objek Pembiayaan</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Application ID</Text>
            <Text style={[styles.value, { fontFamily: "Courier" }]}>
              {data.application.id}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Produk</Text>
            <Text style={styles.value}>{data.product.title}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Marketplace</Text>
            <Text style={styles.value}>{data.product.marketplace}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Harga produk</Text>
            <Text style={styles.value}>{fmt(data.product.price)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Margin pembiayaan</Text>
            <Text style={styles.value}>
              {(data.application.marginPct * 100).toFixed(1)}%
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total pembiayaan</Text>
            <Text style={styles.value}>{fmt(data.application.total)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Down Payment</Text>
            <Text style={styles.value}>{fmt(data.application.dpAmount)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Sisa dicicil</Text>
            <Text style={styles.value}>{fmt(data.application.financed)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tenor</Text>
            <Text style={styles.value}>
              {data.application.tenor} bulan
            </Text>
          </View>
          <View style={styles.rowLast}>
            <Text style={styles.label}>Cicilan per bulan</Text>
            <Text style={[styles.value, { color: colors.primary }]}>
              {fmt(data.application.monthly)}
            </Text>
          </View>
        </View>

        {/* Klausul */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pasal-Pasal Perjanjian</Text>

          <Text
            style={{ fontFamily: "Helvetica-Bold", marginTop: 4, marginBottom: 4 }}
          >
            Pasal 1 — Pemberian Pembiayaan
          </Text>
          <Text style={styles.paragraph}>
            Pihak Pertama setuju untuk membeli produk yang tercantum di atas
            atas nama Pihak Pertama, kemudian menyerahkan kepemilikan produk
            kepada Pihak Kedua setelah seluruh kewajiban pembayaran diselesaikan
            sesuai jadwal cicilan dalam Perjanjian ini.
          </Text>

          <Text
            style={{ fontFamily: "Helvetica-Bold", marginTop: 4, marginBottom: 4 }}
          >
            Pasal 2 — Kewajiban Pembayaran
          </Text>
          <Text style={styles.paragraph}>
            Pihak Kedua wajib membayar cicilan bulanan sesuai nominal{" "}
            {fmt(data.application.monthly)} per bulan selama{" "}
            {data.application.tenor} bulan. Pembayaran dilakukan paling lambat
            tanggal yang tertera pada jadwal cicilan terlampir.
          </Text>

          <Text
            style={{ fontFamily: "Helvetica-Bold", marginTop: 4, marginBottom: 4 }}
          >
            Pasal 3 — Keterlambatan
          </Text>
          <Text style={styles.paragraph}>
            Setiap keterlambatan pembayaran dikenakan denda sebesar 0,1% per
            hari dari nominal cicilan yang tertunggak. Setelah 90 hari
            keterlambatan, Pihak Pertama berhak melakukan upaya hukum sesuai
            ketentuan yang berlaku.
          </Text>

          <Text
            style={{ fontFamily: "Helvetica-Bold", marginTop: 4, marginBottom: 4 }}
          >
            Pasal 4 — Verified Delivery
          </Text>
          <Text style={styles.paragraph}>
            Penyerahan produk dilakukan oleh kurir internal Pihak Pertama
            disertai bukti foto, koordinat GPS, dan tanda tangan digital yang
            mengikat secara hukum sesuai UU ITE.
          </Text>

          <Text
            style={{ fontFamily: "Helvetica-Bold", marginTop: 4, marginBottom: 4 }}
          >
            Pasal 5 — Tanda Tangan Elektronik
          </Text>
          <Text style={styles.paragraph}>
            Para Pihak menyetujui bahwa tanda tangan elektronik yang dilakukan
            melalui platform Manggala memiliki kekuatan hukum yang sama dengan
            tanda tangan basah, sebagaimana diatur dalam UU No. 11/2008 jo. UU
            No. 19/2016 tentang Informasi dan Transaksi Elektronik.
          </Text>
        </View>

        {/* Schedule */}
        <View style={styles.section} break>
          <Text style={styles.sectionTitle}>Jadwal Cicilan</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 1 }]}>Cicilan</Text>
              <Text style={[styles.th, { flex: 2 }]}>Jatuh Tempo</Text>
              <Text style={[styles.th, { flex: 2, textAlign: "right" }]}>
                Nominal
              </Text>
            </View>
            {data.schedule.map((s, idx) => (
              <View
                key={s.sequence}
                style={
                  idx === data.schedule.length - 1
                    ? styles.tableRowLast
                    : styles.tableRow
                }
              >
                <Text style={{ flex: 1 }}>Ke-{s.sequence}</Text>
                <Text style={{ flex: 2 }}>{fmtDate(s.dueDate)}</Text>
                <Text
                  style={{
                    flex: 2,
                    textAlign: "right",
                    fontFamily: "Helvetica-Bold",
                  }}
                >
                  {fmt(s.amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Signatures */}
        <View
          style={[
            styles.section,
            {
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 24,
            },
          ]}
        >
          <View>
            <Text style={styles.sectionTitle}>Pihak Pertama</Text>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Tanda tangan digital</Text>
              <Text style={styles.signatureName}>Manggala Authorized</Text>
              <Text style={[styles.signatureLabel, { marginTop: 2 }]}>
                {fmtDate(data.signedAt)}
              </Text>
            </View>
          </View>
          <View>
            <Text style={styles.sectionTitle}>Pihak Kedua</Text>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Tanda tangan digital</Text>
              <Text style={styles.signatureName}>{data.customer.name}</Text>
              <Text style={[styles.signatureLabel, { marginTop: 2 }]}>
                {fmtDate(data.signedAt)}
              </Text>
            </View>
          </View>
        </View>

        <Text
          style={{
            fontSize: 8,
            color: colors.muted,
            marginTop: 16,
            textAlign: "center",
          }}
        >
          Dokumen ini sah dan mengikat secara hukum berdasarkan UU ITE.
          Hash dokumen tersimpan di sistem audit Manggala.
        </Text>

        <View style={styles.footer} fixed>
          <Text>PT. Manggala Utama Indonesia</Text>
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
