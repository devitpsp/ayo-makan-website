# Ayo Makan: kontrak implementasi visual

> Versi 2.1 "Oranye Bersih" · 3 November 2026 · Menggantikan v1.2 "Sambal Segar" (arsip: `DESIGN-v1-sambal-segar.md`).
>
> Sumber arah, semuanya pilihan owner: gaya bersih editorial untuk seluruh app (referensi hero dengan kata raksasa di belakang produk), hero setinggi layar penuh, latar hero **kuning cerah** dengan kata raksasa **oranye pekat** (owner menolak oranye penuh karena terlalu gelap), warna lain mengikuti logo (merah, oranye, kuning, krem), logo utuh tanpa stiker, kartu dan tombol tanpa garis tebal atau bayangan keras, satu keluarga font Plus Jakarta Sans.
>
> `Dial: ENERGY 2 / RHYTHM 2 / MOTION 2`

File ini **otoritatif untuk semua nilai visual**. Implementasi token ada di `app/globals.css`; jika berbeda, perbaiki salah satunya dan catat di changelog.

Dari referensi owner yang diambil hanya ciri gaya (kata raksasa di belakang produk, nomor slide, tagline miring, ruang kosong). Nama, produk, dan teks referensi tidak dipakai.

---

## 1. Urutan kerja dan penerimaan

1. Token (bagian 2) dan font (bagian 3) dipasang sebelum mengubah layar.
2. Gaya visual dipusatkan di class bersama di `globals.css` (`.btn`, `.field`, `.chip`, `.segments`, `.tab`, `.card-ink`, `.panel-ink`, `.sheet`, `.hero-panel`, `.giant-word`). Komponen memakai class ini, bukan warna atau garis yang ditulis langsung.
3. Semua kontrol berfungsi, Escape menutup panel, fokus kembali ke pemicunya.

**Checklist penerimaan**

- Hero setinggi layar (`min-h-svh`) di semua lebar; di 360×640 kolom cari tetap terlihat tanpa gulir.
- Tidak ada scroll horizontal di 360, 390, 768, 1024, 1440 px, tema terang dan gelap.
- Semua teks lolos WCAG AA; batas kontrol (input, chip) ≥ 3:1 terhadap latarnya.
- LCP beranda < 2.500 ms pada profil HP lambat (`scripts/verify-ui.mjs`).
- `scripts/verify-ui.mjs` dan `scripts/verify-pwa.mjs` tanpa FAIL.

---

## 2. Token

Nama token lama dipertahankan agar komponen tidak dibongkar; nilainya mengikuti arah v2. `--cabai` kini berarti **warna aksi**, `--telur` berarti **aksen lembut**.

### Tema terang (default)

| Token | Hex | Peran | Kontras |
|---|---|---|---|
| `--oranye` / `--bg-hero` | `#FFD54A` | Latar hero (kuning cerah) | Tinta di atasnya 12,85:1 |
| `--kata-raksasa` | `#E85A1E` | Kata raksasa hero (dekoratif, `aria-hidden`) | Teks tinta yang menimpanya 5,11:1 |
| `--cabai` | `#C31615` | Aksi: tombol primer, tautan | Putih di atasnya 6,09:1; sebagai teks di krem 5,84:1 |
| `--aktif` | `#FFD54A` | Chip, tab, segmen terpilih | Tinta di atasnya 12,85:1 |
| `--telur` | `#FFE9B0` | Aksen lembut (avatar ulasan) | Tinta 15,16:1 |
| `--tinta` | `#1C1410` | Teks utama | 17,4:1 di krem |
| `--kertas` | `#FFFAEB` | Latar halaman (krem kekuningan, menyambung ke hero) | |
| `--surface` | `#FFFFFF` | Kartu, panel, input | |
| `--redup` | `#6B5B4E` | Teks sekunder; batas input di dalam hero | 6,23:1 di krem; 4,6:1 di kuning |
| `--garis-keras` | `#9A8673` | Batas kontrol (input, chip, segmen) | 3,48:1 di putih, 3,34:1 di krem |
| `--garis` | `#F1E6CF` | Pemisah dekoratif | |
| `--bintang` | `#D94E00` | Ikon bintang rating | 4,17:1 di putih |
| `--bayangan` / `--bayangan-naik` | hitam hangat 8% / 14% | Bayangan lembut elevasi | |

### Tema gelap (saklar manual, default tetap terang)

