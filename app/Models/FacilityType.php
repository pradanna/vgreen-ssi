<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FacilityType extends Model
{
    protected $table = 'm_facility_types';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'icon_name',
        'description',
    ];

    public const EVCS = 'EVCS';
    public const BSS = 'BSS';
    public const COMBINED = 'COMBINED';

    public function stations()
    {
        return $this->hasMany(Station::class, 'facility_type_id', 'id');
    }
}
