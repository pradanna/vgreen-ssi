<?php

namespace Database\Seeders;

use App\Models\ApprovalStatus;
use Illuminate\Database\Seeder;

class ApprovalStatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            [
                'id' => ApprovalStatus::PENDING_REVIEW,
                'name' => 'Menunggu Verifikasi (Pending)',
            ],
            [
                'id' => ApprovalStatus::APPROVED,
                'name' => 'Disetujui (Approved)',
            ],
            [
                'id' => ApprovalStatus::REVISION_REQUIRED,
                'name' => 'Perlu Revisi (Revision Required)',
            ],
        ];

        foreach ($statuses as $status) {
            ApprovalStatus::updateOrCreate(['id' => $status['id']], $status);
        }
    }
}
