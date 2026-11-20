<?php

namespace App\Domain\Inspection\Actions;

use App\Domain\Activity\Services\ActivityLogger;
use App\Models\ApprovalStatus;
use App\Models\InspectionReport;
use App\Models\Station;
use App\Models\StationStatus;
use App\Models\User;

class ReviewInspectionAction
{
    public function execute(InspectionReport $report, User $reviewer, string $verdict, ?string $notes = null): InspectionReport
    {
        $station = $report->station;

        if ($verdict === 'APPROVE') {
            $report->update([
                'approval_status_id' => ApprovalStatus::APPROVED,
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
                'notes' => $notes ?: 'Dokumentasi 7 sudut lapangan terverifikasi oleh ' . $reviewer->name,
                'rejection_reason' => null,
            ]);

            // Set all photos to approved
            $report->photos()->update(['is_approved' => true]);

            // If commissioning report or construction stage is approved, update station to OPERATIONAL
            if ($report->stage === 'COMMISSIONING' || $station->status_id === StationStatus::CONSTRUCTION) {
                $station->update([
                    'status_id' => StationStatus::OPERATIONAL,
                    'commissioning_date' => now(),
                ]);
            } elseif ($report->stage === 'INITIAL_SURVEY' || $station->status_id === StationStatus::SURVEYED) {
                $station->update([
                    'status_id' => StationStatus::CONSTRUCTION,
                ]);
            }
        } else {
            $report->update([
                'approval_status_id' => ApprovalStatus::REVISION_REQUIRED,
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
                'rejection_reason' => $notes ?: 'Perlu perbaikan dokumentasi atau kondisi teknis di lapangan.',
            ]);

            // Station placed ON_HOLD awaiting contractor revisions
            $station->update([
                'status_id' => StationStatus::ON_HOLD,
            ]);
        }

        ActivityLogger::log(
            module: 'INSPECTION',
            action: 'INSPECTION_REVIEWED',
            description: $verdict === 'APPROVE'
                ? "Menyetujui (Approve) laporan inspeksi stasiun {$station->code} - {$station->name}"
                : "Menolak & meminta revisi laporan inspeksi stasiun {$station->code} - {$station->name}",
            subject: $station,
            properties: [
                'report_id' => $report->id,
                'verdict' => $verdict,
                'approval_status_id' => $report->approval_status_id,
                'notes' => $notes,
                'new_station_status_id' => $station->status_id,
            ],
            user: $reviewer
        );

        return $report->fresh(['approvalStatus', 'reviewer', 'photos']);
    }
}
