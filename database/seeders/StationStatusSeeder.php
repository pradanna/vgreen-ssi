<?php

namespace Database\Seeders;

use App\Models\StationStatus;
use Illuminate\Database\Seeder;

class StationStatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            [
                'id' => StationStatus::OPERATIONAL,
                'name' => 'Operasional / Siap',
                'color_code' => '#22C55E', // Green
                'step_order' => 4,
            ],
            [
                'id' => StationStatus::CONSTRUCTION,
                'name' => 'In Progress',
                'color_code' => '#F97316', // Orange
                'step_order' => 3,
            ],
            [
                'id' => StationStatus::SURVEYED,
                'name' => 'Tahap Survei / Penilaian',
                'color_code' => '#EAB308', // Yellow
                'step_order' => 2,
            ],
            [
                'id' => StationStatus::ON_HOLD,
                'name' => 'Kendala / On-Hold',
                'color_code' => '#EF4444', // Red
                'step_order' => 1,
            ],
        ];

        foreach ($statuses as $status) {
            StationStatus::updateOrCreate(['id' => $status['id']], $status);
        }
    }
}
