<?php

namespace App\Http\Controllers;

use App\Domain\Activity\Services\ActivityLogger;
use App\Models\FacilityType;
use App\Models\ProvinceTarget;
use App\Models\Role;
use App\Models\Station;
use App\Models\StationStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

class TargetController extends Controller
{
    /**
     * Ensure only Director and Admin PT SSI have access.
     */
    protected function ensureAuthorized(Request $request): void
    {
        $user = $request->user();
        if (!in_array($user?->role_id, [Role::DIRECTOR_SSI, Role::ADMIN_SSI, Role::VGREEN_REP])) {
            abort(403, 'Akses terbatas untuk Direktur, Admin PT SSI, dan Perwakilan V-Green.');
        }
    }

    /**
     * Display Province Targets and Realization Overview.
     */
    public function index(Request $request): Response
    {
        $this->ensureAuthorized($request);

        $selectedYear = (int) $request->query('year', 2026);
        $search = trim((string) $request->query('search', ''));
        $selectedProvince = (string) $request->query('province', 'ALL');
        $statusFilter = (string) $request->query('status', 'ALL');
        $sortBy = (string) $request->query('sort', 'UPDATED_DESC');
        $perPage = (int) $request->query('per_page', 10);
        if (!in_array($perPage, [10, 25, 50, 100])) {
            $perPage = 10;
        }
        $page = (int) $request->query('page', 1);
        if ($page < 1) {
            $page = 1;
        }

        // 1. Single aggregated SQL query for station counts by province (Zero N+1)
        $stationCounts = Station::selectRaw("
            LOWER(TRIM(province)) as norm_prov,
            COUNT(CASE WHEN status_id = 'OPERATIONAL' THEN 1 END) as actual_live,
            COUNT(CASE WHEN status_id = 'OPERATIONAL' AND facility_type_id = 'EVCS' THEN 1 END) as actual_evcs,
            COUNT(CASE WHEN status_id = 'OPERATIONAL' AND facility_type_id IN ('BSS', 'COMBINED') THEN 1 END) as actual_bss,
            COUNT(CASE WHEN status_id = 'CONSTRUCTION' THEN 1 END) as in_construction
        ")
        ->groupBy('norm_prov')
        ->get()
        ->keyBy('norm_prov');

        // 2. Fetch all province targets for selected year
        $allTargets = ProvinceTarget::where('year', $selectedYear)->get();

        // 3. Enrich each province target with calculated metrics
        $enrichedTargets = $allTargets->map(function (ProvinceTarget $target) use ($stationCounts) {
            $norm = strtolower(trim($target->province_name));
            $counts = $stationCounts->get($norm);

            $actualLive = (int) ($counts?->actual_live ?? 0);
            $actualEvcs = (int) ($counts?->actual_evcs ?? 0);
            $actualBss = (int) ($counts?->actual_bss ?? 0);
            $inConstruction = (int) ($counts?->in_construction ?? 0);

            $totalTarget = (int) $target->target_total;
            $percentage = $totalTarget > 0 ? round(($actualLive / $totalTarget) * 100, 1) : 0;

            return [
                'id' => $target->id,
                'province_name' => $target->province_name,
                'region' => $target->region,
                'year' => $target->year,
                'target_evcs' => $target->target_evcs,
                'target_bss' => $target->target_bss,
                'target_total' => $totalTarget,
                'actual_live' => $actualLive,
                'actual_evcs' => $actualEvcs,
                'actual_bss' => $actualBss,
                'in_construction' => $inConstruction,
                'percentage' => $percentage,
                'notes' => $target->notes,
                'updated_at' => $target->updated_at?->format('d M Y H:i'),
                'updated_at_raw' => $target->updated_at?->toISOString() ?? $target->updated_at?->toDateTimeString(),
            ];
        });

        // 4. Executive summary statistics (National totals for selected year)
        $totalTargetNational = $enrichedTargets->sum('target_total');
        $totalTargetEvcs = $enrichedTargets->sum('target_evcs');
        $totalTargetBss = $enrichedTargets->sum('target_bss');
        $totalActualLive = Station::where('status_id', StationStatus::OPERATIONAL)->count();
        $totalInConstruction = Station::where('status_id', StationStatus::CONSTRUCTION)->count();
        $nationalProgress = $totalTargetNational > 0 
            ? round(($totalActualLive / $totalTargetNational) * 100, 1) 
            : 0;

        $summary = [
            'total_target_national' => $totalTargetNational,
            'total_target_evcs' => $totalTargetEvcs,
            'total_target_bss' => $totalTargetBss,
            'total_provinces' => $enrichedTargets->count(),
            'total_actual_live' => $totalActualLive,
            'total_in_construction' => $totalInConstruction,
            'national_progress_percentage' => $nationalProgress,
            'selected_year' => $selectedYear,
        ];

        // 5. Server-side Filtering
        $filtered = $enrichedTargets->filter(function ($item) use ($search, $selectedProvince, $statusFilter) {
            if ($selectedProvince !== 'ALL' && !empty($selectedProvince) && $item['province_name'] !== $selectedProvince) {
                return false;
            }
            if ($statusFilter === 'OPERATIONAL' && $item['actual_live'] <= 0) {
                return false;
            }
            if ($statusFilter === 'CONSTRUCTION' && !($item['actual_live'] === 0 && $item['in_construction'] > 0)) {
                return false;
            }
            if ($statusFilter === 'PLANNING' && !($item['actual_live'] === 0 && $item['in_construction'] === 0)) {
                return false;
            }
            if (!empty($search)) {
                $q = strtolower($search);
                $matchName = str_contains(strtolower($item['province_name']), $q);
                $matchNotes = !empty($item['notes']) && str_contains(strtolower($item['notes']), $q);
                return $matchName || $matchNotes;
            }
            return true;
        });

        // 6. Server-side Sorting
        $sorted = $filtered->sort(function ($a, $b) use ($sortBy) {
            if ($sortBy === 'UPDATED_DESC') {
                return strcmp($b['updated_at_raw'] ?? '', $a['updated_at_raw'] ?? '');
            }
            if ($sortBy === 'UPDATED_ASC') {
                return strcmp($a['updated_at_raw'] ?? '', $b['updated_at_raw'] ?? '');
            }
            if ($sortBy === 'TARGET_DESC') {
                return $b['target_total'] <=> $a['target_total'];
            }
            if ($sortBy === 'TARGET_ASC') {
                return $a['target_total'] <=> $b['target_total'];
            }
            if ($sortBy === 'EVCS_DESC') {
                return $b['target_evcs'] <=> $a['target_evcs'];
            }
            if ($sortBy === 'EVCS_ASC') {
                return $a['target_evcs'] <=> $b['target_evcs'];
            }
            if ($sortBy === 'BSS_DESC') {
                return $b['target_bss'] <=> $a['target_bss'];
            }
            if ($sortBy === 'BSS_ASC') {
                return $a['target_bss'] <=> $b['target_bss'];
            }
            if ($sortBy === 'ACTUAL_DESC') {
                return $b['actual_live'] <=> $a['actual_live'];
            }
            if ($sortBy === 'ACTUAL_ASC') {
                return $a['actual_live'] <=> $b['actual_live'];
            }
            if ($sortBy === 'PROGRESS_DESC') {
                return $b['percentage'] <=> $a['percentage'];
            }
            if ($sortBy === 'PROGRESS_ASC') {
                return $a['percentage'] <=> $b['percentage'];
            }
            if ($sortBy === 'NAME_ASC') {
                return strcasecmp($a['province_name'], $b['province_name']);
            }
            if ($sortBy === 'NAME_DESC') {
                return strcasecmp($b['province_name'], $a['province_name']);
            }
            return 0;
        })->values();

        // 7. Server-side Pagination
        $total = $sorted->count();
        $sliced = $sorted->slice(($page - 1) * $perPage, $perPage)->values();

        $paginatedTargets = new LengthAwarePaginator(
            $sliced,
            $total,
            $perPage,
            $page,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ]
        );

        // 8. Prepare full province list for filters and modal auto-fill
        $allProvinces = $allTargets->sortBy('province_name')->values()->map(fn($t) => [
            'name' => $t->province_name,
            'target_total' => $t->target_total,
        ]);

        $existingTargetsInYear = $allTargets->map(fn($t) => [
            'province_name' => $t->province_name,
            'target_evcs' => $t->target_evcs,
            'target_bss' => $t->target_bss,
            'notes' => $t->notes,
            'year' => $t->year,
        ]);

        // Distinct available years in database
        $dbYears = ProvinceTarget::select('year')->distinct()->orderBy('year', 'desc')->pluck('year')->all();
        $availableYears = array_values(array_unique(array_merge([2025, 2026, 2027], $dbYears)));
        sort($availableYears);

        return Inertia::render('Targets/Index', [
            'targets' => $paginatedTargets,
            'summary' => $summary,
            'filters' => [
                'year' => $selectedYear,
                'search' => $search,
                'province' => $selectedProvince,
                'status' => $statusFilter,
                'sort' => $sortBy,
                'per_page' => $perPage,
            ],
            'allProvinces' => $allProvinces,
            'existingTargetsInYear' => $existingTargetsInYear,
            'availableYears' => $availableYears,
            'regions' => ['Jawa', 'Sumatera', 'Sulawesi', 'Bali-Nusra', 'Kalimantan', 'Maluku-Papua'],
            'activeNav' => 'targets',
        ]);
    }

