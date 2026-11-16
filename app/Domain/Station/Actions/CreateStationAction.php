<?php

namespace App\Domain\Station\Actions;

use App\Domain\GIS\GeoCoordinate;
use App\Models\FacilityType;
use App\Models\Station;
use App\Models\StationMachine;
use App\Models\StationStatus;

class CreateStationAction
{
    public function execute(array $data): Station
    {
        // Enforce coordinate validation via Value Object
        $geo = new GeoCoordinate((float) $data['latitude'], (float) $data['longitude']);

        // Auto generate code if empty or requested
        $city = $data['city'] ?? 'Jakarta';
        $code = !empty($data['code']) ? strtoupper(trim($data['code'])) : Station::generateNextCode($city);

        // Calculate total machine capacities if machines array is provided
        $machinesData = $data['machines'] ?? [];
        $totalKw = 0;
        $totalSlots = 0;
        $hasEvcs = false;
        $hasBss = false;

        if (!empty($machinesData) && is_array($machinesData)) {
            foreach ($machinesData as $m) {
                $kw = (int) ($m['power_capacity_kw'] ?? 0);
                $slots = (int) ($m['slot_or_gun_count'] ?? 1);
                $totalKw += $kw;
                $totalSlots += $slots;

                $type = $m['facility_type_id'] ?? 'EVCS';
                if ($type === 'EVCS') $hasEvcs = true;
                if ($type === 'BSS') $hasBss = true;
            }
        } else {
            $totalKw = isset($data['power_capacity_kw']) && $data['power_capacity_kw'] !== '' ? (int) $data['power_capacity_kw'] : 0;
            $totalSlots = isset($data['slot_count']) ? (int) $data['slot_count'] : 2;
        }

        // Determine facility type based on machines if available
        $facilityTypeId = $data['facility_type_id'] ?? FacilityType::EVCS;
        if ($hasEvcs && $hasBss) {
            $facilityTypeId = FacilityType::COMBINED;
        } elseif ($hasBss && !$hasEvcs) {
            $facilityTypeId = FacilityType::BSS;
        } elseif ($hasEvcs && !$hasBss) {
            $facilityTypeId = FacilityType::EVCS;
        }

        $station = Station::create([
            'code' => $code,
            'name' => $data['name'],
            'facility_type_id' => $facilityTypeId,
            'status_id' => $data['status_id'] ?? StationStatus::SURVEYED,
            'latitude' => $geo->latitude,
            'longitude' => $geo->longitude,
            'address' => $data['address'],
            'city' => $data['city'],
            'province' => $data['province'],
            'postal_code' => $data['postal_code'] ?? null,
            'power_capacity_kw' => $totalKw,
            'socket_types' => $data['socket_types'] ?? null,
            'slot_count' => $totalSlots ?: 2,
            'operational_hours' => $data['operational_hours'] ?? '24 Jam',
            'amenities' => is_array($data['amenities'] ?? null) ? $data['amenities'] : (isset($data['amenities']) ? array_filter(array_map('trim', explode(',', $data['amenities']))) : []),
            'survey_date' => $data['survey_date'] ?? now()->toDateString(),
            'construction_start_date' => $data['construction_start_date'] ?? null,
            'target_completion_date' => $data['target_completion_date'] ?? null,
            'commissioning_date' => $data['commissioning_date'] ?? null,
            'vendor_name' => $data['vendor_name'] ?? null,
            'pln_meter_id' => $data['pln_meter_id'] ?? null,
            'internal_notes' => $data['internal_notes'] ?? null,

            // Landlord & Dual Contract Profiles
            'landlord_type' => $data['landlord_type'] ?? 'SWASTA',
            'landlord_name' => $data['landlord_name'] ?? null,
            'landlord_phone' => $data['landlord_phone'] ?? null,
            'lease_end_date' => $data['contract_landlord_end_date'] ?? ($data['lease_end_date'] ?? null),
            'contract_vgreen_start_date' => $data['contract_vgreen_start_date'] ?? null,
            'contract_vgreen_end_date' => $data['contract_vgreen_end_date'] ?? null,
            'contract_vgreen_doc_number' => $data['contract_vgreen_doc_number'] ?? null,
            'contract_landlord_start_date' => $data['contract_landlord_start_date'] ?? null,
            'contract_landlord_end_date' => $data['contract_landlord_end_date'] ?? null,
            'contract_landlord_doc_number' => $data['contract_landlord_doc_number'] ?? null,
        ]);

        // Create initial machines if provided
        if (!empty($machinesData) && is_array($machinesData)) {
            foreach ($machinesData as $idx => $m) {
                StationMachine::create([
                    'station_id' => $station->id,
                    'machine_id' => $m['machine_id'] ?? null,
                    'name' => $m['name'] ?? ('Unit ' . ($m['facility_type_id'] ?? 'EVCS') . ' ' . ($idx + 1)),
                    'brand' => $m['brand'] ?? 'Autel',
                    'model_series' => $m['model_series'] ?? null,
                    'serial_number' => $m['serial_number'] ?? null,
                    'facility_type_id' => $m['facility_type_id'] ?? FacilityType::EVCS,
                    'power_capacity_kw' => (int) ($m['power_capacity_kw'] ?? 60),
                    'socket_types' => $m['socket_types'] ?? 'CCS2',
                    'slot_or_gun_count' => (int) ($m['slot_or_gun_count'] ?? 2),
                    'status' => $m['status'] ?? 'OPERATIONAL',
                    'installed_at' => $m['installed_at'] ?? now()->toDateString(),
                    'notes' => $m['notes'] ?? null,
                ]);
            }
        } else {
            // Default at least 1 machine according to the facility type
            StationMachine::create([
                'station_id' => $station->id,
                'name' => 'Unit Mesin 01',
                'brand' => $facilityTypeId === FacilityType::BSS ? 'V-Green BSS' : 'Autel',
                'model_series' => $facilityTypeId === FacilityType::BSS ? 'BSS Gen-3' : 'MaxiCharger',
                'serial_number' => 'SN-' . strtoupper(substr(md5(uniqid()), 0, 8)),
                'facility_type_id' => $facilityTypeId === FacilityType::COMBINED ? FacilityType::EVCS : $facilityTypeId,
                'power_capacity_kw' => $totalKw ?: 60,
                'socket_types' => $data['socket_types'] ?? ($facilityTypeId === FacilityType::BSS ? '8-Slot Bay' : '2x CCS2 Fast Gun'),
                'slot_or_gun_count' => $totalSlots ?: 2,
                'status' => 'OPERATIONAL',
                'installed_at' => now()->toDateString(),
            ]);
        }

        // Sync compliance status
        $compliance = $station->document_compliance;
        $station->update(['document_status' => $compliance['status']]);

        return $station;
    }
}
