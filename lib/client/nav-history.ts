"use client";

/*
 * Apakah pengguna sudah berpindah halaman DI DALAM Ayo Makan pada sesi tab ini.
 * window.history.length tidak bisa dipakai: tautan bersama yang dibuka di tab yang sudah punya riwayat
 * (mis. dari aplikasi obrolan web) membuat tombol Kembali meninggalkan Ayo Makan.
 */
let navigatedInApp = false;

export const markNavigatedInApp = () => {
  navigatedInApp = true;
};
export const hasInAppHistory = () => navigatedInApp;
