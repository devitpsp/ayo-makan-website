# Audit 001, tindak lanjut (2 November 2026)

Nomor yang dipilih owner untuk diperbaiki: 1, 2, 3, 4, 6, ditambah satu temuan baru dari owner (kolom cari hero tidak mengikuti slide). Nomor lain di `audit-001-2026-11-02.md` tidak disentuh.

| # | Temuan | Perbaikan | Bukti |
|---|---|---|---|
| 1 | Gagal "Muat lebih banyak" menghapus seluruh daftar | Layar galat hanya bila halaman PERTAMA gagal; galat lanjutan menjadi pesan inline (batas laju/kuota/umum) dan tombol tetap bisa dicoba lagi | verify-ui: 9 kartu tetap ada, pesan tampil, ketuk lagi menjadi 18 kartu (sebelumnya 6 menjadi 0) |
| 2 | Kembali dari detail mengambil ulang semua halaman berbayar | `refetchOnMount: false` untuk pencarian; jumlah kartu yang tampil diingat selama sesi | 0 panggilan tambahan setelah kembali dengan data basi 6 menit; 18 kartu tetap 18 (sebelumnya 2 panggilan) |
| 3 | Favorit memuat foto walau `LIST_PHOTOS=off` | `detailCardMask(withPhotos)` di `fieldmasks.ts`, dipakai `details.ts` lewat `flags.ts`; 3 unit test; 1 panggilan Google nyata memastikan mask valid | vitest 35 PASS |
| 4 | 30 favorit melawan batas 30 detail/5 menit; galat sementara menawarkan Hapus | Favorit dimuat bertahap 6 lalu "Muat lebih banyak"; galat 429/jaringan/Google = "Coba lagi", hanya 404 sungguhan yang boleh dihapus | 6 permintaan dari 8 favorit di tahap pertama; 429 hanya "Coba lagi"; 404 boleh Hapus |
| 6 | Tiap jeda mengetik memicu Text Search berbayar | Pencarian otomatis minimal 3 huruf dan jeda 700 ms (Enter tetap mulai 2 huruf); menyimpang dari PRD F-02 (400 ms, 2 huruf) atas keputusan owner | "nasi goreng" dengan jeda 520 ms/huruf = 1 panggilan (sebelumnya 1 per huruf); 2 huruf = 0 panggilan |
| N1 | Kolom cari hero tertinggal pada pencarian lama saat slide diganti | Kolom mengikuti kata kunci slide sebagai isian saja: tidak mencari, tidak menimpa ketikan pengguna, terpilih semua saat difokus | 6 uji baru, dan dicek di server dev :3000 |

Hasil akhir: `verify-ui` 126 PASS, `verify-pwa` 14 PASS, vitest 35 PASS, tsc dan lint bersih.

## Masih terbuka (belum dipilih owner)
5, 7 sampai 23 di laporan utama, di antaranya GPS telat menimpa kampus (7), dua filter diklik cepat (8), geser hero dengan mouse (9), halaman 404 berbahasa Inggris (10), beranda tanpa `<main>` (11).

---

## Batch 2 (2 November 2026)

Nomor dikerjakan: 7, 8, 9, 10, 11, 12, 14, 15, 16, 19. Tidak disentuh (butuh keputusan owner): 5 (batas laju), 13 (urutan ulang saat memuat lanjutan), 17 (cache service worker), 18 (target sentuh 44 px), 20 sampai 23.

| # | Temuan | Perbaikan | Bukti |
|---|---|---|---|
| 7 | GPS telat menimpa kampus yang dipilih belakangan; permintaan GPS ganda | Setiap permintaan GPS bernomor; hasil lama diabaikan bila pengguna memilih kampus atau meminta ulang; permintaan manual menggantikan pengambilan otomatis | pilih Kampus 1 saat GPS 1,5 dtk: tetap `campus`; 1 panggilan `getCurrentPosition` |
| 8 | Dua filter diklik beruntun: yang pertama hilang | `set()` menggabung ke state terbaru (ref), bukan state dari URL yang belum dikomit | `/?buka=1&murah=1` |
| 9 | Geser hero dengan mouse gagal | `draggable={false}`, `-webkit-user-drag:none`, `onDragStart` dicegah | geser mouse memindahkan slide |
| 10 | 404 dan galat bawaan Next berbahasa Inggris | `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx` berbahasa Indonesia | status 404 + teks Indonesia; galat render menampilkan "Ada yang salah di halaman ini." + Coba lagi |
| 11 | Beranda tanpa `<main>`, tanpa tautan lewati | `<main id="konten">` di semua halaman, tautan "Lewati ke konten" (tersembunyi sampai difokus) | satu `<main>` per halaman; Tab pertama menampilkan tautan; Enter memindahkan fokus ke main |
| 12 | "Belum ketemu" padahal ada halaman berikutnya | Tombol "Cari di hasil berikutnya" di state kosong bila ada token | hasil halaman 2 (4 kartu) tampil |
| 14 | Retry pada timeout/jaringan untuk POST berbayar | Retry hanya untuk respons 5xx (PRD 11) | 5 unit test `googleFetch` (fetch palsu) |
| 15 | GPS ditolak dari mode kampus tanpa umpan balik | Pemilih lokasi tetap terbuka saat GPS gagal dan menampilkan pesan (`gpsFailure`) | pesan tampil di dialog yang masih terbuka |
| 16 | `?q=%20a` lolos klien, 400 di server | `parseState` memangkas spasi | 3 unit test + uji browser |
| 19 | Fokus keyboard bisa tertutup header melekat | `scroll-padding-top: 88px` pada `html` | elemen terfokus top 97 px vs bawah header 82 px |

