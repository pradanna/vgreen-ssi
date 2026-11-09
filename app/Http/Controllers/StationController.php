<?php

namespace App\Http\Controllers;

use App\Models\ApprovalStatus;
use App\Models\FacilityType;
use App\Models\InspectionPhoto;
use App\Models\InspectionReport;
use App\Models\Role;
use App\Models\Station;
use App\Models\StationStatus;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StationController extends Controller
{
    /**
     * Display the GIS Map & Dashboard with role-projected data.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $isVGreen = $user && $user->role_id === Role::VGREEN_REP;
        $isInternal = $user && in_array($user->role_id, [Role::DIRECTOR_SSI, Role::ADMIN_SSI]);

        // Base query with relations
        $query = Station::with([
            'facilityType',
            'status',
            'latestInspection.submitter',
            'latestInspection.approvalStatus',
            'latestInspection.photos.slot',
        ]);

        $rawStations = $query->get();

        // Project data based on role
        $stations = $rawStations->map(function ($station) use ($isVGreen) {
            $latestInspection = $station->latestInspection;

            if ($isVGreen) {
                // Client-facing presentation: sanitize internal operational details
                $verifiedPhotos = $latestInspection 
                    ? $latestInspection->photos->where('is_approved', true)->values()
                    : collect();

                return [
                    'id' => $station->id,
                    'code' => $station->code,
                    'name' => $station->name,
                    'facility_type_id' => $station->facility_type_id,
                    'facility_type' => $station->facilityType,
                    'status_id' => $station->status_id,
                    'status' => $station->status,
                    'latitude' => (float) $station->latitude,
                    'longitude' => (float) $station->longitude,
                    'address' => $station->address,
                    'city' => $station->city,
                    'province' => $station->province,
                    'postal_code' => $station->postal_code,
                    'power_capacity_kw' => $station->power_capacity_kw,
                    'socket_types' => $station->socket_types,
                    'slot_count' => $station->slot_count,
                    'operational_hours' => $station->operational_hours,
                    'amenities' => $station->amenities ?? [],
                    'commissioning_date' => $station->commissioning_date?->format('d M Y'),
                    'target_completion_date' => $station->target_completion_date?->format('d M Y'),
                    'is_verified' => $latestInspection && $latestInspection->approval_status_id === ApprovalStatus::APPROVED,
                    'verified_photos' => $verifiedPhotos->map(function ($photo) {
                        return [
                            'slot_id' => $photo->checklist_slot_id,
                            'slot_label' => $photo->slot?->label ?? $photo->checklist_slot_id,
                            'category' => $photo->slot?->category ?? 'LAHAN',
                            'photo_url' => $photo->photo_url,
                            'taken_at' => $photo->taken_at?->format('d M Y H:i'),
                        ];
                    }),
                ];
            }

            // Internal Management (Direktur & Admin SSI): Granular operational view
            return [
                'id' => $station->id,
                'code' => $station->code,
                'name' => $station->name,
                'facility_type_id' => $station->facility_type_id,
                'facility_type' => $station->facilityType,
                'status_id' => $station->status_id,
                'status' => $station->status,
                'latitude' => (float) $station->latitude,
                'longitude' => (float) $station->longitude,
                'address' => $station->address,
                'city' => $station->city,
                'province' => $station->province,
                'postal_code' => $station->postal_code,
                'power_capacity_kw' => $station->power_capacity_kw,
                'socket_types' => $station->socket_types,
                'slot_count' => $station->slot_count,
                'operational_hours' => $station->operational_hours,
                'amenities' => $station->amenities ?? [],
                'survey_date' => $station->survey_date?->format('d M Y'),
                'construction_start_date' => $station->construction_start_date?->format('d M Y'),
                'target_completion_date' => $station->target_completion_date?->format('d M Y'),
                'commissioning_date' => $station->commissioning_date?->format('d M Y'),
                'vendor_name' => $station->vendor_name,
                'pln_meter_id' => $station->pln_meter_id,
                'internal_notes' => $station->internal_notes,
                'latest_inspection' => $latestInspection ? [
                    'id' => $latestInspection->id,
                    'stage' => $latestInspection->stage,
                    'approval_status_id' => $latestInspection->approval_status_id,
                    'approval_status_name' => $latestInspection->approvalStatus?->name,
                    'submitted_by_name' => $latestInspection->submitter?->name,
                    'submitted_at' => $latestInspection->submitted_at?->format('d M Y H:i'),
                    'reviewed_at' => $latestInspection->reviewed_at?->format('d M Y H:i'),
                    'notes' => $latestInspection->notes,
                    'rejection_reason' => $latestInspection->rejection_reason,
                    'photos' => $latestInspection->photos->map(function ($photo) {
                        return [
                            'id' => $photo->id,
                            'slot_id' => $photo->checklist_slot_id,
                            'slot_label' => $photo->slot?->label ?? $photo->checklist_slot_id,
                            'category' => $photo->slot?->category ?? 'LAHAN',
                            'angle' => $photo->slot?->angle ?? 'Depan',
                            'photo_url' => $photo->photo_url,
                            'latitude' => (float) $photo->latitude,
                            'longitude' => (float) $photo->longitude,
                            'taken_at' => $photo->taken_at?->format('d M Y H:i'),
                            'is_approved' => (bool) $photo->is_approved,
                            'reviewer_notes' => $photo->reviewer_notes,
                        ];
                    }),
                ] : null,
            ];
        });

        // Statistics Summary
        $stats = [
            'total' => $rawStations->count(),
            'operational' => $rawStations->where('status_id', StationStatus::OPERATIONAL)->count(),
            'construction' => $rawStations->where('status_id', StationStatus::CONSTRUCTION)->count(),
            'surveyed' => $rawStations->where('status_id', StationStatus::SURVEYED)->count(),
            'on_hold' => $rawStations->where('status_id', StationStatus::ON_HOLD)->count(),
            'evcs' => $rawStations->where('facility_type_id', FacilityType::EVCS)->count(),
            'bss' => $rawStations->where('facility_type_id', FacilityType::BSS)->count(),
            'combined' => $rawStations->where('facility_type_id', FacilityType::COMBINED)->count(),
        ];

        return Inertia::render('Dashboard', [
            'stations' => $stations,
            'stats' => $stats,
            'facilityTypes' => FacilityType::all(),
            'stationStatuses' => StationStatus::orderBy('step_order', 'desc')->get(),
            'availableRoles' => Role::all(),
            'googleMapsApiKey' => env('VITE_GOOGLE_MAPS_API_KEY', ''),
        ]);
    }

    /**
     * Switch Demo Role (for testing and stakeholder review)
     */
    public function switchRole(Request $request)
    {
        $request->validate([
            'role_id' => 'required|exists:m_roles,id',
        ]);

        $targetUser = User::where('role_id', $request->role_id)->first();
        if ($targetUser) {
            Auth::login($targetUser);
        }

        return redirect()->route('dashboard')->with('success', 'Peran berhasil dialihkan ke ' . ($targetUser->role->name ?? $request->role_id));
    }

    /**
     * Review / Approve or Reject an Inspection Report (Direktur & Admin SSI only)
     */
    public function reviewInspection(Request $request, Station $station, InspectionReport $report)
    {
        $user = $request->user();
        if (!in_array($user->role_id, [Role::DIRECTOR_SSI, Role::ADMIN_SSI])) {
            abort(403, 'Hanya Direktur atau Admin PT SSI yang memiliki wewenang verifikasi.');
        }

        $request->validate([
            'action' => 'required|in:APPROVE,REJECT',
            'notes' => 'nullable|string|max:1000',
        ]);

        $action = $request->action;

        if ($action === 'APPROVE') {
            $report->update([
                'approval_status_id' => ApprovalStatus::APPROVED,
                'reviewed_by' => $user->id,
                'reviewed_at' => now(),
                'notes' => $request->notes ?? 'Dokumentasi 7 sudut lapangan terverifikasi oleh ' . $user->name,
                'rejection_reason' => null,
            ]);

            // Set all photos to approved
            $report->photos()->update(['is_approved' => true]);

            // If commissioning report is approved, update station to OPERATIONAL
            if ($report->stage === 'COMMISSIONING' || $station->status_id === StationStatus::CONSTRUCTION) {
                $station->update([
                    'status_id' => StationStatus::OPERATIONAL,
                    'commissioning_date' => now(),
                ]);
            }
        } else {
            $report->update([
                'approval_status_id' => ApprovalStatus::REVISION_REQUIRED,
                'reviewed_by' => $user->id,
                'reviewed_at' => now(),
                'rejection_reason' => $request->notes ?? 'Perlu perbaikan dokumentasi / kondisi lapangan.',
            ]);

            $station->update(['status_id' => StationStatus::ON_HOLD]);
        }

        return redirect()->back()->with('success', 'Status verifikasi berhasil diperbarui.');
    }
}
