<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'id' => Role::DIRECTOR_SSI,
                'name' => 'Direktur PT SSI',
                'description' => 'Super executive access: full map visibility, analytics, and final verification.',
            ],
            [
                'id' => Role::ADMIN_SSI,
                'name' => 'Admin Operasional PT SSI',
                'description' => 'Operations controller: CRUD stasiun, review survei lapangan, dan penugasan vendor.',
            ],
            [
                'id' => Role::VGREEN_REP,
                'name' => 'Perwakilan V-Green',
                'description' => 'Principal Client access: peta interaktif se-Indonesia dan spesifikasi data terverifikasi.',
            ],
            [
                'id' => Role::FIELD_VENDOR,
                'name' => 'Vendor / Tim Lapangan',
                'description' => 'Field survey team: input kondisi lahan eksisting dan upload foto koordinat via mobile.',
            ],
            [
                'id' => Role::CONSTRUCTION_TEAM,
                'name' => 'Tim Pembangunan',
                'description' => 'Construction team: update progres fisik pembangunan dan foto instalasi mesin/panel.',
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['id' => $role['id']], $role);
        }
    }
}
