# Ayo Makan: kontrak implementasi visual

> Versi 1.2 · 2 November 2026 · Sumber arah: pilihan owner di sesi brainstorm (arah "Sambal Segar": merah cabai + kuning telur, foto besar), referensi hero pop komik dari owner (latar kuning, oval merah, badge ledakan, headline besar, panah carousel kotak, header kotak merah + MENU di HP), foto hidangan asli (bukan ilustrasi 3D), hero HP memuat kolom cari.
>
> `Dial: ENERGY 3 / RHYTHM 2 / MOTION 2`

File ini **otoritatif untuk semua nilai visual** (token, ukuran, komponen, gerak). `PRD.md` bagian 10 adalah ringkasan produk. Jika keduanya berbeda, ikuti file ini lalu perbarui PRD.

Dari referensi owner, yang diambil hanya ciri gaya. Nama, logo, maskot, ilustrasi, dan teks referensi **tidak** dipakai.

---

## 1. Urutan implementasi dan penerimaan

1. Pasang token (bagian 2), font (bagian 3), dan aset SVG motif (bagian 6) sebelum menata layar apa pun. Pakai CSS variable, jangan diganti warna Tailwind yang mirip.
2. Bangun komponen bersama dulu (bagian 8): `Button`, `IconButton`, `SearchField`, `Chip`, `CategoryTabs`, `PlaceCard`, `PriceSticker`, `RatingLine`, `BurstBadge`, `CarouselControls`, `BottomSheet`, `MenuPanel`, `StickyHeader`, `ReviewCard`, `StateBlock`, `Skeleton`, `Toast`, `GoogleAttribution`.
3. Buat halaman galeri komponen `/dev/galeri` yang hanya ada saat `NODE_ENV=development` (tidak ditautkan dari navigasi, tidak ikut build produksi). Cek semua varian dan state di tema terang dan gelap.
4. Bangun berurutan: hero beranda → area hasil → detail tempat → favorit → privasi → offline.
5. Bandingkan di 360×640, 390×844, 768×1024, 1440×900. Perbaiki jarak, ukuran, dan state sebelum menyalin pola ke layar lain.
6. Semua kontrol harus berfungsi (antislop R-26): tab, chip, bottom sheet, MENU, carousel, simpan, bagikan, rute, muat lebih banyak, saklar tema. Escape menutup panel, fokus kembali ke pemicunya.

**Checklist penerimaan**

- Hero HP: kolom cari terlihat di layar pertama 360×640 tanpa gulir.
- Header kotak HP: tinggi 60 px, inset 12 px dari tepi, radius 14 px, garis 3 px, bayangan keras 6 px.
- Panel hero desktop: inset 24 px, radius 24 px, garis 3 px, bayangan keras 8 px, tinggi `min(88vh, 760px)`.
- Kolom cari: 52 px HP, 56 px desktop, teks input 16 px.
- Tombol utama: tinggi 48 px HP, 44 px desktop. Semua target sentuh ≥ 44×44 px.
- Kartu hasil: garis 2 px, bayangan keras 3 px, radius 12 px, foto 16:10.
- Lebar konten maks 1200 px. Tidak ada scroll horizontal di lebar mana pun.
- Tema terang default, tema gelap lewat saklar, keduanya lolos kontras.
- Logo Google Maps tampil di daftar hasil dan detail tempat.

---

## 2. Token

Arsitektur: primitif (`--cabai`, `--telur`) → semantik (`--bg`, `--text`, `--action`) → komponen. Komponen hanya memakai token semantik.

