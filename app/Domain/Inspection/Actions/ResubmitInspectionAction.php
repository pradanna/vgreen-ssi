<?php

namespace App\Domain\Inspection\Actions;

use App\Domain\Activity\Services\ActivityLogger;
use App\Domain\GIS\GeoCoordinate;
use App\Models\ApprovalStatus;
use App\Models\InspectionPhoto;
use App\Models\InspectionReport;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ResubmitInspectionAction
{
    /**
     * Resubmit a revised inspection session following feedback/rejection.
     *
     * @param InspectionReport $report
     * @param User $submitter
     * @param array $data
     * @return InspectionReport
     */
    public function execute(InspectionReport $report, User $submitter, array $data): InspectionReport
    {
        $station = $report->station;

        // Calculate submission distance to station if coordinates are provided
        $reportLat = isset($data['latitude']) && $data['latitude'] !== null ? (float) $data['latitude'] : $report->latitude;
        $reportLng = isset($data['longitude']) && $data['longitude'] !== null ? (float) $data['longitude'] : $report->longitude;
        $reportDistance = $report->distance_meters;

        if ($reportLat !== null && $reportLng !== null && $station && $station->latitude && $station->longitude) {
            try {
                $coord = new GeoCoordinate($reportLat, $reportLng);
                $reportDistance = $coord->distanceTo((float) $station->latitude, (float) $station->longitude);
            } catch (\Throwable $e) {
                // Keep existing or null
            }
        }

        $report->update([
            'approval_status_id' => ApprovalStatus::PENDING_REVIEW,
            'stage' => $data['stage'] ?? $report->stage,
            'overall_condition' => $data['overall_condition'] ?? $report->overall_condition,
            'physical_condition' => $data['physical_condition'] ?? $report->physical_condition,
            'electrical_condition' => $data['electrical_condition'] ?? $report->electrical_condition,
            'issues_found' => array_key_exists('issues_found', $data) ? $data['issues_found'] : $report->issues_found,
            'machine_conditions' => array_key_exists('machine_conditions', $data) ? $data['machine_conditions'] : $report->machine_conditions,
            'latitude' => $reportLat,
            'longitude' => $reportLng,
            'distance_meters' => $reportDistance,
            'notes' => $data['notes'] ?? $report->notes,
            'rejection_reason' => null,
            'reviewed_by' => null,
            'reviewed_at' => null,
            'submitted_at' => now(),
        ]);

        // Process revised photos
        if (!empty($data['photos']) && is_array($data['photos'])) {
            foreach ($data['photos'] as $item) {
                $slotId = $item['checklist_slot_id'] ?? $item['slot_id'] ?? null;
                if (!$slotId) continue;

                $file = $item['file'] ?? $item['photo'] ?? null;
                $photoUrl = null;

                if ($file instanceof UploadedFile) {
                    $filename = 'inspections/' . ($station ? $station->code : 'REV') . '_' . $slotId . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
                    $path = Storage::disk('public')->putFileAs('', $file, $filename);
                    $photoUrl = Storage::disk('public')->url($path);
                } elseif (!empty($item['photo_url'])) {
                    $photoUrl = $item['photo_url'];
                }

                $photoLat = isset($item['latitude']) && $item['latitude'] !== null ? (float) $item['latitude'] : ($station ? (float) $station->latitude : null);
                $photoLng = isset($item['longitude']) && $item['longitude'] !== null ? (float) $item['longitude'] : ($station ? (float) $station->longitude : null);
                $photoDistance = null;

                if ($photoLat !== null && $photoLng !== null && $station && $station->latitude && $station->longitude) {
                    try {
                        $coord = new GeoCoordinate($photoLat, $photoLng);
                        $photoDistance = $coord->distanceTo((float) $station->latitude, (float) $station->longitude);
                    } catch (\Throwable $e) {
                        // ignore
                    }
                }

                if ($photoUrl) {
                    // Update existing photo for this slot if exists, otherwise create new
                    $existingPhoto = $report->photos()->where('checklist_slot_id', $slotId)->first();
                    if ($existingPhoto) {
                        $existingPhoto->update([
                            'photo_url' => $photoUrl,
                            'latitude' => $photoLat,
                            'longitude' => $photoLng,
                            'distance_meters' => $photoDistance,
                            'taken_at' => isset($item['taken_at']) ? $item['taken_at'] : now(),
                            'is_approved' => false,
                            'reviewer_notes' => 'Menunggu verifikasi revisi',
                        ]);
                    } else {
                        InspectionPhoto::create([
                            'report_id' => $report->id,
                            'checklist_slot_id' => $slotId,
                            'photo_url' => $photoUrl,
                            'latitude' => $photoLat,
                            'longitude' => $photoLng,
                            'distance_meters' => $photoDistance,
                            'taken_at' => isset($item['taken_at']) ? $item['taken_at'] : now(),
                            'is_approved' => false,
                            'reviewer_notes' => 'Menunggu verifikasi revisi',
                        ]);
                    }
                }
            }
        }

        ActivityLogger::log(
            module: 'INSPECTION',
            action: 'INSPECTION_RESUBMITTED',
            description: "Pengajuan ulang revisi inspeksi stasiun {$report->station->code} - {$report->station->name}",
            subject: $report->station,
            properties: [
                'report_id' => $report->id,
                'stage' => $report->stage,
                'overall_condition' => $report->overall_condition,
                'photos_count' => count($data['photos'] ?? []),
            ],
            user: $submitter
        );

        return $report->fresh(['approvalStatus', 'submitter', 'photos.slot', 'station']);
    }
}
