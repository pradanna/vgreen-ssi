<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            FacilityTypeSeeder::class,
            StationStatusSeeder::class,
            ChecklistSlotSeeder::class,
            ApprovalStatusSeeder::class,
            UserSeeder::class,
            MachineMasterSeeder::class,
            StationSeeder::class,
            ProvinceTargetSeeder::class,
        ]);
    }
}
