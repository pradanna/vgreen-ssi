<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProvinceTarget extends Model
{
    protected $fillable = [
        'province_name',
        'region',
        'year',
        'target_evcs',
        'target_bss',
        'notes',
    ];

    protected $casts = [
        'year' => 'integer',
        'target_evcs' => 'integer',
        'target_bss' => 'integer',
    ];

    protected $appends = [
        'target_total',
    ];

    public function getTargetTotalAttribute(): int
    {
        return (int) $this->target_evcs + (int) $this->target_bss;
    }
}