```css
:root,
:root[data-theme="light"] {
  /* primitif */
  --cabai: #B3261E;
  --telur: #FFC233;
  --tinta: #1C1410;
  --kertas: #FFF7E8;
  --putih: #FFFFFF;
  --redup: #6B5B4E;
  --garis: #E9DCC6;

  /* latar pengganti foto per kategori */
  --tint-makanan: #F6D6D3;   /* huruf --cabai, 4,82:1 */
  --tint-minuman: #FFE3A3;   /* huruf --tinta, 14,49:1 */
  --tint-jajanan: #EADBC4;   /* huruf --tinta, 13,34:1 */

  /* semantik */
  --bg: var(--kertas);
  --bg-hero: var(--telur);
  --surface: var(--putih);
  --text: var(--tinta);
  --text-muted: var(--redup);          /* JANGAN dipakai di atas --telur (4,03:1) */
  --action: var(--cabai);
  --on-action: var(--putih);           /* 6,54:1 */
  --accent: var(--telur);
  --on-accent: var(--tinta);           /* 11,25:1 */
  --line: var(--garis);                /* pemisah dekoratif */
  --line-strong: var(--tinta);         /* garis komik 2-3 px */
  --shadow-hard: var(--tinta);
  --focus: var(--tinta);               /* 17,05:1 di kertas, 11,25:1 di telur */
  --header-box: var(--cabai);
  --on-header-box: var(--kertas);      /* 6,14:1; --telur hanya untuk teks besar (4,05:1) */
}

:root[data-theme="dark"] {
  --kertas: #1A1411;
  --putih: #2A201B;
  --tinta: #FBEFDF;
  --cabai: #FF7A6B;
  --redup: #B8A898;
  --garis: #3A2E27;

  --tint-makanan: #3A2A22;   /* huruf --cabai, 5,38:1 */
  --tint-minuman: #3D3018;   /* huruf --tinta, 11,33:1 */
  --tint-jajanan: #3A3027;   /* huruf --tinta, 11,34:1 */

  --bg: var(--kertas);
  --bg-hero: #2A201B;                  /* hero gelap: kuning jadi aksen, bukan latar */
  --surface: var(--putih);
  --text: var(--tinta);
  --text-muted: var(--redup);          /* 6,88:1 di surface */
  --action: var(--cabai);
  --on-action: #1C1410;                /* 7,13:1 */
  --accent: var(--telur);
  --on-accent: #1C1410;
  --line: var(--garis);
  --line-strong: #F2E3CC;              /* tombol dan input; 14,44:1 di bg */
  --line-card: #5A4638;                /* garis kartu, lebih redup agar daftar tenang */
  --shadow-hard: #000000;
  --focus: var(--telur);               /* 9,85:1 di surface */
  --header-box: #B3261E;
  --on-header-box: #FFF7E8;
}

:root {
  /* jarak (kelipatan 4) */
  --s-1: 4px;  --s-2: 8px;  --s-3: 12px; --s-4: 16px;
  --s-5: 20px; --s-6: 24px; --s-8: 32px; --s-10: 40px; --s-12: 48px; --s-16: 64px;

  /* radius */
  --r-sticker: 6px;
  --r-control: 10px;
  --r-card: 12px;
  --r-header: 14px;
  --r-hero: 24px;
  --r-chip: 999px;   /* hanya chip filter */

  /* garis & bayangan keras (tanpa blur) */
  --stroke-1: 2px;
  --stroke-2: 3px;
  --shadow-card: 3px 3px 0 var(--shadow-hard);
  --shadow-control: 4px 4px 0 var(--shadow-hard);
  --shadow-control-pressed: 2px 2px 0 var(--shadow-hard);
  --shadow-box: 6px 6px 0 var(--shadow-hard);
  --shadow-hero: 8px 8px 0 var(--shadow-hard);

  /* gerak */
  --t-press: 80ms;
  --t-fast: 150ms;
  --t-base: 200ms;
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);

  /* lapisan */
  --z-sticky: 20; --z-menu: 30; --z-sheet: 40; --z-toast: 50;
}
```

**Aturan token**

- Alias semantik **dideklarasikan ulang** di selector `:root[data-theme="dark"]`, jangan hanya mengandalkan alias di `:root`. `var()` di custom property di-resolve di elemen tempat dideklarasikan, jadi alias yang hanya ada di `:root` tidak ikut berubah.
- Jika butuh campuran warna, pakai `color-mix(in oklab, ...)`, bukan `oklch` (campuran dengan warna akromatik di oklch bisa bergeser ke merah muda).
- Tema: default **terang**. Saklar tema menyimpan pilihan di localStorage (dibungkus try/catch). Tidak mengikuti sistem secara otomatis. Atribut `data-theme` dipasang di `<html>` sebelum paint (skrip inline kecil) agar tidak berkedip.
- Maksimal 2 warna inti (cabai, telur) + tinta/kertas netral. Tidak ada warna baru tanpa memperbarui file ini.

---

## 3. Tipografi

Satu keluarga font: **Plus Jakarta Sans** (pilihan owner, 2 November 2026). Hierarki dibangun dari bobot, ukuran, dan huruf kapital, bukan dari font kedua.

| Peran | Bobot | Pemakaian |
|---|---|---|
| Display | 800 (ExtraBold, bobot paling tebal yang tersedia) | Headline hero, badge ledakan, stiker harga, `h1`, `h2` |
| Teks dan UI | 400, 600 | Teks isi, tombol, chip, label, meta |

Pemuatan dengan `next/font/google`:

```ts
import { Plus_Jakarta_Sans } from "next/font/google";

export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});
```

```css
:root {
  /* variabel next/font DI DEPAN stack, jangan ditimpa nama font literal */
  --font-sans: var(--font-plus-jakarta-sans), system-ui, sans-serif;
  --font-display: var(--font-plus-jakarta-sans), system-ui, sans-serif;
}
.display {
  font-family: var(--font-display);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;     /* huruf kapital tebal terlihat renggang tanpa ini */
  text-transform: uppercase;   /* teks sumber tetap kalimat biasa */
  text-wrap: balance;          /* baris headline seimbang, tidak ada satu kata tersisa */
}
.num { font-variant-numeric: tabular-nums; }
```

