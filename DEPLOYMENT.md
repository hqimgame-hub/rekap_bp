# Panduan Deployment ke Vercel

Berikut adalah langkah-langkah untuk menghubungkan repository GitHub ini ke Vercel agar aplikasi bisa online.

## 1. Persiapan
Pastikan Anda memiliki:
- Akun [Vercel](https://vercel.com)
- Akun GitHub (yang sudah terhubung dengan repository `hqimgame-hub/rekap_bp`)
- File `.env.local` di komputer Anda (berisi kunci rahasia Supabase).

## 2. Hubungkan ke Vercel
1. Masuk ke Dashboard Vercel.
2. Klik tombol **"Add New..."** lalu pilih **"Project"**.
3. Di bagian "Import Git Repository", pilih **GitHub**.
4. Cari repository **`rekap_bp`** milik akun `hqimgame-hub`.
5. Klik tombol **Import**.

## 3. Konfigurasi Project (PENTING!)
Sebelum klik Deploy, Anda **WAJIB** memasukkan Environment Variables agar aplikasi bisa terhubung ke database Supabase.

1. Di halaman konfigurasi "Configure Project", buka bagian **Environment Variables**.
2. Buka file `.env.local` di komputer Anda (VS Code).
3. Salin (Copy) **SEMUA** isi file `.env.local`.
4. Paste ke kolom Environment Variables di Vercel.
   - *Tips: Vercel biasanya cukup pintar untuk mendeteksi key-value jika Anda paste sekaligus, atau masukkan satu per satu.*
   - Pastikan variabel berikut ada:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `POSTGRES_URL` (jika pakai Prisma)
     - `POSTGRES_URL_NON_POOLING` (jika pakai Prisma)
     - Variabel lain yang ada di `.env.local` Anda.

## 4. Deploy
1. Jangan ubah pengaturan "Build and Output Settings" (biarkan default Next.js).
2. Klik tombol **Deploy**.
3. Tunggu proses build (sekitar 1-2 menit).
4. Jika berhasil, tampilan "Congratulations!" akan muncul.

## 5. Cek Hasil
Klik screenshot aplikasi untuk membuka URL produksi Anda (biasanya `rekap-bp.vercel.app`).
Coba buka halaman Scan untuk melihat perbedaannya (seharusnya jauh lebih cepat daripada localhost).
