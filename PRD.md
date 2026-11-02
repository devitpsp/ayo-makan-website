# PRD: Ayo Makan

Aplikasi web (PWA) untuk mahasiswa dan anak kost di sekitar UIN Salatiga: cari tempat makan dan minum yang murah, dekat, dan ratingnya tinggi di Google Maps, lalu langsung buka rutenya.

| Atribut | Nilai |
|---|---|
| Versi dokumen | 1.0 (draft) |
| Tanggal | 2 November 2026 |
| Status | Draft, menunggu review owner. Target pertama: demo dengan biaya Google Rp0 (bagian 9.1) |
| Product owner | [ISI: nama owner] |
| Platform | Web responsif + PWA (bisa dipasang di HP), hosting Vercel |
| Sumber data | Google Places API (New), penuh. Tidak ada database tempat milik sendiri |
| Bahasa UI | Bahasa Indonesia |

---

## 1. Ringkasan

Ayo Makan menjawab satu pertanyaan yang diulang mahasiswa setiap hari: "makan apa yang murah, enak, dan dekat dari sini?". Pengguna membuka aplikasi, mengetik makanan yang dicari (seblak, nasi rames, mie ayam) atau memilih jenis (Makanan, Minuman, Jajanan), mengatur radius dari kampus atau posisinya, lalu melihat daftar tempat yang diurutkan berdasarkan rating Google, jarak, dan kisaran harga. Satu ketukan membuka detail tempat beserta ulasan dari Google Maps, dan satu ketukan lagi membuka rute di aplikasi Google Maps.

Tanpa login. Tanpa daftar akun. Buka, cari, jalan.

## 2. Latar Belakang dan Masalah

### 2.1 Kondisi sekarang

Mahasiswa kost di sekitar kampus UIN Salatiga biasanya mencari makan dengan tiga cara, semuanya punya kelemahan:

| Cara sekarang | Masalahnya |
|---|---|
| Buka Google Maps, ketik "makanan" | Hasil campur dengan restoran mahal dan tempat jauh. Tidak ada filter "murah" yang jelas, filter rating tersembunyi, dan harus geser peta manual. |
| Tanya teman atau grup angkatan | Lambat, tergantung siapa yang sedang online, rekomendasinya itu-itu saja. |
| Jalan keliling sekitar kost | Buang waktu dan tenaga, tidak tahu rating atau kisaran harga sebelum masuk. |

### 2.2 Pernyataan masalah

> Mahasiswa dengan uang saku terbatas tidak punya cara cepat untuk menemukan tempat makan yang **murah**, **dekat**, dan **terbukti enak** (rating tinggi dari banyak orang) di sekitar kampus, dalam satu layar, tanpa harus memilah hasil Google Maps yang tidak terfilter.

### 2.3 Kenapa sekarang

Data rating, jumlah ulasan, kisaran harga, jam buka, dan ulasan pengguna sudah tersedia di Google Maps. Yang belum ada adalah tampilan yang memfilter data itu khusus untuk kebutuhan anak kost: radius pendek dari kampus, harga murah di depan, dan rating yang bisa dipercaya.

## 3. Tujuan dan Non-Tujuan

### 3.1 Tujuan produk

1. Pengguna menemukan tempat makan yang cocok dalam waktu singkat sejak membuka aplikasi (target waktu diukur, lihat bagian 13).
2. Setiap hasil menampilkan tiga informasi kunci tanpa perlu dibuka: **rating Google + jumlah ulasan**, **jarak**, dan **kisaran harga** (jika Google punya datanya).
3. Pengguna bisa membaca ulasan asli dari Google Maps sebelum memutuskan.
4. Dari detail tempat, pengguna langsung diarahkan ke rute Google Maps.
5. Bisa dipasang di layar utama HP (PWA) dan nyaman dipakai di desktop.

### 3.2 Non-tujuan (versi 1)

- Tidak ada pemesanan, pembayaran, atau pesan antar.
- Tidak ada login atau akun pengguna.
- Tidak ada ulasan buatan pengguna Ayo Makan (semua ulasan dari Google). Masuk backlog, lihat bagian 15.
- Tidak ada daftar menu per item dengan harga. Google tidak menyediakan data menu; hanya kisaran harga per orang.
- Tidak ada klaim halal. Google tidak punya atribut halal yang terstruktur (lihat Risiko R5).
- Tidak ada peta interaktif tertanam di versi 1. Rute dibuka di aplikasi Google Maps.

## 4. Pengguna

Persona di bawah adalah **asumsi awal** untuk mengarahkan desain. Validasi dengan wawancara singkat 5 sampai 8 mahasiswa sebelum build (lihat Pertanyaan Terbuka).

### Persona A: Mahasiswa kost, uang saku mingguan

- Tinggal di kost dalam radius jalan kaki dari kampus, tidak selalu bawa motor.
- Anggaran makan sekali makan kecil, sangat peka harga.
- Pakai HP Android kelas menengah, kuota internet terbatas.
- Kebutuhan: "Mau seblak yang enak, yang jalan kaki 5 menit dari kost."

### Persona B: Mahasiswa baru (maba)

- Belum kenal daerah sekitar kampus.
- Kebutuhan: "Di sekitar kampus ada makan apa saja yang ratingnya bagus?" (eksplorasi tanpa kata kunci).

### Persona C: Mahasiswa nugas di kafe

- Cari tempat minum yang buka sampai malam.
- Kebutuhan: filter Minuman + Buka sekarang + rating.

## 5. User Stories dan Kriteria Penerimaan

Format: **US-XX**: Sebagai [pengguna], saya ingin [aksi], agar [manfaat].

| ID | User story | Kriteria penerimaan |
|---|---|---|
| US-01 | Sebagai mahasiswa, saya ingin mengetik nama makanan (misal "seblak") agar langsung melihat tempat yang menjualnya di sekitar saya. | Hasil muncul setelah pengguna menekan Enter atau berhenti mengetik 400 ms (min. 2 huruf). Hasil hanya berisi tempat dalam radius aktif. Query kosong menampilkan mode jelajah per kategori. |
| US-02 | Sebagai mahasiswa, saya ingin memilih jenis Makanan, Minuman, atau Jajanan agar hasil tidak campur aduk. | Satu kategori aktif setiap saat (default Makanan). Pergantian kategori memuat ulang hasil dan mempertahankan filter lain. |
| US-03 | Sebagai anak kost, saya ingin mengatur radius (500 m, 1 km, 2 km, 3 km) agar hanya melihat tempat yang terjangkau jalan kaki atau motor. | Default 1 km. Tidak ada hasil di luar radius (difilter ulang di server dengan perhitungan jarak). Jarak tampil di setiap kartu. |
| US-04 | Sebagai pengguna, saya ingin pusat pencarian bisa dari posisi saya atau dari salah satu kampus UIN Salatiga. | Jika izin lokasi diberikan, pusat = posisi GPS. Jika ditolak atau gagal, pengguna memilih kampus. Pilihan tersimpan di perangkat. |
| US-05 | Sebagai mahasiswa hemat, saya ingin menyaring tempat yang murah. | Toggle "Murah" memakai `priceLevel` = INEXPENSIVE dari Google. UI menjelaskan bahwa tempat tanpa data harga di Google ikut tersaring keluar. |
| US-06 | Sebagai pengguna, saya ingin hanya melihat tempat dengan rating tinggi. | Pilihan rating minimal: Semua, 4.0+, 4.5+. Default 4.0+. |
| US-07 | Sebagai pengguna malam hari, saya ingin hanya melihat tempat yang sedang buka. | Toggle "Buka sekarang" (default mati). Kartu menampilkan status Buka/Tutup jika Google punya jam buka. |
| US-08 | Sebagai pengguna, saya ingin mengurutkan hasil berdasarkan Paling cocok, Terdekat, atau Rating teruji. | Tiga opsi urutan. "Rating teruji" memakai skor berbobot jumlah ulasan (bagian 7, F-06). |
| US-09 | Sebagai pengguna, saya ingin membuka detail tempat dan membaca ulasan dari Google Maps. | Detail menampilkan foto, rating, jumlah ulasan, kisaran harga, jam buka, alamat, jarak, dan maksimal 5 ulasan Google dengan nama penulis, foto profil, bintang, dan waktu relatif. |
| US-10 | Sebagai pengguna, saya ingin satu tombol yang membuka rute ke tempat itu. | Tombol "Rute ke sini" membuka Google Maps (aplikasi di HP, web di desktop) dengan tujuan = tempat tersebut. |
| US-11 | Sebagai pengguna, saya ingin menyimpan tempat favorit tanpa login. | Ikon simpan di kartu dan detail. Hanya `place_id` yang disimpan di perangkat (localStorage). Halaman Favorit memuat data terbaru dari Google. |
| US-12 | Sebagai pengguna, saya ingin membagikan tempat ke teman. | Tombol Bagikan memakai Web Share API; fallback salin tautan. Tautan membuka detail tempat di Ayo Makan. |
| US-13 | Sebagai pengguna HP, saya ingin memasang Ayo Makan di layar utama. | Manifest + service worker valid. Ajakan pasang muncul setelah kunjungan kedua, bisa ditutup, tidak muncul lagi 14 hari setelah ditutup. |

## 6. Alur Pengguna

### 6.1 Alur utama: cari dan berangkat

