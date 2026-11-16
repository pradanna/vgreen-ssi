# Agent Guidelines & Development Rules: V-Green SSI Platform

Dokumen ini mereferensikan panduan lengkap di [`AGENTS.md`](./AGENTS.md).

---

## 1. Aturan Wajib & Prinsip Utama (Core Directives)

### 🧠 1. Selalu Lakukan Brainstorming Sebelum Mengubah Kode
- **Dilarang langsung mengedit/membuat kode tanpa perencanaan.**
- Sebelum melakukan perubahan logika, arsitektur, atau UI:
  1. Identifikasi kebutuhan dan akar permasalahan (*root cause*).
  2. Sajikan opsi solusi beserta analisis trade-off (kelebihan, kekurangan, dan risiko/edge cases).
  3. Susun **Action Plan** yang terstruktur dan terukur.
  4. Diskusikan dan pastikan ada kesepakatan dengan user sebelum eksekusi perubahan besar.

### 🔍 2. Selalu Baca & Pahami Struktur Data yang Ada
- **Wajib menginspeksi struktur data riil sebelum menyentuh logika bisnis atau tampilan.**
- Area struktur data yang wajib diperiksa sebelum modifikasi:
  - **Database & Migrations**: Periksa skema tabel di `database/migrations/` dan seeders di `database/seeders/`.
  - **Models & Relationships**: Periksa definisi relasi Eloquent, fillable, casting, dan accessor di `app/Models/`.
  - **Inertia Props & Types**: Periksa TypeScript interfaces dan type definitions di `resources/js/types/` serta props yang dikirim dari controller ke view.
  - **Dokumentasi Spesifikasi**: Rujuk selalu spesifikasi domain di `docs/PRD.md` dan `docs/TECHNICAL_SPECIFICATION.md`.
- Jangan pernah mengasumsikan nama kolom, foreign key, atau tipe data tanpa melihat file aslinya.

### 🧩 3. Cek Komponen Serupa Sebelum Membuat Baru (Component Reusability & DRY)
- **Dilarang langsung membuat komponen UI baru sebelum memeriksa komponen yang sudah ada.**
- Selalu periksa folder `resources/js/Components/` terlebih dahulu.
- Utamakan menggunakan kembali (*reuse*) atau memperluas (*extend*) props komponen yang ada daripada membuat komponen duplikat baru.

### 🚫 4. Larangan Penggunaan Symlink (Shared Hosting Compatibility)
- **Dilarang keras menggunakan atau mengandalkan symlink (`php artisan storage:link`).**
- Platform disiapkan untuk **Shared Hosting** (cPanel/Apache/LiteSpeed).
- Saat upload berkas, simpan via Storage API (`Storage::disk('public')->put(...)`). Seluruh penyajian berkas wajib melalui **Controller Route Streaming** (`response()->file()`), bukan tautan fisik `public/storage`.

---

## 2. Alur Kerja Standar (Workflow Protocol)

1. **Investigasi Data & Kode Eksisting**: Baca skema, model, controller, dan tipe TypeScript terkait.
2. **Brainstorming Solusi**: Rumuskan opsi solusi, trade-off, dan pertimbangan performa/keamanan.
3. **Action Plan**: Paparkan urutan langkah kerja secara transparan.
4. **Implementasi & Verifikasi**: Terapkan perubahan sesuai aturan dan pastikan integrasi berjalan konsisten.

---
*Lihat panduan lengkap beserta diagram alur dan FE Design System di [`AGENTS.md`](./AGENTS.md).*
