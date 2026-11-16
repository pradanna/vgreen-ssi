<?php

namespace Database\Seeders;

use App\Models\ApprovalStatus;
use App\Models\FacilityType;
use App\Models\InspectionPhoto;
use App\Models\InspectionReport;
use App\Models\Machine;
use App\Models\Station;
use App\Models\StationDocument;
use App\Models\StationMachine;
use App\Models\StationStatus;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StationSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ensure master machines and users exist
        if (Machine::count() === 0) {
            $this->call(MachineMasterSeeder::class);
        }
        if (User::count() === 0) {
            $this->call(UserSeeder::class);
        }

        $admin = User::where('role_id', 'ADMIN_SSI')->first() ?? User::first();
        $vendor = User::where('role_id', 'FIELD_VENDOR')->first() ?? User::first();
        $construction = User::where('role_id', 'CONSTRUCTION_TEAM')->first() ?? User::first();

        $mVF60 = Machine::where('code', 'VF-DC-60KW')->first();
        $mVF30 = Machine::where('code', 'VF-DC-30KW')->first();
        $mVF20 = Machine::where('code', 'VF-DC-20KW')->first();
        $mBSS12 = Machine::where('code', 'VG-BSS-12S')->first();
        $mBSS6 = Machine::where('code', 'VG-BSS-6S')->first();

        // 2. Clean up previous station relational data safely across MySQL, SQLite, and PostgreSQL
        $driver = DB::getDriverName();
        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');
        }

        InspectionPhoto::truncate();
        InspectionReport::truncate();
        StationDocument::truncate();
        StationMachine::truncate();
        Station::truncate();

        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON;');
        }

        // Standard 7 mock photo angles
        $mockPhotoSamples = [
            'LAHAN_DEPAN' => 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
            'LAHAN_SAMPING' => 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80',
            'LAHAN_AKSES' => 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
            'MESIN_DEPAN' => 'https://images.unsplash.com/photo-1558441719-570b3d700f9b?auto=format&fit=crop&w=800&q=80',
            'MESIN_BELAKANG' => 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80',
            'PANEL_DEPAN' => 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
            'PANEL_BELAKANG' => 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        ];

        // 3. Showcase stations (The original 15 curated high-detail stations)
        $showcaseStations = [
            [
                'code' => 'VG-JKT-001',
                'name' => 'V-Green Hub SCBD Sudirman',
                'facility_type_id' => FacilityType::EVCS,
                'status_id' => StationStatus::OPERATIONAL,
                'latitude' => -6.2255,
                'longitude' => 106.8095,
                'address' => 'Jl. Jend. Sudirman Kav. 52-53, Senayan, Kebayoran Baru',
                'city' => 'Jakarta Selatan',
                'province' => 'DKI Jakarta',
                'power_capacity_kw' => 120,
                'socket_types' => '2x CCS2 Fast Gun (60kW/gun)',
                'slot_count' => 2,
                'operational_hours' => '24 Jam',
                'amenities' => ['Parkir VIP', 'Kafe', 'ATM Center', 'Security 24 Jam', 'Toilet'],
                'survey_date' => '2026-05-10',
                'construction_start_date' => '2026-06-01',
                'target_completion_date' => '2026-07-15',
                'commissioning_date' => '2026-07-20',
                'vendor_name' => 'PT Mitra Elektrik Nusantara',
                'pln_meter_id' => 'PLN-JKT-554129',
                'internal_notes' => 'Lokasi strategis high traffic. Gardu trafo dedicated 150 kVA.',
                'lease_end_date' => '2028-10-15',
                'landlord_name' => 'PT Danayasa Arthatama (SCBD)',
                'vgreen_contract_end_date' => '2027-01-20',
            ],
            [
                'code' => 'VG-JKT-002',
                'name' => 'V-Green Integrated Hub Rest Area Jagorawi KM 10',
                'facility_type_id' => FacilityType::COMBINED,
                'status_id' => StationStatus::OPERATIONAL,
                'latitude' => -6.3475,
                'longitude' => 106.8833,
                'address' => 'Rest Area KM 10 Tol Jagorawi arah Bogor',
                'city' => 'Jakarta Timur',
                'province' => 'DKI Jakarta',
                'power_capacity_kw' => 180,
                'socket_types' => '2x CCS2 DC Fast (120kW) + 8-Slot BSS Motor Cabinet',
                'slot_count' => 10,
                'operational_hours' => '24 Jam',
                'amenities' => ['Rest Area', 'Toilet', 'Musholla', 'Minimarket', 'Food Court'],
                'survey_date' => '2026-03-10',
                'construction_start_date' => '2026-04-01',
                'target_completion_date' => '2026-05-10',
                'commissioning_date' => '2026-05-15',
                'vendor_name' => 'PT Konstruksi Jaya Utama',
                'pln_meter_id' => 'PLN-JGW-889120',
                'internal_notes' => 'Hub favorit komuter Jakarta-Bogor. Integrasi mobil & motor sangat lancar.',
                'lease_end_date' => '2026-12-04',
                'landlord_name' => 'PT Jasa Marga Related Business',
            ],
            [
                'code' => 'VG-JBR-001',
                'name' => 'V-Green Ultra-Fast Station Rest Area KM 57 Cikampek',
                'facility_type_id' => FacilityType::EVCS,
                'status_id' => StationStatus::OPERATIONAL,
                'latitude' => -6.3725,
                'longitude' => 107.2842,
                'address' => 'Rest Area KM 57 Tol Jakarta-Cikampek',
                'city' => 'Karawang',
                'province' => 'Jawa Barat',
                'power_capacity_kw' => 200,
                'socket_types' => '4x CCS2 Ultra-Fast Gun (50-200kW dinamis)',
                'slot_count' => 4,
                'operational_hours' => '24 Jam',
                'amenities' => ['Rest Area Premium', 'Starbucks', 'Musholla Besar', 'Toilet Eksekutif', 'Bengkel'],
                'survey_date' => '2026-01-15',
                'construction_start_date' => '2026-02-01',
                'target_completion_date' => '2026-03-15',
                'commissioning_date' => '2026-03-22',
                'vendor_name' => 'PT Mitra Elektrik Nusantara',
                'pln_meter_id' => 'PLN-KRW-990142',
                'internal_notes' => 'Paling padat saat arus mudik/liburan. Didukung baterai buffer BESS.',
            ],
            [
                'code' => 'VG-BDG-001',
                'name' => 'V-Green Swap Station Dago Heritage',
                'facility_type_id' => FacilityType::BSS,
                'status_id' => StationStatus::OPERATIONAL,
                'latitude' => -6.8850,
                'longitude' => 107.6136,
                'address' => 'Jl. Ir. H. Juanda No. 128, Dago',
                'city' => 'Bandung',
                'province' => 'Jawa Barat',
                'power_capacity_kw' => 25,
                'socket_types' => '12-Slot BSS Automatic Swapping Cabinet',
                'slot_count' => 12,
                'operational_hours' => '24 Jam',
                'amenities' => ['Kafe', 'Minimarket', 'Wifi Gratis', 'Shelter Ojol'],
                'survey_date' => '2026-06-15',
                'construction_start_date' => '2026-07-01',
                'target_completion_date' => '2026-08-20',
                'commissioning_date' => '2026-08-25',
                'vendor_name' => 'PT Mitra Elektrik Nusantara',
                'pln_meter_id' => 'PLN-BDG-441290',
                'internal_notes' => 'Khusus motor listrik, titik kumpul driver delivery & anak muda Bandung.',
                'lease_end_date' => '2027-01-08',
                'landlord_name' => 'Pengelola Heritage Dago Walk',
            ],
            [
                'code' => 'VG-BDG-002',
                'name' => 'V-Green Station Rest Area KM 149 Tol Padaleunyi',
                'facility_type_id' => FacilityType::EVCS,
                'status_id' => StationStatus::CONSTRUCTION,
                'latitude' => -6.9532,
                'longitude' => 107.6980,
                'address' => 'Rest Area KM 149 Tol Purbaleunyi, Gedebage',
                'city' => 'Bandung',
                'province' => 'Jawa Barat',
                'power_capacity_kw' => 120,
                'socket_types' => '2x CCS2 (60kW) + 1x Type 2 AC (22kW)',
                'slot_count' => 3,
                'operational_hours' => '24 Jam',
                'amenities' => ['Rest Area', 'Toilet', 'Musholla'],
                'survey_date' => '2026-09-01',
                'construction_start_date' => '2026-10-01',
                'target_completion_date' => '2026-11-30',
                'vendor_name' => 'PT Konstruksi Jaya Utama',
                'pln_meter_id' => 'PLN-GDB-330112',
                'internal_notes' => 'Pondasi kanopi 80% selesai. Menunggu sambungan kabel tegangan menengah dari PLN.',
            ],
            [
                'code' => 'VG-CPL-001',
                'name' => 'V-Green Combined Hub Rest Area KM 102 Tol Cipali',
                'facility_type_id' => FacilityType::COMBINED,
                'status_id' => StationStatus::OPERATIONAL,
                'latitude' => -6.5050,
                'longitude' => 107.7200,
                'address' => 'Rest Area KM 102A Tol Cipali, Subang',
                'city' => 'Subang',
                'province' => 'Jawa Barat',
                'power_capacity_kw' => 150,
                'socket_types' => '2x CCS2 DC Fast (100kW) + 8-Slot BSS Motor',
                'slot_count' => 10,
                'operational_hours' => '24 Jam',
                'amenities' => ['Rest Area', 'KFC', 'Masjid', 'SPBU', 'Toilet'],
                'survey_date' => '2026-01-05',
                'construction_start_date' => '2026-01-25',
                'target_completion_date' => '2026-02-25',
                'commissioning_date' => '2026-02-28',
                'vendor_name' => 'PT Mitra Elektrik Nusantara',
                'pln_meter_id' => 'PLN-SBG-771239',
                'internal_notes' => 'Koridor utama Tol Trans Jawa. Daya sangat stabil.',
            ],
            [
                'code' => 'VG-SMG-001',
                'name' => 'V-Green Station Simpang Lima Semarang',
                'facility_type_id' => FacilityType::EVCS,
                'status_id' => StationStatus::OPERATIONAL,
                'latitude' => -6.9925,
                'longitude' => 110.4208,
                'address' => 'Area Parkir Mall Ciputra Simpang Lima',
                'city' => 'Semarang',
                'province' => 'Jawa Tengah',
                'power_capacity_kw' => 60,
                'socket_types' => '2x CCS2 DC Fast (30kW/gun)',
                'slot_count' => 2,
                'operational_hours' => '10:00 - 22:00',
                'amenities' => ['Mall', 'Food Court', 'Toilet', 'Cinema'],
                'survey_date' => '2026-07-15',
                'construction_start_date' => '2026-08-01',
                'target_completion_date' => '2026-09-15',
                'commissioning_date' => '2026-09-28',
                'vendor_name' => 'PT Mitra Elektrik Nusantara',
                'pln_meter_id' => 'PLN-SMG-110294',
                'internal_notes' => 'Pusat kota Semarang, okupansi tinggi saat weekend.',
            ],
            [
                'code' => 'VG-BTG-001',
                'name' => 'V-Green Hub Rest Area KM 379A Batang-Semarang',
                'facility_type_id' => FacilityType::COMBINED,
                'status_id' => StationStatus::CONSTRUCTION,
                'latitude' => -6.9740,
                'longitude' => 109.9500,
                'address' => 'Rest Area KM 379A Tol Batang-Semarang',
                'city' => 'Batang',
                'province' => 'Jawa Tengah',
                'power_capacity_kw' => 120,
                'socket_types' => '2x CCS2 (60kW) + 8-Slot BSS Motor',
                'slot_count' => 10,
                'operational_hours' => '24 Jam',
                'amenities' => ['Rest Area', 'Toilet', 'Masjid', 'Restoran'],
                'survey_date' => '2026-08-20',
                'construction_start_date' => '2026-09-15',
                'target_completion_date' => '2026-11-20',
                'vendor_name' => 'PT Konstruksi Jaya Utama',
                'pln_meter_id' => 'PLN-BTG-991201',
                'internal_notes' => 'Progres fisik 65%. Tiang dan panel utama sudah terpasang.',
            ],
            [
                'code' => 'VG-YOG-001',
                'name' => 'V-Green BSS Malioboro Heritage',
                'facility_type_id' => FacilityType::BSS,
                'status_id' => StationStatus::OPERATIONAL,
                'latitude' => -7.7928,
                'longitude' => 110.3658,
                'address' => 'Jl. Malioboro No. 45, Danurejan',
                'city' => 'Yogyakarta',
                'province' => 'D.I. Yogyakarta',
                'power_capacity_kw' => 30,
                'socket_types' => '16-Slot BSS Dual Swapping Cabinet',
                'slot_count' => 16,
                'operational_hours' => '24 Jam',
                'amenities' => ['Kawasan Wisata', 'Pusat Oleh-oleh', 'Wifi Jogja'],
                'survey_date' => '2026-04-10',
                'construction_start_date' => '2026-05-01',
                'target_completion_date' => '2026-06-10',
                'commissioning_date' => '2026-06-12',
                'vendor_name' => 'PT Mitra Elektrik Nusantara',
                'pln_meter_id' => 'PLN-YOG-667120',
                'internal_notes' => 'Tingkat swap harian tertinggi di DIY.',
            ],
            [
                'code' => 'VG-SBY-001',
                'name' => 'V-Green Fast Station Grand City Surabaya',
                'facility_type_id' => FacilityType::EVCS,
                'status_id' => StationStatus::OPERATIONAL,
                'latitude' => -7.2655,
                'longitude' => 112.7518,
                'address' => 'Jl. Walikota Mustajab No. 1, Ketabang, Genteng',
                'city' => 'Surabaya',
                'province' => 'Jawa Timur',
                'power_capacity_kw' => 120,
                'socket_types' => '2x CCS2 DC Fast (60kW/gun)',
                'slot_count' => 2,
                'operational_hours' => '24 Jam',
                'amenities' => ['Mall', 'Exhibition Hall', 'Security', 'Restoran'],
                'survey_date' => '2026-02-15',
                'construction_start_date' => '2026-03-01',
                'target_completion_date' => '2026-04-15',
                'commissioning_date' => '2026-04-20',
                'vendor_name' => 'PT Mitra Elektrik Nusantara',
                'pln_meter_id' => 'PLN-SBY-882190',
                'internal_notes' => 'Pusat bisnis Surabaya timur.',
            ],
            [
                'code' => 'VG-SBY-002',
                'name' => 'V-Green Hub Rest Area KM 726 Tol Trans Jawa',
                'facility_type_id' => FacilityType::COMBINED,
                'status_id' => StationStatus::SURVEYED,
                'latitude' => -7.3820,
                'longitude' => 112.6050,
                'address' => 'Rest Area KM 726B Tol Surabaya-Mojokerto',
                'city' => 'Gresik',
                'province' => 'Jawa Timur',
                'power_capacity_kw' => 150,
                'socket_types' => '2x CCS2 (75kW) + 8-Slot BSS Motor',
                'slot_count' => 10,
                'operational_hours' => '24 Jam',
                'amenities' => ['Rest Area', 'Toilet', 'Musholla', 'Minimarket'],
                'survey_date' => '2026-10-15',
                'target_completion_date' => '2026-12-25',
                'vendor_name' => 'PT Mitra Elektrik Nusantara',
                'internal_notes' => 'Survei awal menunjukkan lahan siap pakai 40m². Jarak ke gardu trafo 15 meter.',
            ],
            [
                'code' => 'VG-DPS-001',
                'name' => 'V-Green Eco-Hub Sunset Road Kuta',
                'facility_type_id' => FacilityType::COMBINED,
                'status_id' => StationStatus::OPERATIONAL,
                'latitude' => -8.7050,
                'longitude' => 115.1950,
                'address' => 'Jl. Sunset Road No. 88, Kuta',
                'city' => 'Badung',
                'province' => 'Bali',
                'power_capacity_kw' => 120,
                'socket_types' => '2x CCS2 (60kW) + 12-Slot BSS Motor',
                'slot_count' => 14,
                'operational_hours' => '24 Jam',
                'amenities' => ['Kafe Organik', 'Restroom', 'Rental EV', 'Co-working'],
                'survey_date' => '2026-01-05',
                'construction_start_date' => '2026-01-20',
                'target_completion_date' => '2026-02-10',
                'commissioning_date' => '2026-02-15',
                'vendor_name' => 'PT Mitra Elektrik Nusantara',
                'pln_meter_id' => 'PLN-DPS-334120',
                'internal_notes' => 'Kawasan wisata premium. Banyak mobil & motor listrik turis.',
            ],
            [
                'code' => 'VG-DPS-002',
                'name' => 'V-Green Ultra Hub ITDC Nusa Dua',
                'facility_type_id' => FacilityType::EVCS,
                'status_id' => StationStatus::OPERATIONAL,
                'latitude' => -8.8020,
                'longitude' => 115.2280,
                'address' => 'Kawasan Pariwisata ITDC Lot NW-1, Nusa Dua',
                'city' => 'Badung',
                'province' => 'Bali',
                'power_capacity_kw' => 150,
                'socket_types' => '2x CCS2 Ultra-Fast Gun',
                'slot_count' => 2,
                'operational_hours' => '24 Jam',
                'amenities' => ['Resort Area', 'Hotel', 'Convention Center', 'Security'],
                'survey_date' => '2025-12-10',
                'construction_start_date' => '2026-01-02',
                'target_completion_date' => '2026-01-15',
                'commissioning_date' => '2026-01-20',
                'vendor_name' => 'PT Mitra Elektrik Nusantara',
                'pln_meter_id' => 'PLN-NSD-119820',
                'internal_notes' => 'Lokasi KTT & event internasional. Standar keandalan tertinggi.',
                'lease_end_date' => '2028-07-20',
                'landlord_name' => 'PT Pengembangan Pariwisata Indonesia (ITDC)',
            ],
            [
                'code' => 'VG-MDN-001',
                'name' => 'V-Green Station Merdeka Walk Medan',
                'facility_type_id' => FacilityType::EVCS,
                'status_id' => StationStatus::CONSTRUCTION,
                'latitude' => 3.5952,
                'longitude' => 98.6722,
                'address' => 'Jl. Balai Kota, Kesawan, Medan Barat',
                'city' => 'Medan',
                'province' => 'Sumatera Utara',
                'power_capacity_kw' => 60,
                'socket_types' => '2x CCS2 (30kW/gun)',
                'slot_count' => 2,
                'operational_hours' => '24 Jam',
                'amenities' => ['Pusat Kuliner', 'Taman Kota', 'Parkir Luas'],
                'survey_date' => '2026-09-15',
                'construction_start_date' => '2026-10-10',
                'target_completion_date' => '2026-12-15',
                'vendor_name' => 'PT Konstruksi Jaya Utama',
                'pln_meter_id' => 'PLN-MDN-774120',
                'internal_notes' => 'Konstruksi sipil 50%. Pemasangan kanopi pelindung hujan.',
            ],
            [
                'code' => 'VG-BKS-001',
                'name' => 'V-Green Swap Summarecon Bekasi',
                'facility_type_id' => FacilityType::BSS,
                'status_id' => StationStatus::ON_HOLD,
                'latitude' => -6.2230,
                'longitude' => 106.9990,
                'address' => 'Jl. Bulevar Ahmad Yani, Summarecon',
                'city' => 'Bekasi',
                'province' => 'Jawa Barat',
                'power_capacity_kw' => 25,
                'socket_types' => '8-Slot BSS Cabinet',
                'slot_count' => 8,
                'operational_hours' => '24 Jam',
                'amenities' => ['Mall', 'Minimarket'],
                'survey_date' => '2026-08-01',
                'target_completion_date' => '2026-12-31',
                'vendor_name' => 'PT Mitra Elektrik Nusantara',
                'internal_notes' => 'Menunggu revisi izin penempatan dari pengelola kawasan & pergeseran tiang PLN 5 meter.',
            ],
        ];

        // 4. Complete Geo-Distribution Anchors for ALL 28 Provinces in m_province_targets (Total target 430 stations)
        $provinceConfigs = [
            'DKI Jakarta' => [
                'quota' => 70,
                'cities' => [
                    ['name' => 'Jakarta Selatan', 'code' => 'JKT', 'lat' => -6.2615, 'lng' => 106.8106],
                    ['name' => 'Jakarta Pusat', 'code' => 'JKT', 'lat' => -6.1805, 'lng' => 106.8284],
                    ['name' => 'Jakarta Barat', 'code' => 'JKT', 'lat' => -6.1674, 'lng' => 106.7637],
                    ['name' => 'Jakarta Timur', 'code' => 'JKT', 'lat' => -6.2250, 'lng' => 106.9004],
                    ['name' => 'Jakarta Utara', 'code' => 'JKT', 'lat' => -6.1384, 'lng' => 106.8640],
                ],
                'streets' => ['Jl. Sudirman', 'Jl. Gatot Subroto', 'Jl. Rasuna Said', 'Jl. TB Simatupang', 'Jl. M.H. Thamrin', 'Jl. Panjang', 'Jl. Pemuda', 'Jl. Boulevard Kelapa Gading', 'Jl. Casablanca', 'Jl. Fatmawati', 'Jl. Kemang Raya', 'Jl. Hayam Wuruk'],
                'hubs' => ['SCBD', 'Mega Kuningan', 'Pondok Indah', 'Kelapa Gading', 'Pluit', 'Senayan', 'Menteng', 'Cilandak', 'Tanjung Priok', 'Pasar Minggu', 'Cawang', 'Puri Indah'],
            ],
            'Jawa Barat' => [
                'quota' => 60,
                'cities' => [
                    ['name' => 'Bandung', 'code' => 'BDG', 'lat' => -6.9175, 'lng' => 107.6191],
                    ['name' => 'Bekasi', 'code' => 'BKS', 'lat' => -6.2383, 'lng' => 106.9756],
                    ['name' => 'Bogor', 'code' => 'BGR', 'lat' => -6.5971, 'lng' => 106.8060],
                    ['name' => 'Depok', 'code' => 'DPK', 'lat' => -6.4025, 'lng' => 106.7942],
                    ['name' => 'Karawang', 'code' => 'KRW', 'lat' => -6.3042, 'lng' => 107.3075],
                    ['name' => 'Cirebon', 'code' => 'CBN', 'lat' => -6.7320, 'lng' => 108.5523],
                    ['name' => 'Subang', 'code' => 'SBG', 'lat' => -6.5592, 'lng' => 107.7600],
                    ['name' => 'Purwakarta', 'code' => 'PWK', 'lat' => -6.5569, 'lng' => 107.4433],
                    ['name' => 'Sukabumi', 'code' => 'SKB', 'lat' => -6.9277, 'lng' => 106.9300],
                    ['name' => 'Cimahi', 'code' => 'CMH', 'lat' => -6.8722, 'lng' => 107.5425],
                ],
                'streets' => ['Jl. Ir. H. Juanda', 'Jl. Asia Afrika', 'Jl. Pajajaran', 'Jl. Margonda Raya', 'Jl. Ahmad Yani', 'Jl. Surya Sumantri', 'Jl. Soekarno Hatta', 'Jl. Tuparev', 'Jl. Raya Cikarang', 'Jl. KH Noer Ali'],
                'hubs' => ['Dago', 'Gedebage', 'Summarecon Bekasi', 'Sentul City', 'Cikarang Industrial', 'Puncak', 'Rest Area KM 57', 'Rest Area KM 102', 'Cipaganti', 'Harapan Indah'],
            ],
            'Jawa Timur' => [
                'quota' => 50,
                'cities' => [
                    ['name' => 'Surabaya', 'code' => 'SBY', 'lat' => -7.2575, 'lng' => 112.7521],
                    ['name' => 'Malang', 'code' => 'MLG', 'lat' => -7.9666, 'lng' => 112.6326],
                    ['name' => 'Sidoarjo', 'code' => 'SDA', 'lat' => -7.4478, 'lng' => 112.7183],
                    ['name' => 'Gresik', 'code' => 'GRS', 'lat' => -7.1566, 'lng' => 112.6555],
                    ['name' => 'Pasuruan', 'code' => 'PAS', 'lat' => -7.6453, 'lng' => 112.9075],
                    ['name' => 'Mojokerto', 'code' => 'MJK', 'lat' => -7.4722, 'lng' => 112.4385],
                    ['name' => 'Kediri', 'code' => 'KDR', 'lat' => -7.8480, 'lng' => 112.0178],
                    ['name' => 'Banyuwangi', 'code' => 'BWX', 'lat' => -8.2192, 'lng' => 114.3692],
                    ['name' => 'Madiun', 'code' => 'MDN', 'lat' => -7.6298, 'lng' => 111.5239],
                ],
                'streets' => ['Jl. Basuki Rahmat', 'Jl. Mayjen Sungkono', 'Jl. Raya Darmo', 'Jl. Ijen', 'Jl. Pemuda', 'Jl. Pahlawan', 'Jl. Ahmad Yani', 'Jl. Veteran', 'Jl. Panglima Sudirman', 'Jl. Raya Manyar'],
                'hubs' => ['Tunjungan', 'Gubeng', 'Pakuwon City', 'Rungkut', 'Ijen Boulevard', 'Waru', 'Krian', 'Rest Area KM 726', 'Ketapang Port', 'Batu'],
            ],
            'Jawa Tengah' => [
                'quota' => 35,
                'cities' => [
                    ['name' => 'Semarang', 'code' => 'SMG', 'lat' => -6.9932, 'lng' => 110.4203],
                    ['name' => 'Surakarta', 'code' => 'SLO', 'lat' => -7.5694, 'lng' => 110.8283],
                    ['name' => 'Batang', 'code' => 'BTG', 'lat' => -6.9083, 'lng' => 109.7333],
                    ['name' => 'Tegal', 'code' => 'TGL', 'lat' => -6.8694, 'lng' => 109.1402],
                    ['name' => 'Pekalongan', 'code' => 'PKL', 'lat' => -6.8886, 'lng' => 109.6753],
                    ['name' => 'Magelang', 'code' => 'MGL', 'lat' => -7.4797, 'lng' => 110.2177],
                    ['name' => 'Kudus', 'code' => 'KDS', 'lat' => -6.8048, 'lng' => 110.8405],
                    ['name' => 'Cilacap', 'code' => 'CLP', 'lat' => -7.7031, 'lng' => 109.0150],
                ],
                'streets' => ['Jl. Pandanaran', 'Jl. Pahlawan', 'Jl. Slamet Riyadi', 'Jl. Gajah Mada', 'Jl. Pemuda', 'Jl. Jenderal Sudirman', 'Jl. Kolonel Sugiono', 'Jl. Dr. Wahidin'],
                'hubs' => ['Simpang Lima', 'Kawasan Industri Batang', 'Solo Balapan', 'Rest Area KM 379A', 'Rest Area KM 429A', 'Kawasan Kota Lama', 'Grogol', 'Borobudur'],
            ],
            'Banten' => [
                'quota' => 25,
                'cities' => [
                    ['name' => 'Tangerang', 'code' => 'TGR', 'lat' => -6.1783, 'lng' => 106.6319],
                    ['name' => 'Tangerang Selatan', 'code' => 'TGR', 'lat' => -6.2886, 'lng' => 106.7179],
                    ['name' => 'Serang', 'code' => 'SRG', 'lat' => -6.1104, 'lng' => 106.1640],
                    ['name' => 'Cilegon', 'code' => 'CLG', 'lat' => -6.0174, 'lng' => 106.0538],
                    ['name' => 'Pandeglang', 'code' => 'PDG', 'lat' => -6.3084, 'lng' => 106.1065],
                ],
                'streets' => ['Jl. BSD Grand Boulevard', 'Jl. Alam Sutera Boulevard', 'Jl. Daan Mogot', 'Jl. Jenderal Sudirman', 'Jl. Lingkar Selatan', 'Jl. Raya Serpong'],
                'hubs' => ['BSD City', 'Alam Sutera', 'Bintaro Jaya', 'Gading Serpong', 'Pelabuhan Merak', 'Krakatau Steel Industrial', 'Modernland'],
            ],
            'D.I. Yogyakarta' => [
                'quota' => 15,
                'cities' => [
                    ['name' => 'Yogyakarta', 'code' => 'YOG', 'lat' => -7.7956, 'lng' => 110.3695],
                    ['name' => 'Sleman', 'code' => 'YOG', 'lat' => -7.7211, 'lng' => 110.3639],
                    ['name' => 'Bantul', 'code' => 'YOG', 'lat' => -7.8897, 'lng' => 110.3289],
                    ['name' => 'Kulon Progo', 'code' => 'YOG', 'lat' => -7.8631, 'lng' => 110.1592],
                ],
                'streets' => ['Jl. Malioboro', 'Jl. Kaliurang', 'Jl. Solo', 'Jl. Gejayan', 'Jl. Magelang', 'Jl. Ring Road Utara', 'Jl. Parangtritis'],
                'hubs' => ['Malioboro', 'UGM Bulaksumur', 'Bandara YIA Kulon Progo', 'Tugu Jogja', 'Seturan', 'Janti', 'Kotagede'],
            ],
            'Sumatera Utara' => [
                'quota' => 25,
                'cities' => [
                    ['name' => 'Medan', 'code' => 'MDN', 'lat' => 3.5952, 'lng' => 98.6722],
                    ['name' => 'Deli Serdang', 'code' => 'DLS', 'lat' => 3.5500, 'lng' => 98.8500],
                    ['name' => 'Binjai', 'code' => 'BNJ', 'lat' => 3.6000, 'lng' => 98.4850],
                    ['name' => 'Pematang Siantar', 'code' => 'PMS', 'lat' => 2.9610, 'lng' => 99.0600],
                ],
                'streets' => ['Jl. Balai Kota', 'Jl. Gatot Subroto', 'Jl. S. Parman', 'Jl. Putri Hijau', 'Jl. Diponegoro', 'Jl. Imam Bonjol', 'Jl. Ring Road Medan'],
                'hubs' => ['Merdeka Walk', 'Bandara Kualanamu', 'Kawasan Industri Medan (KIM)', 'Ringroad City Walks', 'Danau Toba Parapat', 'Belawan Port'],
            ],
            'Sumatera Selatan' => [
                'quota' => 16,
                'cities' => [
                    ['name' => 'Palembang', 'code' => 'PLM', 'lat' => -2.9909, 'lng' => 104.7565],
                    ['name' => 'Ogan Ilir', 'code' => 'OGI', 'lat' => -3.2300, 'lng' => 104.6500],
                    ['name' => 'Banyuasin', 'code' => 'BYA', 'lat' => -2.8800, 'lng' => 104.3800],
                    ['name' => 'Prabumulih', 'code' => 'PBM', 'lat' => -3.4300, 'lng' => 104.2300],
                ],
                'streets' => ['Jl. Jenderal Sudirman', 'Jl. R. Sukamto', 'Jl. Kolonel H. Burlian', 'Jl. Basuki Rahmat', 'Jl. Demang Lebar Daun', 'Jl. Gubernur H. Asnawi Mangku Alam'],
                'hubs' => ['Jakabaring Sport City', 'Jembatan Ampera', 'Palembang Icon', 'Bandara SMB II', 'Rest Area Tol Kayu Agung', 'Indralaya Unsri'],
            ],
            'Kepulauan Riau' => [
                'quota' => 14,
                'cities' => [
                    ['name' => 'Batam', 'code' => 'BTM', 'lat' => 1.1301, 'lng' => 104.0529],
                    ['name' => 'Tanjung Pinang', 'code' => 'TPN', 'lat' => 0.9200, 'lng' => 104.4500],
                    ['name' => 'Bintan', 'code' => 'BTN', 'lat' => 1.1500, 'lng' => 104.5500],
                ],
                'streets' => ['Jl. Engku Putri', 'Jl. Sudirman Batam Center', 'Jl. Nagoya Hill', 'Jl. Gajah Mada Sekupang', 'Jl. Raja Haji Fisabilillah'],
                'hubs' => ['Batam Center', 'Nagoya Business District', 'Pelabuhan Batam Center', 'Bandara Hang Nadim', 'Bintan Resort Lagoi', 'Nongsa Digital Park'],
            ],
            'Riau' => [
                'quota' => 12,
                'cities' => [
                    ['name' => 'Pekanbaru', 'code' => 'PKU', 'lat' => 0.5333, 'lng' => 101.4500],
                    ['name' => 'Dumai', 'code' => 'DMI', 'lat' => 1.6667, 'lng' => 101.4500],
                    ['name' => 'Kampar', 'code' => 'KMP', 'lat' => 0.3300, 'lng' => 101.0200],
                ],
                'streets' => ['Jl. Jenderal Sudirman', 'Jl. Riau', 'Jl. Tuanku Tambusai', 'Jl. H.R. Soebrantas', 'Jl. Arifin Ahmad', 'Jl. Sukarno Hatta'],
                'hubs' => ['Mall SKA', 'Bandara SSK II', 'Pusat Kota Pekanbaru', 'Pelabuhan Dumai', 'Rest Area Tol Pekanbaru-Dumai'],
            ],
            'Lampung' => [
                'quota' => 12,
                'cities' => [
                    ['name' => 'Bandar Lampung', 'code' => 'LPG', 'lat' => -5.4292, 'lng' => 105.2625],
                    ['name' => 'Lampung Selatan', 'code' => 'LPS', 'lat' => -5.6000, 'lng' => 105.5800],
                    ['name' => 'Metro', 'code' => 'MTR', 'lat' => -5.1136, 'lng' => 105.3069],
                ],
                'streets' => ['Jl. Raden Intan', 'Jl. Teuku Umar', 'Jl. Z.A. Pagar Alam', 'Jl. Kartini', 'Jl. Soekarno Hatta By Pass'],
                'hubs' => ['Pelabuhan Bakauheni', 'Rest Area KM 21A Tol Bakauheni', 'Rest Area KM 87B', 'Mall Boemi Kedaton', 'Teluk Betung'],
            ],
            'Sumatera Barat' => [
                'quota' => 10,
                'cities' => [
                    ['name' => 'Padang', 'code' => 'PDG', 'lat' => -0.9492, 'lng' => 100.3542],
                    ['name' => 'Bukittinggi', 'code' => 'BKT', 'lat' => -0.3056, 'lng' => 100.3692],
                    ['name' => 'Payakumbuh', 'code' => 'PYK', 'lat' => -0.2250, 'lng' => 100.6300],
                ],
                'streets' => ['Jl. Khatib Sulaiman', 'Jl. Sudirman', 'Jl. Bagindo Aziz Chan', 'Jl. Panorama Bukittinggi', 'Jl. Bypass Padang'],
                'hubs' => ['Pantai Padang', 'Jam Gadang Bukittinggi', 'Bandara Minangkabau (BIM)', 'Teluk Bayur', 'Transmart Padang'],
            ],
            'Aceh' => [
                'quota' => 6,
                'cities' => [
                    ['name' => 'Banda Aceh', 'code' => 'BNA', 'lat' => 5.5483, 'lng' => 95.3238],
                    ['name' => 'Aceh Besar', 'code' => 'ABS', 'lat' => 5.3800, 'lng' => 95.4200],
                    ['name' => 'Lhokseumawe', 'code' => 'LSM', 'lat' => 5.1800, 'lng' => 97.1400],
                ],
                'streets' => ['Jl. T. Nyak Arief', 'Jl. Teuku Umar', 'Jl. Sultan Iskandar Muda', 'Jl. Diponegoro'],
                'hubs' => ['Masjid Raya Baiturrahman', 'Pelabuhan Ulee Lheue', 'Bandara Sultan Iskandar Muda', 'Pusat Kota Banda Aceh'],
            ],
            'Jambi' => [
                'quota' => 5,
                'cities' => [
                    ['name' => 'Jambi', 'code' => 'JMB', 'lat' => -1.6100, 'lng' => 103.6100],
                    ['name' => 'Muaro Jambi', 'code' => 'MRO', 'lat' => -1.5000, 'lng' => 103.7500],
                ],
                'streets' => ['Jl. Gatot Subroto', 'Jl. Sultan Thaha', 'Jl. Hayam Wuruk', 'Jl. Kolonel Abunjani'],
                'hubs' => ['Jambi Town Square', 'Bandara Sultan Thaha', 'Kawasan Tanggo Rajo', 'Telanaipura'],
            ],
            'Bengkulu' => [
                'quota' => 4,
                'cities' => [
                    ['name' => 'Bengkulu', 'code' => 'BGL', 'lat' => -3.8004, 'lng' => 102.2655],
                ],
                'streets' => ['Jl. Pariwisata Pantai Panjang', 'Jl. S. Parman', 'Jl. Sudirman', 'Jl. Suprapto'],
                'hubs' => ['Pantai Panjang', 'Bencoolen Mall', 'Benteng Marlborough', 'Bandara Fatmawati Soekarno'],
            ],
            'Bali' => [
                'quota' => 25,
                'cities' => [
                    ['name' => 'Denpasar', 'code' => 'DPS', 'lat' => -8.6705, 'lng' => 115.2126],
                    ['name' => 'Badung', 'code' => 'DPS', 'lat' => -8.7200, 'lng' => 115.1700],
                    ['name' => 'Gianyar', 'code' => 'DPS', 'lat' => -8.5100, 'lng' => 115.2600],
                    ['name' => 'Tabanan', 'code' => 'DPS', 'lat' => -8.5400, 'lng' => 115.1200],
                ],
                'streets' => ['Jl. Sunset Road', 'Jl. Bypass Ngurah Rai', 'Jl. Raya Seminyak', 'Jl. Raya Canggu', 'Jl. Danau Tamblingan Sanur', 'Jl. Raya Ubud', 'Jl. Teuku Umar Denpasar'],
                'hubs' => ['ITDC Nusa Dua', 'Kuta Beachwalk', 'Sunset Road Kuta', 'Canggu Eco Point', 'Ubud Monkey Forest Hub', 'Sanur Port Terminal', 'Bandara Ngurah Rai', 'Jimbaran Hub'],
            ],
            'Nusa Tenggara Barat' => [
                'quota' => 10,
                'cities' => [
                    ['name' => 'Mataram', 'code' => 'MTR', 'lat' => -8.5833, 'lng' => 116.1167],
                    ['name' => 'Lombok Tengah', 'code' => 'LOM', 'lat' => -8.8900, 'lng' => 116.2900],
                    ['name' => 'Lombok Barat', 'code' => 'LOB', 'lat' => -8.5000, 'lng' => 116.0700],
                ],
                'streets' => ['Jl. Pejanggik', 'Jl. Pariwisata Mandalika', 'Jl. Raya Senggigi', 'Jl. Langko Mataram'],
                'hubs' => ['Sirkuit Internasional Mandalika', 'Lombok Epicentrum Mall', 'Kuta Mandalika Beach', 'Senggigi Resort Hub', 'Bandara Internasional Lombok (BIL)'],
            ],
            'Nusa Tenggara Timur' => [
                'quota' => 5,
                'cities' => [
                    ['name' => 'Manggarai Barat', 'code' => 'LBJ', 'lat' => -8.4900, 'lng' => 119.8800],
                    ['name' => 'Kupang', 'code' => 'KPG', 'lat' => -10.1700, 'lng' => 123.6000],
                ],
                'streets' => ['Jl. Soekarno Hatta Labuan Bajo', 'Jl. Pantai Pede', 'Jl. Frans Seda Kupang', 'Jl. El Tari'],
                'hubs' => ['Marina Labuan Bajo Waterfront', 'Puncak Waringin', 'Bandara Komodo', 'Lippo Plaza Kupang', 'Pelabuhan Tenau Kupang'],
            ],
            'Sulawesi Selatan' => [
                'quota' => 22,
                'cities' => [
                    ['name' => 'Makassar', 'code' => 'MKS', 'lat' => -5.1477, 'lng' => 119.4327],
                    ['name' => 'Gowa', 'code' => 'MKS', 'lat' => -5.2000, 'lng' => 119.4500],
                    ['name' => 'Maros', 'code' => 'MRS', 'lat' => -5.0000, 'lng' => 119.5700],
                    ['name' => 'Parepare', 'code' => 'PAR', 'lat' => -4.0100, 'lng' => 119.6300],
                ],
                'streets' => ['Jl. Penghibur', 'Jl. A.P. Pettarani', 'Jl. Urip Sumoharjo', 'Jl. Metro Tanjung Bunga', 'Jl. Perintis Kemerdekaan', 'Jl. Jenderal Sudirman'],
                'hubs' => ['Pantai Losari', 'Trans Studio Mall Makassar', 'Mall Ratu Indah', 'Bandara Sultan Hasanuddin', 'Makassar New Port', 'Center Point of Indonesia (CPI)'],
            ],
            'Sulawesi Utara' => [
                'quota' => 8,
                'cities' => [
                    ['name' => 'Manado', 'code' => 'MND', 'lat' => 1.4822, 'lng' => 124.8489],
                    ['name' => 'Bitung', 'code' => 'BTG', 'lat' => 1.4400, 'lng' => 125.1800],
                    ['name' => 'Minahasa Utara', 'code' => 'LKP', 'lat' => 1.6800, 'lng' => 125.0500],
                ],
                'streets' => ['Jl. Piere Tendean Boulevard', 'Jl. Sam Ratulangi', 'Jl. Yos Sudarso Bitung', 'Jl. Wolter Monginsidi'],
                'hubs' => ['Manado Town Square (Mantos)', 'Megamas Boulevard', 'Kawasan Pariwisata Likupang', 'Pelabuhan Bitung', 'Bandara Sam Ratulangi'],
            ],
            'Sulawesi Tengah' => [
                'quota' => 4,
                'cities' => [
                    ['name' => 'Palu', 'code' => 'PLU', 'lat' => -0.9003, 'lng' => 119.8779],
                ],
                'streets' => ['Jl. Sam Ratulangi Palu', 'Jl. Moh. Hatta', 'Jl. Raden Saleh', 'Jl. Dewi Sartika'],
                'hubs' => ['Palu Grand Mall', 'Pantai Talise', 'Bandara Mutiara SIS Al-Jufrie', 'Kawasan Ekonomi Khusus (KEK) Palu'],
            ],
            'Sulawesi Tenggara' => [
                'quota' => 4,
                'cities' => [
                    ['name' => 'Kendari', 'code' => 'KDR', 'lat' => -3.9722, 'lng' => 122.5156],
                ],
                'streets' => ['Jl. Abdullah Silondae', 'Jl. MT Haryono', 'Jl. Edi Sabara Bypass', 'Jl. Sultan Hasanuddin'],
                'hubs' => ['The Park Kendari', 'Jembatan Teluk Kendari', 'Kawasan MTQ Square', 'Bandara Haluoleo'],
            ],
            'Kalimantan Timur' => [
                'quota' => 15,
                'cities' => [
                    ['name' => 'Balikpapan', 'code' => 'BPN', 'lat' => -1.2654, 'lng' => 116.8312],
                    ['name' => 'Samarinda', 'code' => 'SMD', 'lat' => -0.5016, 'lng' => 117.1537],
                    ['name' => 'Penajam Paser Utara', 'code' => 'IKN', 'lat' => -0.9600, 'lng' => 116.7000],
                ],
                'streets' => ['Jl. Jenderal Sudirman Balikpapan', 'Jl. Ruhui Rahayu', 'Jl. Pahlawan Samarinda', 'Jl. Mulawarman', 'Jl. Sumbu Kebangsaan IKN'],
                'hubs' => ['Kawasan Inti IKN Plaza Barat', 'E-Walk Balikpapan Superblock', 'Big Mall Samarinda', 'Bandara SAMS Sepinggan', 'Rest Area KM 36 Tol Balsam', 'Pelabuhan Semayang'],
            ],
            'Kalimantan Barat' => [
                'quota' => 6,
                'cities' => [
                    ['name' => 'Pontianak', 'code' => 'PTK', 'lat' => -0.0263, 'lng' => 109.3425],
                    ['name' => 'Kubu Raya', 'code' => 'KBR', 'lat' => -0.1000, 'lng' => 109.4000],
                    ['name' => 'Singkawang', 'code' => 'SKW', 'lat' => 0.9000, 'lng' => 108.9800],
                ],
                'streets' => ['Jl. Gajah Mada Pontianak', 'Jl. Ahmad Yani Pontianak', 'Jl. Tanjungpura', 'Jl. Diponegoro Singkawang'],
                'hubs' => ['Ayani Mega Mall', 'Tugu Khatulistiwa', 'Bandara Supadio Kubu Raya', 'Kawasan Wisata Pasir Panjang Singkawang'],
            ],
            'Kalimantan Selatan' => [
                'quota' => 6,
                'cities' => [
                    ['name' => 'Banjarmasin', 'code' => 'BJM', 'lat' => -3.3244, 'lng' => 114.5910],
                    ['name' => 'Banjarbaru', 'code' => 'BJB', 'lat' => -3.4400, 'lng' => 114.8300],
                ],
                'streets' => ['Jl. Lambung Mangkurat', 'Jl. Ahmad Yani Km 6', 'Jl. Panglima Batur Banjarbaru', 'Jl. Pangeran Samudera'],
                'hubs' => ['Duta Mall Banjarmasin', 'Kawasan Menara Pandang Siring', 'Kompleks Perkantoran Pemprov Kalsel', 'Bandara Syamsudin Noor'],
            ],
            'Kalimantan Tengah' => [
                'quota' => 4,
                'cities' => [
                    ['name' => 'Palangka Raya', 'code' => 'PKY', 'lat' => -2.2136, 'lng' => 113.9108],
                ],
                'streets' => ['Jl. Tjilik Riwut', 'Jl. Yos Sudarso', 'Jl. G. Obos', 'Jl. RTA Milono'],
                'hubs' => ['Palma Mall', 'Bundaran Besar Palangka Raya', 'Bandara Tjilik Riwut', 'Kompleks Kantor Gubernur Kalteng'],
            ],
            'Papua' => [
                'quota' => 6,
                'cities' => [
                    ['name' => 'Jayapura', 'code' => 'JYP', 'lat' => -2.5337, 'lng' => 140.7181],
                    ['name' => 'Sentani', 'code' => 'STN', 'lat' => -2.5600, 'lng' => 140.5100],
                ],
                'streets' => ['Jl. Percetakan Negara', 'Jl. Ahmad Yani Jayapura', 'Jl. Raya Sentani-Abepura', 'Jl. Soa Siu Dok II'],
                'hubs' => ['Mall Jayapura', 'Stadion Lukas Enembe', 'Bandara Sentani', 'Jembatan Merah Youtefa', 'Kawasan Kantor Gubernur Dok II'],
            ],
            'Maluku' => [
                'quota' => 5,
                'cities' => [
                    ['name' => 'Ambon', 'code' => 'AMB', 'lat' => -3.6958, 'lng' => 128.1814],
                ],
                'streets' => ['Jl. A.J. Patty', 'Jl. Slamet Riyadi Ambon', 'Jl. Diponegoro', 'Jl. Jenderal Sudirman Ambon'],
                'hubs' => ['Ambon City Center (ACC)', 'Jembatan Merah Putih', 'Pelabuhan Yos Sudarso Ambon', 'Bandara Pattimura Laha'],
            ],
        ];

        $vendors = [
            'PT Mitra Elektrik Nusantara',
            'PT Konstruksi Jaya Utama',
            'PT Surya Energi Perkasa',
            'PT Garda Daya Pratama',
            'PT Rekadaya Elektrika',
        ];

        $amenitiesPool = [
            ['Parkir Luas', 'Toilet', 'Musholla', 'Minimarket'],
            ['Kafe', 'Wifi Gratis', 'Toilet', 'Security 24 Jam'],
            ['Rest Area', 'Toilet Eksekutif', 'Masjid', 'Food Court', 'Minimarket'],
            ['Mall', 'Cinema', 'Food Court', 'ATM Center', 'Toilet'],
            ['SPBU', 'Minimarket', 'Toilet', 'Musholla', 'Tambal Ban'],
            ['Kawasan Wisata', 'Pusat Kuliner', 'Spot Foto', 'Parkir EV VIP'],
        ];

        // 5. Collect and assemble all station items
        $allStations = [];
        $existingCodes = [];

        // Add 15 Showcase Stations first
        foreach ($showcaseStations as $item) {
            $allStations[] = $item;
            $existingCodes[$item['code']] = true;
        }

        // Count how many showcase stations exist per province
        $showcaseCountPerProv = [];
        foreach ($showcaseStations as $item) {
            $prov = $item['province'];
            $showcaseCountPerProv[$prov] = ($showcaseCountPerProv[$prov] ?? 0) + 1;
        }

        $cityCounters = [];

        // Procedurally generate remaining stations to reach >= 400 total
        foreach ($provinceConfigs as $provName => $config) {
            $quota = $config['quota'];
            $existingInProv = $showcaseCountPerProv[$provName] ?? 0;
            $needed = max(0, $quota - $existingInProv);

            $cityCount = count($config['cities']);
            $streetCount = count($config['streets']);
            $hubCount = count($config['hubs']);

            for ($i = 0; $i < $needed; $i++) {
                $cityObj = $config['cities'][$i % $cityCount];
                $cityName = $cityObj['name'];
                $cityCode = $cityObj['code'];
                $baseLat = $cityObj['lat'];
                $baseLng = $cityObj['lng'];

                $streetName = $config['streets'][$i % $streetCount];
                $hubName = $config['hubs'][$i % $hubCount];

                // Code generation: VG-{CODE}-{00001} up to 99999
                $cityCounters[$cityCode] = ($cityCounters[$cityCode] ?? 0) + 1;
                $code = sprintf('VG-%s-%03d', $cityCode, $cityCounters[$cityCode]);
                while (isset($existingCodes[$code])) {
                    $cityCounters[$cityCode]++;
                    $code = sprintf('VG-%s-%03d', $cityCode, $cityCounters[$cityCode]);
                }
                $existingCodes[$code] = true;

                // Facility Type Distribution: ~60% EVCS, ~25% BSS, ~15% COMBINED
                $typeRand = ($i * 7 + 3) % 20;
                if ($typeRand < 12) {
                    $facilityType = FacilityType::EVCS;
                } elseif ($typeRand < 17) {
                    $facilityType = FacilityType::BSS;
                } else {
                    $facilityType = FacilityType::COMBINED;
                }

                // Status Distribution: ~65% OPERATIONAL, ~20% CONSTRUCTION, ~10% SURVEYED, ~5% ON_HOLD
                $statusRand = ($i * 11 + 7) % 20;
                if ($statusRand < 13) {
                    $status = StationStatus::OPERATIONAL;
                } elseif ($statusRand < 17) {
                    $status = StationStatus::CONSTRUCTION;
                } elseif ($statusRand < 19) {
                    $status = StationStatus::SURVEYED;
                } else {
                    $status = StationStatus::ON_HOLD;
                }

                // Coordinate slight offset to spread naturally within city (~1-7 km radius)
                $latOffset = ((($i * 17) % 70) - 35) * 0.0018;
                $lngOffset = ((($i * 23) % 70) - 35) * 0.0018;
                $lat = round($baseLat + $latOffset, 6);
                $lng = round($baseLng + $lngOffset, 6);

                // Naming templates
                $namePatterns = [
                    "V-Green Hub {$hubName}",
                    "V-Green Fast Station {$hubName}",
                    "V-Green Eco Station {$cityName} {$hubName}",
                    "V-Green Swap Station {$hubName}",
                    "V-Green Charging Point {$hubName}",
                    "V-Green Integrated Point {$streetName}",
                ];
                $name = $namePatterns[$i % count($namePatterns)];

                // Technical specs
                $powerKw = 60;
                $socketTypes = '2x CCS2 Dual Gun (200A)';
                $slotCount = 2;

                if ($facilityType === FacilityType::EVCS) {
                    $powerOptions = [20, 30, 60, 120, 180];
                    $powerKw = $powerOptions[$i % count($powerOptions)];
                    if ($powerKw <= 20) {
                        $socketTypes = '1x CCS2 Fast Gun (55A)';
                        $slotCount = 1;
                    } elseif ($powerKw <= 30) {
                        $socketTypes = '1x CCS2 Fast Gun (80A)';
                        $slotCount = 1;
                    } elseif ($powerKw <= 60) {
                        $socketTypes = '2x CCS2 Dual Gun (200A)';
                        $slotCount = 2;
                    } elseif ($powerKw <= 120) {
                        $socketTypes = '2x CCS2 Fast Gun (60kW/gun)';
                        $slotCount = 2;
                    } else {
                        $socketTypes = '3x CCS2 Fast Gun (60kW/gun)';
                        $slotCount = 3;
                    }
                } elseif ($facilityType === FacilityType::BSS) {
                    $bssOptions = [5, 10, 20];
                    $powerKw = $bssOptions[$i % count($bssOptions)];
                    if ($powerKw === 5) {
                        $socketTypes = '6-Slot BSS Compact Cabinet';
                        $slotCount = 6;
                    } elseif ($powerKw === 10) {
                        $socketTypes = '12-Slot BSS Standard Cabinet';
                        $slotCount = 12;
                    } else {
                        $socketTypes = '24-Slot BSS Dual Cabinets';
                        $slotCount = 24;
                    }
                } else { // COMBINED
                    $powerKw = 70;
                    $socketTypes = '2x CCS2 Dual Gun (60kW) + 12-Slot BSS Motor';
                    $slotCount = 14;
                }

                // S-Curve Dates across 2026
                $month = ($i % 10) + 1; // 1 to 10
                $day = ($i % 25) + 1;
                $surveyDate = sprintf('2025-%02d-%02d', ($i % 3) + 10, $day);
                $constDate = sprintf('2026-%02d-%02d', max(1, $month - 1), min(28, $day));
                $targetDate = sprintf('2026-%02d-%02d', $month, min(28, $day + 10));
                $commDate = $status === StationStatus::OPERATIONAL ? sprintf('2026-%02d-%02d', $month, min(28, $day + 15)) : null;

                if ($status === StationStatus::CONSTRUCTION) {
                    $commDate = null;
                    $targetDate = sprintf('2026-%02d-28', rand(11, 12));
                } elseif ($status === StationStatus::SURVEYED) {
                    $commDate = null;
                    $constDate = null;
                    $targetDate = '2027-02-15';
                } elseif ($status === StationStatus::ON_HOLD) {
                    $commDate = null;
                    $targetDate = '2027-03-31';
                }

                // Landlord & Expiring contract alert logic
                $isPemerintah = str_contains(strtolower($hubName), 'rest area') 
                    || str_contains(strtolower($hubName), 'port') 
                    || str_contains(strtolower($hubName), 'bandara') 
                    || str_contains(strtolower($hubName), 'stasiun') 
                    || str_contains(strtolower($hubName), 'pelabuhan') 
                    || str_contains(strtolower($hubName), 'pemda') 
                    || str_contains(strtolower($hubName), 'ikn') 
                    || str_contains(strtolower($hubName), 'itdc')
                    || ($i % 4 === 0);

                $landlordName = $isPemerintah ? 'PT Jasa Marga / Pemda Setempat' : "Pengelola {$hubName}";
                
                // Set ~24 stations to expire within next 90 days to test Director Alert
                $isExpiringSoon = ($i % 18 === 0);
                $leaseEndDate = $isExpiringSoon 
                    ? now()->addDays(rand(12, 85))->format('Y-m-d') 
                    : sprintf('2028-%02d-%02d', ($i % 12) + 1, min(28, $day));

                $vgreenContractEndDate = $isExpiringSoon && ($i % 36 === 0)
                    ? now()->addDays(rand(15, 80))->format('Y-m-d')
                    : '2028-12-31';

                $allStations[] = [
                    'code' => $code,
                    'name' => $name,
                    'facility_type_id' => $facilityType,
                    'status_id' => $status,
                    'latitude' => $lat,
                    'longitude' => $lng,
                    'address' => "{$streetName} No. " . (($i * 3 + 12) % 180 + 1) . ", {$cityName}",
                    'city' => $cityName,
                    'province' => $provName,
                    'postal_code' => sprintf('%05d', rand(10110, 99990)),
                    'power_capacity_kw' => $powerKw,
                    'socket_types' => $socketTypes,
                    'slot_count' => $slotCount,
                    'operational_hours' => ($facilityType === FacilityType::BSS || str_contains($hubName, 'Rest Area')) ? '24 Jam' : '08:00 - 22:00',
                    'amenities' => $amenitiesPool[$i % count($amenitiesPool)],
                    'survey_date' => $surveyDate,
                    'construction_start_date' => $constDate,
                    'target_completion_date' => $targetDate,
                    'commissioning_date' => $commDate,
                    'vendor_name' => $vendors[$i % count($vendors)],
                    'pln_meter_id' => 'PLN-' . $cityCode . '-' . rand(100000, 999999),
                    'internal_notes' => "Titik strategis koridor {$cityName}. Aksesibilitas dan stabilitas trafo listrik terpantau prima.",
                    'lease_end_date' => $leaseEndDate,
                    'landlord_name' => $landlordName,
                    'vgreen_contract_end_date' => $vgreenContractEndDate,
                ];
            }
        }

        // 6. Bulk Insert Stations and Prepare Sub-Entities
        $machinesBatch = [];
        $documentsBatch = [];
        $photosBatch = [];

        DB::beginTransaction();

        try {
            foreach ($allStations as $index => $item) {
                if (!isset($item['lease_end_date'])) {
                    $item['lease_end_date'] = '2028-12-31';
                    $item['landlord_name'] = $item['landlord_name'] ?? 'Mitra Pengelola Lahan Terverifikasi';
                }

                if (!isset($item['vgreen_contract_end_date'])) {
                    $item['vgreen_contract_end_date'] = '2028-12-31';
                }

                $searchContext = strtolower(($item['name'] ?? '') . ' ' . ($item['landlord_name'] ?? '') . ' ' . ($item['address'] ?? ''));
                $isGov = str_contains($searchContext, 'jasa marga')
                    || str_contains($searchContext, 'itdc')
                    || str_contains($searchContext, 'rest area')
                    || str_contains($searchContext, 'pln')
                    || str_contains($searchContext, 'tol')
                    || str_contains($searchContext, 'dishub')
                    || str_contains($searchContext, 'pemerintah')
                    || str_contains($searchContext, 'pemda')
                    || str_contains($searchContext, 'bumn')
                    || str_contains($searchContext, 'pelabuhan')
                    || str_contains($searchContext, 'bandara')
                    || str_contains($searchContext, 'stasiun')
                    || str_contains($searchContext, 'ikn');

                $item['landlord_type'] = $isGov ? 'PEMERINTAH' : 'SWASTA';
                $item['ownership_type'] = $isGov ? 'NEGERI_BUMN' : 'SWASTA';
                $item['landlord_phone'] = '081' . rand(20000000, 89999999);
                $item['contract_vgreen_start_date'] = '2025-01-01';
                $item['contract_vgreen_end_date'] = $item['vgreen_contract_end_date'];
                $item['contract_vgreen_doc_number'] = 'PKS/VG-SSI/2025/' . str_pad($index + 1, 4, '0', STR_PAD_LEFT);
                $item['contract_landlord_start_date'] = '2025-02-01';
                $item['contract_landlord_end_date'] = $item['lease_end_date'];
                $item['contract_landlord_doc_number'] = 'PKS/SSI-LND/2025/' . str_pad($index + 1, 4, '0', STR_PAD_LEFT);

                // Precalculate document status
                if ($item['status_id'] === StationStatus::OPERATIONAL) {
                    $item['document_status'] = 'COMPLETE';
                } elseif ($item['status_id'] === StationStatus::CONSTRUCTION) {
                    $item['document_status'] = 'INCOMPLETE';
                } else {
                    $item['document_status'] = 'INCOMPLETE';
                }

                $station = Station::create($item);

                // --- A. Inspection Lifecycle & Photos ---
                $stagesToCreate = [];
                if ($station->status_id === StationStatus::OPERATIONAL) {
                    $stagesToCreate = [
                        [
                            'stage' => 'INITIAL_SURVEY',
                            'status' => ApprovalStatus::APPROVED,
                            'sub_days' => 120,
                            'rev_days' => 118,
                            'notes' => 'Survei kelayakan lahan lolos uji aksesibilitas dan jaringan PLN.',
                            'rejection_reason' => null,
                            'photos_approved' => true,
                        ],
                        [
                            'stage' => 'COMMISSIONING',
                            'status' => ApprovalStatus::APPROVED,
                            'sub_days' => 20,
                            'rev_days' => 18,
                            'notes' => 'Uji fungsi charging station & pertukaran baterai 100% normal.',
                            'rejection_reason' => null,
                            'photos_approved' => true,
                        ],
                    ];
                } elseif ($station->status_id === StationStatus::CONSTRUCTION) {
                    $stagesToCreate = [
                        [
                            'stage' => 'INITIAL_SURVEY',
                            'status' => ApprovalStatus::APPROVED,
                            'sub_days' => 45,
                            'rev_days' => 42,
                            'notes' => 'Survei kelayakan lahan disetujui.',
                            'rejection_reason' => null,
                            'photos_approved' => true,
                        ],
                        [
                            'stage' => 'CONSTRUCTION_PROGRESS',
                            'status' => ApprovalStatus::PENDING_REVIEW,
                            'sub_days' => 3,
                            'rev_days' => null,
                            'notes' => 'Progres fisik 65%, penanaman kabel tanah dan tiang panel utama.',
                            'rejection_reason' => null,
                            'photos_approved' => false,
                        ],
                    ];
                } elseif ($station->status_id === StationStatus::SURVEYED) {
                    $stagesToCreate = [
                        [
                            'stage' => 'INITIAL_SURVEY',
                            'status' => ApprovalStatus::PENDING_REVIEW,
                            'sub_days' => 2,
                            'rev_days' => null,
                            'notes' => 'Pengajuan hasil survei lahan awal oleh tim lapangan.',
                            'rejection_reason' => null,
                            'photos_approved' => false,
                        ],
                    ];
                } else { // ON_HOLD
                    $stagesToCreate = [
                        [
                            'stage' => 'INITIAL_SURVEY',
                            'status' => ApprovalStatus::APPROVED,
                            'sub_days' => 60,
                            'rev_days' => 58,
                            'notes' => 'Survei awal disetujui.',
                            'rejection_reason' => null,
                            'photos_approved' => true,
                        ],
                        [
                            'stage' => 'COMMISSIONING',
                            'status' => ApprovalStatus::REVISION_REQUIRED,
                            'sub_days' => 8,
                            'rev_days' => 7,
                            'notes' => 'Verifikasi komisioning ditahan.',
                            'rejection_reason' => 'Sudut panel belum rapi, perlu grounding tambahan dan perlindungan kanopi hujan.',
                            'photos_approved' => false,
                        ],
                    ];
                }

                foreach ($stagesToCreate as $stageConfig) {
                    $report = InspectionReport::create([
                        'station_id' => $station->id,
                        'stage' => $stageConfig['stage'],
                        'submitted_by' => $vendor->id,
                        'approval_status_id' => $stageConfig['status'],
                        'reviewed_by' => $stageConfig['status'] === ApprovalStatus::APPROVED ? $admin->id : null,
                        'notes' => $stageConfig['notes'],
                        'rejection_reason' => $stageConfig['rejection_reason'],
                        'submitted_at' => now()->subDays($stageConfig['sub_days']),
                        'reviewed_at' => $stageConfig['rev_days'] ? now()->subDays($stageConfig['rev_days']) : null,
                    ]);

                    foreach ($mockPhotoSamples as $slotId => $photoUrl) {
                        $photosBatch[] = [
                            'report_id' => $report->id,
                            'checklist_slot_id' => $slotId,
                            'photo_url' => $photoUrl,
                            'latitude' => $station->latitude + (rand(-10, 10) * 0.0001),
                            'longitude' => $station->longitude + (rand(-10, 10) * 0.0001),
                            'taken_at' => now()->subDays($stageConfig['sub_days']),
                            'is_approved' => $stageConfig['photos_approved'],
                            'reviewer_notes' => $stageConfig['photos_approved'] ? 'Sesuai standar teknis.' : ($stageConfig['rejection_reason'] ?: 'Menunggu review visual.'),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                }

                // --- B. Station Machines (Official Hardware) ---
                if ($station->facility_type_id === FacilityType::EVCS) {
                    $mainMachine = $station->power_capacity_kw <= 20 
                        ? ($mVF20 ?? $mVF60) 
                        : ($station->power_capacity_kw <= 30 ? ($mVF30 ?? $mVF60) : ($mVF60 ?? $mVF30));

                    $machinesBatch[] = [
                        'station_id' => $station->id,
                        'machine_id' => $mainMachine?->id,
                        'name' => $mainMachine ? $mainMachine->name . ' 01' : 'Unit DC Fast Charger 01',
                        'brand' => 'VinFast',
                        'model_series' => $mainMachine ? $mainMachine->model_series : 'DC Commercial Dispenser',
                        'serial_number' => 'VF-' . ($mainMachine ? $mainMachine->code : 'DC60') . '-' . str_pad($station->id, 5, '0', STR_PAD_LEFT) . '-01',
                        'facility_type_id' => FacilityType::EVCS,
                        'power_capacity_kw' => $mainMachine ? $mainMachine->power_capacity_kw : 60,
                        'socket_types' => $mainMachine ? $mainMachine->socket_types : '2x CCS2 Dual Gun (200A + 200A)',
                        'slot_or_gun_count' => $mainMachine ? $mainMachine->slot_or_gun_count : 2,
                        'status' => 'OPERATIONAL',
                        'installed_at' => $station->commissioning_date ?? now()->subMonths(3),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    if ($station->power_capacity_kw > 60) {
                        $secMachine = $station->power_capacity_kw >= 150 ? $mVF60 : ($station->power_capacity_kw >= 100 ? $mVF30 : $mVF20);
                        $machinesBatch[] = [
                            'station_id' => $station->id,
                            'machine_id' => $secMachine?->id,
                            'name' => $secMachine ? $secMachine->name . ' 02' : 'Unit DC Fast Charger 02',
                            'brand' => 'VinFast',
                            'model_series' => $secMachine ? $secMachine->model_series : 'DC Wallbox Series',
                            'serial_number' => 'VF-' . ($secMachine ? $secMachine->code : 'DC30') . '-' . str_pad($station->id, 5, '0', STR_PAD_LEFT) . '-02',
                            'facility_type_id' => FacilityType::EVCS,
                            'power_capacity_kw' => $secMachine ? $secMachine->power_capacity_kw : 30,
                            'socket_types' => $secMachine ? $secMachine->socket_types : '1x CCS2 Fast Gun (80A)',
                            'slot_or_gun_count' => $secMachine ? $secMachine->slot_or_gun_count : 1,
                            'status' => 'OPERATIONAL',
                            'installed_at' => $station->commissioning_date ?? now()->subMonths(3),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                } elseif ($station->facility_type_id === FacilityType::BSS) {
                    $chosenBss = ($station->slot_count && $station->slot_count <= 8) ? ($mBSS6 ?? $mBSS12) : ($mBSS12 ?? $mBSS6);
                    $machinesBatch[] = [
                        'station_id' => $station->id,
                        'machine_id' => $chosenBss?->id,
                        'name' => $chosenBss ? $chosenBss->name : 'V-Green BSS Cabinet 12-Slot',
                        'brand' => 'V-Green',
                        'model_series' => $chosenBss ? $chosenBss->model_series : 'Smart BSS Cabinet 12-Bay',
                        'serial_number' => 'VG-BSS-' . str_pad($station->id, 5, '0', STR_PAD_LEFT) . '-01',
                        'facility_type_id' => FacilityType::BSS,
                        'power_capacity_kw' => $chosenBss ? $chosenBss->power_capacity_kw : 10,
                        'socket_types' => $chosenBss ? $chosenBss->socket_types : '12 Battery Slots (11 Active LFP + 1 Swap Bay)',
                        'slot_or_gun_count' => $chosenBss ? $chosenBss->slot_or_gun_count : 12,
                        'status' => 'OPERATIONAL',
                        'installed_at' => $station->commissioning_date ?? now()->subMonths(2),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                } else { // COMBINED
                    $machinesBatch[] = [
                        'station_id' => $station->id,
                        'machine_id' => $mVF60?->id,
                        'name' => 'Dispenser DC Fast Charger 01',
                        'brand' => 'VinFast',
                        'model_series' => 'DC Commercial Dispenser',
                        'serial_number' => 'VF-DC60-' . str_pad($station->id, 5, '0', STR_PAD_LEFT) . '-01',
                        'facility_type_id' => FacilityType::EVCS,
                        'power_capacity_kw' => 60,
                        'socket_types' => '2x CCS2 Dual Gun (200A + 200A)',
                        'slot_or_gun_count' => 2,
                        'status' => 'OPERATIONAL',
                        'installed_at' => $station->commissioning_date ?? now()->subMonths(4),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                    $machinesBatch[] = [
                        'station_id' => $station->id,
                        'machine_id' => $mBSS12?->id,
                        'name' => 'V-Green BSS Cabinet 12-Slot 02',
                        'brand' => 'V-Green',
                        'model_series' => 'Smart BSS Cabinet 12-Bay',
                        'serial_number' => 'VG-BSS12-' . str_pad($station->id, 5, '0', STR_PAD_LEFT) . '-02',
                        'facility_type_id' => FacilityType::BSS,
                        'power_capacity_kw' => 10,
                        'socket_types' => '12 Battery Slots (11 Active LFP + 1 Swap Bay)',
                        'slot_or_gun_count' => 12,
                        'status' => 'OPERATIONAL',
                        'installed_at' => $station->commissioning_date ?? now()->subMonths(4),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }

                // --- C. Legal Documents ---
                $reqDocs = StationDocument::REQUIRED_DOCUMENTS[$station->landlord_type];
                $docKeys = array_keys($reqDocs);
                $keysToSeed = [];

                if ($station->status_id === StationStatus::OPERATIONAL) {
                    $keysToSeed = $docKeys; // 100% complete
                } elseif ($station->status_id === StationStatus::CONSTRUCTION) {
                    $keysToSeed = array_slice($docKeys, 0, (int) ceil(count($docKeys) * 0.6));
                } elseif ($station->status_id === StationStatus::SURVEYED) {
                    $keysToSeed = array_slice($docKeys, 0, 2);
                } else {
                    $keysToSeed = array_slice($docKeys, 0, 1);
                }

                foreach ($keysToSeed as $docKey) {
                    $documentsBatch[] = [
                        'station_id' => $station->id,
                        'category' => $station->landlord_type,
                        'document_type' => $docKey,
                        'title' => $reqDocs[$docKey] . ' - ' . $station->name,
                        'file_name' => strtolower($docKey) . '_' . strtolower(str_replace([' ', '/', '-'], '_', $station->code)) . '.pdf',
                        'file_path' => 'documents/stations/' . $station->code . '/' . strtolower($docKey) . '.pdf',
                        'file_size' => rand(150000, 2500000),
                        'mime_type' => 'application/pdf',
                        'uploaded_by' => $admin->id,
                        'notes' => 'Dokumen terverifikasi oleh legal operasional PT SSI.',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }

                if (in_array($station->status_id, [StationStatus::OPERATIONAL, StationStatus::CONSTRUCTION])) {
                    $documentsBatch[] = [
                        'station_id' => $station->id,
                        'category' => 'VENDOR',
                        'document_type' => 'SSR_VENDOR',
                        'title' => 'Site Survey Report (SSR) - ' . $station->name,
                        'file_name' => 'ssr_' . strtolower(str_replace([' ', '/', '-'], '_', $station->code)) . '.pdf',
                        'file_path' => 'documents/stations/' . $station->code . '/ssr.pdf',
                        'file_size' => rand(800000, 3500000),
                        'mime_type' => 'application/pdf',
                        'uploaded_by' => $vendor->id,
                        'notes' => 'Laporan survei geoteknik & ketersediaan daya PLN oleh vendor.',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }

            // 7. Bulk Insert Batch Arrays in Chunks for Maximum Speed
            foreach (array_chunk($machinesBatch, 500) as $chunk) {
                StationMachine::insert($chunk);
            }
            foreach (array_chunk($documentsBatch, 500) as $chunk) {
                StationDocument::insert($chunk);
            }
            foreach (array_chunk($photosBatch, 500) as $chunk) {
                InspectionPhoto::insert($chunk);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
