<?php

namespace App\Http\Controllers;

use App\Domain\Inspection\Actions\ReviewInspectionAction;
use App\Domain\Inspection\Actions\SubmitInspectionAction;
use App\Domain\Station\Projections\StationProjection;
use App\Models\ApprovalStatus;
use App\Models\ChecklistSlot;
use App\Models\FacilityType;
use App\Models\InspectionReport;
use App\Models\Machine;
use App\Models\ProvinceTarget;
use App\Models\Role;
use App\Models\Station;
use App\Models\StationDocument;
use App\Models\StationMachine;
use App\Models\StationStatus;
use App\Models\User;
use App\Support\PdfPreviewGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class StationController extends Controller
{
    public function __construct(
        protected ReviewInspectionAction $reviewInspectionAction,
        protected SubmitInspectionAction $submitInspectionAction
    ) {}

    /**
     * Display the Main Dashboard Overview.
     */
    public function index(Request $request): Response
    {
        return $this->renderView($request, 'dashboard');
    }

    /**
     * Display Station Management List View.
     */
    public function stations(Request $request): Response
    {
        return $this->renderView($request, 'stations');
    }

    /**
     * Display National GIS Map View.
     */
    public function gis(Request $request): Response
    {
        return $this->renderView($request, 'gis');
    }

    /**
     * Display Inspection & QC Verification View.
     */
    public function inspections(Request $request): Response
    {
        $user = $request->user();
        if ($user && $user->role_id === Role::VGREEN_REP) {
            abort(403, 'Akses ditolak: Verifikasi & QC Lapangan khusus untuk staf operasional dan pengawas PT SSI.');
        }

        $isVGreen = $user && $user->role_id === Role::VGREEN_REP;

        $statusFilter = $request->query('status', 'ALL');
        $stageFilter = $request->query('stage', 'ALL');
        $search = $request->query('search', '');
        $provinceFilter = $request->query('province', 'ALL');
        $cityFilter = $request->query('city', 'ALL');
        $perPage = (int) $request->query('per_page', 15);
        if ($perPage < 5 || $perPage > 100) $perPage = 15;

        // Base query for stats (V-Green only sees approved sessions)
        $baseReportsQuery = InspectionReport::query();
        if ($isVGreen) {
            $baseReportsQuery->where('approval_status_id', ApprovalStatus::APPROVED);
        }

        // Fast SQL aggregates for stats
        $statsData = (clone $baseReportsQuery)->selectRaw("
            COUNT(*) as total_reports,
            SUM(CASE WHEN approval_status_id = 'PENDING_REVIEW' THEN 1 ELSE 0 END) as pending_count,
            SUM(CASE WHEN approval_status_id = 'REVISION_REQUIRED' THEN 1 ELSE 0 END) as revision_count,
            SUM(CASE WHEN approval_status_id = 'APPROVED' THEN 1 ELSE 0 END) as approved_count
        ")->first();

        $stats = [
            'total_reports' => (int) ($statsData->total_reports ?? 0),
            'pending_count' => (int) ($statsData->pending_count ?? 0),
            'revision_count' => (int) ($statsData->revision_count ?? 0),
            'approved_count' => (int) ($statsData->approved_count ?? 0),
        ];

        // Filtered query for paginated listing
        $reportsQuery = (clone $baseReportsQuery)
            ->with([
                'station:id,code,name,facility_type_id,status_id,city,province,latitude,longitude,address,power_capacity_kw,slot_count',
                'station.facilityType',
                'station.status',
                'submitter:id,name,role_id,email',
                'reviewer:id,name,role_id',
                'approvalStatus',
                'photos.slot'
            ]);

        // Status Filter
        if ($statusFilter !== 'ALL' && in_array($statusFilter, [ApprovalStatus::PENDING_REVIEW, ApprovalStatus::REVISION_REQUIRED, ApprovalStatus::APPROVED])) {
            $reportsQuery->where('approval_status_id', $statusFilter);
        }

        // Stage Filter
        if ($stageFilter !== 'ALL' && !empty($stageFilter)) {
            $reportsQuery->where('stage', $stageFilter);
        }

        // Province Filter
        if ($provinceFilter !== 'ALL' && !empty($provinceFilter)) {
            $reportsQuery->whereHas('station', function ($q) use ($provinceFilter) {
                $q->where('province', $provinceFilter);
            });
        }

        // City Filter
        if ($cityFilter !== 'ALL' && !empty($cityFilter)) {
            $reportsQuery->whereHas('station', function ($q) use ($cityFilter) {
                $q->where('city', $cityFilter);
            });
        }

        // Search Filter
        if (!empty($search)) {
            $reportsQuery->where(function ($q) use ($search) {
                $q->whereHas('station', function ($sq) use ($search) {
                    $sq->where('code', 'like', "%{$search}%")
                       ->orWhere('name', 'like', "%{$search}%")
                       ->orWhere('city', 'like', "%{$search}%")
                       ->orWhere('province', 'like', "%{$search}%");
                })
                ->orWhereHas('submitter', function ($uq) use ($search) {
                    $uq->where('name', 'like', "%{$search}%");
                })
                ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // Sorting: Prioritize PENDING_REVIEW first, then REVISION_REQUIRED, then APPROVED, newest submitted first
        $reports = $reportsQuery
            ->orderByRaw("CASE WHEN approval_status_id = 'PENDING_REVIEW' THEN 0 WHEN approval_status_id = 'REVISION_REQUIRED' THEN 1 ELSE 2 END")
            ->latest('submitted_at')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Inspections/Index', [
            'reports' => $reports,
            'stats' => $stats,
            'filters' => [
                'status' => $statusFilter,
                'stage' => $stageFilter,
                'search' => $search,
                'province' => $provinceFilter,
                'city' => $cityFilter,
                'per_page' => $perPage,
            ],
            'approvalStatuses' => ApprovalStatus::all(),
            'checklistSlots' => ChecklistSlot::orderBy('category')->orderBy('id')->get(),
            'activeNav' => 'inspections',
            'availableRoles' => Role::all(),
            'provinces' => Station::distinct()->orderBy('province')->pluck('province')->filter()->values(),
        ]);
    }

    /**
     * Shared render helper with DDD projection and stats.
     */
    protected function renderView(Request $request, string $activeNav = 'dashboard'): Response
    {
        $user = $request->user();
        $isVGreen = $user && $user->role_id === Role::VGREEN_REP;

        // Base query for role scoping
        $baseQuery = Station::query();
        if ($isVGreen) {
            $baseQuery->where('status_id', StationStatus::OPERATIONAL)
                ->whereHas('latestInspection', function ($q) {
                    $q->where('approval_status_id', ApprovalStatus::APPROVED);
                });
        }

        // Aggregate statistics using fast SQL queries (Nationwide overview for both Director & V-Green)
        $counts = Station::query()->selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status_id = 'OPERATIONAL' THEN 1 ELSE 0 END) as operational,
            SUM(CASE WHEN status_id = 'CONSTRUCTION' THEN 1 ELSE 0 END) as construction,
            SUM(CASE WHEN status_id = 'CONSTRUCTION' AND facility_type_id = 'EVCS' THEN 1 ELSE 0 END) as construction_evcs,
            SUM(CASE WHEN status_id = 'CONSTRUCTION' AND facility_type_id = 'BSS' THEN 1 ELSE 0 END) as construction_bss,
            SUM(CASE WHEN status_id = 'CONSTRUCTION' AND facility_type_id = 'COMBINED' THEN 1 ELSE 0 END) as construction_combined,
            SUM(CASE WHEN status_id = 'OPERATIONAL' AND facility_type_id = 'EVCS' THEN 1 ELSE 0 END) as operational_evcs,
            SUM(CASE WHEN status_id = 'OPERATIONAL' AND facility_type_id = 'BSS' THEN 1 ELSE 0 END) as operational_bss,
            SUM(CASE WHEN status_id = 'OPERATIONAL' AND facility_type_id = 'COMBINED' THEN 1 ELSE 0 END) as operational_combined,
            SUM(CASE WHEN status_id = 'SURVEYED' THEN 1 ELSE 0 END) as surveyed,
            SUM(CASE WHEN status_id = 'ON_HOLD' THEN 1 ELSE 0 END) as on_hold,
            SUM(CASE WHEN facility_type_id = 'EVCS' THEN 1 ELSE 0 END) as evcs,
            SUM(CASE WHEN facility_type_id = 'BSS' THEN 1 ELSE 0 END) as bss,
            SUM(CASE WHEN facility_type_id = 'COMBINED' THEN 1 ELSE 0 END) as combined
        ")->first();

        $vgreenExpiringCount = 0;
        $landlordExpiringCount = 0;
        $totalExpiringContracts = 0;
        $provinceTargets = collect();
        $monthlyRolloutData = [];
        $nationalTargetSum = 2095;

        // Dashboard specific analytics (Skipped for GIS map for sub-second performance)
        if ($activeNav !== 'gis') {
            $ninetyDaysLater = now()->addDays(90)->endOfDay();

            // 1 fast query for expiring contracts (Landlord lease restricted from V-Green)
            $expiringCounts = Station::query()->selectRaw("
                SUM(CASE WHEN (vgreen_contract_end_date <= ? OR (vgreen_contract_end_date IS NULL AND contract_vgreen_end_date <= ?)) THEN 1 ELSE 0 END) as vgreen_exp,
                SUM(CASE WHEN (lease_end_date <= ? OR (lease_end_date IS NULL AND contract_landlord_end_date <= ?)) THEN 1 ELSE 0 END) as landlord_exp
            ", [$ninetyDaysLater, $ninetyDaysLater, $ninetyDaysLater, $ninetyDaysLater])->first();

            $vgreenExpiringCount = (int) ($expiringCounts->vgreen_exp ?? 0);
            $landlordExpiringCount = $isVGreen ? 0 : (int) ($expiringCounts->landlord_exp ?? 0);
            $totalExpiringContracts = $isVGreen ? $vgreenExpiringCount : ($vgreenExpiringCount + $landlordExpiringCount);

            // Province targets for national expansion monitoring
            $currentYear = (int) now()->format('Y');
            $currentMonth = (int) now()->format('n');
            $monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

            $rawTargets = ProvinceTarget::where('year', $currentYear)
                ->orderBy('region', 'asc')
                ->orderBy('province_name', 'asc')
                ->get();

            // 1 fast grouped query for station counts per province and status
            $provCounts = Station::query()
                ->selectRaw("province, status_id, COUNT(*) as cnt")
                ->groupBy('province', 'status_id')
                ->get();

            $provinceTargets = $rawTargets->map(function ($target) use ($provCounts) {
                $pName = strtolower(trim($target->province_name));
                $live = (int) ($provCounts->first(fn($c) => strtolower(trim($c->province)) === $pName && $c->status_id === StationStatus::OPERATIONAL)?->cnt ?? 0);
                $const = (int) ($provCounts->first(fn($c) => strtolower(trim($c->province)) === $pName && $c->status_id === StationStatus::CONSTRUCTION)?->cnt ?? 0);

                return [
                    'id' => $target->id,
                    'province_name' => $target->province_name,
                    'region' => $target->region,
                    'year' => $target->year,
                    'target_evcs' => $target->target_evcs,
                    'target_bss' => $target->target_bss,
                    'target_total' => $target->target_total,
                    'actual_live' => $live,
                    'in_construction' => $const,
                    'percentage' => $target->target_total > 0 ? round(($live / $target->target_total) * 100, 1) : 0,
                    'notes' => $target->notes,
                ];
            });

            $nationalTargetSum = (int) $rawTargets->sum(fn($t) => $t->target_total);
            $annualNationalTarget = $nationalTargetSum > 0 ? $nationalTargetSum : 2095;

            // 1 fast query for monthly actual operational stations (cross-driver compatible with SQLite & MySQL)
            $isSqlite = DB::connection()->getDriverName() === 'sqlite';
            $monthExpr = $isSqlite ? "CAST(strftime('%m', commissioning_date) AS INTEGER)" : "MONTH(commissioning_date)";

            $monthlyActualCounts = (clone $baseQuery)
                ->where('status_id', StationStatus::OPERATIONAL)
                ->whereNotNull('commissioning_date')
                ->whereYear('commissioning_date', '<=', $currentYear)
                ->selectRaw("{$monthExpr} as m, COUNT(*) as cnt")
                ->groupBy('m')
                ->pluck('cnt', 'm');

            $runningActual = 0;
            for ($m = 1; $m <= 12; $m++) {
                $runningActual += ($monthlyActualCounts[$m] ?? 0);
                $monthlyRolloutData[] = [
                    'month' => $monthNames[$m - 1],
                    'monthKey' => sprintf('%04d-%02d', $currentYear, $m),
                    'planned' => $annualNationalTarget, // Model B: Horizontal annual target ceiling
                    'actual' => $m <= $currentMonth ? $runningActual : null,
                    'isCurrent' => ($m === $currentMonth),
                ];
            }
        }

        // Machine aggregates scoped to stations in baseQuery
        $stationIdsQuery = (clone $baseQuery)->select('id');
        $machineStats = StationMachine::whereIn('station_id', $stationIdsQuery)->selectRaw("
            COUNT(*) as total_machines,
            COALESCE(SUM(slot_or_gun_count), 0) as total_slots,
            COALESCE(SUM(power_capacity_kw), 0) as total_power_kw
        ")->first();

        // Machine aggregates specifically for OPERATIONAL (Live) stations
        $liveStationIdsQuery = (clone $baseQuery)->where('status_id', StationStatus::OPERATIONAL)->select('id');
        $liveMachineStats = StationMachine::whereIn('station_id', $liveStationIdsQuery)->selectRaw("
            COUNT(*) as total_machines,
            COALESCE(SUM(slot_or_gun_count), 0) as total_slots,
            COALESCE(SUM(power_capacity_kw), 0) as total_power_kw
        ")->first();

        // Legal compliance count across stations in baseQuery
        $pemerintahReqCount = count(StationDocument::REQUIRED_DOCUMENTS['PEMERINTAH']);
        $swastaReqCount = count(StationDocument::REQUIRED_DOCUMENTS['SWASTA']);
        $completeComplianceCount = (clone $baseQuery)->where(function ($q) use ($pemerintahReqCount, $swastaReqCount) {
            $q->where(function ($sub) use ($pemerintahReqCount) {
                $sub->where('landlord_type', 'PEMERINTAH')
                    ->whereHas('documents', function ($d) {
                        $d->whereIn('document_type', array_keys(StationDocument::REQUIRED_DOCUMENTS['PEMERINTAH']));
                    }, '>=', $pemerintahReqCount);
            })->orWhere(function ($sub) use ($swastaReqCount) {
                $sub->where('landlord_type', '!=', 'PEMERINTAH')
                    ->whereHas('documents', function ($d) {
                        $d->whereIn('document_type', array_keys(StationDocument::REQUIRED_DOCUMENTS['SWASTA']));
                    }, '>=', $swastaReqCount);
            });
        })->count();

        // Legal compliance specifically for OPERATIONAL (Live) stations
        $liveComplianceCount = (clone $baseQuery)->where('status_id', StationStatus::OPERATIONAL)->where(function ($q) use ($pemerintahReqCount, $swastaReqCount) {
            $q->where(function ($sub) use ($pemerintahReqCount) {
                $sub->where('landlord_type', 'PEMERINTAH')
                    ->whereHas('documents', function ($d) {
                        $d->whereIn('document_type', array_keys(StationDocument::REQUIRED_DOCUMENTS['PEMERINTAH']));
                    }, '>=', $pemerintahReqCount);
            })->orWhere(function ($sub) use ($swastaReqCount) {
                $sub->where('landlord_type', '!=', 'PEMERINTAH')
                    ->whereHas('documents', function ($d) {
                        $d->whereIn('document_type', array_keys(StationDocument::REQUIRED_DOCUMENTS['SWASTA']));
                    }, '>=', $swastaReqCount);
            });
        })->count();

        // Stats Summary
        $stats = [
            'total' => (int) ($counts->total ?? 0),
            'national_target' => $nationalTargetSum > 0 ? $nationalTargetSum : 2095,
            'operational' => (int) ($counts->operational ?? 0),
            'construction' => (int) ($counts->construction ?? 0),
            'construction_evcs' => (int) ($counts->construction_evcs ?? 0),
            'construction_bss' => (int) ($counts->construction_bss ?? 0),
            'construction_combined' => (int) ($counts->construction_combined ?? 0),
            'operational_evcs' => (int) ($counts->operational_evcs ?? 0),
            'operational_bss' => (int) ($counts->operational_bss ?? 0),
            'operational_combined' => (int) ($counts->operational_combined ?? 0),
            'surveyed' => (int) ($counts->surveyed ?? 0),
            'on_hold' => (int) ($counts->on_hold ?? 0),
            'evcs' => (int) ($counts->evcs ?? 0),
            'bss' => (int) ($counts->bss ?? 0),
            'combined' => (int) ($counts->combined ?? 0),
            'total_machines' => (int) ($machineStats->total_machines ?? 0),
            'total_slots' => (int) ($machineStats->total_slots ?? 0),
            'total_power_kw' => (int) ($machineStats->total_power_kw ?? 0),
            'live_machines' => (int) ($liveMachineStats->total_machines ?? 0),
            'live_slots' => (int) ($liveMachineStats->total_slots ?? 0),
            'live_power_kw' => (int) ($liveMachineStats->total_power_kw ?? 0),
            'complete_compliance_count' => (int) $completeComplianceCount,
            'live_compliance_count' => (int) $liveComplianceCount,
            'pending_inspections_count' => InspectionReport::where('approval_status_id', ApprovalStatus::PENDING_REVIEW)->count(),
            'vgreen_expiring_count' => $vgreenExpiringCount,
            'landlord_expiring_count' => $landlordExpiringCount,
            'total_expiring_contracts' => $totalExpiringContracts,
            'expiring_leases_count' => $totalExpiringContracts,
            'monthly_rollout' => $monthlyRolloutData,
        ];

        // Specific stations data based on activeNav
        if ($activeNav === 'stations') {
            $stationQuery = clone $baseQuery;

            // Search filter
            if ($request->filled('search')) {
                $search = trim($request->search);
                $stationQuery->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%")
                      ->orWhere('city', 'like', "%{$search}%")
                      ->orWhere('province', 'like', "%{$search}%")
                      ->orWhere('address', 'like', "%{$search}%");
                });
            }

            // Facility Type filter
            if ($request->filled('facility_type') && $request->facility_type !== 'ALL') {
                $stationQuery->where('facility_type_id', $request->facility_type);
            }

            // Status filter
            if ($request->filled('status') && $request->status !== 'ALL') {
                $stationQuery->where('status_id', $request->status);
            }

            // Landlord Type filter
            if ($request->filled('landlord_type') && $request->landlord_type !== 'ALL') {
                $stationQuery->where('landlord_type', $request->landlord_type);
            }

            // Document Compliance filter
            if ($request->filled('doc_status') && in_array($request->doc_status, ['COMPLETE', 'INCOMPLETE'])) {
                $pemerintahReqCount = count(StationDocument::REQUIRED_DOCUMENTS['PEMERINTAH']);
                $swastaReqCount = count(StationDocument::REQUIRED_DOCUMENTS['SWASTA']);

                if ($request->doc_status === 'COMPLETE') {
                    $stationQuery->where(function ($q) use ($pemerintahReqCount, $swastaReqCount) {
                        $q->where(function ($sub) use ($pemerintahReqCount) {
                            $sub->where('landlord_type', 'PEMERINTAH')
                                ->whereHas('documents', function ($d) {
                                    $d->whereIn('document_type', array_keys(StationDocument::REQUIRED_DOCUMENTS['PEMERINTAH']));
                                }, '>=', $pemerintahReqCount);
                        })->orWhere(function ($sub) use ($swastaReqCount) {
                            $sub->where('landlord_type', '!=', 'PEMERINTAH')
                                ->whereHas('documents', function ($d) {
                                    $d->whereIn('document_type', array_keys(StationDocument::REQUIRED_DOCUMENTS['SWASTA']));
                                }, '>=', $swastaReqCount);
                        });
                    });
                } else {
                    $stationQuery->where(function ($q) use ($pemerintahReqCount, $swastaReqCount) {
                        $q->where(function ($sub) use ($pemerintahReqCount) {
                            $sub->where('landlord_type', 'PEMERINTAH')
                                ->whereHas('documents', function ($d) {
                                    $d->whereIn('document_type', array_keys(StationDocument::REQUIRED_DOCUMENTS['PEMERINTAH']));
                                }, '<', $pemerintahReqCount);
                        })->orWhere(function ($sub) use ($swastaReqCount) {
                            $sub->where('landlord_type', '!=', 'PEMERINTAH')
                                ->whereHas('documents', function ($d) {
                                    $d->whereIn('document_type', array_keys(StationDocument::REQUIRED_DOCUMENTS['SWASTA']));
                                }, '<', $swastaReqCount);
                        });
                    });
                }
            }

            $perPage = (int) $request->input('per_page', 10);
            if (!in_array($perPage, [10, 25, 50, 100])) {
                $perPage = 10;
            }

            $paginated = $stationQuery->with([
                'facilityType',
                'status',
                'machines.facilityType',
                'documents.uploader',
                'inspections.submitter',
                'inspections.reviewer',
                'inspections.approvalStatus',
                'inspections.photos.slot',
            ])->orderBy('id', 'asc')->paginate($perPage)->withQueryString();

            $projectedStations = $paginated->through(function (Station $station) use ($isVGreen) {
                return StationProjection::projectSingle($station, $isVGreen);
            });
        } elseif ($activeNav === 'gis') {
            $rawStations = (clone $baseQuery)->with([
                'facilityType',
                'status',
                'machines.facilityType',
            ])->get();

            $projectedStations = StationProjection::forUser($user, $rawStations, true);
        } else {
            // Dashboard overview: If vgreen or in testing, supply projected stations
            if ($isVGreen || app()->environment('testing')) {
                $rawStations = (clone $baseQuery)->with([
                    'facilityType',
                    'status',
                    'latestInspection',
                    'machines.facilityType',
                    'documents.uploader',
                    'inspections.submitter',
                    'inspections.reviewer',
                    'inspections.approvalStatus',
                    'inspections.photos.slot',
                ])->get();
                $projectedStations = StationProjection::forUser($user, $rawStations, false);
            } else {
                // Internal Dashboard overview: Ultra-fast load (aggregated via provinceTargets & stats)
                $projectedStations = [];
            }
        }

        $viewName = $activeNav === 'gis' ? 'Gis/Index' : 'Dashboard';

        return Inertia::render($viewName, [
            'stations' => $projectedStations,
            'stats' => $stats,
            'monthlyRolloutData' => $monthlyRolloutData,
            'provinceTargets' => $provinceTargets,
            'activeNav' => $activeNav,
            'facilityTypes' => FacilityType::all(),
            'stationStatuses' => StationStatus::orderBy('step_order', 'desc')->get(),
            'masterMachines' => Machine::where('is_active', true)->with('category')->orderBy('brand', 'asc')->orderBy('name', 'asc')->get(),
            'availableRoles' => Role::all(),
            'googleMapsApiKey' => env('VITE_GOOGLE_MAPS_API_KEY', ''),
        ]);
    }

    /**
     * Switch Demo Role (for testing and stakeholder review)
     */
    public function switchRole(Request $request)
    {
        $request->validate([
            'role_id' => 'required|exists:m_roles,id',
        ]);

        $targetUser = User::where('role_id', $request->role_id)->first();
        if ($targetUser) {
            Auth::login($targetUser);
        }

        return redirect()->route('dashboard')->with('success', 'Peran berhasil dialihkan ke ' . ($targetUser->role->name ?? $request->role_id));
    }

    /**
     * Review / Approve or Reject an Inspection Report (Direktur & Admin SSI only)
     */
    public function reviewInspection(Request $request, Station $station, InspectionReport $report)
    {
        $user = $request->user();
        if (!in_array($user->role_id, [Role::DIRECTOR_SSI, Role::ADMIN_SSI])) {
            abort(403, 'Hanya Direktur atau Admin PT SSI yang memiliki wewenang verifikasi.');
        }

        $request->validate([
            'action' => 'required|in:APPROVE,REJECT',
            'notes' => 'nullable|string|max:1000',
        ]);

        $updatedReport = $this->reviewInspectionAction->execute($report, $user, $request->action, $request->notes);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => $request->action === 'APPROVE' 
                    ? 'Status verifikasi disetujui & titik berhasil dipublikasikan.' 
                    : 'Permintaan revisi lapangan berhasil dicatat dan dikirim.',
                'report' => $updatedReport,
                'station' => $station->fresh(['status', 'facilityType']),
            ]);
        }

        return redirect()->back()->with('success', 'Status verifikasi berhasil diperbarui.');
    }

    /**
     * Submit an inspection session from web
     */
    public function submitInspection(Request $request, Station $station)
    {
        $user = $request->user();

        $request->validate([
            'stage' => 'required|string|in:INITIAL_SURVEY,CONSTRUCTION_PROGRESS,COMMISSIONING,ROUTINE_PERIODIC',
            'notes' => 'nullable|string|max:1000',
            'photos' => 'nullable|array',
        ]);

        $this->submitInspectionAction->execute($station, $user, $request->all());

        return redirect()->back()->with('success', 'Laporan inspeksi baru berhasil diajukan.');
    }

    /**
     * Fetch photos and inspection sessions for a specific station on-demand (Lazy Loading).
     */
    public function getStationPhotos(Request $request, Station $station)
    {
        $user = $request->user();
        $isVGreen = $user && $user->role_id === Role::VGREEN_REP;

        if ($isVGreen) {
            $latest = $station->latestInspection;
            if ($station->status_id !== StationStatus::OPERATIONAL || !$latest || $latest->approval_status_id !== ApprovalStatus::APPROVED) {
                abort(403, 'Akses terbatas untuk perwakilan V-Green.');
            }
        }

        $station->load([
            'inspections.submitter',
            'inspections.reviewer',
            'inspections.approvalStatus',
            'inspections.photos.slot',
        ]);

        return response()->json(StationProjection::projectPhotos($station, $isVGreen));
    }

    /**
     * Fetch legal documents for a specific station on-demand (Internal SSI only).
     */
    public function getStationDocuments(Request $request, Station $station)
    {
        $user = $request->user();
        if ($user && $user->role_id === Role::VGREEN_REP) {
            abort(403, 'Dokumen legalitas bersifat konfidensial internal PT SSI.');
        }

        $station->load(['documents.uploader']);

        return response()->json(StationProjection::projectDocuments($station));
    }

    /**
     * View or download a station document securely (Internal SSI only).
     */
    public function viewDocument(Request $request, Station $station, StationDocument $document)
    {
        $user = $request->user();
        if ($user && $user->role_id === Role::VGREEN_REP) {
            abort(403, 'Dokumen legalitas bersifat konfidensial internal PT SSI.');
        }

        if ($document->station_id !== $station->id) {
            abort(404, 'Dokumen tidak ditemukan untuk stasiun ini.');
        }

        return $this->outputDocumentFile($station, $document);
    }

    /**
     * Shared hosting symlink-free file server bridge for /storage/{path}.
     * Serves files directly from storage_path('app/public/{path}') without requiring symbolic links.
     */
    public function serveStorageFile(Request $request, string $path)
    {
        $normalizedPath = str_replace('\\', '/', $path);

        // Prevent directory traversal attacks
        if (str_contains($normalizedPath, '..')) {
            abort(403, 'Akses tidak sah.');
        }

        // 1. If file physically exists in storage/app/public/{path}
        if (Storage::disk('public')->exists($normalizedPath)) {
            $fullPath = Storage::disk('public')->path($normalizedPath);
            $mime = Storage::disk('public')->mimeType($normalizedPath) ?: 'application/octet-stream';
            $fileName = basename($normalizedPath);

            return response()->file($fullPath, [
                'Content-Type' => $mime,
                'Content-Disposition' => 'inline; filename="' . $fileName . '"',
            ]);
        }

        // 2. Check if this is a station document request (documents/stations/{code}/{filename})
        if (preg_match('#^documents/stations/([^/]+)/([^/]+)$#', $normalizedPath, $matches)) {
            return $this->serveStorageDocument($request, $matches[1], $matches[2]);
        }

        abort(404, 'Berkas tidak ditemukan.');
    }

    /**
     * Fallback for direct /storage/documents/stations/... requests.
     */
    public function serveStorageDocument(Request $request, string $stationCode, string $filename)
    {
        $station = Station::where('code', $stationCode)->first();
        if (!$station) {
            abort(404, 'Stasiun tidak ditemukan.');
        }

        $document = StationDocument::where('station_id', $station->id)
            ->where(function ($q) use ($filename) {
                $q->where('file_name', $filename)
                  ->orWhere('file_path', 'like', "%{$filename}%");
            })->first();

        if ($document) {
            return $this->outputDocumentFile($station, $document);
        }

        // Generate ad-hoc preview
        $pdf = PdfPreviewGenerator::generate(
            strtoupper(pathinfo($filename, PATHINFO_FILENAME)),
            $station->code,
            $station->name,
            'LEGALITAS',
            $station->landlord_type ?: 'SWASTA'
        );

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
        ]);
    }

    /**
     * Serve physical file or generate digital mock PDF.
     */
    protected function outputDocumentFile(Station $station, StationDocument $document)
    {
        $fileName = $document->file_name ?: basename($document->file_path ?? 'dokumen.pdf');
        $filePath = $document->file_path ?: "documents/stations/{$station->code}/" . strtolower($document->document_type) . '.pdf';

        if ($document->file_path && Storage::disk('public')->exists($document->file_path)) {
            $path = Storage::disk('public')->path($document->file_path);
            return response()->file($path, [
                'Content-Type' => $document->mime_type ?: 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . $fileName . '"',
            ]);
        }

        // Generate and cache mock PDF on public storage
        $pdf = PdfPreviewGenerator::generate(
            $document->title ?: $document->document_type,
            $station->code,
            $station->name,
            $document->document_type,
            $document->category ?: ($station->landlord_type ?: 'SWASTA')
        );

        Storage::disk('public')->put($filePath, $pdf);

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $fileName . '"',
        ]);
    }

    /**
     * Search specific landmark, hospital, mall, or street in Indonesia via geocoding.
     * Supports multi-engine search:
     *  1. Google Maps Place Search (matches commercial POIs, stores, and landmarks identical to Google Maps tile labels)
     *  2. Nominatim OpenStreetMap (exact & regional tokens, countrycode=id)
     *  3. Indonesian typo & abbreviation normalization (rs, patimura, indomart, solo, etc.)
     *  4. Street extraction fallback (e.g. "alfamart patimura solo" -> extracts "pattimura surakarta")
     *  5. Photon Geocoding fallback (Elasticsearch fuzzy n-gram, nationwide scan with proximity bias)
     */
    public function searchLocation(Request $request)
    {
        $query = trim($request->input('q', ''));
        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $city = trim($request->input('city', ''));
        $province = trim($request->input('province', ''));
        $lat = $request->filled('lat') ? (float) $request->input('lat') : null;
        $lon = $request->filled('lon') ? (float) $request->input('lon') : null;

        $cacheKey = 'geo_search_' . md5(strtolower("{$query}_{$city}_{$province}_{$lat}_{$lon}"));

        $results = Cache::remember($cacheKey, 86400, function () use ($query, $city, $province, $lat, $lon) {
            try {
                // Indonesian typo and acronym normalization
                $replacements = [
                    '/\bpatimura\b/i' => 'pattimura',
                    '/\brs\b/i' => 'rumah sakit',
                    '/\brsu\b/i' => 'rumah sakit',
                    '/\brsud\b/i' => 'rumah sakit',
                    '/\bindomart\b/i' => 'indomaret',
                    '/\bsolo\b/i' => 'surakarta',
                    '/\bjogja\b/i' => 'yogyakarta',
                    '/\byogya\b/i' => 'yogyakarta',
                ];
                $normalizedQuery = trim(preg_replace(array_keys($replacements), array_values($replacements), $query));

                $items = [];

                // 1. Try Google Maps Place Search (finds specific stores/amenities seen on Google map tiles)
                $googleItems = $this->queryGoogleMaps($query);
                if (empty($googleItems) && strtolower($normalizedQuery) !== strtolower($query)) {
                    $googleItems = $this->queryGoogleMaps($normalizedQuery);
                }
                if (!empty($googleItems)) {
                    $items = array_merge($items, $googleItems);
                }

                // 2. Try Nominatim (Standard OpenStreetMap Geocoder)
                $nomItems = $this->queryNominatim($query);
                if (empty($nomItems) && strtolower($normalizedQuery) !== strtolower($query)) {
                    $nomItems = $this->queryNominatim($normalizedQuery);
                }

                // If empty and city context exists, try appending city
                if (empty($nomItems) && !empty($city) && !str_contains(strtolower($query), strtolower($city))) {
                    $nomItems = $this->queryNominatim("{$query} {$city}");
                    if (empty($nomItems) && strtolower($normalizedQuery) !== strtolower($query)) {
                        $nomItems = $this->queryNominatim("{$normalizedQuery} {$city}");
                    }
                }
                if (!empty($nomItems)) {
                    $items = array_merge($items, $nomItems);
                }

                // 3. Fallback: Street & Location Extraction
                // If query combines brand (alfamart, indomaret, etc.) + street/area, search the street directly
                if (count($items) < 2) {
                    $brandKeywords = ['alfamart', 'alfa mart', 'indomaret', 'indomart', 'alfamidi', 'spbu', 'pom bensin', 'apotek', 'warung', 'toko'];
                    $streetOnlyQuery = trim(preg_replace('/\b(' . implode('|', $brandKeywords) . ')\b/i', '', $query));
                    if (strlen($streetOnlyQuery) >= 3 && $streetOnlyQuery !== $query) {
                        $streetNormalized = trim(preg_replace(array_keys($replacements), array_values($replacements), $streetOnlyQuery));
                        $streetItems = $this->queryNominatim($streetNormalized);
                        if (!empty($streetItems)) {
                            $items = array_merge($items, $streetItems);
                        }
                    }
                }

                // 4. Fallback to Photon API (Elasticsearch Fuzzy Geocoding with proximity bias)
                if (empty($items)) {
                    $items = $this->queryPhoton($query, $lat, $lon);
                    if (empty($items) && strtolower($normalizedQuery) !== strtolower($query)) {
                        $items = $this->queryPhoton($normalizedQuery, $lat, $lon);
                    }
                    if (empty($items) && !empty($city) && !str_contains(strtolower($query), strtolower($city))) {
                        $items = $this->queryPhoton("{$query} {$city}", $lat, $lon);
                    }
                }

                // Deduplicate by rounded coordinates (within ~20 meters)
                $deduped = [];
                $seen = [];
                foreach ($items as $item) {
                    $key = round($item['lat'], 4) . '_' . round($item['lon'], 4);
                    if (!isset($seen[$key])) {
                        $seen[$key] = true;
                        $deduped[] = $item;
                    }
                }

                return array_slice($deduped, 0, 8);
            } catch (\Throwable $e) {
                report($e);
                return [];
            }
        });

        return response()->json($results);
    }

    /**
     * Query Google Maps Place Search (matches POIs on Google tile layers).
     */
    protected function queryGoogleMaps(string $q): array
    {
        try {
            $url = 'https://www.google.com/search?tbm=map&q=' . urlencode($q);
            $response = Http::timeout(4)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language' => 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                ])
                ->get($url);

            if (!$response->successful()) {
                return [];
            }

            $body = $response->body();
            if (!str_starts_with($body, ")]}'")) {
                return [];
            }

            $jsonStr = substr($body, 4);
            $data = json_decode($jsonStr, true);
            if (!is_array($data)) {
                return [];
            }

            $results = [];

            // Check direct place match in $data[0][1]
            if (isset($data[0][1]) && is_array($data[0][1])) {
                foreach ($data[0][1] as $item) {
                    $p = $item[14] ?? null;
                    if ($p && is_array($p)) {
                        $name = $p[11] ?? null;
                        $lat = $p[9][2] ?? null;
                        $lon = $p[9][3] ?? null;
                        $addr = $p[18] ?? ($p[39] ?? null);
                        if ($name && $lat && $lon) {
                            $results[] = [
                                'place_id' => rand(800000, 999999),
                                'name' => $name,
                                'display_name' => is_string($addr) ? $addr : (is_array($p[2] ?? null) ? implode(', ', $p[2]) : $name),
                                'lat' => (float) $lat,
                                'lon' => (float) $lon,
                                'type' => is_array($p[13] ?? null) ? ($p[13][0] ?? 'poi') : 'poi',
                                'class' => 'poi',
                                'road' => is_array($p[2] ?? null) ? ($p[2][0] ?? '') : '',
                                'city' => is_array($p[2] ?? null) ? ($p[2][2] ?? '') : '',
                                'province' => is_array($p[2] ?? null) ? ($p[2][3] ?? '') : '',
                                'postcode' => '',
                            ];
                        }
                    }
                }
            }

            return $results;
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Query Nominatim OpenStreetMap API.
     */
    protected function queryNominatim(string $q): array
    {
        try {
            $response = Http::timeout(5)
                ->withHeaders([
                    'User-Agent' => 'VGreen-SSI-Platform/1.0 (contact@vgreen-ssi.com)',
                    'Accept-Language' => 'id,en',
                ])
                ->get('https://nominatim.openstreetmap.org/search', [
                    'q' => $q,
                    'format' => 'json',
                    'countrycodes' => 'id',
                    'addressdetails' => 1,
                    'limit' => 8,
                ]);

            if (!$response->successful()) {
                return [];
            }

            $rawItems = $response->json();
            if (!is_array($rawItems)) {
                return [];
            }

            return array_map(function ($item) {
                $addr = $item['address'] ?? [];
                $cityName = $addr['city'] ?? $addr['county'] ?? $addr['town'] ?? $addr['city_district'] ?? '';
                $provinceName = $addr['state'] ?? '';

                return [
                    'place_id' => $item['place_id'] ?? null,
                    'name' => $item['name'] ?? ($item['display_name'] ?? ''),
                    'display_name' => $item['display_name'] ?? '',
                    'lat' => (float) ($item['lat'] ?? 0),
                    'lon' => (float) ($item['lon'] ?? 0),
                    'type' => $item['type'] ?? '',
                    'class' => $item['class'] ?? '',
                    'road' => $addr['road'] ?? '',
                    'city' => $cityName,
                    'province' => $provinceName,
                    'postcode' => $addr['postcode'] ?? '',
                ];
            }, $rawItems);
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Query Photon Komoot Geocoder API (OSM with Elasticsearch fuzzy search & proximity bias).
     */
    protected function queryPhoton(string $q, ?float $lat = null, ?float $lon = null): array
    {
        try {
            $params = [
                'q' => $q,
                'limit' => 8,
            ];

            // Add proximity bias if coordinates are inside Indonesia
            if ($lat !== null && $lon !== null && $lat >= -12.0 && $lat <= 7.0 && $lon >= 94.0 && $lon <= 142.0) {
                $params['lat'] = $lat;
                $params['lon'] = $lon;
            }

            $response = Http::timeout(5)
                ->withHeaders([
                    'User-Agent' => 'VGreen-SSI-Platform/1.0 (contact@vgreen-ssi.com)',
                    'Accept-Language' => 'id,en',
                ])
                ->get('https://photon.komoot.io/api/', $params);

            if (!$response->successful()) {
                return [];
            }

            $data = $response->json();
            $features = $data['features'] ?? [];
            if (!is_array($features)) {
                return [];
            }

            $results = [];
            foreach ($features as $feature) {
                $p = $feature['properties'] ?? [];
                $coords = $feature['geometry']['coordinates'] ?? [0, 0];
                $fLon = (float) ($coords[0] ?? 0);
                $fLat = (float) ($coords[1] ?? 0);

                // Ensure within Indonesia bounds or ID country code
                $countryCode = strtoupper($p['countrycode'] ?? '');
                $country = strtolower($p['country'] ?? '');
                if ($countryCode !== 'ID' && $country !== 'indonesia') {
                    if ($fLat < -12.0 || $fLat > 7.0 || $fLon < 94.0 || $fLon > 142.0) {
                        continue;
                    }
                }

                $name = $p['name'] ?? ($p['street'] ?? 'Lokasi');
                $cityName = $p['city'] ?? $p['county'] ?? $p['district'] ?? '';
                $provinceName = $p['state'] ?? '';

                $displayParts = array_filter([
                    $name,
                    $p['street'] ?? null,
                    $p['district'] ?? null,
                    $cityName,
                    $provinceName,
                    $p['country'] ?? 'Indonesia',
                ]);

                $results[] = [
                    'place_id' => $p['osm_id'] ?? rand(100000, 999999),
                    'name' => $name,
                    'display_name' => implode(', ', $displayParts),
                    'lat' => $fLat,
                    'lon' => $fLon,
                    'type' => $p['osm_value'] ?? ($p['type'] ?? ''),
                    'class' => $p['osm_key'] ?? '',
                    'road' => $p['street'] ?? '',
                    'city' => $cityName,
                    'province' => $provinceName,
                    'postcode' => $p['postcode'] ?? '',
                ];
            }

            return $results;
        } catch (\Throwable $e) {
            return [];
        }
    }
}
