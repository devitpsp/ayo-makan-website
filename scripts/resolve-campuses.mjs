// Sekali jalan: tanya Google Places lokasi dan place_id tiga kampus UIN Salatiga.
// Memakai 3 panggilan Text Search dari kuota gratis. Hasilnya SARAN: owner memeriksa
// di Google Maps lalu menyalin ke config/campuses.ts.
//
// Pakai: node --env-file=.env.local scripts/resolve-campuses.mjs

const key = process.env.GOOGLE_MAPS_API_KEY;
if (!key) {
  console.error("GOOGLE_MAPS_API_KEY belum diatur (lihat .env.example).");
  process.exit(1);
}

const QUERIES = [
  ["kampus-3", "UIN Salatiga Kampus 3 Pulutan, Jl. Lingkar Salatiga Km. 2, Salatiga"],
  ["kampus-1", "UIN Salatiga Kampus 1, Jl. Tentara Pelajar No. 2, Salatiga"],
  ["kampus-2", "UIN Salatiga Kampus 2, Jl. Nakula Sadewa V No. 9, Salatiga"],
];

for (const [id, textQuery] of QUERIES) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.formattedAddress",
    },
    body: JSON.stringify({ textQuery, languageCode: "id", regionCode: "ID", pageSize: 1 }),
  });
  if (!res.ok) {
    console.error(id, "gagal:", res.status, (await res.text()).slice(0, 200));
    continue;
  }
  const p = (await res.json()).places?.[0];
  if (!p) {
    console.log(id, "tidak ditemukan");
    continue;
  }
  console.log(
    `${id}: ${p.displayName?.text} | lat ${p.location.latitude}, lng ${p.location.longitude} | placeId ${p.id}\n   ${p.formattedAddress}`,
  );
}
