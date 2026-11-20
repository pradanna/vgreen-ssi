<?php

namespace App\Domain\Station\Actions;

use App\Domain\Activity\Services\ActivityLogger;
use App\Domain\GIS\GeoCoordinate;
use App\Models\FacilityType;
use App\Models\Station;
use App\Models\StationStatus;
use Exception;
use Illuminate\Http\UploadedFile;

class ImportStationsAction
{
    /**
     * Import stations from CSV or Excel file with line-by-line validation.
     *
     * @return array{success: bool, imported_count: int, failed_count: int, errors: array, stations: array}
     */
    public function execute(UploadedFile|string $file): array
    {
        $path = $file instanceof UploadedFile ? $file->getRealPath() : $file;
        $handle = fopen($path, 'r');

        if ($handle === false) {
            return [
                'success' => false,
                'imported_count' => 0,
                'failed_count' => 0,
                'errors' => ['Gagal membuka file input.'],
                'stations' => [],
            ];
        }

        // Detect delimiter (comma or semicolon or tab)
        $firstLine = fgets($handle);
        rewind($handle);
        $delimiter = str_contains($firstLine, ';') ? ';' : (str_contains($firstLine, "\t") ? "\t" : ',');

        $header = fgetcsv($handle, 2000, $delimiter);
        if (!$header) {
            fclose($handle);
            return [
                'success' => false,
                'imported_count' => 0,
                'failed_count' => 0,
                'errors' => ['File kosong atau format header tidak valid.'],
                'stations' => [],
            ];
        }

        // Normalize header keys
        $headerMap = [];
        foreach ($header as $idx => $col) {
            $normalized = strtolower(trim(str_replace([' ', '-', '_'], '', $col)));
            $headerMap[$normalized] = $idx;
        }

        $rowNumber = 1;
        $importedCount = 0;
        $errors = [];
        $importedStations = [];

        $validFacilityTypes = FacilityType::pluck('id')->toArray();
        $validStatuses = StationStatus::pluck('id')->toArray();

        while (($row = fgetcsv($handle, 2000, $delimiter)) !== false) {
            $rowNumber++;

            // Skip empty rows
            if (empty(array_filter($row))) {
                continue;
            }

            $getVal = function ($key, $default = null) use ($row, $headerMap) {
                $cleanKey = strtolower(trim(str_replace([' ', '-', '_'], '', $key)));
                if (isset($headerMap[$cleanKey]) && isset($row[$headerMap[$cleanKey]])) {
                    $val = trim($row[$headerMap[$cleanKey]]);
                    return $val !== '' ? $val : $default;
                }
                return $default;
            };

            $code = strtoupper($getVal('code', ''));
            $name = $getVal('name', '');
            $facilityType = strtoupper($getVal('facility_type_id', $getVal('facility_type', 'EVCS')));
            $status = strtoupper($getVal('status_id', $getVal('status', 'SURVEYED')));
            $latRaw = $getVal('latitude', $getVal('lat', null));
            $lngRaw = $getVal('longitude', $getVal('lng', null));
            $address = $getVal('address', 'Alamat belum diisi');
            $city = $getVal('city', 'Jakarta');
            $province = $getVal('province', 'DKI Jakarta');
            $power = $getVal('power_capacity_kw', $getVal('power', null));
            $socket = $getVal('socket_types', $getVal('socket', null));
            $slotCount = (int) $getVal('slot_count', 2);
            $vendorName = $getVal('vendor_name', $getVal('vendor', null));
            $plnMeter = $getVal('pln_meter_id', $getVal('pln_meter', null));
            $internalNotes = $getVal('internal_notes', $getVal('notes', null));

            // Validation rules
            if (empty($code)) {
                $errors[] = [
                    'row' => $rowNumber,
                    'code' => '-',
                    'error' => "Baris #{$rowNumber}: Kolom 'code' wajib diisi.",
                ];
                continue;
            }

            if (empty($name)) {
                $errors[] = [
                    'row' => $rowNumber,
                    'code' => $code,
                    'error' => "Baris #{$rowNumber} ({$code}): Kolom 'name' wajib diisi.",
                ];
                continue;
            }

            if (!in_array($facilityType, $validFacilityTypes)) {
                $errors[] = [
                    'row' => $rowNumber,
                    'code' => $code,
                    'error' => "Baris #{$rowNumber} ({$code}): Jenis fasilitas '{$facilityType}' tidak valid. Pilihan: " . implode(', ', $validFacilityTypes),
                ];
                continue;
            }

            if (!in_array($status, $validStatuses)) {
                $errors[] = [
                    'row' => $rowNumber,
                    'code' => $code,
                    'error' => "Baris #{$rowNumber} ({$code}): Status stasiun '{$status}' tidak valid. Pilihan: " . implode(', ', $validStatuses),
                ];
                continue;
            }

            if ($latRaw === null || $lngRaw === null || !is_numeric($latRaw) || !is_numeric($lngRaw)) {
                $errors[] = [
                    'row' => $rowNumber,
                    'code' => $code,
                    'error' => "Baris #{$rowNumber} ({$code}): Koordinat Latitude/Longitude tidak valid atau bukan angka.",
                ];
                continue;
            }

            // Geographic boundary validation via Value Object
            try {
                $geo = new GeoCoordinate((float) $latRaw, (float) $lngRaw);
            } catch (Exception $e) {
                $errors[] = [
                    'row' => $rowNumber,
                    'code' => $code,
                    'error' => "Baris #{$rowNumber} ({$code}): " . $e->getMessage(),
                ];
                continue;
            }

            // Persist or Update
            $station = Station::updateOrCreate(
                ['code' => $code],
                [
                    'name' => $name,
                    'facility_type_id' => $facilityType,
                    'status_id' => $status,
                    'latitude' => $geo->latitude,
                    'longitude' => $geo->longitude,
                    'address' => $address,
                    'city' => $city,
                    'province' => $province,
                    'power_capacity_kw' => $power !== null ? (int) $power : null,
                    'socket_types' => $socket,
                    'slot_count' => $slotCount > 0 ? $slotCount : 2,
                    'vendor_name' => $vendorName,
                    'pln_meter_id' => $plnMeter,
                    'internal_notes' => $internalNotes,
                ]
            );

            $importedStations[] = $station;
            $importedCount++;
        }

        fclose($handle);

        if ($importedCount > 0 || count($errors) > 0) {
            ActivityLogger::log(
                module: 'STATION',
                action: 'STATIONS_IMPORTED',
                description: "Impor massal stasiun via CSV: {$importedCount} berhasil diproses, " . count($errors) . " gagal",
                subject: null,
                properties: [
                    'imported_count' => $importedCount,
                    'failed_count' => count($errors),
                    'sample_codes' => array_slice(array_map(fn($s) => $s->code, $importedStations), 0, 5),
                ]
            );
        }

        return [
            'success' => count($errors) === 0,
            'imported_count' => $importedCount,
            'failed_count' => count($errors),
            'errors' => $errors,
            'stations' => $importedStations,
        ];
    }
}
