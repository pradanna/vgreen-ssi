<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InspectionReport extends Model
{
    protected $fillable = [
        'station_id',
        'submitted_by',
        'approval_status_id',
        'reviewed_by',
        'stage',
        'overall_condition',
        'physical_condition',
        'electrical_condition',
        'issues_found',
        'machine_conditions',
        'latitude',
        'longitude',
        'distance_meters',
        'notes',
        'rejection_reason',
        'submitted_at',
        'reviewed_at',
    ];

    protected $casts = [
        'issues_found' => 'array',
        'machine_conditions' => 'array',
        'latitude' => 'float',
        'longitude' => 'float',
        'distance_meters' => 'float',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function station()
    {
        return $this->belongsTo(Station::class);
    }

    public function submitter()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function approvalStatus()
    {
        return $this->belongsTo(ApprovalStatus::class, 'approval_status_id', 'id');
    }

    public function photos()
    {
        return $this->hasMany(InspectionPhoto::class, 'report_id');
    }
}
