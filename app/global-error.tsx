"use client";

// Galat di layout akar: CSS aplikasi mungkin belum termuat, jadi gaya ditulis inline.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", background: "#FFF7E8", color: "#1C1410", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 16 }}>
        <div role="alert">
          <h1 style={{ fontSize: 24, margin: "0 0 8px" }}>Ada yang salah di Ayo Makan.</h1>
          <p style={{ margin: "0 0 16px" }}>Ini bukan salah kamu. Coba muat ulang.</p>
          <button type="button" onClick={() => reset()} style={{ minHeight: 44, padding: "0 20px", border: "2px solid #1C1410", borderRadius: 10, background: "#B3261E", color: "#fff", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>
            Coba lagi
          </button>
        </div>
      </body>
    </html>
  );
}
