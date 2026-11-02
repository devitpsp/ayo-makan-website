# API internal Ayo Makan

Semua endpoint: metode `GET`, respons JSON, `Cache-Control: no-store`. Semua memanggil Google Places API (New) dari server lewat `lib/places`, kunci tidak pernah dikirim ke browser. Konten Google tidak disimpan di server, CDN, maupun service worker.

Format error seragam:

```json
{ "error": { "code": "RATE_LIMITED", "message": "Terlalu banyak pencarian. Coba lagi 1 menit lagi." } }
```

| Kode | HTTP | Arti |
|---|---|---|
| `INVALID_PARAMS` | 400 | Parameter gagal validasi Zod. Pesan menyebut nama parameter. |
| `NOT_FOUND` | 404 | Tempat tidak ada lagi di Google. |
| `RATE_LIMITED` | 429 | Melebihi batas per IP. Header `Retry-After` berisi detik. |
| `UPSTREAM_QUOTA` | 503 | Batas bulanan internal per SKU tercapai, atau kuota Google/Redis tidak tersedia (gagal tertutup). |
| `UPSTREAM_ERROR` | 502 | Google error, timeout 8 detik, atau kunci belum diatur. Satu kali retry hanya untuk 5xx/jaringan. |

Batas per IP per 5 menit: `search` 60, `places/[id]` 60, `photo` 240 (`lib/ratelimit.ts`). Naik dari 20/30/120 karena Wi-Fi kampus berbagi satu IP; pengaman biaya utama adalah batas bulanan global per SKU. IP diambil dari `x-vercel-forwarded-for`, lalu `x-real-ip`, lalu entri pertama `x-forwarded-for`.

## `GET /api/places/search`

| Param | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `lat`, `lng` | number | ya | Pusat pencarian. Harus di dalam kotak batas Salatiga (`lib/places/geo.ts`). |
| `radius` | `500` `1000` `2000` `3000` | ya | Meter. |
| `cat` | `makanan` `minuman` `jajanan` | ya | Pemetaan tipe Google di `lib/places/categories.ts`. |
| `q` | string 2 sampai 60 | tidak | Kosong = mode jelajah (Nearby Search). Ada = Text Search. |
| `minRating` | `0` `4` `4.5` | tidak | Default `4`. |
| `openNow` | `1` | tidak | Hanya yang buka. |
| `murah` | `1` | tidak | Hanya `PRICE_LEVEL_INEXPENSIVE`. Tempat tanpa data harga ikut tersaring. |
| `pageToken` | string | tidak | Hanya bersama `q`. |

Respons 200:

```json
{
  "mode": "keyword",
  "places": [
    {
      "id": "ChIJ...", "name": "...", "lat": -7.3, "lng": 110.4, "distanceM": 450,
      "rating": 4.7, "ratingCount": 312,
      "priceLevel": "PRICE_LEVEL_INEXPENSIVE",
      "priceRange": { "start": 10000, "end": 25000, "currency": "IDR" },
      "openNow": true, "primaryType": "indonesian_restaurant",
      "photo": { "name": "places/ChIJ.../photos/AX...", "author": "...", "authorUri": "https://..." }
    }
  ],
  "nextPageToken": "...",
  "truncated": false
}
```

- `mode`: `keyword` atau `explore`.
- `photo` selalu `null` kecuali `LIST_PHOTOS=on`.
- `truncated`: Nearby Search penuh (20) sebelum disaring, ada kemungkinan hasil lain. UI menyarankan mengetik kata kunci.
- `nextPageToken`: hanya mode `keyword`.
- Radius ditegakkan ulang di server (haversine) karena Text Search hanya punya `locationBias`.

Field mask (`lib/places/fieldmasks.ts`): Text Search dan Nearby Search memakai mask berbeda karena `nextPageToken` hanya valid di Text Search. SKU: Text Search / Nearby Search **Enterprise**.

## `GET /api/places/[id]`

`id` harus cocok `^[A-Za-z0-9_-]{10,300}$`.

| Param | Keterangan |
|---|---|
| `lat`, `lng` | Opsional, berpasangan. Mengisi `distanceM`. UI menghitung jarak di klien dan tidak mengirimnya, supaya ganti lokasi tidak memicu panggilan berbayar. |
| `fields=card` | Varian ringkas untuk halaman Favorit, tanpa `reviews` dan jam mingguan. |

Respons: `Place` ditambah `primaryTypeLabel`, `address`, `photos` (maks 5), `weekdayDescriptions`, `googleMapsUri`, `directionsUri`, `writeReviewUri`, `reviews` (maks 5, tidak diubah, tidak disimpan).

SKU: penuh = Place Details **Enterprise + Atmosphere** (field `reviews`); `fields=card` = Place Details **Enterprise**.

## `GET /api/photo`

| Param | Keterangan |
|---|---|
| `name` | Dari `photo.name`. Harus cocok `^places/[A-Za-z0-9_-]+/photos/[A-Za-z0-9_-]+$` (mencegah dipakai sebagai proxy bebas). |
| `w` | `400` `800` `1200`. |

Respons `302` ke `photoUri` (host `googleusercontent.com` atau `ggpht.com`, selain itu ditolak), `Cache-Control: no-store`. SKU: Place Details **Photos**.

## Penjaga biaya (PRD 9.1)

Sebelum setiap panggilan ke Google, `reserveQuota(sku)` (`lib/quota.ts`) menaikkan penghitung Redis `quota:{sku}:{YYYY-MM}` dan menolak dengan `UPSTREAM_QUOTA` bila melebihi `MONTHLY_SKU_CAP`. Penghitung tetap terpakai walau Google gagal (konservatif). Tanpa Redis di production, semua permintaan ditolak.
