<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApprovalStatus extends Model
{
    protected $table = 'm_approval_statuses';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
    ];

    public const PENDING_REVIEW = 'PENDING_REVIEW';
    public const APPROVED = 'APPROVED';
    public const REVISION_REQUIRED = 'REVISION_REQUIRED';
}