| Token | Hex | Kontras |
|---|---|---|
| `--bg-hero` | `#211813` | Teks krem 15,37:1 |
| `--kata-raksasa` | `#8A3A12` | Dekoratif |
| `--cabai` (aksi) | `#FFC94A` | Teks tinta di atasnya 11,85:1 |
| `--aktif` | `#FFC94A` | Tinta di atasnya |
| `--kertas` / `--surface` | `#1A1411` / `#2A201B` | |
| `--tinta` | `#FBEFDF` | 14,02:1 di surface |
| `--garis-keras` | `#7A6A5C` | 3,06:1 di surface |
| `--fokus`, `--link` | `#FFC94A` | |

**Aturan token**

- Oranye **tidak** dipakai sebagai warna teks di atas krem atau putih (`#FF6400` hanya 2,79:1).
- Teks putih **tidak** dipakai di atas kuning atau oranye.
- Alias semantik dideklarasikan ulang di blok `:root[data-theme="dark"]`.
- Campuran warna memakai `color-mix(in oklab, ...)`.
- Maksimal 3 warna inti (kuning, oranye, merah) + netral krem/tinta. Warna logo tidak diubah.

---

## 3. Tipografi

Satu keluarga: **Plus Jakarta Sans** 400 / 600 / 800, dimuat lewat `next/font/google` (variabel `--font-jakarta`).

| Peran | Gaya |
|---|---|
| Kata raksasa hero | 800, kapital, `letter-spacing -0.04em`, `line-height 0.82`; ukuran dihitung dari panjang nama (bagian 7.2) |
| Nomor slide | 400, 36 px HP / 72 px desktop, `tabular-nums`; "/06" 600 kecil |
| Headline hero | 600 **miring**, 19 px HP / 24 px desktop, kalimat biasa (bukan kapital) |
| Judul halaman (`.display`) | 800, `letter-spacing -0.02em`, `text-wrap: balance` |
| Teks isi | 400, 16 px / 1.5 |
| UI (tombol, chip, tab) | 600, 14 sampai 15 px |
| Meta (rating, jarak) | 400, 14 px |

- Input selalu 16 px (mencegah zoom otomatis iOS).
- Bobot 900 tidak dipakai (tidak tersedia, browser akan menebalkan palsu).

---

## 4. Bentuk, garis, bayangan

Tanpa garis tebal dan tanpa bayangan keras. Garis hanya untuk batas kontrol; bayangan lembut hanya sebagai penanda elevasi.

| Elemen | Garis | Bayangan | Radius |
|---|---|---|---|
| Tombol primer | tanpa | tanpa | 12 px |
| Tombol sekunder | 1,5 px `--garis-keras` | tanpa | 12 px |
| Tombol di atas hero (MENU, panah) | tanpa, latar putih | tanpa | 12 px / bulat |
| Input | 1,5 px `--garis-keras` (`--redup` di dalam hero) | tanpa | 12 px |
| Chip filter | 1,5 px | tanpa | pil (satu-satunya bentuk pil) |
| Kartu hasil / ulasan | tanpa | `0 1px 2px` + `0 8px 24px` `--bayangan` | 16 px |
| Menu, header melekat | tanpa | `0 12px 32px --bayangan-naik` | 16 px |
| Bottom sheet | tanpa | ke atas | 20 px sudut atas |
| Label harga di foto | tanpa, putih 94% | tanpa | 8 px |

Tekan: tombol `scale(0.98)`, kartu `scale(0.99)`. Hover kartu (desktop): naik 2 px dan bayangan menebal.

---

## 5. Ikon

Phosphor Icons, bobot Bold, `currentColor`. Hanya ikon yang bermakna (cari, lokasi, bintang, jam, rute, simpan, bagikan, panah carousel, tema). Bintang rating berwarna `--bintang` tanpa garis.

---

## 6. Motif dan aset

### 6.1 Kata raksasa

Nama menu dalam huruf kapital raksasa di belakang foto hidangan hero, warna `--kata-raksasa`. Gaya yang sama (lebih kecil, merah 22% opasitas, class `.state-word`) dipakai di state kosong dan offline ("BELUM KETEMU", "OFFLINE"). Selalu `aria-hidden`; informasinya sudah ada di teks lain.

### 6.1b Grain latar hero

Tekstur grain sangat halus di latar hero (pilihan owner 3 Nov 2026) agar latar tidak datar, kesan kertas cetak. `.hero-panel::before`: SVG `feTurbulence` 160 px diulang, `--grain-opacity` 0,22 + `multiply` (terang), 0,1 + `screen` dengan noise dibalik (gelap). Selalu di bawah konten (`isolation: isolate`, `z-index: -1`), tidak memengaruhi kontras teks. Tanpa file gambar tambahan; diizinkan CSP `img-src data:`.