**Skala**

| Token | HP | Desktop | Bobot | Pemakaian |
|---|---|---|---|---|
| `display-hero` | `clamp(26px, 8vw, 32px)` | `clamp(40px, 4vw, 60px)` | 800 kapital | Headline slide, maksimal 4 baris |
| `display-badge` | 18 px | 24 px | 800 kapital | Nama menu di badge ledakan, maksimal 2 baris |
| `h1` | 24 px | 30 px | 800 | Nama tempat di detail |
| `h2` | 20 px | 24 px | 800 | Judul bagian (Ulasan dari Google) |
| `h3` | 17 px / 600 | 18 px / 600 | 600 | Nama tempat di kartu |
| `body` | 16 px / 1.5 | 16 px / 1.5 | 400 | Teks isi, ulasan |
| `ui` | 15 px / 600 | 14 px / 600 | 600 | Tombol, chip, tab |
| `meta` | 14 px / 1.4 | 14 px / 1.4 | 400 | Rating, jarak, alamat, waktu ulasan |
| `price` | 15 px | 17 px | 800 | Stiker harga |

Jakarta Sans lebih lebar dari font kondensed, jadi ukuran headline lebih kecil dari versi 1.0. Ukuran di atas adalah perkiraan; saat verifikasi, headline terpanjang ("Lauk pilih sendiri, tagihan tetap tahu diri") wajib muat dalam 4 baris di 360 px dan di 1440 px. Jika tidak, turunkan batas atas `clamp`, jangan memotong teks.

- Input selalu `16px` eksplisit (mencegah zoom otomatis iOS). Jangan mengandalkan kelas ukuran bawaan yang bisa ditimpa token.
- Huruf kapital hanya untuk kelas `.display`. Tulisan AYO MAKAN memakai logo (6.7), bukan teks. Tidak ada label kapital dengan letter-spacing lebar.
- Angka rating, jarak, harga, jumlah ulasan memakai `.num`.

---

## 4. Garis, bayangan, radius

Garis tinta + bayangan keras dipakai di seluruh app. Alasannya: identitas pop komik yang konsisten, dan bayangan keras memberi tanda bisa ditekan.

| Elemen | Garis | Bayangan | Radius |
|---|---|---|---|
| Panel hero desktop | `--stroke-2` `--line-strong` | `--shadow-hero` | `--r-hero` |
| Header kotak HP, badge ledakan, panel MENU | `--stroke-2` | `--shadow-box` | `--r-header` (badge: bentuk SVG) |
| Tombol, kolom cari, tombol panah carousel | `--stroke-1` | `--shadow-control` | `--r-control` |
| Kartu hasil, kartu ulasan | `--stroke-1` (`--line-card` di gelap) | `--shadow-card` | `--r-card` |
| Chip filter, tab kategori | `--stroke-1` | tanpa | chip `--r-chip`, tab `--r-control` |
| Stiker harga | `--stroke-1` | `2px 2px 0` | `--r-sticker` |
| Bilah aksi bawah, bottom sheet | `--stroke-1` di tepi atas saja | tanpa | sheet: 16 px di sudut atas |

**Resep tekan** (tombol dan kartu yang bisa diketuk):

```css
.pressable {
  box-shadow: var(--shadow-control);
  transition: transform var(--t-press) ease-out, box-shadow var(--t-press) ease-out;
}
.pressable:active {
  transform: translate(2px, 2px);
  box-shadow: var(--shadow-control-pressed);
}
@media (prefers-reduced-motion: reduce) {
  .pressable { transition: none; }
}
```

Kartu memakai versi yang sama dengan `--shadow-card` (geser 1 px, bayangan jadi 2 px).

---

## 5. Ikon

- Set: Phosphor Icons, bobot **Bold**. Ukuran 20 px di dalam tombol/chip, 24 px untuk tombol ikon.
- Ikon selalu berwarna `currentColor`.

| Fungsi | Ikon Phosphor |
|---|---|
| Cari | `MagnifyingGlass` |
| Hapus kata kunci | `X` |
| Pusat lokasi | `MapPin` |
| Ganti lokasi | `CaretDown` |
| Rating | `Star` (isi `--telur` dengan garis `--tinta` di kartu; `Star` fill untuk bintang ulasan) |
| Jam buka | `Clock` |
| Rute | `NavigationArrow` |
| Simpan / tersimpan | `BookmarkSimple` / `BookmarkSimple` weight fill |
| Bagikan | `ShareNetwork` |
| Salin alamat | `Copy` |
| Carousel | `ArrowLeft`, `ArrowRight` |
| Lihat hasil | `CaretDoubleDown` |
| Tema | `Sun` / `Moon` |
| Buka di Google Maps | `ArrowSquareOut` (satu-satunya ikon panah keluar, karena memang membuka aplikasi lain) |