    /**
     * Store a new province target.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (!in_array($user?->role_id, [Role::DIRECTOR_SSI, Role::ADMIN_SSI])) {
            abort(403, 'Hanya Direktur atau Admin PT SSI yang dapat menambah target provinsi.');
        }

        $validated = $request->validate([
            'province_name' => 'required|string|max:100',
            'region' => 'nullable|string|max:50',
            'year' => 'required|integer|min:2024|max:2035',
            'target_evcs' => 'required|integer|min:0',
            'target_bss' => 'required|integer|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        if (empty($validated['region'])) {
            $validated['region'] = $this->determineRegion($validated['province_name']);
        }

        $target = ProvinceTarget::updateOrCreate(
            [
                'province_name' => $validated['province_name'],
                'year' => $validated['year'],
            ],
            $validated
        );

        ActivityLogger::log(
            module: 'TARGET',
            action: 'TARGET_UPDATED',
            description: "Menetapkan target provinsi {$target->province_name} ({$target->year}): EVCS {$target->target_evcs}, BSS {$target->target_bss}",
            subject: $target,
            properties: $validated,
            subjectNameOverride: "{$target->province_name} ({$target->year})"
        );

        return redirect()->back()->with('success', "Target provinsi {$validated['province_name']} berhasil disimpan.");
    }

    /**
     * Helper to map Indonesian province to standard macro region if not specified.
     */
    protected function determineRegion(string $province): string
    {
        $map = [
            'DKI Jakarta' => 'Jawa', 'Jawa Barat' => 'Jawa', 'Jawa Tengah' => 'Jawa',
            'D.I. Yogyakarta' => 'Jawa', 'Jawa Timur' => 'Jawa', 'Banten' => 'Jawa',
            'Sumatera Utara' => 'Sumatera', 'Sumatera Barat' => 'Sumatera', 'Riau' => 'Sumatera',
            'Kepulauan Riau' => 'Sumatera', 'Jambi' => 'Sumatera', 'Sumatera Selatan' => 'Sumatera',
            'Bengkulu' => 'Sumatera', 'Lampung' => 'Sumatera', 'Kepulauan Bangka Belitung' => 'Sumatera',
            'Aceh' => 'Sumatera', 'Bali' => 'Bali-Nusra', 'Nusa Tenggara Barat' => 'Bali-Nusra',
            'Nusa Tenggara Timur' => 'Bali-Nusra', 'Kalimantan Barat' => 'Kalimantan',
            'Kalimantan Tengah' => 'Kalimantan', 'Kalimantan Selatan' => 'Kalimantan',
            'Kalimantan Timur' => 'Kalimantan', 'Kalimantan Utara' => 'Kalimantan',
            'Sulawesi Utara' => 'Sulawesi', 'Sulawesi Tengah' => 'Sulawesi', 'Sulawesi Selatan' => 'Sulawesi',
            'Sulawesi Tenggara' => 'Sulawesi', 'Gorontalo' => 'Sulawesi', 'Sulawesi Barat' => 'Sulawesi',
            'Maluku' => 'Maluku-Papua', 'Maluku Utara' => 'Maluku-Papua', 'Papua' => 'Maluku-Papua',
            'Papua Barat' => 'Maluku-Papua', 'Papua Barat Daya' => 'Maluku-Papua',
            'Papua Tengah' => 'Maluku-Papua', 'Papua Pegunungan' => 'Maluku-Papua', 'Papua Selatan' => 'Maluku-Papua',
        ];

        return $map[$province] ?? 'Jawa';
    }

