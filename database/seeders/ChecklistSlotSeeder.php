<?php

namespace Database\Seeders;

use App\Models\ChecklistSlot;
use Illuminate\Database\Seeder;

class ChecklistSlotSeeder extends Seeder
{
    public function run(): void
    {
        $slots = [
            // Area Lahan
            [
                'id' => 'LAHAN_DEPAN',
                'category' => 'LAHAN',
                'label' => 'Lahan - Tampak Depan',
                'angle' => 'Depan',
                'is_required' => true,
            ],
            [
                'id' => 'LAHAN_SAMPING',
                'category' => 'LAHAN',
                'label' => 'Lahan - Tampak Samping',
                'angle' => 'Samping',
                'is_required' => true,
            ],
            [
                'id' => 'LAHAN_AKSES',
                'category' => 'LAHAN',
                'label' => 'Lahan - Akses Masuk Kendaraan',
                'angle' => 'Akses Masuk',
                'is_required' => true,
            ],

            // Mesin Charger
            [
                'id' => 'MESIN_DEPAN',
                'category' => 'MESIN',
                'label' => 'Mesin Charger - Tampak Depan',
                'angle' => 'Depan',
                'is_required' => true,
            ],
            [
                'id' => 'MESIN_BELAKANG',
                'category' => 'MESIN',
                'label' => 'Mesin Charger - Tampak Belakang',
                'angle' => 'Belakang',
                'is_required' => true,
            ],

            // Panel & Tiang Listrik
            [
                'id' => 'PANEL_DEPAN',
                'category' => 'PANEL_TIANG',
                'label' => 'Panel & Tiang - Tampak Depan',
                'angle' => 'Depan',
                'is_required' => true,
            ],
            [
                'id' => 'PANEL_BELAKANG',
                'category' => 'PANEL_TIANG',
                'label' => 'Panel & Tiang - Tampak Belakang',
                'angle' => 'Belakang',
                'is_required' => true,
            ],
        ];

        foreach ($slots as $slot) {
            ChecklistSlot::updateOrCreate(['id' => $slot['id']], $slot);
        }
    }
}