Tidak ada ikon dekoratif. Bintang kilau di hero adalah aset motif (bagian 6), bukan ikon.

---

## 6. Motif dan aset SVG

Satu keluarga motif: stiker yang ditempel. Semua bergaris tinta dan berbayangan keras.

### 6.1 Badge ledakan

Dipakai **hanya** di hero (nama menu) dan di empty state. Bentuk: poligon 18 duri, sedikit tidak beraturan agar terasa digambar tangan.

```svg
<svg viewBox="-4 -4 108 108" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <!-- bayangan keras -->
  <polygon transform="translate(5 5)" fill="var(--shadow-hard)"
    points="50.0,7.9 56.5,18.4 67.4,8.9 68.5,22.4 82.3,16.9 79.4,28.8 91.0,29.6 86.7,38.5 96.5,42.9 88.7,50.0 96.7,57.1 84.8,60.9 92.9,71.3 81.0,72.4 80.7,81.5 68.9,78.1 67.4,91.0 57.1,84.8 50.0,93.4 43.3,82.6 31.9,92.7 31.6,77.5 16.5,84.4 20.9,71.0 8.5,70.6 15.0,60.9 1.9,57.3 9.5,50.0 2.6,42.8 13.0,38.4 6.0,28.1 20.6,28.8 17.7,16.9 31.5,22.5 33.8,11.7 43.5,18.1"/>
  <!-- badan -->
  <polygon fill="#FFFFFF" stroke="var(--line-strong)" stroke-width="2.5" stroke-linejoin="round"
    points="50.0,7.9 56.5,18.4 67.4,8.9 68.5,22.4 82.3,16.9 79.4,28.8 91.0,29.6 86.7,38.5 96.5,42.9 88.7,50.0 96.7,57.1 84.8,60.9 92.9,71.3 81.0,72.4 80.7,81.5 68.9,78.1 67.4,91.0 57.1,84.8 50.0,93.4 43.3,82.6 31.9,92.7 31.6,77.5 16.5,84.4 20.9,71.0 8.5,70.6 15.0,60.9 1.9,57.3 9.5,50.0 2.6,42.8 13.0,38.4 6.0,28.1 20.6,28.8 17.7,16.9 31.5,22.5 33.8,11.7 43.5,18.1"/>
</svg>
```

- Badan selalu putih `#FFFFFF` di kedua tema (stiker). Teks nama menu `#B3261E` (6,54:1), `display-badge`, maksimal 2 baris, rata tengah, dirotasi -6°.
- Ukuran: 150 px HP, 220 px desktop. Teks diletakkan di atas SVG dengan elemen HTML (bukan `<text>` di SVG) agar bisa dibaca pembaca layar dan dipotong font dengan benar.

### 6.2 Stiker harga

- Kotak `--accent`, teks `--on-accent` `price`, padding 4 × 8 px, garis `--stroke-1`, bayangan `2px 2px 0`, rotasi -2°.
- Posisi: pojok kanan bawah foto kartu, menjorok 8 px dari tepi foto.
- Isi: `mulai Rp10rb` (dari `priceRange.startPrice`) atau `Murah` (dari `priceLevel`). Tidak tampil jika Google tidak punya data harga.

### 6.3 Oval merah (panggung foto hero)

- Elips `--action` (tema terang `#B3261E`), garis `--stroke-2` `--line-strong`, rotasi 8°.
- Rasio 0,72 (lebar : tinggi). Desktop: tinggi ±78% tinggi kolom kiri. HP: tinggi ±34vh, maks 300 px.
- Foto cutout di atas oval, skala sehingga ±20% bagian foto keluar dari tepi oval (biasanya kanan atas). Foto diberi `filter: drop-shadow(6px 6px 0 var(--shadow-hard))` agar ikut gaya bayangan keras.

### 6.4 Bintang kilau

```svg
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M12 1 C12.9 8.2 15.8 11.1 23 12 C15.8 12.9 12.9 15.8 12 23 C11.1 15.8 8.2 12.9 1 12 C8.2 11.1 11.1 8.2 12 1 Z"
        fill="#FFFFFF" stroke="var(--line-strong)" stroke-width="1.5" stroke-linejoin="round"/>
</svg>
```

- Maksimal 3 per hero, ukuran 20 sampai 32 px, posisi tetap (tidak beranimasi). Tidak dipakai di luar hero.

### 6.5 Foto hero

- Disediakan owner sesuai `PRD.md` 10.11. Sebelum foto ada, slot menampilkan kotak `--tint-makanan` bergaris putus-putus dengan teks `[FOTO: seblak]`.
- Format keluaran: AVIF + WebP, lebar 480 / 800 / 1200 px, `sizes` sesuai kolom. Target ≤ 120 KB pada 800 px.

