<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Machine extends Model
{
    use HasUuids;
    protected $table = 'm_machines';

    protected $fillable = [
        'category_id',
        'code',
        'name',
        'brand',
        'model_series',
        'power_capacity_kw',
        'socket_types',
        'slot_or_gun_count',
        'dimensions',
        'weight',
        'cable_length',
        'input_voltage',
        'input_current',
        'output_voltage',
        'output_current',
        'description',
        'is_active',
    ];

    protected $casts = [
        'power_capacity_kw' => 'integer',
        'slot_or_gun_count' => 'integer',
        'is_active' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(MachineCategory::class, 'category_id');
    }

    public function stationMachines()
    {
        return $this->hasMany(StationMachine::class, 'machine_id');
    }
}
