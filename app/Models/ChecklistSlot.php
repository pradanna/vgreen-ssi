<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChecklistSlot extends Model
{
    protected $table = 'm_checklist_slots';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'category',
        'label',
        'angle',
        'is_required',
    ];

    public function photos()
    {
        return $this->hasMany(InspectionPhoto::class, 'checklist_slot_id', 'id');
    }
}