### 6.6 Pengganti foto tempat (tanpa foto dari Google)

- Kotak 16:10 dengan latar `--tint-makanan` / `--tint-minuman` / `--tint-jajanan` sesuai kategori, huruf awal nama tempat di tengah (`display`, 56 px), warna sesuai komentar token.

### 6.7 Logo

Logo dari owner (2 November 2026): pin lokasi + kaca pembesar dengan mangkuk tersenyum, tulisan AYO MAKAN huruf bulat, garis bawah hijau. File sumber `assets/brand/logo-original.webp` (latar putih gading). Versi kerja dengan latar transparan dan bayangan oval dihapus:

| File | Ukuran | Pemakaian | Tujuan saat dipasang |
|---|---|---|---|
| `assets/brand/logo-full.png` | 1098×974, transparan | Stiker logo di header kotak HP dan bilah atas desktop | `public/brand/logo-full.png` |
| `assets/brand/logo-mark.png` | 794×691, transparan | Stiker bulat di header ringkas, pratinjau link | `public/brand/logo-mark.png` |
| `assets/brand/icon-192.png`, `icon-512.png` | latar `#FFF7E8`, pin 84% | Ikon PWA | `public/` (ganti yang lama) |
| `assets/brand/icon-maskable-512.png` | latar `#FFF7E8`, pin 60% (dalam zona aman 80%) | Ikon PWA maskable | `public/` |
| `assets/brand/apple-icon.png` | 180×180, latar `#FFF7E8` | Ikon iOS | `app/apple-icon.png` |
| `assets/brand/icon.png` | 256×256, transparan | Favicon | `app/icon.png` |

**Aturan pakai**

- Logo selalu tampil di dalam **stiker**: latar `#FFF7E8` tetap (tidak berubah di tema gelap, karena stiker adalah benda fisik), garis 3 px `#1C1410`, bayangan keras `--shadow-box`, radius 14 px, padding 8 px, rotasi -3°.
- Header kotak HP: stiker `logo-full` tinggi 104 px, kiri 12 px, atas 4 px, **menggantung** keluar dari bawah header kotak dan menimpa tepi atas hero. Konten hero di sisi kiri diberi ruang atas 52 px agar tidak tertutup.
- Bilah atas desktop: stiker `logo-full` tinggi 132 px di tengah, menggantung di bawah bilah.
- Header ringkas melekat: stiker bulat 44 px berisi `logo-mark` (bukan logo penuh, karena tulisannya tidak terbaca di ukuran itu).
- Ukuran minimal `logo-full`: tinggi 88 px. Di bawah itu pakai `logo-mark`.
- Logo adalah tautan ke `/` dengan `alt="Ayo Makan"`.
- Warna logo (oranye `#FF6400`, merah `#C31615`, kuning, hijau `#599208`) **tidak** masuk palet UI. Oranye dan hijau hanya boleh muncul di dalam logo.
- Jangan: mengubah warna logo, meregangkan, menaruh logo langsung di atas `--cabai` atau foto tanpa stiker, menambah efek, atau menggambar ulang tulisan logo dengan font UI.

---

## 7. Tata letak

### 7.1 Breakpoint dan grid

| Rentang | Gutter | Grid hasil | Catatan |
|---|---|---|---|
| < 640 px | 16 px | 1 kolom, jarak 16 px | Header kotak, hero bertumpuk |
| 640 sampai 767 px | 24 px | 2 kolom, jarak 16 px | Hero masih bertumpuk |
| 768 sampai 1023 px | 24 px | 2 kolom, jarak 20 px | Hero 2 kolom (foto kiri, teks kanan) |
| ≥ 1024 px | 32 px | panel filter 280 px + 3 kolom, jarak 24 px | Panel hero berbingkai, konten maks 1200 px |

Kartu pertama pada urutan "Paling cocok": lebar penuh di 1 kolom, selebar 2 kolom di grid 2 dan 3 kolom.

### 7.2 Hero beranda

**HP (< 768 px)**, urutan atas ke bawah, latar `--bg-hero`:

1. Header kotak: inset 12 px, tinggi 60 px, `--header-box`, stiker logo menggantung di kiri (bagian 6.7), tombol MENU kanan (putih, teks tinta `ui`, garis 2 px, bayangan 4 px, tinggi 44 px).
2. Panggung foto: oval + foto + badge ledakan menimpa kiri bawah oval + maksimal 2 bintang kilau. Tinggi fleksibel: **panggung yang mengecil** jika ruang kurang, bukan kolom cari yang turun.
3. Headline `display-hero`, maksimal 3 baris.
4. Teks pendukung 1 kolom `meta`, warna `--text` (bukan `--text-muted`).
5. `SearchField` 52 px.
6. Tombol slide (`Button` primer, lebar penuh): "Cari seblak di sekitar".
7. `CarouselControls`.

Jarak antar blok 16 px, padding bawah hero 24 px.

