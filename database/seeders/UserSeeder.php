<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Bambang Soediro (Direktur)',
                'email' => 'direktur@ssi.co.id',
                'password' => Hash::make('password123'),
                'role_id' => Role::DIRECTOR_SSI,
                'phone_number' => '+628111222333',
                'organization' => 'PT SSI',
            ],
            [
                'name' => 'Rian Pratama (Admin Ops)',
                'email' => 'admin@ssi.co.id',
                'password' => Hash::make('password123'),
                'role_id' => Role::ADMIN_SSI,
                'phone_number' => '+628122334455',
                'organization' => 'PT SSI',
            ],
            [
                'name' => 'Nguyen Van Linh (V-Green Principal)',
                'email' => 'vgreen@vgreen.vn',
                'password' => Hash::make('password123'),
                'role_id' => Role::VGREEN_REP,
                'phone_number' => '+84901234567',
                'organization' => 'V-Green',
            ],
            [
                'name' => 'Ahmad Fauzi (Surveyor Lapangan)',
                'email' => 'vendor@mitra.co.id',
                'password' => Hash::make('password123'),
                'role_id' => Role::FIELD_VENDOR,
                'phone_number' => '+628567891011',
                'organization' => 'PT Mitra Elektrik Nusantara',
            ],
            [
                'name' => 'Budi Setiawan (Kontraktor Sipil)',
                'email' => 'konstruksi@mitra.co.id',
                'password' => Hash::make('password123'),
                'role_id' => Role::CONSTRUCTION_TEAM,
                'phone_number' => '+628571234567',
                'organization' => 'PT Konstruksi Jaya Utama',
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(['email' => $user['email']], $user);
        }
    }
}
