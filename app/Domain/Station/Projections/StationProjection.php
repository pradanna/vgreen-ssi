<?php

namespace App\Domain\Station\Projections;

use App\Models\ApprovalStatus;
use App\Models\Role;
use App\Models\Station;
use App\Models\StationStatus;
use App\Models\User;
use Illuminate\Support\Collection;

class StationProjection
{
    /**
     * Project station list based on User Role (V-Green, Director/Admin, or Field).
     */
    public static function forUser(?User $user, Collection $stations, bool $lightweight = false): Collection
    {
        $isVGreen = $user && $user->role_id === Role::VGREEN_REP;
        $isField = $user && in_array($user->role_id, [Role::FIELD_VENDOR, Role::CONSTRUCTION_TEAM]);

        return $stations->filter(function (Station $station) use ($isVGreen, $isField, $user) {
            // V-Green Gate: only OPERATIONAL and latest inspection is APPROVED
            if ($isVGreen) {
                // If relation is eager loaded, verify it. Otherwise base SQL query in controller already scoped it.
                if ($station->relationLoaded('latestInspection')) {
                    $latest = $station->latestInspection;
                    return $station->status_id === StationStatus::OPERATIONAL
                        && $latest
                        && $latest->approval_status_id === ApprovalStatus::APPROVED;
                }
                return $station->status_id === StationStatus::OPERATIONAL;
            }

            // Field vendor: if assigned or matches vendor
            if ($isField && $user->organization) {
                return true;
            }

            return true;
        })->map(function (Station $station) use ($isVGreen, $lightweight) {
            return $lightweight
                ? self::projectLightweight($station, $isVGreen)
                : self::projectSingle($station, $isVGreen);
        })->values();
    }

    /**
     * Project single station model into DTO array.
     */
    public static function projectSingle(Station $station, bool $isVGreen): array
    {
        $latestInspection = $station->latestInspection;

        // Machine list projection (Accessible by both V-Green & Internal)
        $machines = $station->machines->map(fn($m) => [
            'id' => $m->id,
            'machine_id' => $m->machine_id,
            'name' => $m->name,
            'brand' => $m->brand,
            'model_series' => $m->model_series,
            'serial_number' => $m->serial_number,
            'facility_type_id' => $m->facility_type_id,
            'facility_type_name' => $m->facilityType?->name,
            'power_capacity_kw' => (int) $m->power_capacity_kw,
            'socket_types' => $m->socket_types,
            'slot_or_gun_count' => (int) $m->slot_or_gun_count,
            'status' => $m->status,
            'installed_at' => $m->installed_at?->format('d M Y'),
            'notes' => $m->notes,
        ])->values()->all();

        $totalMachineKw = !empty($machines) 
            ? array_sum(array_column($machines, 'power_capacity_kw')) 
            : ($station->power_capacity_kw ?: 0);

        $totalMachineSlots = !empty($machines) 
            ? array_sum(array_column($machines, 'slot_or_gun_count')) 
            : ($station->slot_count ?: 0);

        // V-Green presentation (Strictly technical & verified status only, NO confidential contracts/landlord finance)
        if ($isVGreen) {
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
                'power_capacity_kw' => $totalMachineKw,
                'socket_types' => $station->socket_types,
                'slot_count' => $totalMachineSlots,
                'operational_hours' => $station->operational_hours,
                'amenities' => $station->amenities ?? [],
                'commissioning_date' => $station->commissioning_date?->format('d M Y'),
                'target_completion_date' => $station->target_completion_date?->format('d M Y'),
                'contract_vgreen_start_date' => $station->contract_vgreen_start_date?->format('d M Y'),
                'contract_vgreen_end_date' => ($station->contract_vgreen_end_date ?: $station->vgreen_contract_end_date)?->format('d M Y'),
                'contract_vgreen_doc_number' => $station->contract_vgreen_doc_number,
                'vgreen_contract_end_date' => ($station->contract_vgreen_end_date ?: $station->vgreen_contract_end_date)?->format('d M Y'),
                'machines' => $machines,
                'is_verified' => true,
                'verified_photos' => $verifiedPhotos->map(fn($p) => [
                    'id' => $p->id,
                    'slot_id' => $p->checklist_slot_id,
                    'slot_label' => $p->slot?->label ?? $p->checklist_slot_id,
                    'category' => $p->slot?->category ?? 'LAHAN',
                    'angle' => $p->slot?->angle ?? 'Depan',
                    'photo_url' => $p->photo_url,
                    'latitude' => (float) $p->latitude,
                    'longitude' => (float) $p->longitude,
                    'taken_at' => $p->taken_at?->format('d M Y H:i'),
                    'is_approved' => true,
                ])->values()->all(),
            ];
        }

