<?php

namespace Database\Seeders;

use App\Models\FacilityType;
use Illuminate\Database\Seeder;

class FacilityTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'id' => FacilityType::EVCS,
                'name' => 'EVCS (Mobil Listrik)',
                'icon_name' => 'car',
                'description' => 'Electric Vehicle Charging Station khusus mobil listrik (AC/DC Fast Charging).',
            ],
            [
                'id' => FacilityType::BSS,
                'name' => 'BSS (Motor Listrik)',
                'icon_name' => 'battery-charging',
                'description' => 'Battery Swapping Station khusus motor listrik dengan kabinet tukar baterai.',
            ],
            [
                'id' => FacilityType::COMBINED,
                'name' => 'Kombinasi (EVCS + BSS)',
                'icon_name' => 'zap',
                'description' => 'Hub pengisian terpadu yang melayani pengisian mobil sekaligus penukaran baterai motor.',
            ],
        ];

        foreach ($types as $type) {
            FacilityType::updateOrCreate(['id' => $type['id']], $type);
        }
    }
}
