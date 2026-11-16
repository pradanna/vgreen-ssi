# Frontend & UI/UX Design System Guide: Clean, Airy & Anti-AI Slop

> File ini juga tersinkronisasi sebagai Antigravity Skill resmi di [`.agents/skills/fe-design-system/SKILL.md`](../.agents/skills/fe-design-system/SKILL.md).

Panduan standar Frontend Engineering (FE) dan Desain UI/UX untuk menciptakan aplikasi web modern, profesional, dan nyaman dipandang dalam durasi lama tanpa kesan murahan (*AI Slop*).

---

## 1. Filosofi Desain: Mengeliminasi "AI Slop"

Desain bergaya *AI Slop* adalah antarmuka yang terkesan dibuat otomatis tanpa pemikiran manusia terhadap ergonomi visual. Hindari pola tersebut dengan aturan berikut:

### ❌ Yang Diharamkan (Ciri AI Slop):
1. **Gradien Neon Liar**: Memakai gradien cyan/ungu/pink menyala di seluruh border dan background tanpa fungsi informasi.
2. **Layout Sesak (Suffocating Space)**: Memberikan padding sempit (`p-2` atau `p-3`) pada kartu data penting sehingga elemen tampak berdesakan dan sulit dipindai.
3. **Kelelahan Retina (Eye-Fatigue Surfaces)**:
   - *White-out*: Background layar putih murni (`#FFFFFF`) 100% yang menyilaukan mata pengguna.
   - *Muddy Dark*: Mode gelap abu-abu kusam dengan kontras teks rendah yang membuat mata cepat lelah.
4. **Border Radius Tidak Konsisten**: Mencampur tombol kotak tajam dengan kartu lonjong tanpa hierarki sistemik.
5. **Dinding Angka (Wall of Numbers)**: Menumpuk puluhan angka mentah tanpa hierarki bobot (*typographic weight*) dan jeda visual.

###  Yang Diterapkan (Human-Crafted Professional Standard):
1. **Ruang Nafas Lega (*Breathing Room*)**: Setiap komponen data diberikan batas ruang (*negative space*) yang memadai agar otak pengguna dapat mencerna informasi secara rileks.
2. **Kanvas Sejuk & Kontras Seimbang**: Menggunakan kanvas dasar off-white sejuk (`#F7F9FC`) yang mengeliminasi silau, dipadukan kartu putih bersih (`#FFFFFF`) dengan kontras teks tajam (*accessible*).
3. **Aksen Berwarna Terarah**: Warna tajam hanya digunakan sebagai penanda fokus (*visual anchor*), seperti aksi aktif, status, atau komparasi metrik.
4. **Geometri Melengkung Halus**: Konsistensi sudut membulat modern (`rounded-3xl` / 24px) yang ramah di mata.

---

## 2. Sistem Spasi & Ruang Nafas (Spacing & Layout Rhythm)

Kunci utama agar aplikasi "bisa bernafas lega" adalah kedisiplinan margin dan padding:

### Skala Padding Komponen
- **Layar Luar / Container Utama**: `p-6` hingga `p-8` (24px – 32px).
- **Kartu Metrik & Panel (Card Padding)**: `p-6` hingga `p-7` (24px – 28px). Hindari kartu di bawah 20px kecuali untuk elemen mini.
- **Header Section**: `h-20` (80px), memberikan ruang vertikal yang lapang untuk judul dan kontrol navigasi.
- **Tabel Baris (Table Rows)**: Tinggi baris nyaman dengan `py-4` hingga `py-4.5` pada tiap cell.
- **Drawer / Slide-over**: `p-6` hingga `p-8` dengan pemisah section `space-y-6`.

### Skala Jarak Antar Elemen (Gestalt Rhythm)
- **Elemen Terkait Erat** (Label & Value): `gap-1` hingga `gap-1.5` (4px – 6px).
- **Grup Kontrol** (Buttons, Pills, Tabs): `gap-2` hingga `gap-3` (8px – 12px).
- **Grid Antar Kartu**: `gap-6` (24px).
- **Jarak Antar Section Utama**: `space-y-7` hingga `space-y-8` (28px – 32px).

---

## 3. Palet Warna Ergonomis & Anti-Kelelahan (Sinao Palette)

```css
/* Token Warna Utama */
--canvas-bg:       #F7F9FC; /* Off-white sejuk, mengeliminasi silau monitor */
--card-surface:    #FFFFFF; /* Permukaan kartu bersih */
--card-border:     #EDF1F7; /* Garis batas mikro lembut */
--card-shadow:     0 2px 12px 0 rgba(15, 23, 42, 0.03); /* Difusi bayangan alami */

/* Teks & Keterbacaan */
--text-primary:    #0F172A; /* Slate-900: Tegas, kontras rasio > 12:1 */
--text-body:       #475569; /* Slate-600: Nyaman untuk teks paragraf & sub-label */
--text-muted:      #94A3B8; /* Slate-400: Keterangan waktu, placeholder, unit */

/* Aksen Terarah (Fokus Visual) */
--brand-blue:      #2D60FF; /* Royal Blue: State aktif, tombol CTA, grafik utama */
--brand-blue-hover:#204FDE;
--brand-blue-soft: #EEF4FF; /* Tint latar belakang tombol / badge aktif */

--accent-coral:    #FF7A00; /* Tangerine/Coral: Komparasi nilai terendah & highlight */
--accent-purple:   #4E5BA6; /* Sinao Badge: Indikator counter notifikasi */

/* Status Operasional */
--status-green:    #10B981; /* bg: #ECFDF5, border: #A7F3D0, text: #047857 */
--status-orange:   #F97316; /* bg: #FFF7ED, border: #FED7AA, text: #C2410C */
--status-amber:    #F59E0B; /* bg: #FFFBEB, border: #FDE68A, text: #B45309 */
--status-rose:     #F43F5E; /* bg: #FFF1F2, border: #FECDD3, text: #BE123C */
```