### 6.2 Label harga

Kotak putih kecil di pojok foto kartu, teks tinta 700 14 px, tanpa rotasi. Tampil hanya bila Google punya data harga.

### 6.3 Foto hero

- Foto hidangan tanpa latar (cutout), di `public/hero/*.webp`, sisi terpanjang maks 1.000 px.
- Sumber dan riwayat: `assets/hero-v2/` (hasil hapus latar rembg dari foto owner, aslinya di `original/`), `assets/hero-v1/` (versi sebelumnya).
- Bayangan lembut di bawah foto (`.hero-photo`: `drop-shadow(0 24px 28px)`) agar makanan terasa diletakkan, bukan melayang.
- Slide aktif: seblak, nasi rames, mie ayam, bakso. Ayam geprek dan es teh dilepas (3 Nov 2026) karena hasil hapus latarnya kurang rapi.
- Ruang transparan di sekeliling hidangan dipotong agar foto mengisi kotaknya.
- URL foto memakai versi (`?v=2` di `config/hero-slides.ts`): `/hero` di-cache 1 hari, jadi naikkan versi setiap file foto diganti.
- Resolusi masih rendah untuk tampilan besar (nasi rames 298 px, mie ayam 378 px, seblak 442 px, bakso 618 px): akan tampak buram di desktop besar; butuh foto baru ≥ 1.200 px.

### 6.4 Pengganti foto tempat

Kotak 16:10 berlatar `--tint-makanan` / `--tint-minuman` / `--tint-jajanan` dengan huruf awal nama tempat.

### 6.7 Logo

- Logo owner utuh (`public/brand/logo-full.webp`), tanpa garis, bayangan, atau rotasi.
- Selalu di bidang krem `#FFF7E8` radius 16 px (class `.logo-badge`), karena pin oranye logo tenggelam di latar kuning/oranye. Bidang krem tetap di tema gelap.
- Bilah atas: tinggi 56 px HP, 72 px desktop. Header melekat: pin saja (`logo-mark.webp`) di lingkaran 44 px.
- Komponen: `components/logo.tsx` (`<Logo variant="full" | "mark" />`), selalu tautan ke `/` dengan label "Ayo Makan, ke beranda".
- Warna logo tidak diubah dan tidak dipakai sebagai teks UI.

---

## 7. Tata letak

### 7.1 Breakpoint

| Rentang | Gutter | Grid hasil |
|---|---|---|
| < 768 px | 16 px | 1 kolom |
| 768 sampai 1023 px | 24 px | 2 kolom |
| ≥ 1024 px | 40 px | panel filter + 3 kolom, konten maks 1280 px |

### 7.2 Hero (setinggi layar)

Struktur (`components/hero.tsx`): bilah atas → panggung → headline + kolom cari.

- **Panggung** setinggi `--stage-h`:
  - HP: `max(200px, 100svh - 340px)`
  - Tablet: `max(380px, 100svh - 420px)`
  - Desktop: `max(460px, 100svh - 152px)`
- **Susunan awal dipulihkan** (permintaan owner 3 Nov 2026, setelah mencoba foto di kiri dan lapis garis nama menu di depan foto):
  - Nomor slide kiri atas (36 px HP, 72 px desktop).
  - Nama menu raksasa rata tengah, di tengah vertikal panggung; HP/tablet satu kata per baris, desktop satu baris.
  - Foto di tengah, di depan nama menu: lebar 78% HP, 60% tablet, 42% desktop, tinggi 94% panggung.
- **Ukuran kata raksasa** (`--n` = jumlah huruf nama, `--m` = kata terpanjang):
  - HP: `min((100vw - 32px) / (m × 0.7), 128px)`
  - Tablet: `min((100vw - 64px) / (m × 0.7), 200px)`
  - Desktop: `min((min(100vw, 1360px) - 80px) / (n × 0.7), 340px)`
- **HP/tablet:** panah carousel di bawah panggung; di bawahnya headline miring, satu kalimat pendukung, kolom cari, tombol "Cari di sekitar".
- **Desktop:** garis pendek + headline + teks pendukung di kiri bawah panggung (maks 300 px); kolom cari + tombol + kontrol carousel di kanan tengah (340 px).
- **Kolom cari umum, tidak mengikuti slide** (keputusan owner 3 Nov 2026): placeholder "Mau makan apa hari ini?", tombol "Cari di sekitar" mengirim isi kolom; kolom kosong = mode jelajah. Carousel hanya etalase.
- Hanya satu headline dan satu kolom cari (`#cari-hero`) untuk semua lebar; desktop memposisikannya absolut.
- **Performa:** foto slide pertama di-preload dari server (`app/page.tsx`); foto slide lain dimuat setelah foto pertama selesai; animasi masuk foto hanya saat pengguna ganti slide. `/hero/*` dan `/brand/*` di-cache 1 hari (`next.config.ts`).

