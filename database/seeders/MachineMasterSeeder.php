<?php

namespace Database\Seeders;

use App\Models\Machine;
use App\Models\MachineCategory;
use App\Models\StationMachine;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MachineMasterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * EVCS: Official VinFast Charging Hardware (DC 20kW, DC 30kW, DC 60kW).
     * BSS: Official V-Green Smart Battery Swapping Cabinets (VG-BSS-12S & VG-BSS-6S).
     */
    public function run(): void
    {
        // 1. Seed Categories (EVCS & BSS)
        $catEvcs = MachineCategory::firstOrCreate(
            ['code' => 'EVCS'],
            [
                'name' => 'EVCS - Electric Vehicle Charging Station (Mobil)',
                'description' => 'Kategori unit charger mobil listrik VinFast (DC 20kW Wallbox, DC 30kW Wallbox, DC 60kW Commercial Dispenser).',
            ]
        );

        $catBss = MachineCategory::firstOrCreate(
            ['code' => 'BSS'],
            [
                'name' => 'BSS - Battery Swapping Station (Motor)',
                'description' => 'Kategori kabinet penukaran baterai pintar motor listrik V-Green (6-Slot Compact & 12-Slot Standard).',
            ]
        );

        // Update category descriptions in case they already exist
        $catEvcs->update([
            'name' => 'EVCS - Electric Vehicle Charging Station (Mobil)',
            'description' => 'Kategori unit charger mobil listrik VinFast (DC 20kW Wallbox, DC 30kW Wallbox, DC 60kW Commercial Dispenser).',
        ]);
        $catBss->update([
            'name' => 'BSS - Battery Swapping Station (Motor)',
            'description' => 'Kategori kabinet penukaran baterai pintar motor listrik V-Green (6-Slot Compact & 12-Slot Standard).',
        ]);

        // 2. Official EVCS & BSS Specifications
        $officialMachines = [
            // --- EVCS 1: DC 20kW Wallbox ---
            [
                'category_id' => $catEvcs->id,
                'code' => 'VF-DC-20KW',
                'name' => 'VinFast DC 20kW',
                'brand' => 'VinFast',
                'model_series' => 'DC Wallbox Series',
                'power_capacity_kw' => 20,
                'socket_types' => '1x CCS2 Fast Gun (55A)',
                'slot_or_gun_count' => 1,
                'dimensions' => 'H490 x W740 x D396mm',
                'weight' => '≤ 100kg',
                'cable_length' => '≥ 6m',
                'input_voltage' => '400VAC ±10%, 50/60Hz, 3 Phase + N + PE',
                'input_current' => '32A (Rating 21kW)',
                'output_voltage' => '150 ~ 1 000 VDC',
                'output_current' => '20kW, 55A',
                'description' => 'Wallbox DC Charger 20kW VinFast berstandar 400VAC 3-Phase untuk pengisian EVCS mobil listrik, output 150-1000 VDC 55A dengan kabel 6 meter.',
                'is_active' => true,
            ],
            // --- EVCS 2: DC 30kW Wallbox ---
            [
                'category_id' => $catEvcs->id,
                'code' => 'VF-DC-30KW',
                'name' => 'VinFast DC 30kW',
                'brand' => 'VinFast',
                'model_series' => 'DC Wallbox Series',
                'power_capacity_kw' => 30,
                'socket_types' => '1x CCS2 Fast Gun (80A)',
                'slot_or_gun_count' => 1,
                'dimensions' => 'H490 x W740 x D396mm (No columns)',
                'weight' => '≤ 100kg',
                'cable_length' => '≥ 5m',
                'input_voltage' => '400VAC ±10%, 50/60Hz, 3 Phase + N + PE',
                'input_current' => '48A (Rating 32kW)',
                'output_voltage' => '150 ~ 1 000 VDC',
                'output_current' => '30kW, 80A (Max)',
                'description' => 'Wallbox DC Charger 30kW VinFast berstandar 400VAC 3-Phase untuk pengisian EVCS mobil listrik, output 150-1000 VDC 80A dengan kabel 5 meter.',
                'is_active' => true,
            ],
            // --- EVCS 3: DC 60kW Commercial Dispenser Dual Gun ---
            [
                'category_id' => $catEvcs->id,
                'code' => 'VF-DC-60KW',
                'name' => 'VinFast DC 60kW',
                'brand' => 'VinFast',
                'model_series' => 'DC Commercial Dispenser',
                'power_capacity_kw' => 60,
                'socket_types' => '2x CCS2 Dual Gun (200A + 200A)',
                'slot_or_gun_count' => 2,
                'dimensions' => 'H1650 x W720 x D400mm',
                'weight' => '≤ 250kg',
                'cable_length' => '≥ 6m',
                'input_voltage' => '400VAC ±10%, 50/60Hz, 3 Phase + N + PE',
                'input_current' => '96A (Rating 63kW)',
                'output_voltage' => '150 ~ 1 000 VDC',
                'output_current' => '60kW, 200A + 200A',
                'description' => 'Commercial Standing Dispenser DC Fast Charger 60kW VinFast Dual Gun (200A + 200A) berstandar 400VAC 3-Phase dengan kabel 6 meter untuk EVCS mobil listrik.',
                'is_active' => true,
            ],
            // --- BSS 1: V-Green Smart Battery Cabinet 12-Slot ---
            [
                'category_id' => $catBss->id,
                'code' => 'VG-BSS-12S',
                'name' => 'V-Green BSS Cabinet 12-Slot',
                'brand' => 'V-Green',
                'model_series' => 'Smart BSS Cabinet 12-Bay',
                'power_capacity_kw' => 10,
                'socket_types' => '12 Battery Slots (11 Active LFP + 1 Swap Bay)',
                'slot_or_gun_count' => 12,
                'dimensions' => 'H1850 x W1000 x D600mm',
                'weight' => '≤ 280kg',
                'cable_length' => 'Internal Bay Busbar',
                'input_voltage' => '380VAC ±10%, 50Hz, 3 Phase + N + PE',
                'input_current' => '16A - 25A (Rating 10kW)',
                'output_voltage' => '72 VDC (Baterai LFP 1.5 kWh)',
                'output_current' => 'Multi-bay Intelligent Fast Charging',
                'description' => 'Kabinet penukaran baterai pintar 12-slot standar nasional V-Green untuk motor listrik VinFast (Evo, Feliz II). Dilengkapi 11 slot baterai terisi + 1 slot swap kosong otomatis via QR Code aplikasi VinFast.',
                'is_active' => true,
            ],
            // --- BSS 2: V-Green Smart Battery Cabinet 6-Slot Compact ---
            [
                'category_id' => $catBss->id,
                'code' => 'VG-BSS-6S',
                'name' => 'V-Green BSS Cabinet 6-Slot Compact',
                'brand' => 'V-Green',
                'model_series' => 'Smart BSS Cabinet 6-Bay Compact',
                'power_capacity_kw' => 5,
                'socket_types' => '6 Battery Slots (5 Active LFP + 1 Swap Bay)',
                'slot_or_gun_count' => 6,
                'dimensions' => 'H1600 x W650 x D600mm',
                'weight' => '≤ 150kg',
                'cable_length' => 'Internal Bay Busbar',
                'input_voltage' => '220VAC ±10%, 50Hz, 1 Phase + N + PE',
                'input_current' => '16A - 20A (Rating 5kW)',
                'output_voltage' => '72 VDC (Baterai LFP 1.5 kWh)',
                'output_current' => 'Multi-bay Intelligent Fast Charging',
                'description' => 'Kabinet penukaran baterai pintar 6-slot kompak V-Green untuk kemitraan minimarket dan area komersial urban. 5 slot baterai aktif + 1 slot swap kosong otomatis via QR Code aplikasi VinFast.',
                'is_active' => true,
            ],
        ];

        // 3. Create or update the 5 official machines
        $validCodes = array_column($officialMachines, 'code');
        $createdMachineIds = [];
        foreach ($officialMachines as $mData) {
            $machine = Machine::updateOrCreate(
                ['code' => $mData['code']],
                $mData
            );
            $createdMachineIds[] = $machine->id;
        }

        // Remap any existing station_machines to appropriate model before removing obsolete models
        $default60kW = Machine::where('code', 'VF-DC-60KW')->first();
        if ($default60kW) {
            StationMachine::whereNotIn('machine_id', $createdMachineIds)
                ->orWhereNull('machine_id')
                ->update([
                    'machine_id' => $default60kW->id,
                    'brand' => 'VinFast',
                    'model_series' => 'DC Commercial Dispenser',
                    'socket_types' => '2x CCS2 Dual Gun (200A + 200A)',
                ]);
        }

        // Delete all machines that are NOT in the official list
        Machine::whereNotIn('code', $validCodes)->delete();
    }
}
