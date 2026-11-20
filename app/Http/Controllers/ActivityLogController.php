<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Role;
use App\Models\Station;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    /**
     * Display centralized Activity Log & Audit Trail page.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        if ($user && $user->role_id === Role::VGREEN_REP) {
            abort(403, 'Akses ditolak: Log Aktivitas sistem khusus untuk operasional dan manajemen internal PT SSI.');
        }

        $moduleFilter = $request->query('module', 'ALL');
        $actionFilter = $request->query('action', 'ALL');
        $userFilter = $request->query('user_id', 'ALL');
        $search = trim($request->query('search', ''));
        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');
        $perPage = (int) $request->query('per_page', 20);
        if ($perPage < 5 || $perPage > 100) $perPage = 20;

        // Base query with eager loading to eliminate N+1
        $query = ActivityLog::with(['user:id,name,email,role_id']);

        if ($moduleFilter !== 'ALL') {
            $query->where('module', strtoupper($moduleFilter));
        }

        if ($actionFilter !== 'ALL') {
            $query->where('action', strtoupper($actionFilter));
        }

        if ($userFilter !== 'ALL') {
            $query->where('user_id', $userFilter);
        }

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('subject_name', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if (!empty($dateFrom)) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if (!empty($dateTo)) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        // Fast SQL aggregates for statistics
        $today = now()->toDateString();
        $stats = [
            'total_today' => ActivityLog::whereDate('created_at', $today)->count(),
            'stations_count' => ActivityLog::where('module', 'STATION')->count(),
            'documents_count' => ActivityLog::where('module', 'DOCUMENT')->count(),
            'inspections_count' => ActivityLog::where('module', 'INSPECTION')->count(),
            'total_all' => ActivityLog::count(),
        ];

        $logs = $query->latest('created_at')->paginate($perPage)->withQueryString();

        // Available actors for filter dropdown
        $actors = User::select('id', 'name', 'email', 'role_id')
            ->whereHas('role')
            ->orderBy('name')
            ->get();

        return Inertia::render('ActivityLog/Index', [
            'logs' => $logs,
            'stats' => $stats,
            'filters' => [
                'module' => $moduleFilter,
                'action' => $actionFilter,
                'user_id' => $userFilter,
                'search' => $search,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'per_page' => $perPage,
            ],
            'actors' => $actors,
            'activeNav' => 'activity-logs',
        ]);
    }

    /**
     * On-demand station activity history for the drawer timeline tab.
     */
    public function stationActivities(Station $station): JsonResponse
    {
        $activities = ActivityLog::with(['user:id,name,email,role_id'])
            ->where('subject_type', Station::class)
            ->where('subject_id', $station->id)
            ->latest('created_at')
            ->take(30)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $activities,
        ]);
    }
}