```
Buka app
  │
  ├─ Lokasi sudah tersimpan? ── ya ──┐
  │                                  │
  └─ belum ── minta izin lokasi      │
                ├─ diizinkan → pusat = GPS
                └─ ditolak  → pilih kampus (Kampus 1 / 2 / 3)
                                     │
                                     ▼
                 Beranda: kategori Makanan, radius 1 km, rating 4.0+
                 (mode jelajah, tanpa kata kunci)
                                     │
        ketik "seblak" / ketuk saran kata kunci / ubah filter
                                     │
                                     ▼
                         Daftar hasil (kartu foto)
                                     │
                              ketuk satu kartu
                                     │
                                     ▼
              Detail tempat: info, jam buka, ulasan Google (maks 5)
                                     │
                         ketuk "Rute ke sini"
                                     │
                                     ▼
                     Aplikasi Google Maps terbuka dengan rute
```

### 6.2 Alur sekunder

- **Favorit**: kartu → ikon simpan → halaman Favorit → detail → rute.
- **Bagikan**: detail → Bagikan → teman membuka tautan → detail tempat (lokasi teman dipakai untuk jarak jika diizinkan, jika tidak jarak disembunyikan).
- **Pasang PWA**: kunjungan kedua → banner "Pasang Ayo Makan di HP" → prompt sistem (Android/desktop) atau lembar panduan "Bagikan → Tambah ke Layar Utama" (iOS Safari).

## 7. Spesifikasi Fitur

### F-01 Pusat lokasi

- Sumber pusat pencarian, urutan prioritas:
  1. Posisi GPS (`navigator.geolocation.getCurrentPosition`, `enableHighAccuracy: true`, timeout 8 detik).
  2. Kampus pilihan pengguna.
- Daftar kampus (konfigurasi statis di kode):

| Kode | Nama tampil | Alamat |
|---|---|---|
| `kampus-3` | Kampus Terpadu (Pulutan) | Jl. Lingkar Salatiga Km. 2, Pulutan, Sidorejo, Kota Salatiga 50716 |
| `kampus-1` | Kampus 1 | Jl. Tentara Pelajar No. 2, Kota Salatiga |
| `kampus-2` | Kampus 2 | Jl. Nakula Sadewa V No. 9, Kembangarum, Dukuh, Kota Salatiga 50722 |

- Koordinat tiap kampus: diambil owner dari titik gerbang utama (data milik sendiri) dan disimpan bersama `place_id` kampus (Google mengizinkan penyimpanan `place_id` tanpa batas). **Catatan**: penomoran kampus berbeda antar sumber resmi lama dan baru; owner mengonfirmasi penamaan final.
- Lokasi pengguna **tidak** disimpan di server dan tidak dikirim ke analytics. Koordinat hanya diteruskan ke Google untuk satu permintaan pencarian.
- Indikator di header: "Dari posisi kamu" atau "Dari Kampus Terpadu", ketuk untuk mengganti.

### F-02 Pencarian kata kunci

- Input teks di bagian atas, placeholder: `Cari seblak, rames, mie ayam...`.
- Debounce 400 ms, minimal 2 karakter, maksimal 60 karakter. Enter langsung mencari.
- **Saran kata kunci** (chip statis, bisa diubah lewat konfigurasi): seblak, nasi rames, mie ayam, bakso, ayam geprek, nasi goreng, penyetan, soto, angkringan, es teh, kopi, jus. Ini daftar kata kunci, bukan data tempat.
- **Pencarian terakhir**: 5 kata kunci terakhir disimpan di perangkat, bisa dihapus satu per satu.
- Tombol hapus (×) di dalam input mengembalikan ke mode jelajah.

### F-03 Kategori

Tiga tab: **Makanan**, **Minuman**, **Jajanan**. Pemetaan ke tipe Google (Table A, Places API New):

| Kategori | Tipe Google |
|---|---|
| Makanan | `restaurant`, `indonesian_restaurant`, `fast_food_restaurant`, `chicken_restaurant`, `noodle_shop`, `soup_restaurant`, `meal_takeaway`, `food_court`, `family_restaurant` |
| Minuman | `cafe`, `coffee_shop`, `coffee_stand`, `juice_shop`, `tea_house` |
| Jajanan | `bakery`, `dessert_shop`, `snack_bar`, `ice_cream_shop`, `donut_shop`, `cake_shop`, `pastry_shop` |

Cara pakai per mode:
- **Mode jelajah** (tanpa kata kunci): Nearby Search memakai seluruh tipe kategori di `includedTypes`.
- **Mode kata kunci**: Text Search tanpa `includedType` (agar "seblak" di warung yang tipenya generik tetap muncul), lalu server menyaring hasil yang `types`-nya beririsan dengan kategori aktif. Tempat yang tipenya hanya `food` / `point_of_interest` tetap lolos di kategori Makanan agar warung kecil tidak hilang.

### F-04 Radius

- Pilihan: 500 m, 1 km (default), 2 km, 3 km.
- Nearby Search: `locationRestriction` lingkaran dengan radius aktif (hasil di luar radius tidak dikembalikan Google).
- Text Search: Google hanya menerima `locationBias` lingkaran (hasil bisa keluar area), jadi server menghitung jarak garis lurus (haversine) dan **membuang** hasil di luar radius.
- Jarak di kartu: dibulatkan (`450 m`, `1,2 km`), keterangan "garis lurus" di tooltip/aksesibilitas. Tidak menampilkan estimasi waktu jalan karena butuh Routes API (biaya tambahan); waktu tempuh dilihat di Google Maps.

### F-05 Filter tambahan

| Filter | Nilai | Implementasi |
|---|---|---|
| Rating minimal | Semua, 4.0+ (default), 4.5+ | Text Search: `minRating`. Nearby Search: disaring di server. |
| Buka sekarang | mati (default) / nyala | Text Search: `openNow`. Nearby Search: disaring di server dari `currentOpeningHours.openNow`. |
| Murah | mati (default) / nyala | Text Search: `priceLevels: ["PRICE_LEVEL_INEXPENSIVE"]`. Nearby Search: disaring di server. Teks bantuan: "Hanya tempat yang ditandai murah di Google. Warung tanpa data harga ikut tersembunyi." |

Filter tampil sebagai baris chip yang bisa digeser horizontal di HP, dan sebagai panel samping di desktop. Chip "Reset" muncul bila ada filter di luar default.

### F-06 Urutan hasil

| Urutan | Logika |
|---|---|
| Paling cocok (default) | Urutan asli dari Google (relevansi untuk kata kunci, popularitas untuk jelajah). |
| Terdekat | Jarak haversine naik. |
| Rating teruji | Skor berbobot agar tempat bintang 5,0 dengan 3 ulasan tidak mengalahkan bintang 4,7 dengan 400 ulasan: `skor = (v / (v + m)) × R + (m / (v + m)) × C`, dengan `R` = rating, `v` = jumlah ulasan, `m` = 20, `C` = rata-rata rating hasil saat itu. Dihitung saat itu juga, tidak disimpan. Ikon info menjelaskan rumus dalam satu kalimat. |

### F-07 Daftar hasil (kartu tempat)

Isi kartu:
- Foto utama dari Google (rasio 16:10), dimuat malas saat kartu masuk layar. Jika tidak ada foto: blok warna kategori + huruf awal nama.
- **Stiker harga** di pojok foto (motif identitas, bagian 10.5): `mulai Rp10rb` dari `priceRange.startPrice`, atau `Murah` dari `priceLevel`. Jika tidak ada data: stiker tidak tampil, baris info menulis "Harga belum tercatat".
- Nama tempat (maks 2 baris).
- Baris info: `★ 4,7 (312)` · `450 m` · `Buka` / `Tutup`.
- Ikon simpan (favorit).
- Kartu pertama pada urutan "Paling cocok" tampil lebih besar (lebar penuh di HP, 2 kolom di desktop) sebagai titik fokus layar.

Paginasi:
- Text Search: tombol "Muat lebih banyak" memakai `nextPageToken` (Google memberi maks 60 hasil per kueri). Tidak memakai infinite scroll agar biaya foto terkendali.
- Nearby Search: maks 20 hasil, tanpa halaman berikutnya. Jika hasil 20, tampilkan saran "Ketik nama makanan untuk hasil lebih spesifik".

### F-08 Detail tempat

Rute: `/tempat/[placeId]` (bisa dibagikan, `noindex`).

Urutan isi:
1. Foto utama + strip thumbnail (maks 4, dimuat saat diketuk/digeser). Atribusi penulis foto tampil di tampilan foto besar.
2. Nama, tipe utama (`primaryTypeDisplayName`), rating + jumlah ulasan, kisaran harga (`Rp10rb sampai Rp25rb per orang` dari `priceRange`, atau label `priceLevel`).
3. Jarak dari pusat aktif, status Buka/Tutup, jam buka mingguan (akordeon, dari `regularOpeningHours.weekdayDescriptions`).
4. Alamat (`shortFormattedAddress`), tombol salin.
5. **Ulasan dari Google** (bagian F-09).
6. Logo atribusi Google Maps.
7. Bilah aksi melekat di bawah (HP) / kolom kanan (desktop): **Rute ke sini** (utama), Simpan, Bagikan, "Buka di Google Maps".

### F-09 Ulasan dari Google

