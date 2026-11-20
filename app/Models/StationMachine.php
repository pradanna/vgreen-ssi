<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class StationMachine extends Model
{
    use HasUuids;
    protected $table = 'station_machines';

    protected $fillable = [
        'station_id',
        'machine_id',
        'name',
        'brand',
        'model_series',
        'serial_number',
        'facility_type_id',
        'power_capacity_kw',
        'socket_types',
        'slot_or_gun_count',
        'status',
        'installed_at',
        'notes',
    ];

    protected $casts = [
        'power_capacity_kw' => 'integer',
        'slot_or_gun_count' => 'integer',
        'installed_at' => 'date',
    ];

    public function station()
    {
        return $this->belongsTo(Station::class);
    }

    public function machine()
    {
        return $this->belongsTo(Machine::class, 'machine_id');
    }

    public function facilityType()
    {
        return $this->belongsTo(FacilityType::class, 'facility_type_id', 'id');
    }
}