**Desktop (≥ 1024 px)**: panel berbingkai di atas `--bg`, inset 24 px, padding dalam 32 px.

- Bilah atas (tinggi 72 px): tautan Cari dan Favorit kiri, stiker logo tengah (bagian 6.7), Privasi dan saklar tema kanan.
- Isi: grid 55/45. Kiri: panggung foto (oval, foto, badge kiri atas menimpa oval, maksimal 3 bintang). Kanan: headline, teks pendukung 2 kolom, `SearchField` 56 px, tombol slide, `CarouselControls`.
- Bawah tengah: tautan "Lihat hasil" + ikon `CaretDoubleDown` ke `#hasil`.

**Tablet (768 sampai 1023 px)**: header kotak HP, isi hero 2 kolom 50/50, teks pendukung 1 kolom.

### 7.3 Header ringkas melekat

- Muncul saat hero keluar viewport (IntersectionObserver pada hero), transisi turun `--t-fast`.
- HP: kotak `--header-box` inset 8 px, tinggi 56 px, stiker bulat `logo-mark` 44 px, `SearchField` ringkas (44 px) berisi kata kunci aktif, tombol MENU ikon.
- Desktop: bilah lebar konten, tinggi 64 px, stiker bulat `logo-mark` 44 px kiri, `SearchField` tengah (maks 520 px), Favorit + tema kanan.

### 7.4 Area hasil (`#hasil`)

Latar `--bg`. Urutan: baris pusat lokasi (`MapPin` + "Dari Kampus Terpadu" + `CaretDown`) → `CategoryTabs` → baris chip filter (geser horizontal di HP, dengan fade 24 px di tepi kanan sebagai tanda bisa digeser) → pemilih urutan → grid kartu → "Muat lebih banyak" → `GoogleAttribution`.

Desktop: chip filter pindah ke panel kiri 280 px yang melekat (top = tinggi header ringkas + 16 px), berisi grup Radius, Rating, Buka sekarang, Murah, dan tombol Reset.

### 7.5 Detail tempat

- HP: tombol kembali (`IconButton`) melayang di atas foto kiri atas. Foto 4:3 lebar penuh, strip thumbnail 4 buah (64 px, garis 2 px). Lalu nama (`h1`), tipe (`meta`), `RatingLine` + harga, jarak + status + akordeon jam, alamat + salin, bagian ulasan, `GoogleAttribution`. Bilah aksi melekat di bawah (tinggi 72 px + safe area): "Rute ke sini" (primer, mengisi sisa lebar), Simpan, Bagikan (`IconButton`).
- Desktop: grid 7/5 dalam lebar 1200 px. Kiri: foto + info + aksi (tidak melekat). Kanan: ulasan, melekat saat digulir jika lebih pendek dari kiri.

### 7.6 Halaman lain

- `/favorit`: judul `h1` "Tempat tersimpan", grid sama dengan hasil.
- `/privasi`: kolom teks maks 680 px, `body`, judul `h2` per bagian, termasuk "Kredit foto".
- `/offline`: `StateBlock` di tengah layar.

---

## 8. Resep komponen