- Sumber: field `reviews` dari Place Details (maks 5 ulasan, diurutkan Google berdasarkan relevansi). Diminta dengan `languageCode=id`.
- Setiap ulasan menampilkan: foto profil penulis, nama penulis (tautan ke profil `authorAttribution.uri`), bintang, waktu relatif (`relativePublishTimeDescription`), teks ulasan (dipotong 5 baris + "Baca selengkapnya").
- Label "Diterjemahkan oleh Google" jika bahasa `text` berbeda dengan `originalText`, dengan tombol "Lihat teks asli".
- Tautan "Lihat di Google Maps" per ulasan (`googleMapsUri` ulasan) dan tautan "Laporkan" (`flagContentUri`).
- Pemberitahuan di atas daftar (wajib menurut kebijakan Google): "Maksimal 5 ulasan, dipilih dan diurutkan Google berdasarkan relevansi. Lihat semua ulasan di Google Maps."
- Teks ulasan tidak diubah, tidak diringkas oleh AI, tidak disimpan.
- Jika tidak ada ulasan: "Belum ada ulasan untuk tempat ini di Google Maps." + tombol "Tulis ulasan di Google Maps" (`googleMapsLinks.writeAReviewUri`).

### F-10 Rute ke Google Maps

- Prioritas tautan: `googleMapsLinks.directionsUri` dari Google.
- Fallback (Maps URLs resmi): `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>&destination_place_id=<placeId>&travelmode=walking`.
- Mode default `walking` jika radius ≤ 1 km, `driving` (motor) jika lebih.
- Dibuka dengan `target="_blank" rel="noopener"`. Di Android/iOS, tautan ini membuka aplikasi Google Maps bila terpasang.

### F-11 Favorit

- Disimpan di localStorage: daftar `place_id` + waktu simpan. Tidak menyimpan nama, rating, atau konten Google lain (aturan cache Google).
- Halaman `/favorit` memanggil Place Details (field ringkas) untuk setiap id saat dibuka, maks 30 favorit.
- Akses localStorage dibungkus try/catch; mode privat yang memblokir storage menampilkan pesan "Favorit tidak bisa disimpan di mode ini".

### F-12 Bagikan

- `navigator.share({ title, text, url })` dengan teks: `"<Nama tempat> di Ayo Makan"`.
- Fallback: salin tautan + toast "Tautan disalin".

### F-13 PWA

- `manifest.webmanifest`: `name: "Ayo Makan"`, `short_name: "Ayo Makan"`, `display: "standalone"`, `start_url: "/"`, `theme_color: "#B3261E"`, `background_color: "#FFF7E8"`, ikon 192/512 + maskable dari logo owner (`assets/brand/`, DESIGN.md 6.7).
- Service worker:
  - Precache app shell (HTML halaman utama, CSS, JS, font, ikon).
  - `/api/*` dan foto Google: **network-only**, tidak di-cache (kebijakan Google melarang cache konten Places).
  - Fallback offline: halaman "Kamu sedang offline. Sambungkan internet untuk mencari tempat makan." Favorit tetap terlihat sebagai daftar kosong dengan keterangan.
- Ajakan pasang: banner kustom setelah kunjungan kedua (event `beforeinstallprompt` di Chromium; lembar panduan di iOS Safari).
- Implementasi: panduan PWA resmi Next.js (`app/manifest.ts` + service worker manual) atau Serwist. Pilih saat implementasi setelah cek kompatibilitas dengan versi Next.js yang dipakai.

### F-14 Atribusi Google

