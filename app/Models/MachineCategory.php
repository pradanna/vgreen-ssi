<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MachineCategory extends Model
{
    use HasUuids;
    protected $table = 'm_machine_categories';

    protected $fillable = [
        'code',
        'name',
        'description',
    ];

    public const EVCS = 'EVCS';
    public const BSS = 'BSS';

    public function machines()
    {
        return $this->hasMany(Machine::class, 'category_id');
    }
}
