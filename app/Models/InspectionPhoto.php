<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InspectionPhoto extends Model
{
    protected $fillable = [
        'report_id',
        'checklist_slot_id',
        'photo_url',
        'latitude',
        'longitude',
        'taken_at',
        'is_approved',
        'reviewer_notes',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'taken_at' => 'datetime',
        'is_approved' => 'boolean',
    ];

    public function report()
    {
        return $this->belongsTo(InspectionReport::class, 'report_id');
    }

    public function slot()
    {
        return $this->belongsTo(ChecklistSlot::class, 'checklist_slot_id', 'id');
    }
}
