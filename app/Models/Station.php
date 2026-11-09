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
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'amenities' => 'array',
        'survey_date' => 'date',
        'construction_start_date' => 'date',
        'target_completion_date' => 'date',
        'commissioning_date' => 'date',
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
}
