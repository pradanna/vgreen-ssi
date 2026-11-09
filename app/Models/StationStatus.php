<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StationStatus extends Model
{
    protected $table = 'm_station_statuses';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'color_code',
        'step_order',
    ];

    public const OPERATIONAL = 'OPERATIONAL';
    public const CONSTRUCTION = 'CONSTRUCTION';
    public const SURVEYED = 'SURVEYED';
    public const ON_HOLD = 'ON_HOLD';

    public function stations()
    {
        return $this->hasMany(Station::class, 'status_id', 'id');
    }
}
