<?php

namespace App\Domain\Activity\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;

class ActivityLogger
{
    /**
     * Record an activity log entry with automatic request metadata and non-blocking safety.
     *
     * @param string $module (e.g. 'STATION', 'DOCUMENT', 'INSPECTION', 'TARGET', 'MASTER_DATA')
     * @param string $action (e.g. 'STATION_CREATED', 'DOCUMENT_UPLOADED')
     * @param string $description Human-readable summary in Indonesian
     * @param Model|null $subject Associated Eloquent Model
     * @param array|null $properties Payload diff (old_values, new_values, metadata)
     * @param User|null $user Override actor (defaults to authenticated user)
     * @param string|null $subjectNameOverride Optional custom subject name
     * @return ActivityLog|null
     */
    public static function log(
        string $module,
        string $action,
        string $description,
        ?Model $subject = null,
        ?array $properties = null,
        ?User $user = null,
        ?string $subjectNameOverride = null
    ): ?ActivityLog {
        try {
            $user = $user ?? Auth::user();
            $ip = Request::ip();
            $userAgent = Request::header('User-Agent');

            $subjectType = $subject ? get_class($subject) : null;
            $subjectId = $subject ? (string) $subject->getKey() : null;

            $subjectName = $subjectNameOverride;
            if (!$subjectName && $subject) {
                if (isset($subject->code) && isset($subject->name)) {
                    $subjectName = "{$subject->code} - {$subject->name}";
                } elseif (isset($subject->code)) {
                    $subjectName = (string) $subject->code;
                } elseif (isset($subject->name)) {
                    $subjectName = (string) $subject->name;
                } elseif (isset($subject->title)) {
                    $subjectName = (string) $subject->title;
                }
            }

            return ActivityLog::create([
                'user_id' => $user?->id,
                'module' => strtoupper($module),
                'action' => strtoupper($action),
                'subject_type' => $subjectType,
                'subject_id' => $subjectId,
                'subject_name' => $subjectName,
                'description' => $description,
                'properties' => $properties,
                'ip_address' => $ip,
                'user_agent' => $userAgent ? substr($userAgent, 0, 500) : null,
            ]);
        } catch (\Throwable $e) {
            // Non-blocking resilience: failure in logging should never abort critical business flow
            Log::warning('ActivityLogger failed to record log: ' . $e->getMessage());
            return null;
        }
    }
}
