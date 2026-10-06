import React from "react";
import Layout from "@/components/Layout";
import { FileText, ScrollText, Ban, RefreshCw, UserCheck, Gavel } from "lucide-react";

const SECTIONS = [
  {
    icon: ScrollText,
    title: "Ketentuan Umum",
    body: [
      "Dengan menggunakan aplikasi OjekTa, Anda menyetujui untuk terikat pada ketentuan layanan ini. OjekTa adalah layanan pemesanan ojek daring untuk layanan antar orang, belanja makanan, dan pengiriman barang.",
      "OjekTa adalah platform teknologi yang mencocokkan pengguna dengan driver mitra. Layanan transportasi dan pengiriman dilakukan oleh driver mitra yang telah terverifikasi oleh admin."
    ]
  },
  {
    icon: UserCheck,
    title: "Akun dan Keamanan",
    body: [
      "Untuk menggunakan layanan, Anda wajib membuat akun. Pembuatan akun dapat dilakukan melalui login Google; dengan ini Anda mengizinkan aplikasi menerima nama, alamat email, dan foto profil dari akun Google Anda.",
      "Anda bertanggung jawab menjaga kerahasiaan akun dan seluruh aktivitas yang terjadi melalui akun Anda. Dilarang menggunakan aplikasi untuk tujuan yang melanggar hukum."
    ]
  },
  {
    icon: FileText,
    title: "Pemesanan dan Pembayaran",
    body: [
      "Tarif layanan ditentukan berdasarkan jarak tempuh dan ditampilkan sebelum Anda melakukan pemesanan. Pembayaran dapat dilakukan secara tunai (cash) atau melalui QRIS sesuai pilihan yang tersedia.",
      "Biaya barang yang dibelanjakan driver terpisah dari biaya jasa pengantar dan wajib dilunasi sesuai rincian pesanan. Pesanan dapat dibatalkan sesuai ketentuan status pesanan yang berlaku di aplikasi."
    ]
  },
  {
    icon: Ban,
    title: "Larangan Penggunaan",
    body: [
      "Pengguna dilarang mengirimkan barang terlarang, barang berbahaya, atau barang yang dilarang oleh hukum. Dilarang melakukan penyalahgunaan layanan, manipulasi pembayaran, atau tindakan yang merugikan driver maupun pengguna lain.",
      "Pelanggaran ketentuan dapat mengakibatkan penangguhan atau penghapusan akun tanpa pemberitahuan sebelumnya."
    ]
  },
  {
    icon: RefreshCw,
    title: "Perubahan Ketentuan",
    body: [
      "Ketentuan layanan ini dapat diperbarui dari waktu ke waktu. Setiap perubahan akan kami umumkan melalui halaman ini dan/atau notifikasi di dalam aplikasi.",
      "Penggunaan layanan secara berkelanjutan setelah pembaruan dianggap sebagai persetujuan Anda terhadap ketentuan yang berlaku."
    ]
  },
  {
    icon: Gavel,
    title: "Hukum yang Berlaku",
    body: [
      "Ketentuan layanan ini diatur berdasarkan hukum Republik Indonesia. Sengketa yang timbul akan diselesaikan terlebih dahulu secara musyawarah, dan apabila tidak tercapai kesepakatan, akan diselesaikan melalui pengadilan yang berwenang."
    ]
  }
];

export default function Terms() {
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" /> Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ketentuan layanan penggunaan aplikasi OjekTa.
        </p>
      </div>
      <div className="grid gap-4">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="bg-card rounded-2xl border border-border p-5">
              <h2 className="font-bold mb-2 flex items-center gap-2">
                <Icon className="w-5 h-5 text-primary shrink-0" /> {s.title}
              </h2>
              <div className="space-y-2">
                {s.body.map((p, i) => (
                  <p key={i} className="text-sm text-muted-foreground leading-relaxed selectable">{p}</p>
                ))}
              </div>
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground text-center">
          Terakhir diperbarui: 6 Oktober 2026
        </p>
      </div>
    </Layout>
  );
}