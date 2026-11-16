<?php

namespace Database\Seeders;

use App\Models\ProvinceTarget;
use Illuminate\Database\Seeder;

class ProvinceTargetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $targets = [
            // WILAYAH JAWA (Target ~1.273)
            ['province_name' => 'DKI Jakarta', 'region' => 'Jawa', 'year' => 2026, 'target_evcs' => 350, 'target_bss' => 150, 'notes' => 'Pusat komersial & koridor utama komuter'],
            ['province_name' => 'Jawa Barat', 'region' => 'Jawa', 'year' => 2026, 'target_evcs' => 260, 'target_bss' => 70, 'notes' => 'Rest area tol Trans Jawa, Bandung Raya, & Bodebek'],
            ['province_name' => 'Jawa Timur', 'region' => 'Jawa', 'year' => 2026, 'target_evcs' => 170, 'target_bss' => 50, 'notes' => 'Surabaya metropolitan & koridor tol timur'],
            ['province_name' => 'Jawa Tengah', 'region' => 'Jawa', 'year' => 2026, 'target_evcs' => 90, 'target_bss' => 25, 'notes' => 'Semarang, Solo, & rest area pantura'],
            ['province_name' => 'Banten', 'region' => 'Jawa', 'year' => 2026, 'target_evcs' => 55, 'target_bss' => 15, 'notes' => 'Tangerang raya & jalur pelabuhan Merak'],
            ['province_name' => 'D.I. Yogyakarta', 'region' => 'Jawa', 'year' => 2026, 'target_evcs' => 30, 'target_bss' => 8, 'notes' => 'Destinasi wisata & mobilitas urban'],

            // WILAYAH SUMATERA (Target ~505)
            ['province_name' => 'Sumatera Utara', 'region' => 'Sumatera', 'year' => 2026, 'target_evcs' => 120, 'target_bss' => 20, 'notes' => 'Medan & kawasan industri Belawan'],
            ['province_name' => 'Sumatera Selatan', 'region' => 'Sumatera', 'year' => 2026, 'target_evcs' => 65, 'target_bss' => 10, 'notes' => 'Palembang & tol Kayu Agung'],
            ['province_name' => 'Riau', 'region' => 'Sumatera', 'year' => 2026, 'target_evcs' => 55, 'target_bss' => 10, 'notes' => 'Pekanbaru & jalur lintas timur'],
            ['province_name' => 'Lampung', 'region' => 'Sumatera', 'year' => 2026, 'target_evcs' => 50, 'target_bss' => 10, 'notes' => 'Gerbang Trans Sumatera dari Bakauheni'],
            ['province_name' => 'Sumatera Barat', 'region' => 'Sumatera', 'year' => 2026, 'target_evcs' => 40, 'target_bss' => 10, 'notes' => 'Padang, Bukittinggi & pariwisata'],
            ['province_name' => 'Kepulauan Riau', 'region' => 'Sumatera', 'year' => 2026, 'target_evcs' => 40, 'target_bss' => 10, 'notes' => 'Batam & Bintan free trade zone'],
            ['province_name' => 'Aceh', 'region' => 'Sumatera', 'year' => 2026, 'target_evcs' => 25, 'target_bss' => 5, 'notes' => 'Banda Aceh & koridor barat'],
            ['province_name' => 'Jambi', 'region' => 'Sumatera', 'year' => 2026, 'target_evcs' => 15, 'target_bss' => 5, 'notes' => 'Kota Jambi & jalur logistik'],
            ['province_name' => 'Bengkulu', 'region' => 'Sumatera', 'year' => 2026, 'target_evcs' => 10, 'target_bss' => 5, 'notes' => 'Pesisir barat Sumatera'],

            // WILAYAH SULAWESI (Target ~120)
            ['province_name' => 'Sulawesi Selatan', 'region' => 'Sulawesi', 'year' => 2026, 'target_evcs' => 50, 'target_bss' => 10, 'notes' => 'Hub Indonesia Timur & Makassar Raya'],
            ['province_name' => 'Sulawesi Utara', 'region' => 'Sulawesi', 'year' => 2026, 'target_evcs' => 25, 'target_bss' => 5, 'notes' => 'Manado & pariwisata Likupang'],
            ['province_name' => 'Sulawesi Tengah', 'region' => 'Sulawesi', 'year' => 2026, 'target_evcs' => 15, 'target_bss' => 0, 'notes' => 'Palu & koridor industri'],
            ['province_name' => 'Sulawesi Tenggara', 'region' => 'Sulawesi', 'year' => 2026, 'target_evcs' => 15, 'target_bss' => 0, 'notes' => 'Kendari & kawasan nikel'],

            // WILAYAH BALI & NUSA TENGGARA (Target ~98)
            ['province_name' => 'Bali', 'region' => 'Bali-Nusra', 'year' => 2026, 'target_evcs' => 60, 'target_bss' => 18, 'notes' => 'Kawasan pariwisata internasional Kuta-Nusa Dua-Ubud'],
            ['province_name' => 'Nusa Tenggara Barat', 'region' => 'Bali-Nusra', 'year' => 2026, 'target_evcs' => 15, 'target_bss' => 0, 'notes' => 'Mandalika & Lombok'],
            ['province_name' => 'Nusa Tenggara Timur', 'region' => 'Bali-Nusra', 'year' => 2026, 'target_evcs' => 5, 'target_bss' => 0, 'notes' => 'Labuan Bajo premium tourism'],

            // WILAYAH KALIMANTAN (Target ~74)
            ['province_name' => 'Kalimantan Timur', 'region' => 'Kalimantan', 'year' => 2026, 'target_evcs' => 35, 'target_bss' => 5, 'notes' => 'Kawasan Ibu Kota Nusantara (IKN) & Balikpapan'],
            ['province_name' => 'Kalimantan Barat', 'region' => 'Kalimantan', 'year' => 2026, 'target_evcs' => 15, 'target_bss' => 0, 'notes' => 'Pontianak & koridor khatulistiwa'],
            ['province_name' => 'Kalimantan Selatan', 'region' => 'Kalimantan', 'year' => 2026, 'target_evcs' => 14, 'target_bss' => 0, 'notes' => 'Banjarmasin & Banjarbaru'],
            ['province_name' => 'Kalimantan Tengah', 'region' => 'Kalimantan', 'year' => 2026, 'target_evcs' => 5, 'target_bss' => 0, 'notes' => 'Palangka Raya'],

            // WILAYAH MALUKU & PAPUA
            ['province_name' => 'Papua', 'region' => 'Maluku-Papua', 'year' => 2026, 'target_evcs' => 15, 'target_bss' => 0, 'notes' => 'Kota Jayapura & Sentani'],
            ['province_name' => 'Maluku', 'region' => 'Maluku-Papua', 'year' => 2026, 'target_evcs' => 10, 'target_bss' => 0, 'notes' => 'Kota Ambon manise'],
        ];

        foreach ($targets as $data) {
            ProvinceTarget::updateOrCreate(
                [
                    'province_name' => $data['province_name'],
                    'year' => $data['year'],
                ],
                $data
            );
        }
    }
}
