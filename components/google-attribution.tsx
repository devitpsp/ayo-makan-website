/*
 * Atribusi Google Maps (PRD F-14). Memakai fallback teks resmi (Roboto 400, #5E5E5E, translate="no")
 * sampai logo Google Maps resmi diunduh dari halaman atribusi Google dan dipasang di sini.
 * TODO: ganti dengan aset logo (tinggi 16-19 dp, ruang kosong >=10 dp kiri/kanan/atas, >=5 dp bawah).
 */
export function GoogleAttribution({ className = "" }: { className?: string }) {
  return (
    <p className={`px-[10px] pt-[10px] pb-[5px] ${className}`}>
      <span className="gm-attr" translate="no" aria-label="Google Maps">
        Google Maps
      </span>
    </p>
  );
}