---

## 4. Tipografi & Font Style (`Plus Jakarta Sans`)

Aplikasi menggunakan font keluarga **Plus Jakarta Sans** untuk tampilan modern, geometris, dan memiliki keterbacaan tinggi:

### Konfigurasi Font
Impor di file HTML/Blade:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
```

Aturan Hirarki Tipografi:
1. **Page Title**: `text-2xl font-extrabold tracking-tight text-slate-900`
2. **Card Headline**: `text-base font-bold tracking-tight text-slate-900`
3. **Hero Metrics / Angka Besar**: `text-3xl font-extrabold tracking-tight text-slate-900`
4. **Metrik Sub-badge (Tren)**: `text-[11px] font-bold px-2 py-0.5 rounded-full` (contoh: `-10%` atau `+13.4%`)
5. **Labels / Sub-header**: `text-xs font-semibold text-slate-400`
6. **Body / Nilai Tabel**: `text-xs font-medium text-slate-800`

---

## 5. Pola Komponen Standar

### A. Kartu Metrik (Metric Card)
- Wadah: `bg-white rounded-3xl p-6 border border-[#EDF1F7] shadow-card flex flex-col justify-between`
- Berisi judul metrik (`text-xs font-semibold text-slate-400`), angka raksasa (`text-3xl font-extrabold`), dan badge status persentase.
- Baris visual: Dilengkapi progress bar horizontal dengan warna `#2D60FF` dan `#FF7A00`, atau baris lingkaran streak harian (`aspect-square rounded-full bg-[#2D60FF] text-white`).

### B. Bar Chart dengan Tekstur Garis Diagonal
Untuk batang grafik bulanan, gunakan utility CSS garis diagonal (*striped pattern*) agar grafik memiliki karakter visual tanpa terlihat murahan:
```css
.bg-striped-subtle {
    background-color: #F3F4F8;
    background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 5px,
        rgba(0, 0, 0, 0.03) 5px,
        rgba(0, 0, 0, 0.03) 10px
    );
}

.bg-striped-blue {
    background-color: #2D60FF;
    background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 6px,
        rgba(255, 255, 255, 0.12) 6px,
        rgba(255, 255, 255, 0.12) 12px
    );
}
```

### C. Search Bar Berbentuk Kapsul (*Pill Input*)
- Wadah input: `w-full bg-white border border-[#E8ECF2] rounded-full pl-11 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 shadow-subtle focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 transition`
- Ikon pencarian diletakkan di sisi kiri absolut dengan warna `text-slate-400`.

### D. Sidebar Navigasi Kiri
- Lebar tetap: `w-64 bg-white border-r border-[#EDF1F7] flex flex-col shrink-0`
- Tombol navigasi aktif: `bg-[#F4F5F8] text-slate-900 font-semibold rounded-2xl px-4 py-3 shadow-subtle`
- Tombol tidak aktif: `text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium rounded-2xl px-4 py-3`
- Badge jumlah pesan: `bg-[#4E5BA6] text-white text-[11px] font-bold px-2 py-0.5 rounded-full`

### E. Floating Action Banner (Toast)
- Posisi: `absolute bottom-6 left-1/2 -translate-x-1/2 z-30 max-w-xl w-[90%]`
- Bentuk: `bg-white border border-[#EDF1F7] rounded-full py-2.5 px-5 shadow-[0_12px_32px_rgba(15,23,42,0.12)] flex items-center justify-between gap-4`
- Tombol aksi: `rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 text-xs font-bold px-4 py-1.5`

---

## 6. Checklist Verifikasi Sebelum Rilis Frontend

Sebelum menyelesaikan pekerjaan FE/Desain, pastikan:
- [ ] Tidak ada background putih menyilaukan `#FFFFFF` yang membentang tanpa jeda kanvas `#F7F9FC`.
- [ ] Semua kartu data utama menggunakan padding minimal `p-6` (24px).
- [ ] Jarak antar kartu minimal `gap-6` (24px).
- [ ] Font keluarga telah mengadopsi `Plus Jakarta Sans` dengan hirarki bobot tegas (800 / 700 / 600 / 500).
- [ ] Warna teks utama memiliki kontras tajam (`#0F172A`), bukan abu-abu pudar.
- [ ] Tombol dan badge memiliki interaksi halus (*hover state* & *active scale*).
- [ ] Tidak ada error build pada `tsc && vite build`.
