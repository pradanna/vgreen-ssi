<?php

namespace App\Http\Middleware;

use App\Models\ApprovalStatus;
use App\Models\InspectionReport;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        if ($user) {
            $user->load('role');
        }

        // Calculate pending verification & QC count for internal users (PT SSI)
        $pendingInspectionCount = 0;
        if ($user && $user->role_id !== Role::VGREEN_REP) {
            $pendingInspectionCount = InspectionReport::where('approval_status_id', ApprovalStatus::PENDING_REVIEW)->count();
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
            ],
            'pendingInspectionCount' => $pendingInspectionCount,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'googleMapsApiKey' => env('VITE_GOOGLE_MAPS_API_KEY', ''),
        ];
    }
}
