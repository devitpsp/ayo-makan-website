import type { Metadata } from "next";
import { TopBar } from "@/components/top-bar";
import { GoogleAttribution } from "@/components/google-attribution";

export const metadata: Metadata = {
  title: "Privasi: Ayo Makan",
  description: "Data apa yang dipakai Ayo Makan, apa yang diteruskan ke Google, dan apa yang disimpan di perangkatmu.",
};

export default function PrivasiPage() {
  return (
    <>
      <div className="mx-auto max-w-[1200px] px-4 pt-4">
        <TopBar variant="box" />
      </div>
      <main id="konten" tabIndex={-1} className="mx-auto max-w-2xl space-y-8 px-4 py-10 leading-relaxed">
        <h1 className="display text-4xl uppercase">Privasi</h1>
        <p>
          Ayo Makan tidak pakai akun dan tidak pakai cookie pelacak. Halaman ini menjelaskan data apa yang lewat dan di mana ia disimpan.
        </p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Lokasi</h2>
          <p>
            Kalau kamu mengizinkan, posisimu dipakai untuk menghitung jarak. Koordinat dikirim ke Google untuk satu permintaan pencarian, lalu tidak
            disimpan di server Ayo Makan dan tidak dikirim ke analytics. Di perangkatmu hanya tersimpan pilihan sumber lokasi (posisi atau kampus),
            bukan koordinatnya.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Data tempat, ulasan, dan foto</h2>
          <p>
            Semua data tempat, rating, jam buka, ulasan, dan foto datang dari Google Maps lewat Places API. Ayo Makan tidak menyimpan konten itu. Ulasan
            tidak diubah dan tidak diringkas. Penulis ulasan dan foto ditampilkan sesuai sumbernya.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Yang tersimpan di perangkatmu</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Daftar Favorit: hanya ID tempat dan waktu simpan.</li>
            <li>5 kata kunci pencarian terakhir.</li>
            <li>Pilihan lokasi, pilihan tema, dan penanda ajakan pasang aplikasi.</li>
          </ul>
          <p>Semuanya bisa dihapus lewat pengaturan situs di browser.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Analytics</h2>
          <p>
            Ayo Makan memakai Vercel Web Analytics tanpa cookie untuk melihat kata kunci yang sering dicari dan fitur yang dipakai. Lokasi tidak ikut dikirim.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Ketentuan Google</h2>
          <p>
            Dengan memakai Ayo Makan kamu juga tunduk pada{" "}
            <a href="https://maps.google.com/help/terms_maps/" target="_blank" rel="noopener">Ketentuan Layanan Google Maps/Google Earth</a> dan{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Kebijakan Privasi Google</a>.
          </p>
          <GoogleAttribution className="!px-0" />
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Kredit foto</h2>
          <p>Foto hidangan di bagian atas beranda disediakan oleh pengelola Ayo Makan. Bila lisensi sebuah foto meminta kredit, nama fotografernya ditulis di sini.</p>
        </section>
      </main>
    </>
  );
}
