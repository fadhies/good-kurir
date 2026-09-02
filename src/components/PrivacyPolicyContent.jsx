import React from "react";
import { Database, Search, Target, ShieldCheck, Share2, Cookie, UserCheck, FileText, Mail, Phone } from "lucide-react";

const SECTIONS = [
  {
    icon: Database,
    title: "Informasi yang Dikumpulkan",
    body: [
      "Kami mengumpulkan data pribadi berupa: nama lengkap, alamat email, nomor telepon, alamat IP, data lokasi (GPS) saat Anda menggunakan layanan pesanan/antar, serta informasi pembayaran (mis. bukti transfer dan nomor akun Dana) yang diperlukan untuk memproses transaksi.",
      "Untuk driver, kami juga mengumpulkan data kendaraan, nomor plat, foto KTP, dan foto selfie bersama KTP sebagai syarat verifikasi."
    ]
  },
  {
    icon: Search,
    title: "Metode Pengumpulan Data",
    body: [
      "Data kami kumpulkan secara langsung ketika Anda mengisinya sendiri, misalnya melalui formulir pendaftaran akun, form pemesanan, obrolan (chat) dengan driver, atau proses transaksi di dalam aplikasi.",
      "Sebagian data juga dikumpulkan secara otomatis oleh sistem, seperti alamat IP, data lokasi perangkat saat layanan aktif, serta data penggunaan aplikasi melalui cookie dan layanan analitik."
    ]
  },
  {
    icon: Target,
    title: "Tujuan Penggunaan Data",
    body: [
      "Data yang dikumpulkan kami gunakan untuk: memproses dan mengantarkan pesanan Anda, mencocokkan pesanan dengan driver terdekat, menghubungi Anda terkait status pesanan, memproses pembayaran dan penyelesaian fee, meningkatkan kualitas layanan aplikasi, serta menjaga keamanan akun dan mendeteksi penyalahgunaan atau kecurangan.",
      "Kami tidak menggunakan data Anda untuk tujuan lain di luar yang disebutkan di atas tanpa persetujuan Anda."
    ]
  },
  {
    icon: ShieldCheck,
    title: "Penyimpanan dan Keamanan Data",
    body: [
      "Data Anda disimpan di server yang dikelola oleh penyedia infrastruktur tepercaya dengan standar keamanan industri. Selama transit dan penyimpanan, data dilindungi menggunakan enkripsi.",
      "Akses ke data dibatasi berdasarkan peran (user, driver, admin) melalui kebijakan keamanan tingkat baris (row-level security). Data pesanan Anda hanya dapat dilihat oleh Anda, driver yang menerima pesanan, dan admin.",
      "Data kami simpan selama akun Anda masih aktif atau selama diperlukan untuk keperluan transaksi dan hukum. Jika Anda menghapus akun, data pribadi Anda akan dihapus dari sistem kami sesuai ketentuan."
    ]
  },
  {
    icon: Share2,
    title: "Pembagian Data ke Pihak Ketiga",
    body: [
      "Kami TIDAK menjual, menyewakan, atau memperdagangkan data pribadi Anda kepada pihak ketiga mana pun.",
      "Data hanya dapat dibagikan secara terbatas kepada: penyedia layanan analitik (untuk statistik penggunaan aplikasi), penyedia layanan pembayaran (untuk memproses transaksi), mitra teknologi yang menopang operasional aplikasi, atau aparat/pejabat berwenang jika diwajibkan oleh hukum yang berlaku.",
      "Setiap pembagian data dilakukan semata-mata untuk menjalankan layanan yang Anda gunakan."
    ]
  },
  {
    icon: Cookie,
    title: "Penggunaan Cookie dan Teknologi Pelacak",
    body: [
      "Aplikasi kami menggunakan cookie dan teknologi pelacak serupa untuk menjaga sesi login Anda tetap aktif, mengingat preferensi penggunaan, serta mengumpulkan statistik penggunaan aplikasi.",
      "Anda dapat mengelola atau menolak cookie melalui pengaturan peramban (browser) atau perangkat Anda. Perlu diketahui bahwa menonaktifkan cookie dapat memengaruhi beberapa fitur aplikasi, misalnya sesi login."
    ]
  },
  {
    icon: UserCheck,
    title: "Hak-Hak Pengguna",
    body: [
      "Anda memiliki hak atas data pribadi Anda, yaitu: hak untuk melihat (mengakses) data yang kami simpan, hak untuk mengoreksi data yang tidak akurat, hak untuk menghapus data pribadi Anda (right to be forgotten) termasuk menghapus akun secara permanen melalui menu pengaturan akun, serta hak untuk menarik persetujuan penggunaan data Anda sewaktu-waktu.",
      "Untuk menggunakan hak-hak tersebut, silakan hubungi kami melalui informasi kontak di bagian bawah kebijakan ini."
    ]
  },
  {
    icon: FileText,
    title: "Perubahan Kebijakan Privasi",
    body: [
      "Kebijakan privasi ini dapat diperbarui dari waktu ke waktu seiring perkembangan layanan atau peraturan yang berlaku.",
      "Setiap perubahan akan kami umumkan melalui halaman ini dan/atau notifikasi di dalam aplikasi. Penggunaan layanan secara berkelanjutan setelah pembaruan dianggap sebagai persetujuan Anda terhadap kebijakan yang berlaku."
    ]
  }
];

export default function PrivacyPolicyContent() {
  return (
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

      <div className="bg-card rounded-2xl border-2 border-primary/30 p-5">
        <h2 className="font-bold mb-2 flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary shrink-0" /> Informasi Kontak
        </h2>
        <p className="text-sm text-muted-foreground mb-3 selectable">
          Jika Anda memiliki pertanyaan, permintaan, atau keluhan terkait privasi data pribadi Anda, silakan hubungi kami:
        </p>
        <div className="grid gap-2">
          <a href="mailto:delgazessi@gmail.com" className="flex items-center gap-2 text-sm font-medium text-primary">
            <Mail className="w-4 h-4" /> delgazessi@gmail.com
          </a>
          <a href="tel:+628119477702" className="flex items-center gap-2 text-sm font-medium text-primary">
            <Phone className="w-4 h-4" /> +62 811-9477-702
          </a>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Terakhir diperbarui: 3 September 2026
      </p>
    </div>
  );
}