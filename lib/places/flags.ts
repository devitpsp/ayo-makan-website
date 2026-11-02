/** Foto di kartu (hasil dan Favorit) hanya menyala bila LIST_PHOTOS=on (default mati, hemat kuota foto, PRD 9.1). */
export function listPhotosOn(): boolean {
  return process.env.LIST_PHOTOS === "on";
}
