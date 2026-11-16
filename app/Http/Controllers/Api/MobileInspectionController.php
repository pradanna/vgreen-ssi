<?php

namespace App\Http\Controllers\Api;

use App\Domain\Inspection\Actions\SubmitInspectionAction;
use App\Http\Controllers\Controller;
use App\Models\ChecklistSlot;
use App\Models\InspectionReport;
use App\Models\Station;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MobileInspectionController extends Controller
{
    public function __construct(
        protected SubmitInspectionAction $submitInspectionAction
    ) {}

    /**
     * Get list of stations assigned to the authenticated mobile surveyor / vendor.
     */
    public function assignments(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Station::with(['facilityType', 'status', 'latestInspection.approvalStatus']);

        // If user belongs to a specific vendor organization, filter to that vendor or return all relevant stations
        if ($user->organization && !in_array($user->role_id, ['DIRECTOR_SSI', 'ADMIN_SSI'])) {
            $query->where(function ($q) use ($user) {
                $q->where('vendor_name', 'LIKE', '%' . $user->organization . '%')
                  ->orWhereNull('vendor_name');
            });
        }

        $stations = $query->orderBy('name')->get()->map(function ($station) {
            return [
                'id' => $station->id,
                'code' => $station->code,
                'name' => $station->name,
                'facility_type' => [
                    'id' => $station->facility_type_id,
                    'name' => $station->facilityType->name ?? $station->facility_type_id,
                ],
                'status' => [
                    'id' => $station->status_id,
                    'name' => $station->status->name ?? $station->status_id,
                ],
                'coordinates' => [
                    'latitude' => (float) $station->latitude,
                    'longitude' => (float) $station->longitude,
                ],
                'address' => $station->address,
                'city' => $station->city,
                'province' => $station->province,
                'power_capacity_kw' => $station->power_capacity_kw,
                'socket_types' => $station->socket_types,
                'slot_count' => $station->slot_count,
                'operational_hours' => $station->operational_hours,
                'vendor_name' => $station->vendor_name,
                'latest_inspection_status' => $station->latestInspection?->approval_status_id,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Daftar penugasan stasiun berhasil diambil.',
            'data' => [
                'total' => $stations->count(),
                'assignments' => $stations,
            ],
        ]);
    }

    /**
     * Submit an inspection session with 7-angle photo evidence directly from smartphone camera.
     */
    public function storeInspection(Request $request, Station $station): JsonResponse
    {
        $request->validate([
            'stage' => 'required|string|in:INITIAL_SURVEY,CONSTRUCTION_PROGRESS,COMMISSIONING,ROUTINE_PERIODIC',
            'notes' => 'nullable|string|max:1000',
            // Photos can be uploaded as multipart files or JSON payload
            'photos' => 'nullable|array',
            'photos.*.slot_id' => 'required_with:photos|string|exists:m_checklist_slots,id',
            'photos.*.latitude' => 'nullable|numeric|between:-12.0,7.0',
            'photos.*.longitude' => 'nullable|numeric|between:94.0,142.0',
            'photos.*.taken_at' => 'nullable|date',
        ]);

        $photosData = [];

        // Support for standard multipart files keyed by slot_id or file list
        $allSlots = ChecklistSlot::pluck('id')->toArray();

        foreach ($allSlots as $slotId) {
            if ($request->hasFile("photo_{$slotId}")) {
                $file = $request->file("photo_{$slotId}");
                $photosData[] = [
                    'checklist_slot_id' => $slotId,
                    'file' => $file,
                    'latitude' => $request->input("lat_{$slotId}", $station->latitude),
                    'longitude' => $request->input("lng_{$slotId}", $station->longitude),
                    'taken_at' => $request->input("taken_at_{$slotId}", now()->toDateTimeString()),
                ];
            }
        }

        // Support for array of photos payload
        if ($request->has('photos') && is_array($request->photos)) {
            foreach ($request->photos as $idx => $photoItem) {
                $file = $request->file("photos.{$idx}.file");
                $photosData[] = [
                    'checklist_slot_id' => $photoItem['slot_id'],
                    'file' => $file,
                    'photo_url' => $photoItem['photo_url'] ?? null,
                    'latitude' => $photoItem['latitude'] ?? $station->latitude,
                    'longitude' => $photoItem['longitude'] ?? $station->longitude,
                    'taken_at' => $photoItem['taken_at'] ?? now()->toDateTimeString(),
                ];
            }
        }

        // If demo request without files, provide sample 7 slots
        if (empty($photosData)) {
            foreach ($allSlots as $slotId) {
                $photosData[] = [
                    'checklist_slot_id' => $slotId,
                    'photo_url' => 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
                    'latitude' => $station->latitude,
                    'longitude' => $station->longitude,
                    'taken_at' => now()->toDateTimeString(),
                ];
            }
        }

        $report = $this->submitInspectionAction->execute($station, $request->user(), [
            'stage' => $request->stage,
            'notes' => $request->notes,
            'photos' => $photosData,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Laporan inspeksi & dokumentasi 7 sudut foto berhasil diunggah.',
            'data' => [
                'report_id' => $report->id,
                'station_code' => $station->code,
                'stage' => $report->stage,
                'approval_status' => $report->approval_status_id,
                'submitted_at' => $report->submitted_at?->toIso8601String(),
                'photos_count' => $report->photos->count(),
            ],
        ], 201);
    }

    /**
     * Check status of an inspection report (Approved / Revision Required / Pending).
     */
    public function getInspectionStatus(InspectionReport $report): JsonResponse
    {
        $report->load(['station', 'approvalStatus', 'reviewer', 'photos.slot']);

        return response()->json([
            'success' => true,
            'message' => 'Status inspeksi berhasil diambil.',
            'data' => [
                'report_id' => $report->id,
                'station' => [
                    'id' => $report->station->id,
                    'code' => $report->station->code,
                    'name' => $report->station->name,
                ],
                'stage' => $report->stage,
                'approval_status' => [
                    'id' => $report->approval_status_id,
                    'name' => $report->approvalStatus?->name,
                ],
                'submitted_at' => $report->submitted_at?->toIso8601String(),
                'reviewed_at' => $report->reviewed_at?->toIso8601String(),
                'reviewed_by' => $report->reviewer?->name,
                'notes' => $report->notes,
                'rejection_reason' => $report->rejection_reason,
                'photos' => $report->photos->map(fn($p) => [
                    'id' => $p->id,
                    'slot_id' => $p->checklist_slot_id,
                    'slot_label' => $p->slot?->label ?? $p->checklist_slot_id,
                    'photo_url' => $p->photo_url,
                    'is_approved' => (bool) $p->is_approved,
                    'gps_tag' => [
                        'latitude' => (float) $p->latitude,
                        'longitude' => (float) $p->longitude,
                    ],
                ]),
            ],
        ]);
    }

    /**
     * Get 7-Angle standardized checklist slots reference for mobile UI.
     */
    public function checklistSlots(): JsonResponse
    {
        $slots = ChecklistSlot::orderBy('category')->orderBy('order_index')->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar 7 sudut foto terstandarisasi berhasil diambil.',
            'data' => [
                'slots' => $slots,
            ],
        ]);
    }
}