    /**
     * Update an existing province target.
     */
    public function update(Request $request, ProvinceTarget $target): RedirectResponse
    {
        $user = $request->user();
        if (!in_array($user?->role_id, [Role::DIRECTOR_SSI, Role::ADMIN_SSI])) {
            abort(403, 'Hanya Direktur atau Admin PT SSI yang dapat mengubah target provinsi.');
        }

        $validated = $request->validate([
            'target_evcs' => 'required|integer|min:0',
            'target_bss' => 'required|integer|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        $originalEvcs = $target->target_evcs;
        $originalBss = $target->target_bss;
        $target->update($validated);

        ActivityLogger::log(
            module: 'TARGET',
            action: 'TARGET_UPDATED',
            description: "Memperbarui target provinsi {$target->province_name} ({$target->year}): EVCS {$target->target_evcs} (sebelumnya {$originalEvcs}), BSS {$target->target_bss} (sebelumnya {$originalBss})",
            subject: $target,
            properties: [
                'old' => ['target_evcs' => $originalEvcs, 'target_bss' => $originalBss],
                'new' => $validated,
            ],
            subjectNameOverride: "{$target->province_name} ({$target->year})"
        );

        return redirect()->back()->with('success', "Target provinsi {$target->province_name} berhasil diperbarui.");
    }
}