| Komponen | Spesifikasi |
|---|---|
| `Button` primer | Latar `--action`, teks `--on-action` `ui`, garis 2 px `--line-strong`, `--shadow-control`, radius `--r-control`, tinggi 48 / 44 px, padding 0 20 px. Hover desktop: latar `color-mix(in oklab, var(--action) 88%, black)`. |
| `Button` sekunder | Latar `--surface`, teks `--text`, garis dan bayangan sama. |
| `Button` teks | Tanpa garis/bayangan, teks `--action` dengan garis bawah 2 px. Untuk "Lihat di Google Maps", "Laporkan". |
| `IconButton` | 44×44 px, latar `--surface`, garis 2 px, bayangan `--shadow-control`, ikon 24 px, wajib `aria-label`. |
| `SearchField` | Tinggi 52 / 56 px, latar `--surface`, garis 2 px, `--shadow-control`, ikon cari kiri, tombol hapus kanan (muncul jika ada isi), placeholder `--text-muted`, teks 16 px. Fokus: garis tetap, cincin fokus di luar bayangan. |
| `Chip` | Tinggi 36 px dengan area sentuh 44 px (padding vertikal tak terlihat), radius pil, garis 2 px, tanpa bayangan. Aktif: latar `--accent`, teks `--on-accent`. Chip dengan pilihan memakai `CaretDown` dan membuka `BottomSheet`. |
| `CategoryTabs` | 3 segmen sama lebar dalam satu kotak bergaris 2 px radius `--r-control`, tinggi 44 px. Aktif: latar `--tinta`, teks `--bg`. `role="tablist"`, panah kiri/kanan berpindah tab. |
| `PlaceCard` | Latar `--surface`, garis 2 px, `--shadow-card`, radius 12 px, foto 16:10 di atas (radius atas 10 px), `PriceSticker`, isi padding 12 px: nama `h3` 2 baris, `RatingLine`, tombol simpan `IconButton` versi tanpa garis 44 px di kanan atas isi. Seluruh kartu adalah satu tautan ke detail; tombol simpan menghentikan propagasi. |
| `RatingLine` | `Star` 16 px + `4,7` (600) + `(312)` (`--text-muted`) · jarak · status. Status "Buka" teks `--text` dengan titik 8 px `#1E7A3C` (terang) / `#5CCB82` (gelap); "Tutup" teks `--text-muted`. Warna status hanya titik, informasi tetap tertulis. `aria-label` lengkap. |
| `CarouselControls` | Dua `IconButton` 48×48 px (panah) mengapit indikator: batang aktif 32×6 px `--tinta`, titik lain 6×6 px `--tinta` 40%. Indikator bisa diketuk untuk lompat slide. |
| `BurstBadge` | Bagian 6.1. |
| `BottomSheet` | Latar `--surface`, radius atas 16 px, garis atas 2 px, pegangan 36×4 px, tinggi maks 70vh, backdrop `rgba(28,20,16,0.45)`. Fokus terkunci di dalam, Escape dan ketuk backdrop menutup. |
| `MenuPanel` (HP) | Turun dari bawah header kotak, latar `--header-box`, garis 3 px, `--shadow-box`, radius 14 px. Item: tinggi 52 px, teks `--on-header-box` `ui` 17 px, dipisah garis 1 px `rgba(255,247,232,0.35)`. |
| `ReviewCard` | Latar `--surface`, garis 2 px, `--shadow-card`, padding 16 px. Baris atas: avatar 36 px bulat (garis 2 px), nama (600, tautan ke profil), waktu `meta`. Bintang 14 px. Teks `body` dipotong 5 baris + "Baca selengkapnya". Bawah: "Diterjemahkan oleh Google" (jika ada), "Lihat di Google Maps", "Laporkan". |
| `StateBlock` | Ilustrasi (badge ledakan untuk kosong, tanpa ilustrasi untuk error), judul `h2`, kalimat `body`, maksimal 2 tombol. Rata tengah, lebar maks 420 px. |
| `Skeleton` | Bentuk sama dengan `PlaceCard` (foto + 2 baris), latar `--line`, tanpa garis tinta (supaya jelas belum siap). Animasi denyut opasitas 1,2 detik; mati saat reduced motion. |
| `Toast` | Bawah tengah, di atas bilah aksi, latar `--tinta`, teks `--bg`, radius 10 px, hilang setelah 3 detik, `role="status"`. |
| `GoogleAttribution` | Logo resmi Google Maps tinggi 16 sampai 19 px, ruang kosong ≥ 10 px kiri/kanan/atas dan ≥ 5 px bawah, varian outline di atas foto, `aria-label="Google Maps"`. |

---

## 9. State

| State | Visual |
|---|---|
| Memuat hasil | 3 `Skeleton` (HP) / 6 (desktop), `aria-busy="true"` di daftar. |
| Kosong | `StateBlock` dengan badge ledakan "BELUM KETEMU" 120 px. |
| Error / kuota habis / offline | `StateBlock` tanpa ilustrasi, tombol utama sesuai PRD 10.7. |
| Tanpa izin lokasi | Kartu `--surface` bergaris 2 px di atas area hasil, dua tombol (primer + sekunder). |
| Tombol nonaktif | Opasitas 0,5, tanpa bayangan, `aria-disabled`. |
| Hover (desktop) | Tombol: latar sedikit lebih gelap. Kartu: naik `translate(-1px,-1px)` + bayangan 4 px. |

Teks setiap state mengikuti `PRD.md` 10.7.

---

## 10. Gerak (MOTION 2)

| Interaksi | Gerak | Durasi |
|---|---|---|
| Tekan tombol/kartu | geser ke bayangan (bagian 4) | `--t-press` |
| Ganti slide hero | crossfade foto + headline; badge skala 0,92 → 1 | `--t-base`, badge `--t-fast` |
| Header ringkas muncul | translateY(-100%) → 0 | `--t-fast` |
| MENU panel | translateY(-8px) + opasitas 0 → 1 | 180 ms |
| Bottom sheet | translateY(100%) → 0 | `--t-base` `--ease-out` |
| Toast | opasitas + translateY(8px) | `--t-fast` |

Tidak ada: scroll-reveal, elemen melayang, parallax, carousel berputar otomatis, bintang berkedip. `prefers-reduced-motion: reduce` mematikan semua transisi di atas (perubahan langsung).

---

## 11. Aksesibilitas