### 7.3 Bilah atas dan header melekat

- Bilah atas (`components/top-bar.tsx`): logo kiri, navigasi tengah (desktop: Cari, Favorit, Privasi), saklar tema kanan; HP: logo + tombol Menu.
- Header melekat: bilah putih radius 16 px berbayangan lembut, pin logo, kolom cari, Favorit + tema (desktop) atau Menu (HP). Muncul saat hero keluar layar.

### 7.4 Area hasil, detail, halaman lain

Struktur dan perilaku tetap seperti v1 (lihat `PRD.md` 7 dan koreksi owner di `log.md`: semua kartu sama ukuran, 6 kartu per muat, petunjuk pencarian dua grup berlabel). Yang berubah hanya gaya visual sesuai bagian 4.

---

## 8. Gerak (MOTION 2)

| Interaksi | Gerak |
|---|---|
| Ganti slide | crossfade 250 ms; foto naik 12 px + muncul 150 ms (tidak di muatan pertama) |
| Tekan tombol / kartu | `scale(0.98)` / `scale(0.99)` 80 ms |
| Hover kartu | naik 2 px, bayangan menebal 150 ms |
| Header melekat, menu | turun 150 sampai 180 ms |
| Bottom sheet | naik 200 ms |

Tidak ada putar otomatis, scroll-reveal, atau parallax. `prefers-reduced-motion` mematikan semua gerak.

---

## 9. Aksesibilitas

- Cincin fokus `3px solid var(--fokus)`, offset 3 px.
- `scroll-padding-top: 88px` agar elemen yang difokus tidak tertutup header melekat.
- Carousel: `aria-roledescription`, label slide, live region, panah keyboard, tombol berlabel.
- Kata raksasa, nomor slide, dan kata besar state: `aria-hidden`.

---

## 10. Jangan lakukan

- Teks putih di atas kuning/oranye; oranye sebagai teks di krem/putih.
- Garis tebal, bayangan keras, rotasi stiker, badge ledakan, bintang kilau (semua milik v1).
- Logo tanpa bidang krem di atas latar berwarna.
- Bentuk pil selain chip filter.
- Optimasi `next/image` untuk foto Google (aturan cache Places API).

---

## 11. Alasan keputusan (antislop R-31)

| Keputusan | Alasan |
|---|---|
| Hero kuning + kata raksasa oranye | Pilihan owner: oranye penuh terlalu gelap, kuning lebih cerah dan menonjolkan makanan. |
| Kata raksasa di belakang foto | Titik fokus kuat dari referensi owner; nama menu langsung terbaca. |
| Warna lain dari logo | Merah (aksi), oranye (kata raksasa), kuning (hero, terpilih), krem (latar) membuat app dan logo satu keluarga. |
| Chip/tab terpilih kuning | Mengulang warna hero di area hasil, lebih ramah dari hitam. |
| Tanpa garis tebal/bayangan keras | Arah editorial bersih pilihan owner; elevasi cukup dengan bayangan lembut. |
| Headline miring kecil | Mengikuti referensi: kata raksasa yang berteriak, tagline yang berbisik. |
| Satu font Jakarta Sans | Pilihan owner; hierarki dari bobot dan ukuran. |
| Hero setinggi layar | Permintaan owner; panggung fleksibel agar kolom cari tetap terlihat di HP. |

---

## Changelog

- **2.1** (3 November 2026): grain halus di latar hero (6.1b); susunan hero awal dipulihkan setelah percobaan foto kiri dan lapis garis; foto besar di depan nama menu rata tengah (lapis garis di depan foto dicoba lalu ditolak owner), kolom cari umum (tidak mengikuti slide), slide ayam geprek dan es teh dilepas, URL foto berversi.
- **2.0** (2 November 2026): arah "Oranye Bersih" menggantikan "Sambal Segar". Hero editorial setinggi layar (kuning + kata raksasa oranye), palet dari logo, komponen tanpa garis tebal/bayangan keras, logo polos di bidang krem, foto hero v2 hasil hapus latar, preload LCP.
- 1.x: lihat `DESIGN-v1-sambal-segar.md`.
