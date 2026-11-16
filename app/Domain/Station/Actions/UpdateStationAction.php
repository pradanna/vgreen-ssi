<?php

namespace App\Domain\Station\Actions;

use App\Domain\GIS\GeoCoordinate;
use App\Models\FacilityType;
use App\Models\Station;
use App\Models\StationMachine;

class UpdateStationAction
{
    public function execute(Station $station, array $data): Station
    {
        if (isset($data['latitude']) && isset($data['longitude'])) {
            $geo = new GeoCoordinate((float) $data['latitude'], (float) $data['longitude']);
            $data['latitude'] = $geo->latitude;
            $data['longitude'] = $geo->longitude;
        }

        if (isset($data['amenities']) && is_string($data['amenities'])) {
            $data['amenities'] = array_filter(array_map('trim', explode(',', $data['amenities'])));
        }

        if (isset($data['code'])) {
            $data['code'] = strtoupper(trim($data['code']));
        }

        // Align lease_end_date with contract_landlord_end_date if passed
        if (isset($data['contract_landlord_end_date'])) {
            $data['lease_end_date'] = $data['contract_landlord_end_date'];
        }

        // Synchronize nested machines if explicitly provided
        if (isset($data['machines']) && is_array($data['machines'])) {
            // Delete removed machines
            $incomingIds = array_filter(array_column($data['machines'], 'id'));
            $station->machines()->whereNotIn('id', $incomingIds)->delete();

            $totalKw = 0;
            $totalSlots = 0;
            $hasEvcs = false;
            $hasBss = false;
            foreach ($data['machines'] as $m) {
                $kw = (int) ($m['power_capacity_kw'] ?? 0);
                $slots = (int) ($m['slot_or_gun_count'] ?? 1);
                $totalKw += $kw;
                $totalSlots += $slots;

                $type = $m['facility_type_id'] ?? 'EVCS';
                if ($type === 'EVCS') $hasEvcs = true;
                if ($type === 'BSS') $hasBss = true;

                if (!empty($m['id'])) {
                    StationMachine::where('id', $m['id'])->where('station_id', $station->id)->update([
                        'machine_id' => $m['machine_id'] ?? null,
                        'name' => $m['name'],
                        'brand' => $m['brand'] ?? 'Autel',
                        'model_series' => $m['model_series'] ?? null,
                        'serial_number' => $m['serial_number'] ?? null,
                        'facility_type_id' => $m['facility_type_id'] ?? 'EVCS',
                        'power_capacity_kw' => $kw,
                        'socket_types' => $m['socket_types'] ?? null,
                        'slot_or_gun_count' => $slots,
                        'status' => $m['status'] ?? 'OPERATIONAL',
                    ]);
                } else {
                    StationMachine::create([
                        'station_id' => $station->id,
                        'machine_id' => $m['machine_id'] ?? null,
                        'name' => $m['name'] ?? 'Unit Mesin Baru',
                        'brand' => $m['brand'] ?? 'Autel',
                        'model_series' => $m['model_series'] ?? null,
                        'serial_number' => $m['serial_number'] ?? null,
                        'facility_type_id' => $m['facility_type_id'] ?? 'EVCS',
                        'power_capacity_kw' => $kw,
                        'socket_types' => $m['socket_types'] ?? null,
                        'slot_or_gun_count' => $slots,
                        'status' => $m['status'] ?? 'OPERATIONAL',
                        'installed_at' => now()->toDateString(),
                    ]);
                }
            }

            // Otomatis sinkronkan tipe fasilitas stasiun dari mesin
            if ($hasEvcs && $hasBss) {
                $data['facility_type_id'] = FacilityType::COMBINED;
            } elseif ($hasBss && !$hasEvcs) {
                $data['facility_type_id'] = FacilityType::BSS;
            } elseif ($hasEvcs && !$hasBss) {
                $data['facility_type_id'] = FacilityType::EVCS;
            }

            $data['power_capacity_kw'] = $totalKw;
            $data['slot_count'] = $totalSlots;
            unset($data['machines']);
        }

        $station->update($data);

        // Update document status cache
        $compliance = $station->document_compliance;
        $station->update(['document_status' => $compliance['status']]);

        return $station->fresh(['facilityType', 'status', 'machines', 'documents', 'latestInspection']);
    }
}