- Cincin fokus: `outline: 3px solid var(--focus); outline-offset: 3px` (offset melewati bayangan keras). Tidak boleh `outline: none` tanpa pengganti.
- Urutan Tab mengikuti urutan visual. Carousel: panah kiri/kanan saat fokus di dalamnya.
- Semua `IconButton` punya `aria-label` berbahasa Indonesia.
- Wilayah live `polite` untuk: ganti slide, jumlah hasil ("12 tempat ditemukan"), toast.
- Kontras sudah dihitung di bagian 2. Kombinasi baru wajib dihitung sebelum dipakai.

---

## 12. Suara teks (ringkas)

- "Kamu", kalimat pendek, nada teman kos. Tombol menyebut aksinya ("Rute ke sini", "Perlebar ke 2 km").
- Tidak ada tanda pisah panjang, buzzword, klaim tanpa sumber, atau angka statistik karangan.
- Headline hero berima (lihat `PRD.md` 10.6.1).

---

## 13. Jangan lakukan

- Jangan memakai `--text-muted` di atas `--bg-hero` kuning.
- Jangan memakai `--telur` sebagai teks di atas merah di bawah 24 px (atau 18,66 px tebal).
- Jangan memberi bayangan lembut (blur). Semua bayangan keras tanpa blur.
- Jangan menambah badge ledakan atau bintang kilau di luar hero dan empty state.
- Jangan membuat semua elemen berbentuk pil. Pil hanya untuk chip filter.
- Jangan memakai `next/image` dengan optimasi untuk foto Google (`unoptimized` wajib, aturan cache Google). Foto hero milik sendiri boleh dioptimasi.
- Jangan menyalin nama, logo, maskot, atau teks dari referensi owner.
- Jangan menautkan halaman yang belum ada.

---

## 14. Verifikasi visual

Sebelum dinyatakan selesai:

1. Jalankan build produksi dan buka di 360×640, 390×844, 768×1024, 1440×900, tema terang dan gelap.
2. Ambil screenshot hero, area hasil (dengan data, kosong, memuat, error), detail, favorit kosong, MENU terbuka, bottom sheet terbuka.
3. Klik satu per satu semua kontrol dan catat hasilnya (antislop R-35), misal: "panah kanan → slide 2 Nasi Rames, live region terbaca", "Cari seblak di sekitar → hasil terisi, gulir ke #hasil".
4. Navigasi penuh dengan keyboard: Tab, Enter/Space, Escape, panah di carousel dan tab.
5. Cek tidak ada scroll horizontal (`document.documentElement.scrollWidth === innerWidth`).
6. Cek konsol bebas error.

Hasil akhir tergantung rendering browser dan font; klaim kesesuaian harus didukung screenshot, bukan teks ini saja.

---

## 15. Alasan keputusan (antislop R-31)

| Keputusan | Alasan satu baris |
|---|---|
| Merah cabai + kuning telur | Warna spanduk warung Indonesia, dipilih owner (arah "Sambal Segar"). |
| Latar hero kuning, hasil krem | Hero lantang menarik perhatian, area hasil tenang agar mudah dipindai. |
| Plus Jakarta Sans saja | Pilihan owner; satu keluarga membuat tampilan rapi dan hanya satu font yang dimuat. Nyaman untuk teks Bahasa Indonesia, angka jelas untuk harga dan jarak; bobot 800 kapital cukup lantang untuk headline. |
| Garis tinta + bayangan keras | Identitas pop komik dari referensi owner, sekaligus tanda bisa ditekan. |
| Takaran bayangan bertingkat | Hero paling lantang, kartu paling ringan agar daftar panjang tidak melelahkan. |
| Badge ledakan + stiker harga | Satu keluarga motif stiker; stiker harga juga penanda ada data harga. |
| Foto asli, bukan ilustrasi 3D | Keputusan owner; foto jujur menunjukkan makanan yang akan ditemukan. |
| Phosphor Bold | Garis tebal selaras dengan gaya garis tinta. |
| Logo dalam stiker krem | Warna oranye logo bertabrakan dengan merah header; stiker menjaga warna logo utuh dan menyatu dengan motif stiker. |
| Tema terang default | Konteks pemakaian siang hari di kampus; gelap tersedia lewat saklar. |
| Carousel tanpa putar otomatis | Pengguna yang mengendalikan; menghindari masalah aksesibilitas gerak otomatis. |
| Kolom cari di layar pertama HP | Tugas utama app adalah mencari; hero tidak boleh menghalanginya. |

---

## Changelog

- **1.2** (2 November 2026): font headline Archivo kondensed diganti Plus Jakarta Sans 800 (pilihan owner); semua teks satu keluarga font. Skala display diperkecil (bagian 3).
- **1.1** (2 November 2026): logo dari owner (6.7). Tulisan AYO MAKAN berhuruf Archivo diganti stiker logo; aset di `assets/brand/`.
- **1.0** (2 November 2026): versi pertama, disusun dari pilihan dan referensi owner.
