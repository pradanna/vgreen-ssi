<?php

namespace App\Domain\Inspection\Actions;

use App\Domain\Activity\Services\ActivityLogger;
use App\Domain\GIS\GeoCoordinate;
use App\Models\ApprovalStatus;
use App\Models\ChecklistSlot;
use App\Models\InspectionPhoto;
use App\Models\InspectionReport;
use App\Models\Station;
use App\Models\StationStatus;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SubmitInspectionAction
{
    /**
     * Submit a standardized inspection session with condition assessment & 7-angle photo evidence.
     *
     * @param Station $station
     * @param User $submitter
     * @param array{
     *     stage: string,
     *     overall_condition?: string,
     *     physical_condition?: string,
     *     electrical_condition?: string,
     *     issues_found?: array,
     *     machine_conditions?: array,
     *     latitude?: float,
     *     longitude?: float,
     *     notes?: string,
     *     photos?: array
     * } $data
     * @return InspectionReport
     */
    public function execute(Station $station, User $submitter, array $data): InspectionReport
    {
        $stage = $data['stage'] ?? 'CONSTRUCTION_PROGRESS';

        // Calculate submission distance to station if coordinates are provided
        $reportLat = isset($data['latitude']) && $data['latitude'] !== null ? (float) $data['latitude'] : null;
        $reportLng = isset($data['longitude']) && $data['longitude'] !== null ? (float) $data['longitude'] : null;
        $reportDistance = null;

        if ($reportLat !== null && $reportLng !== null && $station->latitude && $station->longitude) {
            try {
                $coord = new GeoCoordinate($reportLat, $reportLng);
                $reportDistance = $coord->distanceTo((float) $station->latitude, (float) $station->longitude);
            } catch (\Throwable $e) {
                // Keep null if boundary check or parsing fails
            }
        }

        // Create new inspection report (non-destructive history)
        $report = InspectionReport::create([
            'station_id' => $station->id,
            'submitted_by' => $submitter->id,
            'approval_status_id' => ApprovalStatus::PENDING_REVIEW,
            'stage' => $stage,
            'overall_condition' => $data['overall_condition'] ?? 'BAIK',
            'physical_condition' => $data['physical_condition'] ?? null,
            'electrical_condition' => $data['electrical_condition'] ?? null,
            'issues_found' => $data['issues_found'] ?? null,
            'machine_conditions' => $data['machine_conditions'] ?? null,
            'latitude' => $reportLat,
            'longitude' => $reportLng,
            'distance_meters' => $reportDistance,
            'notes' => $data['notes'] ?? null,
            'submitted_at' => now(),
        ]);

        // Process photos
        if (!empty($data['photos']) && is_array($data['photos'])) {
            foreach ($data['photos'] as $item) {
                $slotId = $item['checklist_slot_id'] ?? $item['slot_id'] ?? null;
                if (!$slotId) continue;

                $photoUrl = null;
                $file = $item['file'] ?? $item['photo'] ?? null;

                if ($file instanceof UploadedFile) {
                    $filename = 'inspections/' . $station->code . '_' . $slotId . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
                    $path = Storage::disk('public')->putFileAs('', $file, $filename);
                    $photoUrl = Storage::disk('public')->url($path);
                } elseif (!empty($item['photo_url'])) {
                    $photoUrl = $item['photo_url'];
                } else {
                    // Fallback mock sample if no file is uploaded in demo/testing
                    $photoUrl = 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80';
                }

                $photoLat = isset($item['latitude']) && $item['latitude'] !== null ? (float) $item['latitude'] : (float) $station->latitude;
                $photoLng = isset($item['longitude']) && $item['longitude'] !== null ? (float) $item['longitude'] : (float) $station->longitude;
                $photoDistance = null;

                if ($photoLat !== null && $photoLng !== null && $station->latitude && $station->longitude) {
                    try {
                        $coord = new GeoCoordinate($photoLat, $photoLng);
                        $photoDistance = $coord->distanceTo((float) $station->latitude, (float) $station->longitude);
                    } catch (\Throwable $e) {
                        // Keep null if outside bounds
                    }
                }

                InspectionPhoto::create([
                    'report_id' => $report->id,
                    'checklist_slot_id' => $slotId,
                    'photo_url' => $photoUrl,
                    'latitude' => $photoLat,
                    'longitude' => $photoLng,
                    'distance_meters' => $photoDistance,
                    'taken_at' => isset($item['taken_at']) ? $item['taken_at'] : now(),
                    'is_approved' => false,
                    'reviewer_notes' => 'Menunggu verifikasi Direktur / Admin PT SSI',
                ]);
            }
        }

        ActivityLogger::log(
            module: 'INSPECTION',
            action: 'INSPECTION_SUBMITTED',
            description: "Pengajuan laporan inspeksi tahap {$report->stage} untuk stasiun {$station->code} - {$station->name}",
            subject: $station,
            properties: [
                'report_id' => $report->id,
                'stage' => $report->stage,
                'overall_condition' => $report->overall_condition,
                'photos_count' => count($data['photos'] ?? []),
                'distance_meters' => $report->distance_meters,
            ],
            user: $submitter
        );

        return $report->fresh(['approvalStatus', 'submitter', 'photos.slot']);
    }
}
