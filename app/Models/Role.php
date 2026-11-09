<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $table = 'm_roles';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'description',
    ];

    public const DIRECTOR_SSI = 'DIRECTOR_SSI';
    public const ADMIN_SSI = 'ADMIN_SSI';
    public const VGREEN_REP = 'VGREEN_REP';
    public const FIELD_VENDOR = 'FIELD_VENDOR';
    public const CONSTRUCTION_TEAM = 'CONSTRUCTION_TEAM';

    public function users()
    {
        return $this->hasMany(User::class, 'role_id', 'id');
    }
}
