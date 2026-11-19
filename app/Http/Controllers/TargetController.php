<?php

namespace App\Http\Controllers;

use App\Models\FacilityType;
use App\Models\ProvinceTarget;
use App\Models\Role;
use App\Models\Station;
use App\Models\StationStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

        $selectedYear = (int) $request->query('year', now()->format('Y'));

        $targets = ProvinceTarget::where('year', $selectedYear)
            ->orderBy('updated_at', 'desc')
            ->get();

        // Get actual stations per province
        $stations = Station::all();

        $enrichedTargets = $targets->map(function (ProvinceTarget $target) use ($stations) {
            $provStations = $stations->filter(function ($s) use ($target) {
                return strcasecmp(trim($s->province), trim($target->province_name)) === 0;
            });

            $actualLive = $provStations->where('status_id', StationStatus::OPERATIONAL)->count();
            $actualEvcs = $provStations->where('status_id', StationStatus::OPERATIONAL)
                ->where('facility_type_id', FacilityType::EVCS)
                ->count();
            $actualBss = $provStations->where('status_id', StationStatus::OPERATIONAL)
                ->whereIn('facility_type_id', [FacilityType::BSS, FacilityType::COMBINED])
                ->count();
            $inConstruction = $provStations->where('status_id', StationStatus::CONSTRUCTION)->count();

            $totalTarget = $target->target_total;
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

        // Summary statistics for executive header
        $totalTargetNational = $enrichedTargets->sum('target_total');
        $totalTargetEvcs = $enrichedTargets->sum('target_evcs');
        $totalTargetBss = $enrichedTargets->sum('target_bss');
        $totalActualLive = $stations->where('status_id', StationStatus::OPERATIONAL)->count();
        $totalInConstruction = $stations->where('status_id', StationStatus::CONSTRUCTION)->count();
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

        return Inertia::render('Targets/Index', [
            'targets' => $enrichedTargets,
            'summary' => $summary,
            'activeNav' => 'targets',
            'availableYears' => [2025, 2026, 2027],
            'regions' => ['Jawa', 'Sumatera', 'Sulawesi', 'Bali-Nusra', 'Kalimantan', 'Maluku-Papua'],
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

        ProvinceTarget::updateOrCreate(
            [
                'province_name' => $validated['province_name'],
                'year' => $validated['year'],
            ],
            $validated
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

        $target->update($validated);

        return redirect()->back()->with('success', "Target provinsi {$target->province_name} berhasil diperbarui.");
    }
}
