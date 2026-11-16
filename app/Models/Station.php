<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Station extends Model
{
    protected $fillable = [
        'code',
        'name',
        'facility_type_id',
        'status_id',
        'latitude',
        'longitude',
        'address',
        'city',
        'province',
        'postal_code',
        'power_capacity_kw',
        'socket_types',
        'slot_count',
        'operational_hours',
        'amenities',
        'survey_date',
        'construction_start_date',
        'target_completion_date',
        'commissioning_date',
        'vendor_name',
        'pln_meter_id',
        'internal_notes',
        'lease_end_date',
        'landlord_name',
        'vgreen_contract_end_date',
        'landlord_type',
        'ownership_type',
        'landlord_phone',
        'contract_vgreen_start_date',
        'contract_vgreen_end_date',
        'contract_vgreen_doc_number',
        'contract_landlord_start_date',
        'contract_landlord_end_date',
        'contract_landlord_doc_number',
        'document_status',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'amenities' => 'array',
        'survey_date' => 'date',
        'construction_start_date' => 'date',
        'target_completion_date' => 'date',
        'commissioning_date' => 'date',
        'lease_end_date' => 'date',
        'vgreen_contract_end_date' => 'date',
        'contract_vgreen_start_date' => 'date',
        'contract_vgreen_end_date' => 'date',
        'contract_landlord_start_date' => 'date',
        'contract_landlord_end_date' => 'date',
    ];

    public function facilityType()
    {
        return $this->belongsTo(FacilityType::class, 'facility_type_id', 'id');
    }

    public function status()
    {
        return $this->belongsTo(StationStatus::class, 'status_id', 'id');
    }

    public function inspections()
    {
        return $this->hasMany(InspectionReport::class)->latest('submitted_at');
    }

    public function latestInspection()
    {
        return $this->hasOne(InspectionReport::class)->latestOfMany('submitted_at');
    }

    public function machines()
    {
        return $this->hasMany(StationMachine::class)->orderBy('id', 'asc');
    }

    public function documents()
    {
        return $this->hasMany(StationDocument::class)->latest();
    }

    /**
     * Compute document compliance based on landlord type and required checklist.
     */
    public function getDocumentComplianceAttribute(): array
    {
        $landlordType = strtoupper($this->landlord_type ?: 'SWASTA');
        $requiredList = StationDocument::REQUIRED_DOCUMENTS[$landlordType] ?? StationDocument::REQUIRED_DOCUMENTS['SWASTA'];
        
        $uploadedDocs = $this->documents;
        $uploadedTypes = $uploadedDocs->pluck('document_type')->unique()->toArray();

        $fulfilledTypes = array_values(array_intersect(array_keys($requiredList), $uploadedTypes));
        $missingTypes = array_values(array_diff(array_keys($requiredList), $uploadedTypes));
        
        $totalRequired = count($requiredList);
        $totalUploaded = count($fulfilledTypes);
        $percentage = $totalRequired > 0 ? round(($totalUploaded / $totalRequired) * 100, 1) : 100;

        $isComplete = count($missingTypes) === 0;
        $status = $isComplete ? 'COMPLETE' : ($totalUploaded > 0 ? 'INCOMPLETE' : 'PENDING_UPLOAD');

        // Missing document details with friendly labels
        $missingDetails = array_map(function ($key) use ($requiredList) {
            return [
                'type' => $key,
                'label' => $requiredList[$key] ?? $key,
            ];
        }, $missingTypes);

        return [
            'landlord_type' => $landlordType,
            'total_required' => $totalRequired,
            'total_uploaded' => $totalUploaded,
            'percentage' => $percentage,
            'is_complete' => $isComplete,
            'status' => $status,
            'fulfilled_types' => $fulfilledTypes,
            'missing_types' => $missingTypes,
            'missing_details' => $missingDetails,
        ];
    }

    /**
     * Helper to auto-generate station code: VG-{KOTA}-{00001} up to 99999
     */
    public static function generateNextCode(string $cityName): string
    {
        $normalizedCity = trim(strtoupper($cityName));
        
        // City Code Mapping for Major Indonesian Hubs
        $cityCodeMap = [
            'JAKARTA' => 'JKT',
            'JAKARTA SELATAN' => 'JKT',
            'JAKARTA PUSAT' => 'JKT',
            'JAKARTA BARAT' => 'JKT',
            'JAKARTA UTARA' => 'JKT',
            'JAKARTA TIMUR' => 'JKT',
            'SURABAYA' => 'SBY',
            'BANDUNG' => 'BDG',
            'SEMARANG' => 'SMG',
            'MEDAN' => 'MDN',
            'MAKASSAR' => 'MKS',
            'DENPASAR' => 'DPS',
            'BALI' => 'DPS',
            'YOGYAKARTA' => 'JOG',
            'JOGJA' => 'JOG',
            'BEKASI' => 'BKS',
            'TANGERANG' => 'TGR',
            'TANGERANG SELATAN' => 'TGR',
            'DEPOK' => 'DPK',
            'BOGOR' => 'BGR',
            'MALANG' => 'MLG',
            'PALEMBANG' => 'PLM',
            'BATAM' => 'BTM',
            'SURAKARTA' => 'SLO',
            'SOLO' => 'SLO',
            'CIREBON' => 'CBN',
            'SERANG' => 'SRG',
            'CILEGON' => 'CLG',
        ];

        $codePrefix = 'IDN';
        foreach ($cityCodeMap as $name => $code) {
            if (str_contains($normalizedCity, $name)) {
                $codePrefix = $code;
                break;
            }
        }

        // If not mapped, take first 3 alphanumeric consonants/letters
        if ($codePrefix === 'IDN' && strlen($normalizedCity) > 0) {
            $alphanumeric = preg_replace('/[^A-Z]/', '', $normalizedCity);
            $codePrefix = substr($alphanumeric, 0, 3);
            if (strlen($codePrefix) < 3) {
                $codePrefix = str_pad($codePrefix, 3, 'X');
            }
        }

        $prefix = "VG-{$codePrefix}";

        // Find existing stations matching this prefix
        $existingCodes = self::where('code', 'LIKE', "{$prefix}-%")->pluck('code');
        
        $highestNumber = 0;
        foreach ($existingCodes as $existingCode) {
            $parts = explode('-', $existingCode);
            $numPart = end($parts);
            if (is_numeric($numPart)) {
                $val = (int) $numPart;
                if ($val > $highestNumber) {
                    $highestNumber = $val;
                }
            }
        }

        $nextNumber = $highestNumber + 1;
        $fiveDigitNumber = str_pad($nextNumber, 5, '0', STR_PAD_LEFT);

        return "{$prefix}-{$fiveDigitNumber}";
    }
}