        // Internal SSI (Full granular operational, multi-machine, dual contracts, & legal compliance)
        $inspectionsHistory = $station->inspections->map(function ($report) {
            return [
                'id' => $report->id,
                'stage' => $report->stage,
                'approval_status_id' => $report->approval_status_id,
                'approval_status_name' => $report->approvalStatus?->name,
                'submitted_by_name' => $report->submitter?->name,
                'reviewed_by_name' => $report->reviewer?->name,
                'submitted_at' => $report->submitted_at?->format('d M Y H:i'),
                'reviewed_at' => $report->reviewed_at?->format('d M Y H:i'),
                'notes' => $report->notes,
                'rejection_reason' => $report->rejection_reason,
                'photos' => $report->photos->map(fn($photo) => [
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
                ])->values()->all(),
            ];
        });

        // Legal Documents (Internal SSI only)
        $documents = $station->documents->map(fn($d) => [
            'id' => $d->id,
            'category' => $d->category,
            'document_type' => $d->document_type,
            'title' => $d->title,
            'file_name' => $d->file_name,
            'file_path' => $d->file_path,
            'file_size' => $d->file_size,
            'file_size_formatted' => $d->file_size ? round($d->file_size / 1024, 1) . ' KB' : null,
            'uploaded_at' => $d->created_at?->format('d M Y H:i'),
            'uploaded_by_name' => $d->uploader?->name,
            'notes' => $d->notes,
        ])->values()->all();

        $documentCompliance = $station->document_compliance;

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
            'power_capacity_kw' => $totalMachineKw,
            'socket_types' => $station->socket_types,
            'slot_count' => $totalMachineSlots,
            'operational_hours' => $station->operational_hours,
            'amenities' => $station->amenities ?? [],
            'survey_date' => $station->survey_date?->format('d M Y'),
            'construction_start_date' => $station->construction_start_date?->format('d M Y'),
            'target_completion_date' => $station->target_completion_date?->format('d M Y'),
            'commissioning_date' => $station->commissioning_date?->format('d M Y'),
            'lease_end_date' => $station->lease_end_date?->format('d M Y'),
            'vgreen_contract_end_date' => $station->vgreen_contract_end_date?->format('d M Y') ?: $station->contract_vgreen_end_date?->format('d M Y'),
            
            // Landlord & Dual Contract Profiles
            'landlord_type' => $station->landlord_type ?: 'SWASTA',
            'landlord_name' => $station->landlord_name,
            'landlord_phone' => $station->landlord_phone,
            'contract_vgreen_start_date' => $station->contract_vgreen_start_date?->format('d M Y'),
            'contract_vgreen_end_date' => $station->contract_vgreen_end_date?->format('d M Y'),
            'contract_vgreen_doc_number' => $station->contract_vgreen_doc_number,
            'contract_landlord_start_date' => $station->contract_landlord_start_date?->format('d M Y'),
            'contract_landlord_end_date' => $station->contract_landlord_end_date?->format('d M Y'),
            'contract_landlord_doc_number' => $station->contract_landlord_doc_number,

            // Machines & Legal Documents
            'machines' => $machines,
            'documents' => $documents,
            'document_compliance' => $documentCompliance,

