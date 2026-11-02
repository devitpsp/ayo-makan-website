import Link from "next/link";

/**
 * Logo owner (DESIGN v2 6.7): tampil utuh tanpa garis, bayangan, atau rotasi.
 * Bidang krem kecil di belakangnya menjaga pin oranye tetap terlihat di atas latar oranye hero.
 * "full": logo penuh (tinggi diatur lewat className). "mark": pin saja di lingkaran 44px, untuk header melekat.
 */
export function Logo({ variant, className = "" }: { variant: "full" | "mark"; className?: string }) {
  if (variant === "mark") {
    return (
      <Link href="/" aria-label="Ayo Makan, ke beranda" className={`logo-badge logo-badge-mark ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-mark.webp" alt="" width={128} height={111} />
      </Link>
    );
  }
  return (
    <Link href="/" aria-label="Ayo Makan, ke beranda" className={`logo-badge logo-badge-full ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-full.webp" alt="" width={360} height={319} fetchPriority="high" />
    </Link>
  );
}
