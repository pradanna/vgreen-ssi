<?php

namespace App\Http\Controllers\Api;

use App\Domain\Inspection\Actions\ResubmitInspectionAction;
use App\Domain\Inspection\Actions\SubmitInspectionAction;
use App\Http\Controllers\Controller;
use App\Models\ApprovalStatus;
use App\Models\ChecklistSlot;
use App\Models\InspectionReport;
use App\Models\Station;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MobileInspectionController extends Controller
{
    public function __construct(
        protected SubmitInspectionAction $submitInspectionAction,
        protected ResubmitInspectionAction $resubmitInspectionAction
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
     * Get single station details for field vendor (coordinates, machines, address, PIC).
     */
    public function showStation(Station $station, Request $request): JsonResponse
    {
        $station->load(['facilityType', 'status', 'machines', 'latestInspection.approvalStatus']);

        return response()->json([
            'success' => true,
            'message' => 'Detail stasiun berhasil diambil.',
            'data' => [
                'station' => [
                    'id' => $station->id,
                    'code' => $station->code,
                    'name' => $station->name,
                    'facility_type' => [
                        'id' => $station->facility_type_id,
                        'name' => $station->facilityType?->name ?? $station->facility_type_id,
                    ],
                    'status' => [
                        'id' => $station->status_id,
                        'name' => $station->status?->name ?? $station->status_id,
                        'color_code' => $station->status?->color_code,
                    ],
                    'coordinates' => [
                        'latitude' => (float) $station->latitude,
                        'longitude' => (float) $station->longitude,
                    ],
                    'address' => $station->address,
                    'city' => $station->city,
                    'province' => $station->province,
                    'postal_code' => $station->postal_code,
                    'power_capacity_kw' => $station->power_capacity_kw,
                    'socket_types' => $station->socket_types,
                    'slot_count' => $station->slot_count,
                    'operational_hours' => $station->operational_hours,
                    'vendor_name' => $station->vendor_name,
                    'landlord_name' => $station->landlord_name,
                    'landlord_phone' => $station->landlord_phone,
                    'latest_inspection' => $station->latestInspection ? [
                        'id' => $station->latestInspection->id,
                        'stage' => $station->latestInspection->stage,
                        'approval_status' => $station->latestInspection->approval_status_id,
                        'submitted_at' => $station->latestInspection->submitted_at?->toIso8601String(),
                        'rejection_reason' => $station->latestInspection->rejection_reason,
                    ] : null,
                    'machines' => $station->machines->map(fn($m) => [
                        'id' => $m->id,
                        'name' => $m->name,
                        'brand' => $m->brand,
                        'model_series' => $m->model_series,
                        'serial_number' => $m->serial_number,
                        'power_capacity_kw' => $m->power_capacity_kw,
                        'socket_types' => $m->socket_types,
                        'slot_or_gun_count' => $m->slot_or_gun_count,
                        'status' => $m->status,
                    ]),
                ],
            ],
        ]);
    }

    /**
     * Submit an inspection session with condition assessment & 7-angle photo evidence.
     */
    public function storeInspection(Request $request, Station $station): JsonResponse
    {
        $request->validate([
            'stage' => 'required|string|in:INITIAL_SURVEY,CONSTRUCTION_PROGRESS,COMMISSIONING,ROUTINE_PERIODIC',
            'overall_condition' => 'nullable|string|in:BAIK,CUKUP,RUSAK_RINGAN,RUSAK_BERAT',
            'physical_condition' => 'nullable|string|max:2000',
            'electrical_condition' => 'nullable|string|max:2000',
            'issues_found' => 'nullable|array',
            'issues_found.*' => 'string|max:255',
            'machine_conditions' => 'nullable|array',
            'latitude' => 'nullable|numeric|between:-12.0,7.0',
            'longitude' => 'nullable|numeric|between:94.0,142.0',
            'notes' => 'nullable|string|max:2000',
            'photos' => 'nullable|array',
            'photos.*.slot_id' => 'required_with:photos|string',
            'photos.*.latitude' => 'nullable|numeric|between:-12.0,7.0',
            'photos.*.longitude' => 'nullable|numeric|between:94.0,142.0',
            'photos.*.taken_at' => 'nullable|date',
        ], [
            'stage.required' => 'Tahapan inspeksi wajib dipilih (INITIAL_SURVEY, CONSTRUCTION_PROGRESS, COMMISSIONING, atau ROUTINE_PERIODIC).',
            'stage.in' => 'Tahapan inspeksi yang dipilih tidak valid. Pilihan yang tersedia: INITIAL_SURVEY, CONSTRUCTION_PROGRESS, COMMISSIONING, ROUTINE_PERIODIC.',
            'overall_condition.in' => 'Status kondisi fisik tidak valid. Pilihan yang tersedia: BAIK, CUKUP, RUSAK_RINGAN, RUSAK_BERAT.',
            'physical_condition.max' => 'Deskripsi kondisi fisik lahan maksimal 2000 karakter.',
            'electrical_condition.max' => 'Deskripsi kondisi kelistrikan maksimal 2000 karakter.',
            'latitude.between' => 'Titik koordinat Latitude perangkat berada di luar wilayah Indonesia (-12.0 s/d 7.0).',
            'longitude.between' => 'Titik koordinat Longitude perangkat berada di luar wilayah Indonesia (94.0 s/d 142.0).',
            'photos.*.slot_id.required_with' => 'ID slot sudut foto wajib disertakan.',
            'photos.*.latitude.between' => 'Titik koordinat Latitude foto berada di luar wilayah Indonesia (-12.0 s/d 7.0).',
            'photos.*.longitude.between' => 'Titik koordinat Longitude foto berada di luar wilayah Indonesia (94.0 s/d 142.0).',
            'photos.*.taken_at.date' => 'Format tanggal dan waktu pengambilan foto tidak valid.',
            'notes.max' => 'Catatan lapangan maksimal 2000 karakter.',
        ]);

        $photosData = $this->extractPhotosFromRequest($request, $station);

        $report = $this->submitInspectionAction->execute($station, $request->user(), [
            'stage' => $request->stage,
            'overall_condition' => $request->overall_condition ?? 'BAIK',
            'physical_condition' => $request->physical_condition,
            'electrical_condition' => $request->electrical_condition,
            'issues_found' => $request->issues_found,
            'machine_conditions' => $request->machine_conditions,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'notes' => $request->notes,
            'photos' => $photosData,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Laporan inspeksi & dokumentasi kondisi lapangan berhasil diunggah.',
            'data' => [
                'report_id' => $report->id,
                'station_code' => $station->code,
                'stage' => $report->stage,
                'overall_condition' => $report->overall_condition,
                'distance_meters' => $report->distance_meters,
                'approval_status' => $report->approval_status_id,
                'submitted_at' => $report->submitted_at?->toIso8601String(),
                'photos_count' => $report->photos->count(),
            ],
        ], 201);
    }

    /**
     * Get history of inspection reports submitted by vendor.
     */
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = InspectionReport::with([
            'station:id,code,name,city,province,status_id',
            'approvalStatus',
            'photos:id,report_id,checklist_slot_id,photo_url,is_approved',
        ]);

        // Non-admin users only see reports they submitted
        if (!in_array($user->role_id, ['DIRECTOR_SSI', 'ADMIN_SSI'])) {
            $query->where('submitted_by', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('approval_status_id', $request->status);
        }

        if ($request->filled('stage')) {
            $query->where('stage', $request->stage);
        }

        if ($request->filled('station_id')) {
            $query->where('station_id', $request->station_id);
        }

        $reports = $query->latest('submitted_at')->get()->map(function ($report) {
            return [
                'id' => $report->id,
                'station' => [
                    'id' => $report->station?->id,
                    'code' => $report->station?->code,
                    'name' => $report->station?->name,
                    'city' => $report->station?->city,
                    'province' => $report->station?->province,
                ],
                'stage' => $report->stage,
                'overall_condition' => $report->overall_condition,
                'approval_status' => [
                    'id' => $report->approval_status_id,
                    'name' => $report->approvalStatus?->name ?? $report->approval_status_id,
                ],
                'photos_count' => $report->photos->count(),
                'distance_meters' => $report->distance_meters,
                'submitted_at' => $report->submitted_at?->toIso8601String(),
                'reviewed_at' => $report->reviewed_at?->toIso8601String(),
                'rejection_reason' => $report->rejection_reason,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Riwayat laporan inspeksi berhasil diambil.',
            'data' => [
                'total' => $reports->count(),
                'reports' => $reports,
            ],
        ]);
    }

    /**
     * Check status and full details of an inspection report.
     */
    public function getInspectionStatus(InspectionReport $report): JsonResponse
    {
        $report->load(['station.facilityType', 'station.status', 'approvalStatus', 'reviewer', 'photos.slot']);

        return response()->json([
            'success' => true,
            'message' => 'Detail laporan inspeksi berhasil diambil.',
            'data' => [
                'report_id' => $report->id,
                'station' => [
                    'id' => $report->station->id,
                    'code' => $report->station->code,
                    'name' => $report->station->name,
                    'facility_type' => $report->station->facilityType?->name,
                    'status' => $report->station->status?->name,
                ],
                'stage' => $report->stage,
                'overall_condition' => $report->overall_condition,
                'physical_condition' => $report->physical_condition,
                'electrical_condition' => $report->electrical_condition,
                'issues_found' => $report->issues_found ?: [],
                'machine_conditions' => $report->machine_conditions ?: [],
                'submission_gps' => [
                    'latitude' => $report->latitude,
                    'longitude' => $report->longitude,
                    'distance_meters' => $report->distance_meters,
                ],
                'approval_status' => [
                    'id' => $report->approval_status_id,
                    'name' => $report->approvalStatus?->name ?? $report->approval_status_id,
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
                    'reviewer_notes' => $p->reviewer_notes,
                    'gps_tag' => [
                        'latitude' => (float) $p->latitude,
                        'longitude' => (float) $p->longitude,
                        'distance_meters' => $p->distance_meters,
                    ],
                    'taken_at' => $p->taken_at?->toIso8601String(),
                ]),
            ],
        ]);
    }

    /**
     * Resubmit an inspection session following revision request.
     */
    public function resubmitInspection(Request $request, InspectionReport $report): JsonResponse
    {
        $user = $request->user();

        // Check ownership if not admin/director
        if (!in_array($user->role_id, ['DIRECTOR_SSI', 'ADMIN_SSI']) && $report->submitted_by !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki hak akses untuk merevisi laporan ini.',
                'data' => null,
            ], 403);
        }

        // Verify report is in revisable status
        if ($report->approval_status_id === ApprovalStatus::APPROVED) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan inspeksi ini sudah disetujui (APPROVED) dan tidak dapat direvisi kembali.',
                'data' => null,
            ], 400);
        }

        $request->validate([
            'stage' => 'nullable|string|in:INITIAL_SURVEY,CONSTRUCTION_PROGRESS,COMMISSIONING,ROUTINE_PERIODIC',
            'overall_condition' => 'nullable|string|in:BAIK,CUKUP,RUSAK_RINGAN,RUSAK_BERAT',
            'physical_condition' => 'nullable|string|max:2000',
            'electrical_condition' => 'nullable|string|max:2000',
            'issues_found' => 'nullable|array',
            'machine_conditions' => 'nullable|array',
            'latitude' => 'nullable|numeric|between:-12.0,7.0',
            'longitude' => 'nullable|numeric|between:94.0,142.0',
            'notes' => 'nullable|string|max:2000',
            'photos' => 'nullable|array',
            'photos.*.slot_id' => 'required_with:photos|string',
        ], [
            'stage.in' => 'Tahapan inspeksi yang dipilih tidak valid. Pilihan yang tersedia: INITIAL_SURVEY, CONSTRUCTION_PROGRESS, COMMISSIONING, ROUTINE_PERIODIC.',
            'overall_condition.in' => 'Status kondisi fisik tidak valid. Pilihan yang tersedia: BAIK, CUKUP, RUSAK_RINGAN, RUSAK_BERAT.',
            'physical_condition.max' => 'Deskripsi kondisi fisik lahan maksimal 2000 karakter.',
            'electrical_condition.max' => 'Deskripsi kondisi kelistrikan maksimal 2000 karakter.',
            'latitude.between' => 'Titik koordinat Latitude perangkat berada di luar wilayah Indonesia (-12.0 s/d 7.0).',
            'longitude.between' => 'Titik koordinat Longitude perangkat berada di luar wilayah Indonesia (94.0 s/d 142.0).',
            'notes.max' => 'Catatan revisi maksimal 2000 karakter.',
        ]);

        $station = $report->station;
        $photosData = $this->extractPhotosFromRequest($request, $station);

        $updatedReport = $this->resubmitInspectionAction->execute($report, $user, [
            'stage' => $request->stage ?? $report->stage,
            'overall_condition' => $request->overall_condition ?? $report->overall_condition,
            'physical_condition' => $request->physical_condition ?? $report->physical_condition,
            'electrical_condition' => $request->electrical_condition ?? $report->electrical_condition,
            'issues_found' => $request->issues_found ?? $report->issues_found,
            'machine_conditions' => $request->machine_conditions ?? $report->machine_conditions,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'notes' => $request->notes ?? $report->notes,
            'photos' => $photosData,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Revisi laporan inspeksi berhasil dikirim ulang.',
            'data' => [
                'report_id' => $updatedReport->id,
                'approval_status' => $updatedReport->approval_status_id,
                'submitted_at' => $updatedReport->submitted_at?->toIso8601String(),
                'photos_count' => $updatedReport->photos->count(),
            ],
        ]);
    }

    /**
     * Get 7-Angle standardized checklist slots reference for mobile UI.
     */
    public function checklistSlots(): JsonResponse
    {
        $slots = ChecklistSlot::orderBy('category')->orderBy('id')->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar 7 sudut foto terstandarisasi berhasil diambil.',
            'data' => [
                'slots' => $slots,
            ],
        ]);
    }

    /**
     * Helper to extract photos from both multipart and structured array requests.
     */
    private function extractPhotosFromRequest(Request $request, Station $station): array
    {
        $photosData = [];
        $allSlots = ChecklistSlot::pluck('id')->toArray();

        // 1. Multipart files keyed by photo_{slot_id}
        foreach ($allSlots as $slotId) {
            if ($request->hasFile("photo_{$slotId}")) {
                $request->validate([
                    "photo_{$slotId}" => 'file|image|mimes:jpeg,png,jpg,webp|max:10240',
                ], [
                    "photo_{$slotId}.image" => "Berkas foto untuk sudut {$slotId} harus berupa gambar.",
                    "photo_{$slotId}.mimes" => "Berkas foto untuk sudut {$slotId} harus berformat JPG, JPEG, PNG, atau WEBP.",
                    "photo_{$slotId}.max" => "Ukuran berkas foto sudut {$slotId} maksimal adalah 10MB.",
                ]);

                $file = $request->file("photo_{$slotId}");
                $photosData[] = [
                    'checklist_slot_id' => $slotId,
                    'file' => $file,
                    'latitude' => $request->input("lat_{$slotId}", $request->input('latitude', $station->latitude)),
                    'longitude' => $request->input("lng_{$slotId}", $request->input('longitude', $station->longitude)),
                    'taken_at' => $request->input("taken_at_{$slotId}", now()->toDateTimeString()),
                ];
            }
        }

        // 2. Structured array of photos payload
        if ($request->has('photos') && is_array($request->photos)) {
            $request->validate([
                'photos.*.file' => 'nullable|file|image|mimes:jpeg,png,jpg,webp|max:10240',
            ], [
                'photos.*.file.image' => 'Berkas foto yang diunggah harus berupa gambar.',
                'photos.*.file.mimes' => 'Format berkas foto harus berformat JPG, JPEG, PNG, atau WEBP.',
                'photos.*.file.max' => 'Ukuran berkas foto maksimal adalah 10MB.',
            ]);

            foreach ($request->photos as $idx => $photoItem) {
                $file = $request->file("photos.{$idx}.file") ?? ($photoItem['file'] ?? null);
                $photosData[] = [
                    'checklist_slot_id' => $photoItem['slot_id'],
                    'file' => $file,
                    'photo_url' => $photoItem['photo_url'] ?? null,
                    'latitude' => $photoItem['latitude'] ?? $request->input('latitude', $station->latitude),
                    'longitude' => $photoItem['longitude'] ?? $request->input('longitude', $station->longitude),
                    'taken_at' => $photoItem['taken_at'] ?? now()->toDateTimeString(),
                ];
            }
        }

        // 3. Fallback mock sample if no file is provided in demo/testing
        if (empty($photosData) && !$request->has('photos')) {
            foreach ($allSlots as $slotId) {
                $photosData[] = [
                    'checklist_slot_id' => $slotId,
                    'photo_url' => 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
                    'latitude' => (float) $station->latitude,
                    'longitude' => (float) $station->longitude,
                    'taken_at' => now()->toDateTimeString(),
                ];
            }
        }

        return $photosData;
    }
}