- Logo Google Maps (bukan teks) di footer daftar hasil dan di detail tempat, tinggi 16 sampai 19 dp, ruang kosong ≥10 dp kiri/kanan/atas dan ≥5 dp bawah, label aksesibilitas "Google Maps".
- Logo varian outline saat di atas foto, varian polos di atas latar krem.
- Fallback teks `Google Maps` (Roboto 400, 12 sampai 16 px, warna #1F1F1F atau #5E5E5E, `translate="no"`) hanya jika ruang sempit.

## 8. Arsitektur Teknis

### 8.1 Stack

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Framework | Next.js (App Router), TypeScript | SSR + Route Handlers dalam satu proyek, dukungan kelas satu di Vercel. |
| Styling | Tailwind CSS v4 + CSS custom properties untuk token | Token warna terang/gelap di satu tempat. |
| Data client | TanStack Query | Pembatalan request saat filter berubah cepat, status loading/error konsisten. Cache memori sesi saja (bukan penyimpanan persisten). |
| Validasi | Zod | Validasi query parameter di Route Handler. |
| Ikon | Phosphor Icons (bobot Bold) | Garis tebal selaras dengan huruf tebal gaya spanduk; menghindari tampilan default ikon garis tipis. |
| Font | `next/font/google`: Plus Jakarta Sans | Lihat 10.3. |
| Rate limit | Upstash Redis (Vercel Marketplace) | Membatasi pemakaian API Google per IP. |
| Analytics | Vercel Web Analytics | Tanpa cookie, ringan. |
| Test | Vitest (unit), Playwright (e2e) dengan respons Google di-mock (MSW) | Test tidak memakan kuota Google. |
| Hosting | Vercel | Preview deployment per branch, edge network. Catatan: paket Hobby hanya untuk pemakaian non-komersial; jika ada monetisasi, pindah ke Pro. |

### 8.2 Diagram alur data

```
 Browser / PWA                     Vercel (Next.js)                         Google
┌──────────────┐   GET /api/...   ┌───────────────────────────┐   POST    ┌──────────────────┐
│ UI React     │ ───────────────▶ │ Route Handler             │ ────────▶ │ Places API (New) │
│ TanStack     │                  │  1. validasi Zod          │           │  searchText      │
│ Query        │ ◀─────────────── │  2. rate limit (Upstash)  │ ◀──────── │  searchNearby    │
│ localStorage │   JSON ringkas   │  3. field mask minimal    │   JSON    │  place details   │
│ (place_id)   │                  │  4. filter radius/kategori│           │  photo media     │
└──────┬───────┘                  │  5. Cache-Control:no-store│           └──────────────────┘
       │                          └───────────────────────────┘
       │  ketuk "Rute ke sini"
       ▼
 Aplikasi Google Maps (directionsUri)
```

Prinsip:
- **API key hanya di server** (`GOOGLE_MAPS_API_KEY`, tidak pernah berawalan `NEXT_PUBLIC_`).
- **Tidak ada penyimpanan konten Places** di server, CDN, maupun service worker. Hanya `place_id` yang boleh disimpan (favorit di perangkat, `place_id` kampus di konfigurasi).
- Respons `/api/*` memakai `Cache-Control: no-store`. Foto Google tidak melewati optimasi `next/image` (pakai `unoptimized`) karena optimasi Vercel menyimpan salinan gambar.
- Field mask per endpoint dibuat sekecil mungkin karena field menentukan tarif (bagian 9).

### 8.3 Endpoint internal (dokumentasi API)

Semua endpoint: metode GET, respons JSON, `Cache-Control: no-store`, error dengan format:

```json
{ "error": { "code": "RATE_LIMITED", "message": "Terlalu banyak pencarian. Coba lagi 1 menit lagi." } }
```

Kode error: `INVALID_PARAMS` (400), `NOT_FOUND` (404), `RATE_LIMITED` (429), `UPSTREAM_QUOTA` (503, batas bulanan internal per SKU atau per-day quota Google tercapai), `UPSTREAM_ERROR` (502).

#### `GET /api/places/search`

| Param | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `lat`, `lng` | number | ya | Pusat pencarian. Divalidasi dalam kotak batas Kota Salatiga dan sekitarnya. |
| `radius` | 500 \| 1000 \| 2000 \| 3000 | ya | Meter. |
| `cat` | `makanan` \| `minuman` \| `jajanan` | ya | Kategori. |
| `q` | string 2 sampai 60 | tidak | Kata kunci. Kosong = mode jelajah (Nearby Search). |
| `minRating` | 0 \| 4 \| 4.5 | tidak | Default 4. |
| `openNow` | `1` | tidak | |
| `murah` | `1` | tidak | |
| `pageToken` | string | tidak | Hanya mode kata kunci. |

Respons 200:

```json
{
  "mode": "keyword",
  "places": [
    {
      "id": "ChIJ...",
      "name": "<displayName.text>",
      "lat": -7.0, "lng": 110.0,
      "distanceM": 450,
      "rating": 4.7,
      "ratingCount": 312,
      "priceLevel": "PRICE_LEVEL_INEXPENSIVE",
      "priceRange": { "start": 10000, "end": 25000, "currency": "IDR" },
      "openNow": true,
      "primaryType": "indonesian_restaurant",
      "photo": { "name": "places/ChIJ.../photos/AX...", "author": "<nama>", "authorUri": "https://..." }
    }
  ],
  "nextPageToken": "..."
}
```

Field mask ke Google (Text Search & Nearby Search):
`places.id,places.displayName,places.location,places.primaryType,places.types,places.photos,places.rating,places.userRatingCount,places.priceLevel,places.priceRange,places.currentOpeningHours.openNow,nextPageToken`
(SKU: Text Search / Nearby Search **Enterprise**.)

#### `GET /api/places/[id]`

Param: `id` = place ID (regex `^[A-Za-z0-9_-]{10,300}$`), opsional `lat`, `lng` untuk jarak.

Field mask:
`id,displayName,location,primaryType,primaryTypeDisplayName,shortFormattedAddress,photos,rating,userRatingCount,priceLevel,priceRange,currentOpeningHours.openNow,regularOpeningHours.weekdayDescriptions,googleMapsUri,googleMapsLinks,reviews`
(SKU: Place Details **Enterprise + Atmosphere**, karena field `reviews`.)

Varian ringkas untuk halaman Favorit: `?fields=card`, tanpa `reviews` dan `regularOpeningHours` (SKU: Place Details **Enterprise**).

#### `GET /api/photo`

| Param | Keterangan |
|---|---|
| `name` | Nama foto dari respons Places, divalidasi regex `^places/[A-Za-z0-9_-]+/photos/[A-Za-z0-9_-]+$` (mencegah endpoint dipakai sebagai proxy bebas). |
| `w` | Lebar: 400 \| 800 \| 1200. |

Server memanggil `GET https://places.googleapis.com/v1/{name}/media?maxWidthPx={w}&skipHttpRedirect=true`, lalu merespons `302` ke `photoUri` dengan `Cache-Control: no-store`. (SKU: Place Details **Photos**.)

### 8.4 Konfigurasi environment

| Variabel | Sisi | Keterangan |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | server | Kunci Places API (New). Lihat .env atau tanya owner. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | server | Rate limit. |
| `MONTHLY_SKU_CAP` | server | Batas bulanan internal per SKU Google (default 950), dihitung di Redis. Lihat 9.1. |
| `LIST_PHOTOS` | server | `on` / `off`. Mematikan foto di daftar hasil jika biaya membengkak. |

### 8.5 Keamanan kunci Google

- Batasi kunci hanya untuk **Places API (New)** (API restriction).
- Pembatasan IP tidak praktis karena IP keluar Vercel dinamis, jadi perlindungan utama: kunci tidak pernah dikirim ke browser, rate limit per IP, batas bulanan internal per SKU, dan **kuota per hari di Google Cloud Console** untuk setiap metode.
- Pasang **budget alert** di Google Cloud Billing (misal 50%, 90%, 100% dari anggaran bulanan owner).

### 8.6 Rate limit

| Endpoint | Batas per IP |
|---|---|
| `/api/places/search` | 20 permintaan / 5 menit |
| `/api/places/[id]` | 30 permintaan / 5 menit |
| `/api/photo` | 120 permintaan / 5 menit |

Angka awal, disesuaikan setelah melihat pola pemakaian nyata.

## 9. Estimasi Biaya Google Places API

Tarif dari halaman harga resmi Google Maps Platform (dicek 2 November 2026). Kuota gratis berlaku **per SKU per bulan**.

| SKU | Gratis / bulan | Tarif setelah kuota gratis (per 1.000) |
|---|---|---|
| Text Search Enterprise | 1.000 | US$35 |
| Nearby Search Enterprise | 1.000 | US$35 |
| Place Details Enterprise | 1.000 | US$20 |
| Place Details Enterprise + Atmosphere (dengan ulasan) | 1.000 | US$25 |
| Place Details Photos | 1.000 | US$7 |

Kenapa Enterprise: rating, jumlah ulasan, `priceLevel`, `priceRange`, dan jam buka adalah field Enterprise. Ulasan adalah field Enterprise + Atmosphere. Tanpa field ini, Ayo Makan kehilangan nilai utamanya.

**Asumsi per sesi aktif**: 2 pencarian, 8 foto termuat, 1 detail tempat.

| Sesi aktif / bulan | Pencarian | Foto | Detail | Perkiraan biaya / bulan |
|---|---|---|---|---|
| 500 | 1.000 (gratis) | 4.000 → US$21 | 500 (gratis) | ± US$21 |
| 1.000 | 2.000 → US$35 | 8.000 → US$49 | 1.000 (gratis) | ± US$84 |
| 3.000 | 6.000 → US$175 | 24.000 → US$161 | 3.000 → US$50 | ± US$386 |

Rumus: `(pemakaian − 1.000) × tarif / 1.000` per SKU. Ini perkiraan dari asumsi, bukan janji; angka nyata dipantau di Google Cloud Console.

**Tuas pengendali biaya** (urut dari yang paling berdampak):
1. `LIST_PHOTOS=off`: daftar hasil tanpa foto (blok warna kategori). Foto hanya di detail. Biaya foto turun drastis.
2. Foto dimuat malas hanya untuk kartu yang terlihat; strip thumbnail detail dimuat saat diketuk.
3. Debounce + minimal 2 huruf + tombol "Muat lebih banyak" (bukan infinite scroll).
4. Batas bulanan internal per SKU + per-day quota di Google Cloud (9.1).
5. Mode jelajah default hanya memuat ulang saat filter berubah, bukan setiap kali halaman difokuskan.

Cache konten Google **tidak** boleh dipakai sebagai tuas penghemat (melanggar kebijakan Places API).

### 9.1 Mode demo Rp0

Versi pertama Ayo Makan dipakai untuk **demo**. Targetnya: tagihan Google Rp0 dengan data asli dari Google Places. Caranya adalah tetap di bawah kuota gratis bulanan (1.000 per SKU), dijaga oleh dua lapis batas.

**Fakta dari dokumentasi Google yang mendasari rencana ini**
- Akun billing tetap wajib (perlu kartu kredit/debit), tapi pemakaian di bawah kuota gratis tidak ditagih.
- Batas keras pemakaian dibuat dengan **menurunkan per-day quota** tiap API di Cloud Console. Jika batas tercapai, API berhenti merespons, bukan menagih.
- Budget dan budget alert **tidak** membatasi pemakaian. Itu hanya email peringatan.
- Kuota harian di-reset **tengah malam waktu Pacific** = pukul **15.00 WIB** (November sampai Maret) atau **14.00 WIB** (Maret sampai November, saat daylight saving).
- Kuota gratis bulanan berlaku per SKU, bukan per metode API. Metode Place Details dipakai dua SKU (detail lengkap dan kartu favorit), jadi kuota harian metode itu harus cukup kecil untuk keduanya.

**Lapis pengaman**

| Lapis | Di mana | Fungsi |
|---|---|---|
| 1. Penghitung bulanan internal | Upstash Redis, kunci `quota:{sku}:{YYYY-MM}` | Server berhenti memanggil Google saat satu SKU mencapai `MONTHLY_SKU_CAP` (default 950, sisa 50 sebagai margin). Pengguna melihat state "Kuota habis" (10.7). |
| 2. Per-day quota Google | Cloud Console | Penjaga terakhir jika lapis 1 gagal (bug, salah konfigurasi). Tidak bergantung pada kode kita. |
| 3. Budget alert | Cloud Billing | Email jika ada biaya sekecil apa pun (budget US$1, alert 50/90/100%). Hanya peringatan. |

**Langkah setup (sekali)**

1. Buat project Google Cloud `ayo-makan-demo` dan hubungkan ke akun billing.
2. Aktifkan **hanya** Places API (New). Jangan aktifkan Maps JavaScript API, Routes, atau Geocoding (tidak dipakai di versi 1).
3. Buat API key. Di "API restrictions", batasi ke Places API (New) saja.
4. Simpan kunci di Vercel Environment Variables (`GOOGLE_MAPS_API_KEY`, untuk Production dan Preview). Jangan ditulis di repo, log, atau dokumen.
5. Buka Google Maps Platform > Quotas > Places API (New), lalu ubah **per-day quota** setiap metode sesuai tabel pola harian di bawah. Nama metode di console bisa sedikit berbeda; pilih yang sesuai dengan Text Search, Nearby Search, Place Details, dan Place Photo.
6. Buat budget US$1 di Cloud Billing dengan alert 50%, 90%, 100% ke email owner.
7. Isi `MONTHLY_SKU_CAP=950` di Vercel.

**Pola kuota harian**

Hari biasa (development dan latihan): 32 per hari per metode, karena 32 × 31 hari = 992, masih di bawah 1.000 walau lapis 1 gagal.

| Metode | Hari biasa | Hari-H demo | Sehari setelah demo |
|---|---|---|---|
| Text Search | 32 | 400 | 10 |
| Nearby Search | 32 | 400 | 10 |
| Place Details | 32 | 400 | 10 |
| Place Photo | 32 | 500 | 10 |

- Di hari-H, kuota dinaikkan sementara supaya banyak orang bisa mencoba bersamaan. Total bulanan tetap dijaga lapis 1 (950 per SKU).
- **Wajib** turunkan lagi sehari setelah demo. Masukkan ke checklist demo.
- Hitung sisa bulan sebelum menaikkan: jika bulan itu sudah terpakai banyak untuk latihan, kapasitas hari-H berkurang.

**Perkiraan kapasitas hari-H** (asumsi per pengunjung: 2 pencarian, 8 foto, 1 detail)

| Batas | Kira-kira cukup untuk |
|---|---|
| 950 foto per bulan | ±115 pengunjung. **Foto adalah batas tersempit.** |
| 950 pencarian kata kunci + 950 jelajah | ±475 pengunjung |
| 950 detail dengan ulasan | ±950 pengunjung |

Supaya kuota foto tidak habis sebelum hari-H:
- Selama development dan latihan, pakai `LIST_PHOTOS=off` (foto hanya di detail). Nyalakan `LIST_PHOTOS=on` di hari-H.
- Test otomatis tidak boleh memanggil Google sungguhan. Respons Google di test dibuat lewat MSW (bagian 8.1), sehingga kuota hanya terpakai untuk uji manual.

**Checklist hari-H demo**

- [ ] Cek sisa kuota bulan ini di dashboard Google Maps Platform.
- [ ] Naikkan per-day quota sesuai kolom "Hari-H demo".
- [ ] `LIST_PHOTOS=on` di Vercel, lalu redeploy.
- [ ] Jadwalkan demo **di luar** jam reset (15.00 WIB) atau pastikan kuota baru sudah aktif sebelum mulai.
- [ ] Buka app sekali dari HP dan desktop: cari, buka detail, tekan "Rute ke sini".
- [ ] Siapkan hotspot cadangan untuk internet ruang demo.
- [ ] Besoknya: turunkan per-day quota ke kolom "Sehari setelah demo", `LIST_PHOTOS=off`.

## 10. Desain: Arah Visual "Sambal Segar"

> Nilai visual lengkap (token CSS, ukuran, resep komponen, gerak, verifikasi) ada di [`DESIGN.md`](DESIGN.md), dan file itu **otoritatif**. Bagian ini ringkasan produk. Jika berbeda, ikuti DESIGN.md lalu perbarui bagian ini.

### 10.1 Design Read

> Reading this as: aplikasi utilitas pencarian mobile-first untuk mahasiswa kost, dengan bahasa visual pop komik ala spanduk warung (latar kuning telur, merah cabai, garis tinta tebal, bayangan keras, badge ledakan, stiker harga), dial **ENERGY 3 / RHYTHM 2 / MOTION 2**.

Referensi arah dari owner (2 November 2026): hero bergaya pop komik dengan latar kuning, oval merah di belakang makanan, badge ledakan berisi nama menu, headline kondensed besar, tombol panah carousel berbentuk kotak, dan di HP header berupa kotak merah dengan tombol MENU. Yang diambil hanya ciri gayanya. Nama, logo, maskot, ilustrasi, dan teks dari referensi tidak dipakai.

- **ENERGY 3**: warung di Indonesia menyapa lewat spanduk merah-kuning yang lantang. Hero, badge ledakan, dan stiker harga membawa energi itu.
- **RHYTHM 2**: hero tampil lantang, daftar hasil tetap mudah dipindai (konsisten), dengan kartu pertama yang lebih besar sebagai pemecah ritme.
- **MOTION 2**: hanya transisi yang menjelaskan perubahan (ganti slide hero, buka panel, tombol tertekan). Tidak ada scroll-reveal, animasi melayang, atau putar otomatis.

### 10.2 Token warna

Palet: 2 warna inti + 1 aksen + netral hangat. Rasio kontras dihitung dengan rumus WCAG 2.x.

**Tema terang (default)**

| Token | Hex | Pemakaian | Kontras |
|---|---|---|---|
| `--cabai` | `#B3261E` | Header spanduk, tombol utama, tautan | Teks putih di atasnya 6,54:1. Sebagai teks di atas kertas 6,14:1 |
| `--telur` (aksen) | `#FFC233` | Stiker harga, chip aktif | Teks tinta di atasnya 11,25:1. Di atas cabai 4,05:1, **hanya untuk teks besar** (≥24 px atau ≥18,66 px tebal) |
| `--tinta` | `#1C1410` | Teks utama | Di atas kertas 17,05:1 |
| `--kertas` | `#FFF7E8` | Latar halaman | |
| `--surface` | `#FFFFFF` | Kartu, panel | |
| `--redup` | `#6B5B4E` | Teks sekunder (alamat, waktu ulasan) | Di atas kertas 6,1:1, di atas putih 6,5:1 |
| `--garis` | `#E9DCC6` | Garis tepi kartu, pemisah | Dekoratif, bukan pembawa informasi |

**Tema gelap** (lewat saklar; default selalu terang, tidak mengikuti sistem otomatis)

| Token | Hex | Kontras |
|---|---|---|
| `--kertas` | `#1A1411` | |
| `--surface` | `#2A201B` | |
| `--tinta` | `#FBEFDF` | Di atas latar gelap 16,07:1 |
| `--cabai` | `#FF7A6B` | Teks/tautan di latar 7,16:1, di surface 6,24:1. Tombol: teks tinta gelap `#1C1410` di atasnya 7,13:1 |
| `--telur` | `#FFC233` | Di latar gelap 11,3:1 |
| `--redup` | `#B8A898` | Di surface 6,88:1 |

Alasan tema gelap ada: mahasiswa sering mencari makan malam hari dan nugas di kafe; tema gelap mengurangi silau. Kedua tema wajib lolos kontras dan diuji sebelum rilis.

### 10.3 Tipografi

| Peran | Font | Alasan |
|---|---|---|
| Headline, badge, harga, judul | **Plus Jakarta Sans** 800, headline kapital | Pilihan owner: satu keluarga font untuk semua teks, hierarki dari bobot dan ukuran. |
| Teks isi, UI | **Plus Jakarta Sans** 400 / 600 | Dirancang di Jakarta, nyaman untuk teks Bahasa Indonesia, angka jelas untuk harga dan jarak. |

- Skala lengkap di DESIGN.md bagian 3. Headline hero `clamp(26px, 8vw, 32px)` di HP, `clamp(40px, 4vw, 60px)` di desktop, maksimal 4 baris.
- Skala teks: 30 / 24 / 20 / 16 / 14 px. Teks isi minimal 16 px di HP, input minimal 16 px (mencegah zoom otomatis iOS).
- Angka harga, rating, dan jarak memakai `font-variant-numeric: tabular-nums`.
- Tidak ada label huruf kapital dengan letter-spacing lebar. Huruf kapital hanya untuk headline display. Tulisan AYO MAKAN memakai logo owner dalam stiker (DESIGN.md 6.7).

### 10.4 Bentuk, bayangan, ikon

- Radius: panel hero desktop 24 px, header kotak HP 14 px, kartu 12 px, tombol 10 px, input 10 px, stiker harga 6 px. Bentuk pil **hanya** untuk chip filter (fungsinya toggle, bentuk pil membedakannya dari tombol aksi).
- **Garis tinta + bayangan keras** dipakai di seluruh app, dengan takaran bertingkat. Alasan: (1) identitas pop komik yang konsisten dari hero sampai detail, (2) bayangan keras memberi tanda "bisa ditekan", dan saat ditekan elemen bergeser masuk ke bayangannya sehingga umpan balik sentuhnya jelas.

| Elemen | Garis | Bayangan keras (offset, tanpa blur) |
|---|---|---|
| Panel hero desktop, header kotak HP, badge ledakan | 3 px `--tinta` | 6 px 6 px |
| Tombol, kolom cari, tombol panah carousel | 2 px `--tinta` | 4 px 4 px; saat ditekan bergeser 2 px dan bayangan jadi 2 px |
| Kartu hasil, kartu ulasan | 2 px `--tinta` | 3 px 3 px (lebih ringan agar daftar panjang tetap tenang dipindai) |
| Chip filter | 2 px `--tinta` | tanpa bayangan; status aktif = isi `--telur` |
| Bilah aksi bawah, bottom sheet | 2 px `--tinta` di tepi atas | tanpa offset, karena posisinya sudah melekat |

- Tema gelap: garis memakai `--garis-keras` `#F2E3CC` (krem) untuk tombol dan input agar tetap terlihat, kartu memakai garis `#5A4638`, bayangan keras `#000000`.
- Ikon Phosphor Bold, hanya yang bermakna: kaca pembesar (cari), pin (lokasi), bintang (rating, karena itu simbol rating Google), jam (jam buka), navigasi panah (rute), bookmark (simpan), share. Tidak ada ikon dekoratif.

### 10.5 Motif identitas

Satu keluarga motif: **stiker yang ditempel**. Semua bergaris tinta dan berbayangan keras, seperti stiker di gerobak atau etalase warung.

1. **Badge ledakan** (starburst): bentuk ledakan komik putih, garis tinta 3 px, bayangan keras, berisi nama menu dalam huruf tebal merah cabai. Dipakai di hero (nama menu per slide) dan di empty state. Hanya di dua tempat itu agar tetap istimewa.
2. **Stiker harga**: kotak kuning telur, teks tebal tinta, diputar -2°, menempel di pojok foto kartu. Muncul hanya bila ada data harga dari Google, jadi stiker sekaligus penanda ada info harga.
3. **Oval merah**: oval `--cabai` bergaris tinta di belakang foto hidangan hero. Foto potongan (cutout) sedikit keluar dari tepi oval agar terasa menonjol.
4. **Bintang kilau** (4 sudut, garis tinta): aksen komik, **maksimal 3 per hero**, tidak dipakai di luar hero dan tidak pernah sebagai ikon fitur.

### 10.6 Tata letak per layar

#### 10.6.1 Hero carousel "Menu andalan"

Hero adalah layar pertama beranda. Isinya carousel hidangan yang biasa dicari anak kost. Setiap slide punya tombol yang langsung menjalankan pencarian, jadi hero bukan dekorasi: hero adalah pintu masuk pencarian.

**Isi slide** (urutan awal, bisa diubah di konfigurasi):

| # | Badge ledakan | Headline | Tombol | Kata kunci yang dicari |
|---|---|---|---|---|
| 1 | SEBLAK | Pedasnya nampol, dompet nggak jebol | Cari seblak di sekitar | `seblak` |
| 2 | NASI RAMES | Lauk pilih sendiri, tagihan tetap tahu diri | Cari nasi rames di sekitar | `nasi rames` |
| 3 | MIE AYAM | Mie ayam hangat, nugas jadi semangat | Cari mie ayam di sekitar | `mie ayam` |
| 4 | BAKSO | Kuahnya panas, laparnya tuntas | Cari bakso di sekitar | `bakso` |
| 5 | AYAM GEPREK | Pilih level sambalnya, cek ratingnya dulu | Cari ayam geprek di sekitar | `ayam geprek` |
| 6 | ES TEH | Es teh manis, hausnya habis | Cari es teh di sekitar | `es teh` (kategori Minuman) |

- Teks pendukung (sama untuk semua slide, dua kolom kecil di bawah headline): "Rating dan ulasan langsung dari Google Maps." dan "Jarak dihitung dari kampus atau dari posisi kamu." Keduanya fakta fitur, bukan klaim.
- Headline ditampilkan kapital lewat CSS (`text-transform: uppercase`) karena itu gaya display spanduk; teks sumbernya tetap kalimat biasa agar pembaca layar tidak mengejanya huruf per huruf.
- Tidak ada klaim harga, "paling enak", atau nama warung di hero. Hero hanya mengajak mencari; datanya datang dari Google di hasil.

**Perilaku carousel**

- Tidak berputar otomatis. Pindah slide lewat tombol panah kotak, geser (swipe) di HP, atau tombol panah kiri/kanan keyboard saat fokus di carousel.
- Indikator: batang progres + titik, slide aktif = batang panjang.
- Transisi: foto dan badge berganti dengan crossfade 200 ms, badge muncul dengan skala 0,92 ke 1 dalam 150 ms. Mati saat `prefers-reduced-motion`.
- Tombol slide mengisi kolom cari dengan kata kuncinya, memilih kategori yang sesuai, menjalankan pencarian, lalu menggulir ke `#hasil`.
- Hanya foto slide pertama yang dimuat di awal (`fetchpriority="high"`), foto slide lain dimuat saat slide di sebelahnya aktif.
- Aksesibilitas: `aria-roledescription="carousel"`, tiap slide `aria-label="2 dari 6: Nasi Rames"`, tombol panah berlabel "Menu sebelumnya" / "Menu berikutnya", wilayah live `polite` mengumumkan nama menu saat slide berganti.

**Desktop (≥ 1024 px)**

```
 latar halaman --kertas
 ┌───────────────────────────────────────────────────────────────────────┐
 │  Cari     Favorit          [ AYO MAKAN ]          Privasi   [tema ◐] │ panel hero
 │                                                                       │ latar --telur
 │   _/\/\/\_      ✦                                                     │ garis 3 px
 │  <  SEBLAK  >  .-~~~~~~-.          PEDASNYA NAMPOL,                   │ radius 24 px
 │   \/\/\/\/   /  [FOTO    \  ✦      DOMPET NGGAK JEBOL                 │ bayangan 6 px
 │             |   cutout    |                                           │
 │             |   seblak]   |        Rating dan ulasan   Jarak dihitung │
 │              \   oval    /         langsung dari       dari kampus... │
 │               '-.cabai.-'          Google Maps.                       │
 │                                    [🔍 Cari seblak, rames, mie ayam ] │
 │   ✦                                [ Cari seblak di sekitar ]         │
 │                                    [←]  ━━━━━ • • • • •  [→]          │
 │                               ⌄ Lihat hasil                           │
 └───────────────────────────────────────────────────────────────────────┘
```

- Panel hero menempel 24 px dari tepi layar, tinggi `min(88vh, 760px)`.
- Kolom kiri (±55%): oval merah miring ±8°, foto cutout keluar dari tepi oval, badge ledakan menimpa kiri atas oval, maksimal 3 bintang kilau.
- Kolom kanan (±45%): headline Plus Jakarta Sans 800 kapital, `clamp(40px, 4vw, 60px)`, maksimal 4 baris; teks pendukung 2 kolom 15 px; kolom cari 56 px; tombol slide; kontrol carousel.
- Navigasi atas: stiker logo di tengah (DESIGN.md 6.7), tautan di kiri dan kanan hanya ke tujuan yang ada (Cari = `#hasil`, Favorit, Privasi, saklar tema).
- "Lihat hasil" di bawah tengah: tautan ke `#hasil`.

**HP (< 640 px)**

```
┌───────────────────────────────┐
│┌─────────────────────────────┐│ header kotak --cabai
││ AYO MAKAN           [MENU]  ││ garis 3 px, radius 14 px
│└─────────────────────────────┘│ bayangan 6 px
│  ✦     .-~~~~~~~-.            │ latar --telur
│       /  [FOTO     \   ✦      │ panggung foto ±38% tinggi layar
│      |   cutout     |         │
│ _/\/\/\_ seblak]   /          │
│<  SEBLAK  > '-.oval.-'        │ badge menimpa kiri bawah oval
│ \/\/\/\/                      │
│ PEDASNYA NAMPOL,              │ headline clamp(32px, 9vw, 40px)
│ DOMPET NGGAK JEBOL            │
│ Rating & ulasan dari Google   │ teks pendukung 1 kolom 14 px
│ [🔍 Cari seblak, rames...   ] │ kolom cari 52 px
│ [ Cari seblak di sekitar    ] │
│ [←]   ━━━━ • • • • •     [→]  │
└───────────────────────────────┘
```

- Kolom cari wajib terlihat di layar pertama pada lebar 360 x 640 px. Jika ruang kurang, panggung foto yang mengecil, bukan kolom cari yang turun.
- Tombol MENU membuka panel merah di bawah header berisi: Favorit, Privasi, Tema (terang/gelap), dipisah garis tipis. Tertutup dengan tombol yang sama, Escape, atau ketuk di luar panel; fokus kembali ke tombol MENU.
- Setelah pengguna mencari, halaman menggulir ke `#hasil` dan **header ringkas melekat** muncul saat hero keluar layar: kotak merah berisi stiker bulat pin logo, kolom cari berisi kata kunci aktif, dan tombol hapus. Hapus kata kunci = kembali ke mode jelajah, hero tetap ada di atas.

#### 10.6.2 Area hasil, HP (< 640 px)

```
┌─────────────────────────────────┐
│┌───────────────────────────────┐│ header ringkas melekat
││ AYO MAKAN [🔍 seblak     ✕]   ││ (muncul setelah hero lewat)
│└───────────────────────────────┘│
│ 📍 Dari Kampus Terpadu  ▾       │ latar --kertas
│  Makanan │ Minuman │ Jajanan    │ tab
│ (1 km▾)(★4.0+▾)(Buka)(Murah) →  │ chip geser
│ Urut: Paling cocok ▾            │
│ ┌─────────────────────────────┐ │
│ │        [FOTO 16:10]  ┌─────┐│ │ kartu pertama
│ │                      │10rb ││ │ stiker harga
│ │ Nama Warung              ⊡  │ │
│ │ ★ 4,7 (312) · 450 m · Buka  │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ ...kartu berikutnya         │ │
│ └─────────────────────────────┘ │
│        [ Muat lebih banyak ]    │
│        Google Maps (logo)       │
└─────────────────────────────────┘
```

- Area hasil berlatar `--kertas` agar terpisah jelas dari hero kuning; hero adalah titik fokus layar pertama, kartu pertama adalah titik fokus area hasil.
- Ketuk chip radius/rating membuka bottom sheet kecil berisi pilihan.
- Angka pada contoh kartu adalah placeholder tata letak, bukan data nyata.

**Tablet (640 sampai 1023 px)**: hero memakai tata letak HP dengan panggung foto di kiri dan teks di kanan mulai 768 px. Hasil: grid 2 kolom, kartu pertama selebar 2 kolom.

**Desktop (≥ 1024 px)**: lebar konten maks 1200 px. Panel filter samping melekat (280 px) di kiri, grid hasil 3 kolom di kanan, kartu pertama 2 kolom. Header ringkas melekat muncul setelah panel hero lewat.

**Detail tempat**

```
HP                                   Desktop (≥1024)
┌────────────────────────────┐      ┌──────────────────┬──────────────────┐
│ ← [FOTO besar]  [thumb x4] │      │ [FOTO besar]     │ Ulasan dari      │
│ Nama Warung                │      │ [thumb x4]       │ Google (maks 5)  │
│ Warung makan Indonesia     │      │ Nama, tipe       │ ┌──────────────┐ │
│ ★ 4,7 (312) · Rp10rb-25rb  │      │ ★, harga, jarak  │ │ ulasan       │ │
│ 450 m · Buka · Jam buka ▾  │      │ Jam buka ▾       │ └──────────────┘ │
│ Alamat [salin]             │      │ Alamat [salin]   │ ...              │
│ Ulasan dari Google         │      │ [Rute ke sini]   │ Google Maps logo │
│ ┌────────────────────────┐ │      │ Simpan · Bagikan │                  │
│ │ (av) Nama  ★★★★★ 2 bln │ │      └──────────────────┴──────────────────┘
│ │ teks ulasan...         │ │
│ └────────────────────────┘ │
│ Google Maps (logo)         │
├────────────────────────────┤
│ [ Rute ke sini ] ⊡  ⇪      │  bilah aksi melekat
└────────────────────────────┘
```

### 10.7 State UI (wajib semua)

| State | Tampilan dan teks |
|---|---|
| Belum ada lokasi | Kartu: "Biar jaraknya akurat, izinkan lokasi. Atau pilih kampus." Tombol: "Pakai lokasi saya", "Pilih kampus". |
| Izin lokasi ditolak | Otomatis ke pemilih kampus + catatan cara mengaktifkan izin di pengaturan browser. |
| Memuat | Kerangka kartu dengan bentuk sama seperti kartu asli (foto, 2 baris teks). `aria-busy="true"`. |
| Kosong | Badge ledakan "BELUM KETEMU" + "Belum ketemu seblak di radius 1 km." Tombol: "Perlebar ke 2 km" (langsung mengubah filter). Jika filter Murah aktif: "Coba matikan filter Murah, banyak warung belum punya data harga di Google." |
| Error jaringan | "Koneksi putus. Cek internet kamu, lalu coba lagi." Tombol "Coba lagi". |
| Terlalu banyak permintaan (429) | "Pelan-pelan dulu, kamu sudah banyak mencari. Coba lagi dalam 1 menit." |
| Kuota habis (503) | "Kuota pencarian Ayo Makan sedang habis. Coba lagi nanti, atau cari langsung di Google Maps." Tombol ke Google Maps dengan kata kunci yang sama. |
| Offline | Halaman offline dari service worker (F-13). |
| Tanpa foto | Blok warna sesuai kategori + huruf awal nama tempat. |
| Tanpa ulasan | F-09. |
| Tempat tidak ditemukan (404) | "Tempat ini sudah tidak ada di Google Maps." Tombol "Kembali ke pencarian". |
| Favorit kosong | "Belum ada tempat tersimpan. Ketuk ikon simpan di kartu untuk menyimpan." |

### 10.8 Gerak

- Tombol dan kartu: saat ditekan bergeser 2 px ke arah bayangan kerasnya (bayangan mengecil), 80 ms. Ini umpan balik sentuh.
- Ganti slide hero: crossfade 200 ms, badge ledakan skala 0,92 ke 1 dalam 150 ms.
- Panel MENU HP: turun 180 ms ease-out.
- Bottom sheet filter: geser naik 200 ms ease-out.
- Header menyusut saat gulir: transisi 150 ms.
- `prefers-reduced-motion: reduce` mematikan semua transisi di atas.

### 10.9 Pedoman teks (copy)

- Sapaan "kamu", kalimat pendek, nada teman kos, tanpa jargon pemasaran.
- Tanda pisah panjang tidak dipakai di teks UI.
- Tombol menyebut aksinya: "Rute ke sini", "Perlebar ke 2 km", "Muat lebih banyak", "Pasang di HP". Tidak memakai "Mulai", "Selengkapnya", atau "Jelajahi" sebagai tombol generik.
- Angka dalam format Indonesia: `4,7`, `1,2 km`, `Rp10rb`.
- Tidak ada angka statistik pengguna, testimoni, atau klaim di halaman yang tidak punya sumber nyata.

### 10.10 Aksesibilitas

- Target WCAG 2.2 AA.
- Indikator fokus: outline 3 px `--tinta` dengan offset 3 px (melewati bayangan keras) di tema terang, `--telur` di tema gelap (kuning di atas krem tidak cukup kontras untuk indikator fokus).
- Semua kontrol bisa dijangkau Tab, aktif dengan Enter/Space, bottom sheet tertutup dengan Escape dan mengembalikan fokus ke chip pemicunya.
- Target sentuh minimal 44 × 44 px.
- Rating dibacakan lengkap: "Rating 4,7 dari 5, 312 ulasan".
- `<html lang="id">`; nama tempat dari Google dibiarkan apa adanya.
- Foto: `alt` = "Foto <nama tempat>", atribusi penulis foto bisa diakses di tampilan foto besar.
- Foto hero: `alt` = "Semangkuk seblak" dan sejenisnya (menggambarkan hidangan, bukan warung tertentu).

### 10.11 Brief foto hero (disediakan owner)

Hero memakai **foto asli** hidangan, bukan ilustrasi 3D. Foto ini aset milik Ayo Makan, terpisah dari foto Google di hasil pencarian.

**Daftar foto**

| # | Hidangan | Wadah yang diharapkan |
|---|---|---|
| 1 | Seblak | Mangkuk, kuah merah terlihat, kerupuk/topping di atas |
| 2 | Nasi rames | Piring berisi nasi + 2 sampai 3 lauk dan sayur |
| 3 | Mie ayam | Mangkuk, topping ayam kecap, sawi |
| 4 | Bakso | Mangkuk berkuah, pentol terlihat jelas |
| 5 | Ayam geprek | Piring/kertas nasi, sambal di atas ayam |
| 6 | Es teh | Gelas plastik atau gelas kaca khas warung, ada es batu |
| cadangan | Nasi goreng, soto | Untuk mengganti slide di kemudian hari |

**Syarat teknis**

| Hal | Syarat | Alasan |
|---|---|---|
| Latar | PNG latar transparan (cutout), atau latar polos yang kontras dengan makanan agar mudah dipotong | Foto harus bisa "keluar" dari oval merah. |
| Sudut | Semua foto dari sudut yang sama, ±45° dari atas (tiga perempat) | Carousel terasa satu set, tidak loncat-loncat. |
| Komposisi | Wadah utuh, tidak terpotong tepi foto, ada ruang kosong di sekeliling | Ruang untuk dipotong dan diposisikan menimpa oval. |
| Resolusi | Sisi terpendek minimal 1600 px, tajam, tidak blur | Diekspor ke 480, 800, 1200 px untuk berbagai layar. |
| Isi | Tanpa watermark, teks, logo, atau merek warung yang terbaca | Hero tidak boleh terlihat mempromosikan warung tertentu. |
| Gaya | Porsi dan wadah khas warung, pencahayaan terang alami | Jujur dengan apa yang akan ditemukan pengguna, bukan plating restoran. |

**Hak pakai** (wajib dipenuhi salah satu)

1. Foto milik sendiri (paling aman).
2. Foto stok dengan lisensi yang mengizinkan pemakaian komersial tanpa biaya (misal Unsplash atau Pexels; cek lisensi tiap foto).
3. Foto dari warung dengan izin tertulis pemiliknya.

**Tidak boleh** diambil dari Google Maps, Instagram, GoFood/GrabFood, atau situs lain tanpa izin (hak cipta, dan untuk foto Google juga melanggar kebijakan Places API).

**Yang dikirim owner per foto**: file asli, nama hidangan, sumber (link atau "foto sendiri"), dan nama fotografer bila lisensinya meminta kredit. Kredit ditampilkan di halaman `/privasi` bagian "Kredit foto".

**Pengolahan oleh tim**: potong latar bila belum transparan, samakan warna dan kecerahan, ekspor WebP/AVIF ukuran 480, 800, 1200 px dengan target ≤ 120 KB pada ukuran 800 px.

## 11. Kebutuhan Non-Fungsional

| Area | Kebutuhan |
|---|---|
| Performa | LCP < 2,5 detik dan INP < 200 ms pada HP Android kelas menengah dengan jaringan 4G (diukur Lighthouse mode mobile + Vercel Speed Insights). JS awal beranda < 150 KB gzip. |
| Hemat kuota | Foto daftar memakai lebar 400 px, detail 800 px, galeri 1200 px. Tidak ada video atau animasi berat. |
| Responsif | Diuji pada lebar 360, 390, 768, 1024, 1440 px. Tanpa scroll horizontal di semua lebar. |
| Browser | Chrome/Edge 2 versi terakhir, Safari iOS 16+, Firefox terbaru, Samsung Internet terbaru. |
| Privasi | Tanpa akun, tanpa cookie pelacak. Lokasi tidak disimpan di server dan tidak dikirim ke analytics. Halaman "Privasi" singkat menjelaskan data yang diteruskan ke Google. |
| Kepatuhan Google | Patuh kebijakan Places API: tanpa cache konten, atribusi logo, atribusi penulis ulasan dan foto, pemberitahuan urutan ulasan, tautan ke sumber di Google Maps. Tautan ke Ketentuan Layanan Google Maps dan Kebijakan Privasi Google di halaman Privasi. |
| SEO | Beranda: metadata statis (judul, deskripsi, Open Graph). Halaman `/tempat/[id]`: `noindex` karena isinya konten Google yang tidak boleh disalin. |
| Keandalan | Timeout request ke Google 8 detik, satu kali retry untuk error 5xx. Error tercatat di log Vercel tanpa koordinat pengguna. |
| Keamanan | Validasi semua input dengan Zod, header keamanan (CSP, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(self)`). |

## 12. Halaman dan Navigasi

| Rute | Isi |
|---|---|
| `/` | Beranda: pencarian, filter, hasil. |
| `/tempat/[placeId]` | Detail tempat. |
| `/favorit` | Daftar tempat tersimpan. |
| `/privasi` | Penjelasan data dan atribusi Google. |
| `/offline` | Fallback service worker. |

Navigasi: logo kembali ke beranda. Desktop: tautan Cari (`#hasil`), Favorit, Privasi, dan saklar tema di bilah atas panel hero. HP: tombol MENU membuka panel berisi Favorit, Privasi, dan Tema. Tautan Privasi juga ada di footer. Tidak ada tautan ke halaman yang belum dibuat.

## 13. Analytics dan Metrik Keberhasilan

### 13.1 Event

| Event | Properti (tanpa data pribadi) |
|---|---|
| `search` | `mode` (keyword/jelajah), `source` (ketik/saran/hero), `cat`, `radius`, `filters_on`, `result_count` |
| `hero_slide` | `slide` (nama menu), `action` (geser/klik_cari) |
| `place_open` | `rank` (posisi kartu), `from` (hasil/favorit/tautan) |
| `route_click` | `rank`, `radius` |
| `favorite_add` / `favorite_remove` | |
| `share` | `method` (native/salin) |
| `pwa_install` | `platform` |
| `empty_result` | `cat`, `radius`, `filters_on` |
| `error` | `code` |

Kata kunci pencarian dikirim tanpa data lokasi, untuk melihat makanan paling dicari.

### 13.2 Metrik

| Metrik | Definisi | Target |
|---|---|---|
| **North star**: tingkat rute | Sesi dengan `route_click` ÷ sesi dengan `search` | [TARGET: tetapkan setelah 2 minggu data beta] |
| Waktu ke rute | Median detik dari buka app sampai `route_click` | [TARGET] |
| Hasil kosong | `empty_result` ÷ `search` | [TARGET] |
| Kembali dalam 7 hari | Pengunjung yang kembali | [TARGET] |
| Biaya per sesi | Tagihan Google ÷ sesi aktif | Di bawah anggaran owner (lihat Pertanyaan Terbuka) |

Target sengaja dikosongkan sampai ada data nyata.

## 14. Rencana Rilis

| Fase | Isi | Selesai jika |
|---|---|---|
| 0. Persiapan | Foto hero 10.11 terkumpul. Project Google Cloud + billing, kunci API dengan restriction, budget alert, kuota harian. Project Vercel + Upstash. Konfirmasi logo, nama kampus, koordinat kampus, anggaran bulanan. Wawancara singkat 5 sampai 8 mahasiswa. | Kunci jalan di lingkungan preview; semua Pertanyaan Terbuka terjawab. |
| 1. MVP inti | Hero carousel 10.6.1 (dengan foto dari owner atau slot `[FOTO]`), F-01 sampai F-10, F-14. Endpoint 8.3, rate limit, batas bulanan per SKU. Semua state 10.7. | Alur 6.1 jalan dari HP nyata ke aplikasi Google Maps. |
| 2. PWA dan pelengkap | F-11 Favorit, F-12 Bagikan, F-13 PWA, tema gelap, halaman Privasi. | Lighthouse PWA installable, kedua tema lolos kontras. |
| 3. QA dan beta | Test unit (haversine, skor rating teruji, pemetaan kategori, filter), e2e dengan mock Google, uji aksesibilitas keyboard, uji di 5 lebar layar. Beta tertutup ke teman sekampus. | Delivery Gate antislop PASS, tidak ada bug kritis selama 1 minggu beta. |
| 4. Demo | Setup 9.1, jalankan checklist hari-H. | Demo berjalan dengan data asli Google, tagihan Google Rp0. |
| 5. Rilis publik (opsional) | Domain, analytics aktif, tentukan anggaran Google bulanan, pantau biaya harian minggu pertama. | Biaya per sesi sesuai anggaran. |

## 15. Backlog (Setelah Versi 1)

- Ulasan dan foto dari pengguna Ayo Makan (butuh login dan database, misal Supabase), ditampilkan terpisah dari ulasan Google.
- Info harga menu hasil kurasi (contoh: harga seblak per porsi) dari kontribusi pengguna, diverifikasi.
- Penanda halal hasil kurasi/verifikasi (bukan dari Google).
- Peta interaktif (Maps JavaScript API, biaya tambahan).
- Estimasi waktu jalan kaki (Routes API, biaya tambahan).
- Kampus lain di Salatiga (UKSW, dsb.) sebagai pilihan pusat.

## 16. Risiko dan Mitigasi

| ID | Risiko | Dampak | Mitigasi |
|---|---|---|---|
| R1 | Biaya Google membengkak karena konten tidak boleh di-cache | Tagihan melebihi anggaran | Mode demo Rp0 (9.1): batas bulanan internal per SKU, per-day quota Google, budget alert; field mask minimal; `LIST_PHOTOS` bisa dimatikan. |
| R2 | Banyak warung kecil tidak punya `priceLevel`/`priceRange` di Google | Filter Murah menyembunyikan warung murah sungguhan | Filter Murah default mati, teks bantuan jujur, empty state menyarankan mematikan filter. |
| R3 | Warung kaki lima belum terdaftar di Google Maps | Tempat tidak muncul sama sekali | Diterima sebagai batasan v1. Backlog: kontribusi pengguna. |
| R4 | Google hanya memberi maks 5 ulasan per tempat, urutan relevansi | Pengguna ingin ulasan lebih banyak/terbaru | Pemberitahuan jelas + tautan "Lihat semua ulasan di Google Maps". |
| R5 | Mahasiswa UIN membutuhkan info halal, Google tidak punya datanya | Ekspektasi tidak terpenuhi | Tidak membuat klaim halal di v1. Backlog: penanda halal terverifikasi. |
| R6 | Text Search memberi hasil di luar radius (bias, bukan restriksi) | Hasil terasa tidak akurat | Filter ulang haversine di server sebelum dikirim ke browser. |
| R7 | GPS di dalam gedung tidak akurat | Jarak meleset | Tampilkan pusat aktif di header, mudah ganti ke titik kampus. |
| R8 | Kunci API bocor atau disalahgunakan | Tagihan tak terduga | Kunci hanya di server, API restriction, rate limit, kuota harian. |
| R9 | Kebijakan atau tarif Google berubah | Fitur atau biaya berubah | Cek halaman kebijakan dan harga setiap kuartal; logika Google terisolasi di satu modul `lib/places`. |

## 17. Pertanyaan Terbuka

| # | Pertanyaan | Pemilik |
|---|---|---|
| Q1 | ~~Logo/ikon aplikasi~~ **Terjawab 2 November 2026**: logo dari owner, dipakai dalam stiker krem; warnanya tidak masuk palet UI. Aset di `assets/brand/`, aturan di DESIGN.md 6.7. | Owner |
| Q2 | Kampus default saat izin lokasi ditolak: Kampus Terpadu (Pulutan) atau lainnya? Penamaan final Kampus 1/2/3? | Owner |
| Q3 | Tanggal demo dan perkiraan jumlah orang yang mencoba? (menentukan angka kuota hari-H di 9.1). Untuk demo, anggaran Google = Rp0. | Owner |
| Q4 | Domain: subdomain Vercel (`ayo-makan.vercel.app`, jika tersedia) atau domain sendiri? | Owner |
| Q5 | Apakah ada rencana monetisasi? (menentukan paket Vercel Hobby atau Pro) | Owner |
| Q6 | Siapa 5 sampai 8 mahasiswa untuk wawancara validasi persona? | Owner |
| Q7 | Foto 6 hidangan hero sesuai brief 10.11 (sedang dicarikan owner). Setuju dengan urutan dan headline slide di 10.6.1? | Owner |

## 18. Lampiran

### 18.1 Catatan antislop untuk dokumen ini

| Aturan | Status | Bukti |
|---|---|---|
| R-02 tanpa tanda pisah panjang | PASS | Dicek dengan pencarian karakter di file ini. |
| R-17 / R-36 tanpa angka tanpa sumber | PASS | Angka biaya dari halaman harga resmi Google + asumsi tertulis. Target metrik dikosongkan `[TARGET]`. Tidak ada angka pengguna. |
| R-18 / R-38 tanpa testimoni atau konten karangan | PASS | Semua ulasan dari Google API. Contoh di diagram memakai placeholder, bukan nama warung atau ulasan nyata. Persona ditandai sebagai asumsi. |
| R-23 aset | PASS | Logo dari owner (Q1), tidak digambar ulang; hanya latar dihapus atas persetujuan owner. Foto hero disediakan owner sesuai brief 10.11 (Q7); sebelum ada, slot bertanda `[FOTO: seblak]`. |
| R-30 tidak meniru produk lain | PASS | Referensi owner dipakai sebagai ciri gaya (warna, garis, badge, tata letak hero). Nama, logo, maskot, ilustrasi, dan teks referensi tidak dipakai. |
| R-24 navigasi | PASS | Hanya 5 rute yang benar-benar dispesifikasikan. |
| R-25 kontras | PASS | Semua pasangan dihitung (10.2); kuning di atas merah dibatasi untuk teks besar. |
| R-27 state UI | PASS | Tabel 10.7. |
| R-31 alasan keputusan | PASS | Alasan warna, font, ikon, bentuk, motif, dial tertulis di bagian 10. |
| R-35 verifikasi build | Belum berlaku | Dokumen ini PRD, belum ada aplikasi untuk dijalankan. Wajib dijalankan di Fase 3. |

### 18.2 Referensi

- Harga Google Maps Platform: https://developers.google.com/maps/billing-and-pricing/pricing
- Text Search (New): https://developers.google.com/maps/documentation/places/web-service/text-search
- Nearby Search (New): https://developers.google.com/maps/documentation/places/web-service/nearby-search
- Place Details (New): https://developers.google.com/maps/documentation/places/web-service/place-details
- Place Photos (New): https://developers.google.com/maps/documentation/places/web-service/place-photos
- Kebijakan dan atribusi Places API: https://developers.google.com/maps/documentation/places/web-service/policies
- Tipe tempat (Table A): https://developers.google.com/maps/documentation/places/web-service/place-types
- Maps URLs (tautan rute): https://developers.google.com/maps/documentation/urls/get-started
- Alamat kampus: https://admission.uinsalatiga.ac.id/?p=561 dan pedoman layanan disabilitas UIN Salatiga (lpm.uinsalatiga.ac.id)

### 18.3 Glosarium

| Istilah | Arti |
|---|---|
| PWA | Progressive Web App: situs web yang bisa dipasang di layar utama HP dan punya halaman offline. |
| Place ID | ID unik tempat dari Google, satu-satunya data Places yang boleh disimpan permanen. |
| Field mask | Daftar field yang diminta ke Google; menentukan tarif SKU. |
| SKU | Satuan tagihan Google (misal Text Search Enterprise). |
| Haversine | Rumus jarak garis lurus antara dua koordinat di permukaan bumi. |