            // Operations & Audit
            'vendor_name' => $station->vendor_name,
            'pln_meter_id' => $station->pln_meter_id,
            'internal_notes' => $station->internal_notes,
            'latest_inspection' => $inspectionsHistory->first() ?? null,
            'inspections_history' => $inspectionsHistory->values()->all(),
        ];
    }

    /**
     * Project lightweight station data for GIS map and table lists.
     * Heavy photo collections and documents are omitted and loaded on-demand.
     */
    public static function projectLightweight(Station $station, bool $isVGreen): array
    {
        $latestInspection = $station->relationLoaded('latestInspection') ? $station->latestInspection : null;

        $machines = $station->machines->map(fn($m) => [
            'id' => $m->id,
            'machine_id' => $m->machine_id,
            'name' => $m->name,
            'brand' => $m->brand,
            'model_series' => $m->model_series,
            'serial_number' => $m->serial_number,
            'facility_type_id' => $m->facility_type_id,
            'facility_type_name' => $m->facilityType?->name,
            'power_capacity_kw' => (int) $m->power_capacity_kw,
            'socket_types' => $m->socket_types,
            'slot_or_gun_count' => (int) $m->slot_or_gun_count,
            'status' => $m->status,
            'installed_at' => $m->installed_at?->format('d M Y'),
            'notes' => $m->notes,
        ])->values()->all();

        $totalMachineKw = !empty($machines) 
            ? array_sum(array_column($machines, 'power_capacity_kw')) 
            : ($station->power_capacity_kw ?: 0);

        $totalMachineSlots = !empty($machines) 
            ? array_sum(array_column($machines, 'slot_or_gun_count')) 
            : ($station->slot_count ?: 0);

        if ($isVGreen) {
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
                'power_capacity_kw' => $totalMachineKw,
                'socket_types' => $station->socket_types,
                'slot_count' => $totalMachineSlots,
                'operational_hours' => $station->operational_hours,
                'amenities' => $station->amenities ?? [],
                'commissioning_date' => $station->commissioning_date?->format('d M Y'),
                'target_completion_date' => $station->target_completion_date?->format('d M Y'),
                'contract_vgreen_start_date' => $station->contract_vgreen_start_date?->format('d M Y'),
                'contract_vgreen_end_date' => ($station->contract_vgreen_end_date ?: $station->vgreen_contract_end_date)?->format('d M Y'),
                'contract_vgreen_doc_number' => $station->contract_vgreen_doc_number,
                'vgreen_contract_end_date' => ($station->contract_vgreen_end_date ?: $station->vgreen_contract_end_date)?->format('d M Y'),
                'machines' => $machines,
                'is_verified' => true,
                'verified_photos' => [], // loaded on demand
            ];
        }

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
            'power_capacity_kw' => $totalMachineKw,
            'socket_types' => $station->socket_types,
            'slot_count' => $totalMachineSlots,
            'operational_hours' => $station->operational_hours,
            'amenities' => $station->amenities ?? [],
            'survey_date' => $station->survey_date?->format('d M Y'),
            'construction_start_date' => $station->construction_start_date?->format('d M Y'),
            'target_completion_date' => $station->target_completion_date?->format('d M Y'),
            'commissioning_date' => $station->commissioning_date?->format('d M Y'),
            'lease_end_date' => $station->lease_end_date?->format('d M Y'),
            'vgreen_contract_end_date' => $station->vgreen_contract_end_date?->format('d M Y') ?: $station->contract_vgreen_end_date?->format('d M Y'),

            // Landlord
            'ownership_type' => $station->ownership_type ?: 'SWASTA',
            'landlord_type' => $station->landlord_type ?: 'SWASTA',
            'landlord_name' => $station->landlord_name,
            'landlord_phone' => $station->landlord_phone,
            'contract_vgreen_start_date' => $station->contract_vgreen_start_date?->format('d M Y'),
            'contract_vgreen_end_date' => $station->contract_vgreen_end_date?->format('d M Y'),
            'contract_vgreen_doc_number' => $station->contract_vgreen_doc_number,
            'contract_landlord_start_date' => $station->contract_landlord_start_date?->format('d M Y'),
            'contract_landlord_end_date' => $station->contract_landlord_end_date?->format('d M Y'),
            'contract_landlord_doc_number' => $station->contract_landlord_doc_number,

            // Machines & Summary
            'machines' => $machines,
            'documents' => [], // loaded on demand
            'document_compliance' => $station->relationLoaded('documents') ? $station->document_compliance : null,

            // Operations & Audit
            'vendor_name' => $station->vendor_name,
            'pln_meter_id' => $station->pln_meter_id,
            'internal_notes' => $station->internal_notes,
            'latest_inspection' => $latestInspection ? [
                'id' => $latestInspection->id,
                'stage' => $latestInspection->stage,
                'approval_status_id' => $latestInspection->approval_status_id,
                'approval_status_name' => $latestInspection->approvalStatus?->name,
                'submitted_by_name' => $latestInspection->submitter?->name,
                'reviewed_by_name' => $latestInspection->reviewer?->name,
                'submitted_at' => $latestInspection->submitted_at?->format('d M Y H:i'),
                'reviewed_at' => $latestInspection->reviewed_at?->format('d M Y H:i'),
                'notes' => $latestInspection->notes,
                'rejection_reason' => $latestInspection->rejection_reason,
                'photos' => [], // loaded on demand
            ] : null,
            'inspections_history' => [], // loaded on demand
        ];
    }

    /**
     * Project photos and inspection sessions for a single station on-demand.
     */
    public static function projectPhotos(Station $station, bool $isVGreen): array
    {
        $latestInspection = $station->latestInspection;

        if ($isVGreen) {
            $verifiedPhotos = $latestInspection
                ? $latestInspection->photos->where('is_approved', true)->values()
                : collect();

            return [
                'verified_photos' => $verifiedPhotos->map(fn($p) => [
                    'id' => $p->id,
                    'slot_id' => $p->checklist_slot_id,
                    'slot_label' => $p->slot?->label ?? $p->checklist_slot_id,
                    'category' => $p->slot?->category ?? 'LAHAN',
                    'angle' => $p->slot?->angle ?? 'Depan',
                    'photo_url' => $p->photo_url,
                    'latitude' => (float) $p->latitude,
                    'longitude' => (float) $p->longitude,
                    'taken_at' => $p->taken_at?->format('d M Y H:i'),
                    'is_approved' => true,
                ])->values()->all(),
            ];
        }

        $inspectionsHistory = $station->inspections->map(function ($report) {
            return [
                'id' => $report->id,
                'stage' => $report->stage,
                'approval_status_id' => $report->approval_status_id,
                'approval_status_name' => $report->approvalStatus?->name,
                'submitted_by_name' => $report->submitter?->name,
                'reviewed_by_name' => $report->reviewer?->name,
                'submitted_at' => $report->submitted_at?->format('d M Y H:i'),
                'reviewed_at' => $report->reviewed_at?->format('d M Y H:i'),
                'notes' => $report->notes,
                'rejection_reason' => $report->rejection_reason,
                'photos' => $report->photos->map(fn($photo) => [
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
                ])->values()->all(),
            ];
        });

        return [
            'latest_inspection' => $inspectionsHistory->first() ?? null,
            'inspections_history' => $inspectionsHistory->values()->all(),
        ];
    }

    /**
     * Project documents for a single station on-demand (Internal SSI only).
     */
    public static function projectDocuments(Station $station): array
    {
        $documents = $station->documents->map(fn($d) => [
            'id' => $d->id,
            'category' => $d->category,
            'document_type' => $d->document_type,
            'title' => $d->title,
            'file_name' => $d->file_name,
            'file_path' => $d->file_path,
            'file_size' => $d->file_size,
            'file_size_formatted' => $d->file_size ? round($d->file_size / 1024, 1) . ' KB' : null,
            'uploaded_at' => $d->created_at?->format('d M Y H:i'),
            'uploaded_by_name' => $d->uploader?->name,
            'notes' => $d->notes,
        ])->values()->all();

        return [
            'documents' => $documents,
            'document_compliance' => $station->document_compliance,
        ];
    }
}