Temuan sampingan: tautan "Lewati ke konten" sempat tampil permanen karena aturan CSS-nya tidak pernah masuk (jangkar sisipan sudah hilang setelah DESIGN.md berubah ke v1.2). Diperbaiki, dan ujinya sekarang memeriksa kondisi tersembunyi sebelum fokus.

Hasil: `verify-ui` 146 PASS, `verify-pwa` 14 PASS, vitest 43 PASS, tsc dan lint bersih, bundle klien bebas kunci.

---

## Batch 3 (2 November 2026)

Nomor dikerjakan: 5, 13, 17, 18, 20. Keputusan angka dan ruang lingkup saya tulis di sini karena owner meminta "kerjakan" tanpa menentukannya.

| # | Temuan | Perbaikan | Bukti |
|---|---|---|---|
| 5 | Batas laju per IP terlalu ketat untuk Wi-Fi kampus bersama; XFF bisa dipalsukan | Batas naik: pencarian 60, detail 60, foto 240 per 5 menit (dari 20/30/120). IP diambil dari `x-vercel-forwarded-for`, lalu `x-real-ip`, lalu XFF paling kiri. Pengaman biaya tetap batas bulanan global per SKU | 6 unit test; end-to-end: 60 permintaan lolos, ke-61 mendapat 429; XFF palsu dengan header platform tidak menghindari batas |
| 13 | Memuat lanjutan mengacak kartu yang sudah tampil (urutan Terdekat/Rating teruji) | Tiap halaman diurutkan sendiri lalu ditambahkan di belakang | 6 kartu pertama identik sebelum dan sesudah memuat halaman yang berisi tempat lebih dekat; total 12 |
| 17 | Service worker tidak pernah dipasang ulang; cache menumpuk | `/sw.js` kini route handler (`app/sw.js/route.ts`, `lib/sw-source.ts`) dengan nama cache memuat versi build (`VERCEL_GIT_COMMIT_SHA` atau waktu build); `activate` menghapus cache lama | header `no-store`; nama cache `am-shell-<versi>`; cache usang dihapus saat SW baru aktif; 3 unit test |
| 18 | Target sentuh di bawah 44 px | Footer Privasi 66x44; titik carousel melebar mengikuti ruang (41 px di 390 px) | uji ukuran |
| 20 | Kembali di detail bisa meninggalkan Ayo Makan | `NavTracker` menandai perpindahan di dalam aplikasi; tanpa itu Kembali menuju beranda | tautan bersama di tab berriwayat menuju `/`; dari hasil ke detail lalu Kembali tetap `/?q=seblak` |

Hasil: `verify-ui` 152 PASS, `verify-pwa` 18 PASS, vitest 52 PASS, tsc dan lint bersih, bundle klien bebas kunci.

### Tidak diubah (keputusan owner)
- **21 thumbnail galeri berupa angka**: sengaja, agar tidak memakai 4 panggilan foto tambahan per detail (kuota foto 1.000/bulan).
- **22 logo**: sudah dikerjakan sesi lain (stiker logo di header, DESIGN 6.7).
- **23 ukuran JS**: sekarang 233,2 KB gzip (baseline Next 16 kosong 176 KB; target PRD 150 KB tidak realistis). Usul: ubah target PRD 11 menjadi sekitar 240 KB. LCP 2.196 ms (batas 2.500).
- Titik carousel di 360 px sekitar 36 px (di bawah 44, di atas minimum WCAG 2.5.8 24 px): diterima.
