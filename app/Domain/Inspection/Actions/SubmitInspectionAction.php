<?php

namespace App\Domain\Inspection\Actions;

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
     * Submit a standardized inspection session with 7-angle photo evidence.
     *
     * @param Station $station
     * @param User $submitter
     * @param array{stage: string, notes?: string, photos: array} $data
     * @return InspectionReport
     */
    public function execute(Station $station, User $submitter, array $data): InspectionReport
    {
        $stage = $data['stage'] ?? 'CONSTRUCTION_PROGRESS';

        // Create new inspection report (non-destructive history)
        $report = InspectionReport::create([
            'station_id' => $station->id,
            'submitted_by' => $submitter->id,
            'approval_status_id' => ApprovalStatus::PENDING_REVIEW,
            'stage' => $stage,
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

                InspectionPhoto::create([
                    'report_id' => $report->id,
                    'checklist_slot_id' => $slotId,
                    'photo_url' => $photoUrl,
                    'latitude' => isset($item['latitude']) ? (float) $item['latitude'] : $station->latitude,
                    'longitude' => isset($item['longitude']) ? (float) $item['longitude'] : $station->longitude,
                    'taken_at' => isset($item['taken_at']) ? $item['taken_at'] : now(),
                    'is_approved' => false,
                    'reviewer_notes' => 'Menunggu verifikasi Direktur / Admin PT SSI',
                ]);
            }
        }

        return $report->fresh(['approvalStatus', 'submitter', 'photos.slot']);
    }
}
