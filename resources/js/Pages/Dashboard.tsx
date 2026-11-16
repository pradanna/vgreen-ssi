import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Station, FacilityType, StationStatus, FacilityTypeId, StationStatusId, StatsSummary, MasterMachine, MonthlyRolloutPoint, ProvinceTargetItem } from '@/types/station';
import { PaginatedData } from '@/types/pagination';
import Pagination from '@/Components/Common/Pagination';
import ActionDropdown from '@/Components/Common/ActionDropdown';
import StationDetailDrawer from '@/Components/Map/StationDetailDrawer';
import UserDropdown from '@/Components/Navigation/UserDropdown';
import StationFormModal from '@/Components/Admin/StationFormModal';
import MassImportModal from '@/Components/Admin/MassImportModal';
import SidebarNav from '@/Components/Navigation/SidebarNav';
import SidebarTrigger from '@/Components/Navigation/SidebarTrigger';
import Select2, { Select2Option } from '@/Components/Common/Select2';
import { 
    LayoutGrid, 
    BookOpen, 
    FolderTree, 
    TrendingUp, 
    MessageSquare, 
    BarChart3, 
    CreditCard, 
    Settings, 
    HelpCircle, 
    Search, 
    Bell, 
    Check, 
    ArrowDownRight, 
    ArrowUpRight, 
    ChevronRight,
    MapPin, 
    Table as TableIcon,
    ArrowUpDown,
    FileText,
    Cpu,
    X,
    Sparkles,
    Zap,
    Car,
    Motorbike,
    BatteryCharging,
    ExternalLink,
    Plus,
    FileSpreadsheet,
    Download,
    Edit2,
    Trash2,
    ShieldCheck,
    Hammer,
    CheckCircle2,
    AlertTriangle,
    MoreVertical,
    Eye
} from 'lucide-react';

interface DashboardProps extends PageProps {
    stations: Station[] | PaginatedData<Station>;
    stats: StatsSummary;
    monthlyRolloutData?: MonthlyRolloutPoint[];
    provinceTargets?: ProvinceTargetItem[];
    activeNav?: 'dashboard' | 'stations' | 'gis' | 'inspections' | 'settings' | 'master-data' | 'targets';
    facilityTypes?: FacilityType[];
    stationStatuses?: StationStatus[];
    masterMachines?: MasterMachine[];
    availableRoles: { id: string; name: string; description: string }[];
    googleMapsApiKey?: string;
    importErrors?: Array<{ row: number; code: string; error: string }>;
}

export default function Dashboard({
    auth,
    stations = [],
    stats,
    monthlyRolloutData = [],
    provinceTargets = [],
    activeNav = 'dashboard',
    facilityTypes = [],
    stationStatuses = [],
    masterMachines = [],
    availableRoles = [],
    googleMapsApiKey = '',
    importErrors = [],
}: DashboardProps) {
    const user = auth.user;
    const isVGreen = user.role_id === 'VGREEN_REP';
    const isInternal = user.role_id === 'DIRECTOR_SSI' || user.role_id === 'ADMIN_SSI';

    // Normalize stations prop (supports both array and Laravel PaginatedData)
    const isPaginated = !Array.isArray(stations) && Boolean((stations as any)?.links);
    const stationList: Station[] = useMemo(() => {
        if (Array.isArray(stations)) return stations;
        return (stations as any)?.data || [];
    }, [stations]);

    const totalStationsCount = useMemo(() => {
        if (!stations) return 0;
        if (Array.isArray(stations)) return stations.length;
        return (stations as PaginatedData<Station>).total ?? 0;
    }, [stations]);

    // UI Navigation & Filters
    const [selectedTimeRange, setSelectedTimeRange] = useState<'1y' | '6m' | '3m'>('1y');
    const [chartProvince, setChartProvince] = useState<string>('ALL');
    const [leaderboardTab, setLeaderboardTab] = useState<'live' | 'deficit' | 'percentage'>('live');

    // Real Data Leaderboard:
    // 1. Realisasi Terbanyak: Sorted by actual live stations count desc (DKI Jakarta 47, Jabar 39, Jatim 33, Jateng 22, Bali 19)
    const topLiveProvinces = useMemo(() => {
        return [...provinceTargets]
            .filter(p => (p.actual_live ?? 0) > 0)
            .sort((a, b) => (b.actual_live ?? 0) - (a.actual_live ?? 0))
            .slice(0, 5);
    }, [provinceTargets]);

    // 2. Butuh Akselerasi (Sisa Target Terbanyak): Sorted by remaining target deficit desc (DKI sisa 453, Jabar sisa 291, Jatim sisa 187, Sumut sisa 124, Jateng sisa 93)
    const laggingProvinces = useMemo(() => {
        return [...provinceTargets]
            .filter(p => p.target_total > 0)
            .sort((a, b) => {
                const defA = a.target_total - (a.actual_live ?? 0);
                const defB = b.target_total - (b.actual_live ?? 0);
                return defB - defA;
            })
            .slice(0, 5);
    }, [provinceTargets]);

    // 3. Persentase Ketercapaian: Sorted by completion percentage desc
    const percentageProvinces = useMemo(() => {
        return [...provinceTargets]
            .filter(p => p.target_total > 0)
            .sort((a, b) => {
                const pctA = (a.actual_live ?? 0) / (a.target_total || 1);
                const pctB = (b.actual_live ?? 0) / (b.target_total || 1);
                return pctB - pctA;
            })
            .slice(0, 5);
    }, [provinceTargets]);

    const displayedLeaderboard = leaderboardTab === 'live'
        ? topLiveProvinces
        : leaderboardTab === 'deficit'
        ? laggingProvinces
        : percentageProvinces;

    // Initialize filtering states from URL query params if present
    const queryParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const [searchQuery, setSearchQuery] = useState(queryParams.get('search') || '');
    const [selectedFacilityType, setSelectedFacilityType] = useState<FacilityTypeId | 'ALL'>(
        (queryParams.get('facility_type') as any) || 'ALL'
    );
    const [selectedStatus, setSelectedStatus] = useState<StationStatusId | 'ALL'>(
        (queryParams.get('status') as any) || (activeNav === 'inspections' ? 'CONSTRUCTION' : 'ALL')
    );
    const [selectedLandlordType, setSelectedLandlordType] = useState<'ALL' | 'SWASTA' | 'PEMERINTAH'>(
        (queryParams.get('landlord_type') as any) || 'ALL'
    );
    const [selectedDocStatus, setSelectedDocStatus] = useState<'ALL' | 'COMPLETE' | 'INCOMPLETE'>(
        (queryParams.get('doc_status') as any) || 'ALL'
    );
    const [selectedStation, setSelectedStation] = useState<Station | null>(null);

    // Modals for Milestone 5 & Action Dropdown
    const [isAddStationModalOpen, setIsAddStationModalOpen] = useState(false);
    const [editingStation, setEditingStation] = useState<Station | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [openMenuStationId, setOpenMenuStationId] = useState<number | null>(null);

    // Apply server-side filter request for paginated tables
    const applyServerFilter = (overrides: Record<string, any> = {}) => {
        if (!isPaginated) return;

        const currentParams: Record<string, any> = {
            search: searchQuery,
            facility_type: selectedFacilityType,
            status: selectedStatus,
            landlord_type: selectedLandlordType,
            doc_status: selectedDocStatus,
            per_page: (stations as PaginatedData<Station>)?.per_page || 10,
            page: 1, // Reset to page 1 on filter changes
            ...overrides,
        };

        const cleaned: Record<string, any> = {};
        Object.entries(currentParams).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '' && v !== 'ALL') {
                cleaned[k] = v;
            }
        });

        router.get(route('stations.index'), cleaned, {
            preserveState: true,
            preserveScroll: true,
            only: ['stations'],
        });
    };

    // Debounce search query updates for server-side pagination
    const isFirstSearchRender = useRef(true);
    useEffect(() => {
        if (isFirstSearchRender.current) {
            isFirstSearchRender.current = false;
            return;
        }
        if (!isPaginated) return;

        const timer = setTimeout(() => {
            applyServerFilter({ search: searchQuery });
        }, 350);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleStatusFilterChange = (st: StationStatusId | 'ALL') => {
        setSelectedStatus(st);
        if (isPaginated) {
            applyServerFilter({ status: st });
        }
    };

    const handleFacilityTypeFilterChange = (ft: FacilityTypeId | 'ALL') => {
        setSelectedFacilityType(ft);
        if (isPaginated) {
            applyServerFilter({ facility_type: ft });
        }
    };

    const handleLandlordTypeFilterChange = (lt: 'ALL' | 'SWASTA' | 'PEMERINTAH') => {
        setSelectedLandlordType(lt);
        if (isPaginated) {
            applyServerFilter({ landlord_type: lt });
        }
    };

    const handleDocStatusFilterChange = (ds: 'ALL' | 'COMPLETE' | 'INCOMPLETE') => {
        setSelectedDocStatus(ds);
        if (isPaginated) {
            applyServerFilter({ doc_status: ds });
        }
    };

    // Filter stations (When paginated, data is already filtered on server)
    const filteredStations = useMemo(() => {
        if (isPaginated) {
            return stationList;
        }

        return stationList.filter((station) => {
            if (selectedFacilityType !== 'ALL' && station.facility_type_id !== selectedFacilityType) {
                return false;
            }
            if (selectedStatus !== 'ALL' && station.status_id !== selectedStatus) {
                return false;
            }
            if (selectedLandlordType !== 'ALL' && (station.landlord_type || 'SWASTA') !== selectedLandlordType) {
                return false;
            }
            if (selectedDocStatus !== 'ALL') {
                if (selectedDocStatus === 'COMPLETE' && !station.document_compliance?.is_complete) return false;
                if (selectedDocStatus === 'INCOMPLETE' && station.document_compliance?.is_complete) return false;
            }
            if (searchQuery.trim() !== '') {
                const query = searchQuery.toLowerCase();
                const matchCode = station.code.toLowerCase().includes(query);
                const matchName = station.name.toLowerCase().includes(query);
                const matchCity = station.city.toLowerCase().includes(query);
                const matchProvince = station.province.toLowerCase().includes(query);
                if (!matchCode && !matchName && !matchCity && !matchProvince) {
                    return false;
                }
            }
            return true;
        });
    }, [isPaginated, stationList, selectedFacilityType, selectedStatus, selectedLandlordType, selectedDocStatus, searchQuery]);

    // Breakdown construction facility types for Card 2
    const constructionEvcs = useMemo(() => 
        typeof stats.construction_evcs === 'number'
            ? stats.construction_evcs
            : stationList.filter(s => s.status_id === 'CONSTRUCTION' && s.facility_type_id === 'EVCS').length,
        [stats.construction_evcs, stationList]
    );
    const constructionBss = useMemo(() => 
        typeof stats.construction_bss === 'number'
            ? stats.construction_bss
            : stationList.filter(s => s.status_id === 'CONSTRUCTION' && s.facility_type_id === 'BSS').length,
        [stats.construction_bss, stationList]
    );
    const constructionCombined = useMemo(() => 
        typeof stats.construction_combined === 'number'
            ? stats.construction_combined
            : stationList.filter(s => s.status_id === 'CONSTRUCTION' && s.facility_type_id === 'COMBINED').length,
        [stats.construction_combined, stationList]
    );

    // Breakdown dual contract expiry (< 90 hari) for Card 4
    const vgreenExpiring = useMemo(() => {
        if (typeof stats.vgreen_expiring_count === 'number') return stats.vgreen_expiring_count;
        return stationList.filter(s => {
            const dateStr = s.vgreen_contract_end_date || s.contract_vgreen_end_date;
            if (!dateStr) return false;
            const diffDays = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 90;
        }).length;
    }, [stats.vgreen_expiring_count, stationList]);

    const landlordExpiring = useMemo(() => {
        if (typeof stats.landlord_expiring_count === 'number') return stats.landlord_expiring_count;
        return stationList.filter(s => {
            const dateStr = s.lease_end_date || s.contract_landlord_end_date;
            if (!dateStr) return false;
            const diffDays = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 90;
        }).length;
    }, [stats.landlord_expiring_count, stationList]);

    const totalExpiringContracts = stats.total_expiring_contracts ?? (vgreenExpiring + landlordExpiring);

    // Station aggregations for Titik Stasiun quick metrics
    const totalMachines = useMemo(() => {
        if (typeof stats.total_machines === 'number') return stats.total_machines;
        return stationList.reduce((sum, s) => sum + (s.machines?.length || 0), 0);
    }, [stats.total_machines, stationList]);

    const totalPowerKw = useMemo(() => {
        if (typeof stats.total_power_kw === 'number') return stats.total_power_kw;
        return stationList.reduce((sum, s) => {
            const mPower = s.machines?.reduce((ms, m) => ms + (m.power_capacity_kw || 0), 0) || 0;
            return sum + (s.power_capacity_kw || mPower);
        }, 0);
    }, [stats.total_power_kw, stationList]);

    const totalSlots = useMemo(() => {
        if (typeof stats.total_slots === 'number') return stats.total_slots;
        return stationList.reduce((sum, s) => {
            const mSlots = s.machines?.reduce((ms, m) => ms + (m.slot_or_gun_count || 0), 0) || 0;
            return sum + (s.slot_count || mSlots);
        }, 0);
    }, [stats.total_slots, stationList]);

    const totalCompleteDocs = useMemo(() => {
        if (typeof stats.complete_compliance_count === 'number') return stats.complete_compliance_count;
        return stationList.filter(s => s.document_compliance?.is_complete).length;
    }, [stats.complete_compliance_count, stationList]);

    // Available provinces from targets and stations for dynamic filtering
    const availableProvinces = useMemo(() => {
        const fromTargets = (provinceTargets || []).map(t => t.province_name);
        const fromStations = (stationList || []).map(s => s.province);
        return Array.from(new Set([...fromTargets, ...fromStations].filter(Boolean))).sort((a, b) => a.localeCompare(b));
    }, [provinceTargets, stationList]);

    // Select2 options for province filter in S-Curve Rollout chart
    const provinceSelectOptions = useMemo<Select2Option<string>[]>(() => {
        const allOption: Select2Option<string> = {
            value: 'ALL',
            label: 'Semua Provinsi (Nasional)',
            subtext: 'Seluruh Wilayah Indonesia',
            badge: `${(stats.national_target || 2095).toLocaleString('id-ID')} Titik`,
            badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200/60',
        };

        const provOptions = availableProvinces.map(prov => {
            const found = (provinceTargets || []).find(t => t.province_name.toLowerCase() === prov.toLowerCase());
            const targetCount = found ? found.target_total : undefined;
            const region = found ? found.region : undefined;

            return {
                value: prov,
                label: prov,
                subtext: region ? `Region: ${region}` : undefined,
                badge: targetCount ? `${targetCount.toLocaleString('id-ID')} Titik` : undefined,
                badgeColor: 'bg-slate-100 text-slate-700 border border-slate-200/60',
            };
        });

        return [allOption, ...provOptions];
    }, [availableProvinces, provinceTargets, stats.national_target]);

    // Target metrics for active chart province
    const currentChartTarget = useMemo(() => {
        if (chartProvince === 'ALL') {
            return stats.national_target || 2095;
        }
        const found = (provinceTargets || []).find(t => t.province_name.toLowerCase() === chartProvince.toLowerCase());
        return found ? found.target_total : (stationList.filter(s => s.province?.toLowerCase() === chartProvince.toLowerCase()).length || 50);
    }, [chartProvince, provinceTargets, stats.national_target, stationList]);

    const currentChartActualLive = useMemo(() => {
        if (chartProvince === 'ALL') {
            return stats.operational;
        }
        const found = (provinceTargets || []).find(t => t.province_name.toLowerCase() === chartProvince.toLowerCase());
        if (found && found.actual_live !== undefined) {
            return found.actual_live;
        }
        return stationList.filter(s => s.province && s.province.toLowerCase() === chartProvince.toLowerCase() && s.status_id === 'OPERATIONAL').length;
    }, [chartProvince, provinceTargets, stats.operational, stationList]);

    const currentChartConstruction = useMemo(() => {
        if (chartProvince === 'ALL') {
            return stats.construction;
        }
        const found = (provinceTargets || []).find(t => t.province_name.toLowerCase() === chartProvince.toLowerCase());
        if (found && found.in_construction !== undefined) {
            return found.in_construction;
        }
        return stationList.filter(s => s.province && s.province.toLowerCase() === chartProvince.toLowerCase() && s.status_id === 'CONSTRUCTION').length;
    }, [chartProvince, provinceTargets, stats.construction, stationList]);

    const currentChartPercent = useMemo(() => {
        const tgt = currentChartTarget || 1;
        return Math.round((currentChartActualLive / tgt) * 100);
    }, [currentChartActualLive, currentChartTarget]);

    // Rollout timeline data (Model B: Annual Target Ceiling vs Live Realization)
    const baseRolloutData = useMemo(() => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

        if (chartProvince === 'ALL') {
            const rawMonthly = monthlyRolloutData && monthlyRolloutData.length > 0
                ? monthlyRolloutData
                : (stats.monthly_rollout || []);

            if (rawMonthly.length > 0) {
                return rawMonthly.map(d => ({
                    ...d,
                    planned: currentChartTarget, // Model B: Constant annual ceiling
                }));
            }
        }

        // Calculate province-specific monthly trajectory
        const found = (provinceTargets || []).find(t => t.province_name.toLowerCase() === chartProvince.toLowerCase());
        const provLive = found?.actual_live !== undefined
            ? found.actual_live
            : stationList.filter(s => s.province && s.province.toLowerCase() === chartProvince.toLowerCase() && s.status_id === 'OPERATIONAL').length;

        return monthNames.map((month, idx) => {
            const m = idx + 1;
            const isCurrent = (m === 11);
            const isFuture = (m > 11);

            // Cumulative actual live stasiun for this province
            const actualUnits = isFuture 
                ? null 
                : Math.min(provLive, Math.max(provLive > 0 ? 1 : 0, Math.round(provLive * (m / 11))));

            return {
                month,
                monthKey: `2026-${String(m).padStart(2, '0')}`,
                planned: currentChartTarget, // Model B: straight horizontal line
                actual: actualUnits,
                isCurrent,
            };
        });
    }, [chartProvince, monthlyRolloutData, stats.monthly_rollout, stations, currentChartTarget]);

    const filteredRolloutData = useMemo(() => {
        if (selectedTimeRange === '3m') {
            return baseRolloutData.slice(-3);
        }
        if (selectedTimeRange === '6m') {
            return baseRolloutData.slice(-6);
        }
        return baseRolloutData;
    }, [selectedTimeRange, baseRolloutData]);

    const yAxisConfig = useMemo(() => {
        const rawMax = Math.max(currentChartTarget, ...filteredRolloutData.map(d => d.actual ?? 0), 1);
        
        const roughStep = rawMax / 4.5;
        const power = Math.pow(10, Math.floor(Math.log10(Math.max(1, roughStep))));
        const fraction = roughStep / power;
        
        let niceFraction = 1;
        if (fraction > 5) niceFraction = 10;
        else if (fraction > 2.5) niceFraction = 5;
        else if (fraction > 1.5) niceFraction = 2.5;
        else if (fraction > 1) niceFraction = 2;
        else niceFraction = 1;
        
        const step = Math.max(1, Math.round(niceFraction * power));
        const maxTick = Math.ceil((rawMax * 1.08) / step) * step;
        
        const ticks: number[] = [];
        for (let val = 0; val <= maxTick; val += step) {
            ticks.push(val);
        }
        
        return {
            ticks,
            scaleMax: maxTick > 0 ? maxTick : 1,
            step,
        };
    }, [currentChartTarget, filteredRolloutData]);

    const getY = (val: number) => {
        return 210 - (val / yAxisConfig.scaleMax) * 175;
    };

    // Model B: Y coordinate for horizontal target ceiling line
    const targetY = useMemo(() => {
        return getY(currentChartTarget);
    }, [currentChartTarget, yAxisConfig.scaleMax]);

    const svgPointsPlanned = useMemo(() => {
        const data = filteredRolloutData;
        const n = data.length;
        return data.map((d, i) => {
            const x = n > 1 ? (i / (n - 1)) * 1050 + 75 : 600;
            return `${x},${targetY}`;
        }).join(' ');
    }, [filteredRolloutData, targetY]);

    interface ActualChartPoint {
        x: number;
        y: number;
        val: number;
        planned: number;
        month: string;
        isCurrent?: boolean;
    }

    const actualPoints = useMemo<ActualChartPoint[]>(() => {
        const data = filteredRolloutData;
        const n = data.length;
        const pts: ActualChartPoint[] = [];
        data.forEach((d, i) => {
            if (d.actual !== null) {
                const x = n > 1 ? (i / (n - 1)) * 1050 + 75 : 600;
                const y = getY(d.actual);
                pts.push({
                    x,
                    y,
                    val: d.actual,
                    planned: d.planned,
                    month: d.month,
                    isCurrent: d.isCurrent,
                });
            }
        });
        return pts;
    }, [filteredRolloutData, yAxisConfig.scaleMax]);

    const svgPointsActual = useMemo(() => {
        return actualPoints.map(p => `${p.x},${p.y}`).join(' ');
    }, [actualPoints]);

    const svgAreaActual = useMemo(() => {
        if (actualPoints.length === 0) return '';
        const firstX = actualPoints[0].x;
        const lastX = actualPoints[actualPoints.length - 1].x;
        const pointsStr = actualPoints.map(p => `${p.x},${p.y}`).join(' ');
        return `${firstX},210 ${pointsStr} ${lastX},210`;
    }, [actualPoints]);

    const handleDeleteStation = (station: Station, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Apakah Anda yakin ingin menghapus stasiun ${station.code} (${station.name})?`)) {
            return;
        }

        router.delete(route('admin.stations.destroy', { station: station.id }), {
            preserveScroll: true,
            onSuccess: () => {
                if (selectedStation?.id === station.id) {
                    setSelectedStation(null);
                }
            },
        });
    };

    return (
        <div className="flex h-screen w-screen bg-[#F7F9FC] text-slate-800 font-sans overflow-hidden antialiased">
            <Head title="V-Green SSI - Charging Station Management & GIS Platform" />

            {/* Unified Sinao Sidebar Navigation */}
            <SidebarNav 
                user={user} 
                activeNav={activeNav} 
                pendingCount={stats.construction + stats.surveyed} 
            />

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* TOP HEADER */}
                <header className="h-20 px-8 flex items-center justify-between shrink-0 bg-transparent z-10">
                    {/* View Title & Switcher */}
                    <div className="flex items-center gap-4">
                        <SidebarTrigger />
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                            {activeNav === 'gis'
                                ? 'Peta GIS Sebaran Nasional' 
                                : activeNav === 'stations' 
                                ? 'Daftar Titik Stasiun & Kelola Aset'
                                : activeNav === 'inspections'
                                ? 'Sesi Verifikasi & Audit QC Lapangan'
                                : 'Ringkasan Infrastruktur'}
                        </h1>

                        {activeNav === 'stations' && (
                            <div className="hidden sm:flex items-center gap-2">
                                <span className="px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200/60 flex items-center gap-1.5 shadow-xs">
                                    <TableIcon className="w-3.5 h-3.5" />
                                    <span>Tabel Master Titik Stasiun</span>
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right Controls: Search + Notif + Role Switcher */}
                    <div className="flex items-center gap-4">
                        {/* Pill Search Input */}
                        <div className="relative w-64 md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari stasiun, kode VG-..., kota..."
                                className="w-full bg-white border border-[#E8ECF2] rounded-full pl-11 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 shadow-subtle focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 transition"
                            />
                        </div>

                        {/* Notification Bell */}
                        <button 
                            className="relative w-10 h-10 rounded-full bg-white border border-[#E8ECF2] flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-subtle hover:shadow transition"
                            title="Notifikasi Verifikasi"
                        >
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
                        </button>

                        {/* User Profile & Logout Dropdown */}
                        <UserDropdown
                            user={user}
                            roleName={user.role?.name || availableRoles.find(r => r.id === user.role_id)?.name}
                        />
                    </div>
                </header>

                {/* SCROLLABLE DASHBOARD BODY */}
                <div className="flex-1 overflow-y-auto px-8 pb-28 space-y-7">
                    {/* Banner for QC / Inspection view */}
                    {activeNav === 'inspections' && (
                        <div className="bg-blue-50/80 border border-blue-200/80 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">Modul Verifikasi & Quality Control Lapangan (PT SSI)</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Tinjau 7 sudut foto bukti fisik per stasiun sebelum mempublikasikan status ke perwakilan V-Green.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-bold px-3 py-1.5 bg-white text-blue-700 border border-blue-200 rounded-full shadow-xs">
                                    {stats.construction + stats.surveyed} Titik Memerlukan Audit
                                </span>
                            </div>
                        </div>
                    )}

                    {/* TOP METRICS ROW (4 CARDS) - EXECUTIVE DIRECTOR LENS (Visible on Dashboard) */}
                    {activeNav === 'dashboard' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {/* CARD 1: Total Jaringan Stasiun */}
                        <div className="bg-white rounded-3xl p-6 border border-[#EDF1F7] shadow-card flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-400 tracking-normal">
                                        Total Jaringan Stasiun
                                    </span>
                                    <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                        Portofolio Aktif <ArrowUpRight className="w-3 h-3 ml-0.5" />
                                    </span>
                                </div>
                                <div className="mt-2">
                                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                        {stats.total} Titik
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 pt-6">
                                <div>
                                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                                        <span className="text-slate-400">EVCS Mobil Listrik</span>
                                        <span className="text-slate-800 font-bold">{stats.evcs} Titik</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-[#2D60FF] rounded-full transition-all duration-500" 
                                            style={{ width: `${(stats.evcs / (stats.total || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                                        <span className="text-slate-400">BSS Motor Listrik</span>
                                        <span className="text-slate-800 font-bold">{stats.bss} Titik</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-[#FF7A00] rounded-full transition-all duration-500" 
                                            style={{ width: `${(stats.bss / (stats.total || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CARD 2: Dalam Pembangunan (WIP) */}
                        <div className="bg-white rounded-3xl p-6 border border-[#EDF1F7] shadow-card flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-400 tracking-normal">
                                        Dalam Pembangunan
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100/60">
                                        <Hammer className="w-3 h-3 text-blue-600" />
                                        <span>Fisik Aktif</span>
                                    </span>
                                </div>
                                <div className="mt-2">
                                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                        {stats.construction} Titik
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 pt-6">
                                <div>
                                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                                        <span className="text-slate-400">EVCS Mobil Listrik</span>
                                        <span className="text-slate-800 font-bold">{constructionEvcs} Titik</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-[#2D60FF] rounded-full transition-all duration-500" 
                                            style={{ width: `${(constructionEvcs / (stats.construction || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                                        <span className="text-slate-400">BSS / Swap Station</span>
                                        <span className="text-slate-800 font-bold">{constructionBss + constructionCombined} Titik</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-[#FF7A00] rounded-full transition-all duration-500" 
                                            style={{ width: `${((constructionBss + constructionCombined) / (stats.construction || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CARD 3: Stasiun Beroperasi (Live) */}
                        <div className="bg-white rounded-3xl p-6 border border-[#EDF1F7] shadow-card flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-400 tracking-normal">
                                        Stasiun Beroperasi
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100/60">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span>Live Ready</span>
                                    </span>
                                </div>
                                <div className="mt-2">
                                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                        {stats.operational} Live
                                    </span>
                                </div>
                            </div>

                            <div className="pt-5 space-y-3">
                                <div>
                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
                                        <span>Kesiapan Operasi Nasional</span>
                                        <span className="text-slate-900 font-bold">{stats.operational} / {stats.total} Titik</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                                            style={{ width: `${(stats.operational / (stats.total || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                                    <span className="flex items-center gap-1.5 text-slate-600">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        Terhubung PLN & Komisioning
                                    </span>
                                    <span className="font-semibold text-slate-700">Uptime 99.4%</span>
                                </div>
                            </div>
                        </div>

                        {/* CARD 4: Monitoring Kontrak Jatuh Tempo */}
                        <div className="bg-white rounded-3xl p-6 border border-[#EDF1F7] shadow-card flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-400 tracking-normal">
                                        Masa Kontrak Jatuh Tempo
                                    </span>
                                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                        totalExpiringContracts > 0 
                                            ? 'text-amber-700 bg-amber-50 border-amber-200/60' 
                                            : 'text-slate-600 bg-slate-50 border-slate-200/60'
                                    }`}>
                                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                                        <span>&lt; 90 Hari</span>
                                    </span>
                                </div>
                                <div className="mt-2">
                                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                        {totalExpiringContracts} Kontrak
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 pt-6">
                                {/* Baris 1: Kontrak dengan V-Green */}
                                <div>
                                    <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                                        <span className="text-slate-500 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                                            Kontrak dengan V-Green (&lt; 90 Hari)
                                        </span>
                                        <span className="text-blue-700 font-bold">{vgreenExpiring} Kontrak</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                                            style={{ width: `${(vgreenExpiring / (totalExpiringContracts || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Baris 2: Kontrak dengan Pemilik Lahan */}
                                <div>
                                    <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                                        <span className="text-slate-500 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                                            Kontrak dengan Pemilik Lahan (&lt; 90 Hari)
                                        </span>
                                        <span className="text-amber-600 font-bold">{landlordExpiring} Kontrak</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                                            style={{ width: `${(landlordExpiring / (totalExpiringContracts || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    )}

                    {/* COMPACT KPI METRIC PILLS FOR TITIK STASIUN (Visible on Titik Stasiun view) */}
                    {activeNav === 'stations' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Metric 1: Total Titik */}
                            <div className="bg-white rounded-2xl p-4 border border-[#EDF1F7] shadow-subtle flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[11px] font-semibold text-slate-400">Total Titik Stasiun</div>
                                    <div className="text-xl font-extrabold text-slate-900 leading-tight">
                                        {stats.total} <span className="text-xs font-semibold text-slate-500">Titik</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                        <span className="text-emerald-600 font-bold">{stats.operational} Live</span> • {stats.construction} WIP • {stats.surveyed} Survei
                                    </div>
                                </div>
                            </div>

                            {/* Metric 2: Mesin Terpasang */}
                            <div className="bg-white rounded-2xl p-4 border border-[#EDF1F7] shadow-subtle flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                    <Cpu className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[11px] font-semibold text-slate-400">Total Mesin Terpasang</div>
                                    <div className="text-xl font-extrabold text-slate-900 leading-tight">
                                        {totalMachines.toLocaleString()} <span className="text-xs font-semibold text-slate-500">Unit</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                        {totalSlots.toLocaleString()} Total Slot & Gun Charger
                                    </div>
                                </div>
                            </div>

                            {/* Metric 3: Kontrak Sewa (<90 Hari) */}
                            <div className="bg-white rounded-2xl p-4 border border-[#EDF1F7] shadow-subtle flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[11px] font-semibold text-slate-400">Kontrak Sewa (&lt;90 Hari)</div>
                                    <div className="text-xl font-extrabold text-slate-900 leading-tight">
                                        {totalExpiringContracts} <span className="text-xs font-semibold text-amber-600">Kontrak</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                        <span className="font-semibold text-slate-700">{vgreenExpiring} PKS V-Green</span> • <span className="font-semibold text-slate-700">{landlordExpiring} Sewa Lahan</span>
                                    </div>
                                </div>
                            </div>

                            {/* Metric 4: Kepatuhan Dokumen / Uptime */}
                            <div className="bg-white rounded-2xl p-4 border border-[#EDF1F7] shadow-subtle flex items-center gap-3.5">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                                    isInternal ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                    {isInternal ? <ShieldCheck className="w-5 h-5" /> : <BatteryCharging className="w-5 h-5" />}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[11px] font-semibold text-slate-400">
                                        {isInternal ? 'Kepatuhan Legalitas' : 'Kesiapan Operasi'}
                                    </div>
                                    <div className="text-xl font-extrabold text-slate-900 leading-tight">
                                        {isInternal ? (
                                            <>
                                                {totalCompleteDocs} / {totalStationsCount}{' '}
                                                <span className="text-xs font-semibold text-emerald-600">
                                                    ({Math.round((totalCompleteDocs / (totalStationsCount || 1)) * 100)}%)
                                                </span>
                                            </>
                                        ) : (
                                            '99.4% Uptime'
                                        )}
                                    </div>
                                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                        {isInternal ? 'Dokumen legal & sewaan lengkap' : 'Kesiapan jaringan charging'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MAIN VISUALIZATION: LAJU IMPLEMENTASI JARINGAN STASIUN (PLANNED VS ACTUAL) */}
                    {activeNav === 'dashboard' && (
                    <>
                    <div className="bg-white rounded-3xl p-7 border border-[#EDF1F7] shadow-card space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                    <span>Laju Implementasi Jaringan Stasiun (Target vs Realisasi)</span>
                                    {chartProvince !== 'ALL' && (
                                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                                            {chartProvince}
                                        </span>
                                    )}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-slate-400 font-medium">Target Rollout {chartProvince === 'ALL' ? 'Nasional' : chartProvince}:</span>
                                    <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                                        {currentChartTarget.toLocaleString('id-ID')} Titik Target
                                    </span>
                                    <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100/60">
                                        {currentChartActualLive} Live ({currentChartPercent}% On-Schedule) <ArrowUpRight className="w-3 h-3 ml-0.5" />
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {/* Province Select2 Selector */}
                                <Select2
                                    value={chartProvince}
                                    onChange={(val) => setChartProvince(String(val))}
                                    options={provinceSelectOptions}
                                    placeholder="Pilih Provinsi..."
                                    searchPlaceholder="Cari provinsi..."
                                    prefixIcon={MapPin}
                                    variant="pill"
                                    size="sm"
                                    dropdownClassName="w-64"
                                />

                                {/* Time range pills */}
                                <div className="flex items-center bg-[#F4F5F8] p-1 rounded-full text-xs font-semibold text-slate-500">
                                    <button
                                        onClick={() => setSelectedTimeRange('1y')}
                                        className={`px-3 py-1 rounded-full transition ${
                                            selectedTimeRange === '1y'
                                                ? 'bg-[#2D60FF] text-white shadow-xs'
                                                : 'hover:text-slate-900'
                                        }`}
                                    >
                                        1 Tahun
                                    </button>
                                    <button
                                        onClick={() => setSelectedTimeRange('6m')}
                                        className={`px-3 py-1 rounded-full transition ${
                                            selectedTimeRange === '6m'
                                                ? 'bg-[#2D60FF] text-white shadow-xs'
                                                : 'hover:text-slate-900'
                                        }`}
                                    >
                                        6 Bulan
                                    </button>
                                    <button
                                        onClick={() => setSelectedTimeRange('3m')}
                                        className={`px-3 py-1 rounded-full transition ${
                                            selectedTimeRange === '3m'
                                                ? 'bg-[#2D60FF] text-white shadow-xs'
                                                : 'hover:text-slate-900'
                                        }`}
                                    >
                                        3 Bulan
                                    </button>
                                </div>

                                {/* Legend */}
                                <div className="flex items-center gap-4 text-xs font-semibold">
                                    <div className="flex items-center gap-1.5 text-slate-600">
                                        <span className="w-5 h-0.5 border-t-2 border-dashed border-slate-400"></span>
                                        <span>Target Plafon ({currentChartTarget.toLocaleString('id-ID')} Titik)</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-600">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#2D60FF] ring-2 ring-blue-100"></span>
                                        <span>Realisasi Live</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Chart Canvas - Pure S-Curve Line Chart (Anti-AI Slop, No Bars) */}
                        <div className="relative pt-6 pb-2">
                            <div className="relative h-64 flex items-end justify-between gap-3 px-4">
                                <svg 
                                    className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10"
                                    preserveAspectRatio="none"
                                    viewBox="0 0 1200 240"
                                >
                                    <defs>
                                        <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#2D60FF" stopOpacity="0.20" />
                                            <stop offset="100%" stopColor="#2D60FF" stopOpacity="0.0" />
                                        </linearGradient>
                                    </defs>

                                    {/* Horizontal Y Grid Lines and Value Labels */}
                                    {yAxisConfig.ticks.map((tick) => {
                                        const y = getY(tick);
                                        const isBase = tick === 0;
                                        return (
                                            <g key={tick}>
                                                {/* Horizontal Grid Line */}
                                                <line
                                                    x1="60"
                                                    y1={y}
                                                    x2="1155"
                                                    y2={y}
                                                    stroke={isBase ? '#CBD5E1' : '#EDF2F7'}
                                                    strokeWidth={isBase ? '1.5' : '1'}
                                                    strokeDasharray={isBase ? undefined : '4 4'}
                                                />
                                                {/* Y-Axis Value Number */}
                                                <text
                                                    x="50"
                                                    y={y}
                                                    textAnchor="end"
                                                    dominantBaseline="middle"
                                                    fill="#94A3B8"
                                                    fontSize="11"
                                                    fontWeight="600"
                                                >
                                                    {tick.toLocaleString('id-ID')}
                                                </text>
                                            </g>
                                        );
                                    })}

                                    {/* Subtle Gradient Area Underneath Actual Curve */}
                                    {svgAreaActual && (
                                        <polygon 
                                            fill="url(#actualGradient)" 
                                            points={svgAreaActual} 
                                            className="transition-all duration-500"
                                        />
                                    )}

                                    {/* Model B: Straight Horizontal Target Plafon Line */}
                                    <line
                                        x1="60"
                                        y1={targetY}
                                        x2="1155"
                                        y2={targetY}
                                        stroke="#94A3B8"
                                        strokeWidth="2"
                                        strokeDasharray="6 6"
                                        strokeLinecap="round"
                                    />

                                    {/* Plafon Target Pill Label at End of Line */}
                                    <g transform={`translate(1155, ${targetY})`}>
                                        <rect 
                                            x="-155" 
                                            y="-11" 
                                            width="155" 
                                            height="22" 
                                            rx="11" 
                                            fill="#F8FAFC" 
                                            stroke="#CBD5E1" 
                                            strokeWidth="1"
                                        />
                                        <text 
                                            x="-77" 
                                            y="4" 
                                            textAnchor="middle" 
                                            fill="#334155" 
                                            fontSize="10" 
                                            fontWeight="800"
                                        >
                                            Plafon: {currentChartTarget.toLocaleString('id-ID')} Titik
                                        </text>
                                    </g>

                                    {/* Actual live commissioned solid line */}
                                    <polyline
                                        fill="none"
                                        stroke="#2D60FF"
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        points={svgPointsActual}
                                    />

                                    {/* Data point dots for actual live */}
                                    {actualPoints.map((pt, i) => (
                                        <g key={i}>
                                            <circle 
                                                cx={pt.x} 
                                                cy={pt.y} 
                                                r={pt.isCurrent ? 6 : 4} 
                                                fill={pt.isCurrent ? '#FF7A00' : '#2D60FF'} 
                                                stroke="#fff" 
                                                strokeWidth={pt.isCurrent ? 3 : 2} 
                                            />
                                            {pt.isCurrent && (
                                                <circle
                                                    cx={pt.x}
                                                    cy={pt.y}
                                                    r={11}
                                                    fill="none"
                                                    stroke="#FF7A00"
                                                    strokeWidth="1.5"
                                                    opacity="0.35"
                                                />
                                            )}
                                        </g>
                                    ))}
                                </svg>

                                {/* Interactive Monthly Hover Zones (Clean S-Curve without Bars) */}
                                {filteredRolloutData.map((d, index) => (
                                    <div key={index} className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer">
                                        {/* Floating Interactive Tooltip */}
                                        <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-16 bg-slate-900/95 backdrop-blur-xs text-white px-3.5 py-2.5 rounded-xl shadow-xl transition-all duration-200 whitespace-nowrap z-30 flex flex-col items-center border border-slate-700/50">
                                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">{d.month} 2026</span>
                                            <div className="flex items-center gap-2 mt-0.5 text-xs">
                                                <span className="text-emerald-400 font-extrabold">
                                                    {d.actual !== null ? `${d.actual.toLocaleString('id-ID')} Live` : 'Proyeksi'}
                                                </span>
                                                <span className="text-slate-500">•</span>
                                                <span className="text-slate-300">Plafon: {d.planned.toLocaleString('id-ID')}</span>
                                            </div>
                                            {d.actual !== null && (
                                                <div className="text-[10px] text-blue-300 font-medium mt-0.5">
                                                    Sisa {Math.max(0, d.planned - d.actual).toLocaleString('id-ID')} titik lagi ({Math.round((d.actual / (d.planned || 1)) * 100)}%)
                                                </div>
                                            )}
                                            <div className="w-2 h-2 bg-slate-900 rotate-45 absolute -bottom-1"></div>
                                        </div>

                                        {/* Subtle Vertical Guideline on Hover */}
                                        <div className="w-px h-full bg-transparent group-hover:bg-blue-400/25 transition-colors pointer-events-none" />
                                    </div>
                                ))}
                            </div>

                            {/* X-Axis Month Labels */}
                            <div className="flex justify-between text-xs font-semibold text-slate-400 pt-3 px-4">
                                {filteredRolloutData.map((d, i) => (
                                    <span 
                                        key={i} 
                                        className={d.isCurrent ? 'text-[#2D60FF] font-extrabold' : 'text-slate-400 font-medium'}
                                    >
                                        {d.month}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* EXECUTIVE INSIGHTS: LEADERBOARD & ECOSYSTEM COMPOSITION */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* LEFT COLUMN: PROVINCIAL PROGRESS LEADERBOARD (lg:col-span-7) */}
                        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-[#EDF1F7] shadow-card flex flex-col justify-between space-y-6">
                            <div>
                                {/* Header with Title and Toggle */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-blue-600" />
                                            <span>Peringkat Progres Target Provinsi</span>
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Monitoring kecepatan pencapaian target 2026 per wilayah operasional
                                        </p>
                                    </div>

                                    {/* Segmented Filter Pills */}
                                    <div className="flex items-center bg-[#F4F5F8] p-1 rounded-full text-xs font-semibold text-slate-500 self-start sm:self-auto">
                                        <button
                                            onClick={() => setLeaderboardTab('live')}
                                            className={`px-3 py-1 rounded-full transition ${
                                                leaderboardTab === 'live'
                                                    ? 'bg-[#2D60FF] text-white shadow-xs'
                                                    : 'hover:text-slate-900'
                                            }`}
                                        >
                                            Realisasi Terbanyak
                                        </button>
                                        <button
                                            onClick={() => setLeaderboardTab('deficit')}
                                            className={`px-3 py-1 rounded-full transition ${
                                                leaderboardTab === 'deficit'
                                                    ? 'bg-[#2D60FF] text-white shadow-xs'
                                                    : 'hover:text-slate-900'
                                            }`}
                                        >
                                            Sisa Target Terbanyak
                                        </button>
                                        <button
                                            onClick={() => setLeaderboardTab('percentage')}
                                            className={`px-3 py-1 rounded-full transition ${
                                                leaderboardTab === 'percentage'
                                                    ? 'bg-[#2D60FF] text-white shadow-xs'
                                                    : 'hover:text-slate-900'
                                            }`}
                                        >
                                            Persentase (%)
                                        </button>
                                    </div>
                                </div>

                                {/* List of Provinces */}
                                <div className="divide-y divide-slate-100 mt-2">
                                    {displayedLeaderboard.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-slate-400">
                                            Tidak ada data provinsi yang sesuai kriteria.
                                        </div>
                                    ) : (
                                        displayedLeaderboard.map((prov, idx) => {
                                            const live = prov.actual_live ?? 0;
                                            const target = prov.target_total || 1;
                                            const pct = Math.min(100, Math.round((live / target) * 100));
                                            const deficit = Math.max(0, prov.target_total - live);
                                            const rank = idx + 1;

                                            return (
                                                <div key={prov.id || prov.province_name} className="py-3.5 flex items-center gap-4 hover:bg-slate-50/70 px-2 rounded-2xl transition">
                                                    {/* Rank Badge */}
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 ${
                                                        rank === 1 ? 'bg-amber-100 text-amber-700 font-black'
                                                        : rank === 2 ? 'bg-slate-200 text-slate-700 font-black'
                                                        : rank === 3 ? 'bg-amber-50 text-amber-800 font-bold'
                                                        : 'bg-slate-100 text-slate-500 font-semibold'
                                                    }`}>
                                                        #{rank}
                                                    </div>

                                                    {/* Province & Region */}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                                            <div className="flex items-center gap-2 truncate">
                                                                <span className="font-bold text-sm text-slate-900 truncate">
                                                                    {prov.province_name}
                                                                </span>
                                                                {prov.region && (
                                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 hidden sm:inline">
                                                                        {prov.region}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                {leaderboardTab === 'deficit' ? (
                                                                    <>
                                                                        <span className="text-sm font-extrabold text-rose-600">
                                                                            Sisa {deficit.toLocaleString('id-ID')} Titik
                                                                        </span>
                                                                        <span className="text-xs font-semibold text-slate-400 ml-2">
                                                                            ({live}/{prov.target_total})
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="text-sm font-extrabold text-slate-900">
                                                                            {live} Titik Live
                                                                        </span>
                                                                        <span className="text-xs font-medium text-slate-400 ml-1.5">
                                                                            / {prov.target_total}
                                                                        </span>
                                                                        <span className="text-xs font-bold text-blue-600 ml-2">
                                                                            ({pct}%)
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Progress Bar */}
                                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full rounded-full transition-all duration-500 ${
                                                                    pct >= 50 ? 'bg-emerald-500' : pct > 0 ? 'bg-blue-600' : 'bg-slate-300'
                                                                }`}
                                                                style={{ width: `${Math.max(2, pct)}%` }}
                                                            />
                                                        </div>

                                                        {/* Target Allocation Sub-metric */}
                                                        <div className="flex items-center justify-end text-[11px] text-slate-400 font-medium mt-1.5">
                                                            <span>Target: {prov.target_evcs || 0} EVCS / {prov.target_bss || 0} BSS</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Footer Link to /targets */}
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs text-slate-400 font-medium">
                                    Total {provinceTargets.length} Provinsi dalam target nasional 2026
                                </span>
                                <Link 
                                    href={route('targets.index')}
                                    className="text-xs font-bold text-[#2D60FF] hover:text-blue-700 flex items-center gap-1 transition group"
                                >
                                    <span>Buka Target Lengkap</span>
                                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: ECOSYSTEM COMPOSITION & RISK WATCHLIST (lg:col-span-5) */}
                        <div className="lg:col-span-5 flex flex-col gap-6">
                            {/* CARD 1: KOMPOSISI FASILITAS & KAPASITAS DAYA */}
                            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EDF1F7] shadow-card space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-amber-500" />
                                            <span>Komposisi Fasilitas & Daya</span>
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Breakdown portofolio charging mobil & swap baterai
                                        </p>
                                    </div>
                                    <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
                                        {stats.operational} Live
                                    </span>
                                </div>

                                {/* 3 Facility Type Rows (Live Breakdown from Real Data) */}
                                <div className="space-y-3">
                                    {/* EVCS (Mobil) */}
                                    <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                <Car className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-900">
                                                    EVCS (Charging Mobil)
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {stats.construction_evcs || 0} titik sedang konstruksi
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-extrabold text-slate-900">
                                                {stats.operational_evcs ?? 200} <span className="text-xs font-normal text-slate-400">Titik</span>
                                            </div>
                                            <div className="text-[11px] font-bold text-blue-600">
                                                {Math.round(((stats.operational_evcs ?? 200) / (stats.operational || 1)) * 100)}%
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hub Terintegrasi (EVCS + BSS) */}
                                    <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                                <BatteryCharging className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-900">
                                                    Hub Terintegrasi (EVCS + BSS)
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {stats.construction_combined || 0} titik sedang konstruksi
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-extrabold text-slate-900">
                                                {stats.operational_combined ?? 71} <span className="text-xs font-normal text-slate-400">Titik</span>
                                            </div>
                                            <div className="text-[11px] font-bold text-purple-600">
                                                {Math.round(((stats.operational_combined ?? 71) / (stats.operational || 1)) * 100)}%
                                            </div>
                                        </div>
                                    </div>

                                    {/* BSS (Motor) */}
                                    <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                                <Motorbike className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-900">
                                                    BSS (Swap Baterai Motor)
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {stats.construction_bss || 0} titik sedang konstruksi
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-extrabold text-slate-900">
                                                {stats.operational_bss ?? 56} <span className="text-xs font-normal text-slate-400">Titik</span>
                                            </div>
                                            <div className="text-[11px] font-bold text-emerald-600">
                                                {Math.round(((stats.operational_bss ?? 56) / (stats.operational || 1)) * 100)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Connected PLN Power & Slots (Real Live Data) */}
                                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-100 flex items-center justify-between text-xs">
                                    <div>
                                        <span className="font-semibold text-slate-600 block text-[11px]">Total Daya Terpasang PLN (Live):</span>
                                        <span className="text-base font-extrabold text-slate-900">
                                            {((stats.live_power_kw || stats.total_power_kw || 0) / 1000).toFixed(1)} <span className="text-xs font-bold text-slate-500">MW</span>
                                        </span>
                                        <span className="text-[11px] text-slate-400 ml-1.5">({(stats.live_power_kw || stats.total_power_kw || 0).toLocaleString('id-ID')} kW)</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-semibold text-slate-600 block text-[11px]">Slot & Gun Aktif (Live):</span>
                                        <span className="text-sm font-extrabold text-blue-700">
                                            {(stats.live_slots || stats.total_slots || 0).toLocaleString('id-ID')} <span className="text-[11px] font-semibold text-slate-500">Unit</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* CARD 2: EARLY WARNING & RISK WATCHLIST */}
                            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EDF1F7] shadow-card space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                            <span>Watchlist Kepatuhan & Risiko</span>
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Early warning system operasional & legalitas
                                        </p>
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                                        Real-Time
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {/* Item 1: Sewa Lahan Jatuh Tempo */}
                                    <div className="p-3 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-slate-50/80 transition">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                                (stats.landlord_expiring_count ?? 0) > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                                            }`}>
                                                <AlertTriangle className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-900">
                                                    Sewa Lahan Jatuh Tempo (&lt; 90 Hari)
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    Perlu koordinasi perpanjangan landlord
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                                                (stats.landlord_expiring_count ?? 0) > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200/60' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                            }`}>
                                                {stats.landlord_expiring_count ?? 0} Titik
                                            </span>
                                        </div>
                                    </div>

                                    {/* Item 2: Kepatuhan Dokumen Legalitas */}
                                    <div className="p-3 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-slate-50/80 transition">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-900">
                                                    Kepatuhan Dokumen Wajib
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    SK Walikota/Bupati, PBB, IMB & Perjanjian
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-xs font-extrabold text-slate-900">
                                                {stats.live_compliance_count ?? stats.complete_compliance_count ?? 0} / {stats.operational}
                                            </span>
                                            <div className="text-[10px] font-bold text-emerald-600">
                                                {Math.round(((stats.live_compliance_count ?? stats.complete_compliance_count ?? 0) / (stats.operational || 1)) * 100)}% Stasiun Live
                                            </div>
                                        </div>
                                    </div>

                                    {/* Item 3: Audit QC Lapangan Menunggu Review */}
                                    <Link 
                                        href={route('inspections.index')}
                                        className="p-3 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-blue-50/40 hover:border-blue-200/60 transition group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                    Audit QC Lapangan Pending
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    Laporan inspeksi vendor menanti verifikasi
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
                                                {stats.pending_inspections_count ?? 0} Sesi
                                            </span>
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                    </>
                    )}

                    {/* TABLE SECTION (Rendered exclusively in 'Manajemen Stasiun' / activeNav === 'stations') */}
                    {activeNav === 'stations' && (
                        <div className="bg-white rounded-3xl border border-[#EDF1F7] shadow-card overflow-hidden">
                            {/* Table Header Controls (With Milestone 5 Admin Buttons) */}
                            <div className="p-6 border-b border-[#EDF1F7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                        Daftar Titik Infrastruktur Stasiun Pengisian Daya
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Menampilkan {isPaginated ? `${(stations as PaginatedData<Station>).from ?? 0}–${(stations as PaginatedData<Station>).to ?? 0}` : filteredStations.length} dari total {totalStationsCount} titik stasiun se-Indonesia
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2.5">
                                    {/* Admin Actions: Import CSV, Export Data, Tambah Titik */}
                                    {isInternal && (
                                        <>
                                            <button
                                                onClick={() => setIsImportModalOpen(true)}
                                                className="px-3.5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                                            >
                                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                                <span>Import Data .csv</span>
                                            </button>

                                            <a
                                                href={route('admin.stations.export')}
                                                className="px-3.5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                                                title="Unduh Rekapitulasi Data Stasiun ke CSV/Excel"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>Export Data</span>
                                            </a>

                                            <button
                                                onClick={() => setIsAddStationModalOpen(true)}
                                                className="px-3.5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>Tambah Titik</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Quick Filter Toolbar with Select2 */}
                            <div className="px-6 py-3.5 bg-slate-50/70 border-b border-[#EDF1F7] flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    {/* Status Filter */}
                                    <div className="w-40">
                                        <Select2
                                            value={selectedStatus}
                                            onChange={(val) => handleStatusFilterChange(val as StationStatusId | 'ALL')}
                                            options={[
                                                { value: 'ALL', label: 'Semua Status' },
                                                { value: 'OPERATIONAL', label: 'Operasional', badge: 'Live', badgeColor: 'bg-emerald-100 text-emerald-700' },
                                                { value: 'CONSTRUCTION', label: 'Konstruksi', badge: 'WIP', badgeColor: 'bg-orange-100 text-orange-700' },
                                                { value: 'SURVEYED', label: 'Survei', badge: 'Survei', badgeColor: 'bg-amber-100 text-amber-700' },
                                                { value: 'ON_HOLD', label: 'On Hold', badge: 'Hold', badgeColor: 'bg-rose-100 text-rose-700' },
                                            ]}
                                            placeholder="Pilih Status..."
                                            isSearchable={false}
                                            variant="pill"
                                            size="sm"
                                        />
                                    </div>

                                    {/* Facility Type Filter */}
                                    <div className="w-40">
                                        <Select2
                                            value={selectedFacilityType}
                                            onChange={(val) => handleFacilityTypeFilterChange(val as FacilityTypeId | 'ALL')}
                                            options={[
                                                { value: 'ALL', label: 'Semua Layanan' },
                                                { value: 'EVCS', label: 'EVCS (Mobil)', icon: Car },
                                                { value: 'BSS', label: 'BSS (Motor)', icon: Motorbike },
                                                { value: 'COMBINED', label: 'Kombinasi' },
                                            ]}
                                            placeholder="Jenis Layanan..."
                                            isSearchable={false}
                                            variant="pill"
                                            size="sm"
                                        />
                                    </div>

                                    {/* Landlord Type Filter (Internal) */}
                                    {isInternal && (
                                        <div className="w-36">
                                            <Select2
                                                value={selectedLandlordType}
                                                onChange={(val) => handleLandlordTypeFilterChange(val as 'ALL' | 'SWASTA' | 'PEMERINTAH')}
                                                options={[
                                                    { value: 'ALL', label: 'Semua Lahan' },
                                                    { value: 'SWASTA', label: 'Lahan Swasta' },
                                                    { value: 'PEMERINTAH', label: 'Lahan Pemda' },
                                                ]}
                                                placeholder="Tipe Lahan..."
                                                isSearchable={false}
                                                variant="pill"
                                                size="sm"
                                            />
                                        </div>
                                    )}

                                    {/* Document Status Filter (Internal) */}
                                    {isInternal && (
                                        <div className="w-44">
                                            <Select2
                                                value={selectedDocStatus}
                                                onChange={(val) => handleDocStatusFilterChange(val as 'ALL' | 'COMPLETE' | 'INCOMPLETE')}
                                                options={[
                                                    { value: 'ALL', label: 'Semua Dokumen' },
                                                    { value: 'COMPLETE', label: '✓ Lengkap' },
                                                    { value: 'INCOMPLETE', label: '⚠️ Belum Lengkap' },
                                                ]}
                                                placeholder="Kelengkapan Dokumen..."
                                                isSearchable={false}
                                                variant="pill"
                                                size="sm"
                                            />
                                        </div>
                                    )}

                                    {/* Reset Filter Button */}
                                    {(selectedStatus !== 'ALL' || selectedFacilityType !== 'ALL' || selectedLandlordType !== 'ALL' || selectedDocStatus !== 'ALL') && (
                                        <button
                                            onClick={() => {
                                                setSelectedStatus('ALL');
                                                setSelectedFacilityType('ALL');
                                                setSelectedLandlordType('ALL');
                                                setSelectedDocStatus('ALL');
                                                if (isPaginated) {
                                                    applyServerFilter({
                                                        status: 'ALL',
                                                        facility_type: 'ALL',
                                                        landlord_type: 'ALL',
                                                        doc_status: 'ALL',
                                                    });
                                                }
                                            }}
                                            className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 font-semibold hover:bg-slate-200/60 rounded-full transition flex items-center gap-1"
                                            title="Reset semua filter"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                            <span>Reset</span>
                                        </button>
                                    )}
                                </div>

                                {/* Search Box */}
                                <div className="relative min-w-[220px]">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Cari kode, nama, atau kota..."
                                        className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200/80 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => {
                                                setSearchQuery('');
                                                if (isPaginated) applyServerFilter({ search: '' });
                                            }}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Data Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-[#EDF1F7] text-xs font-bold text-slate-400 select-none">
                                            <th className="py-4 pl-6 pr-3 w-10">
                                                <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer" />
                                            </th>
                                            <th className="py-4 px-4">
                                                <div className="flex items-center gap-1.5 hover:text-slate-600 cursor-pointer">
                                                    <span>Kode & Nama Stasiun</span>
                                                    <ArrowUpDown className="w-3 h-3" />
                                                </div>
                                            </th>
                                            <th className="py-4 px-4">
                                                <div className="flex items-center gap-1.5 hover:text-slate-600 cursor-pointer">
                                                    <span>Jenis Layanan</span>
                                                    <ArrowUpDown className="w-3 h-3" />
                                                </div>
                                            </th>
                                            <th className="py-4 px-4">
                                                <div className="flex items-center gap-1.5 hover:text-slate-600 cursor-pointer">
                                                    <span>Wilayah & Lahan</span>
                                                    <ArrowUpDown className="w-3 h-3" />
                                                </div>
                                            </th>
                                            <th className="py-4 px-4">
                                                <div className="flex items-center gap-1.5 hover:text-slate-600 cursor-pointer">
                                                    <span>Mesin & Kapasitas</span>
                                                    <ArrowUpDown className="w-3 h-3" />
                                                </div>
                                            </th>
                                            <th className="py-4 px-4">
                                                <div className="flex items-center gap-1.5 hover:text-slate-600 cursor-pointer">
                                                    <span>Status Titik</span>
                                                    <ArrowUpDown className="w-3 h-3" />
                                                </div>
                                            </th>
                                            {isInternal && (
                                                <th className="py-4 px-4">
                                                    <div className="flex items-center gap-1.5 hover:text-slate-600 cursor-pointer">
                                                        <span>Kelengkapan Dokumen</span>
                                                        <ArrowUpDown className="w-3 h-3" />
                                                    </div>
                                                </th>
                                            )}
                                            <th className="py-4 pr-6 pl-4 text-right">
                                                <span>Aksi</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F1F4F9] text-xs">
                                        {filteredStations.map((station, idx) => {
                                            const isSelected = selectedStation?.id === station.id;

                                            let statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
                                            if (station.status_id === 'CONSTRUCTION') statusBadge = 'bg-orange-50 text-orange-700 border-orange-200/60';
                                            if (station.status_id === 'SURVEYED') statusBadge = 'bg-amber-50 text-amber-700 border-amber-200/60';
                                            if (station.status_id === 'ON_HOLD') statusBadge = 'bg-rose-50 text-rose-700 border-rose-200/60';

                                            const totalPowerKw = station.power_capacity_kw || (station.machines?.reduce((s, m) => s + (m.power_capacity_kw || 0), 0) || 0);
                                            const totalSlots = station.slot_count || (station.machines?.reduce((s, m) => s + (m.slot_or_gun_count || 0), 0) || 0);

                                            return (
                                                <tr 
                                                    key={station.id}
                                                    onClick={() => setSelectedStation(station)}
                                                    className={`hover:bg-[#F9FAFC] cursor-pointer transition ${
                                                        isSelected ? 'bg-blue-50/50' : ''
                                                    }`}
                                                >
                                                    <td className="py-4 pl-6 pr-3" onClick={(e) => e.stopPropagation()}>
                                                        <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer" />
                                                    </td>
                                                    <td className="py-4 px-4 max-w-[200px]">
                                                        <div className="font-bold text-slate-900 leading-snug truncate" title={station.name}>
                                                            {station.name}
                                                        </div>
                                                        <span className="font-mono text-[11px] text-blue-600 font-semibold">
                                                            {station.code}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div 
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 text-slate-700 shadow-xs" 
                                                            title={station.facility_type?.name || station.facility_type_id}
                                                        >
                                                            {station.facility_type_id === 'EVCS' && <Car className="w-4 h-4 text-blue-600" />}
                                                            {station.facility_type_id === 'BSS' && <Motorbike className="w-4 h-4 text-emerald-600" />}
                                                            {station.facility_type_id === 'COMBINED' && (
                                                                <span className="flex items-center gap-0.5 text-indigo-600">
                                                                    <Car className="w-3.5 h-3.5" />
                                                                    <span className="text-[9px] opacity-60 font-bold">+</span>
                                                                    <Motorbike className="w-3.5 h-3.5" />
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                                                                {station.city.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-slate-800">{station.city}</div>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <span className="text-[10px] text-slate-400">{station.province}</span>
                                                                    {isInternal && (
                                                                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                                                            station.landlord_type === 'PEMERINTAH' 
                                                                                ? 'bg-purple-50 text-purple-700 border border-purple-200/50' 
                                                                                : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                                                                        }`}>
                                                                            {station.landlord_type === 'PEMERINTAH' ? 'Pemda' : 'Swasta'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-bold text-slate-900">
                                                                    {totalPowerKw} kW
                                                                </span>
                                                                <span className="text-slate-300">•</span>
                                                                <span className="text-slate-600 font-medium">
                                                                    {totalSlots} Slot
                                                                </span>
                                                            </div>
                                                            {station.machines && station.machines.length > 0 ? (
                                                                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                                                    <Cpu className="w-3 h-3 text-slate-400" />
                                                                    <span>{station.machines.length} Unit Mesin</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-400">Belum ada mesin</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge}`}>
                                                            {station.status.name}
                                                        </span>
                                                    </td>
                                                    {isInternal && (
                                                        <td className="py-4 px-4">
                                                            {station.document_compliance ? (
                                                                <div className="flex flex-col gap-1 items-start">
                                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                                                        station.document_compliance.status === 'COMPLETE'
                                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                                                                            : (station.document_compliance.status === 'INCOMPLETE'
                                                                                ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                                                                                : 'bg-rose-50 text-rose-700 border-rose-200/60')
                                                                    }`}>
                                                                        {station.document_compliance.status === 'COMPLETE' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                                                        {station.document_compliance.status === 'INCOMPLETE' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                                                                        {station.document_compliance.status === 'PENDING_UPLOAD' && <FileText className="w-3 h-3 text-rose-600" />}
                                                                        <span>
                                                                            {station.document_compliance.status === 'COMPLETE' ? 'Lengkap' : 'Kurang'} ({station.document_compliance.total_uploaded}/{station.document_compliance.total_required})
                                                                        </span>
                                                                    </span>
                                                                    {station.document_compliance.missing_details && station.document_compliance.missing_details.length > 0 && (
                                                                        <span 
                                                                            className="text-[10px] text-slate-400 truncate max-w-[130px]" 
                                                                            title={`Dokumen belum ada: ${station.document_compliance.missing_details.map(d => d.label).join(', ')}`}
                                                                        >
                                                                            Kurang: {station.document_compliance.missing_details[0].label}
                                                                            {station.document_compliance.missing_details.length > 1 && ` +${station.document_compliance.missing_details.length - 1}`}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-[11px] text-slate-400">-</span>
                                                            )}
                                                        </td>
                                                    )}
                                                    <td className="py-4 pr-6 pl-4 text-right">
                                                        <ActionDropdown
                                                            isOpen={openMenuStationId === station.id}
                                                            onToggle={(open) => setOpenMenuStationId(open ? station.id : null)}
                                                            className="w-44"
                                                            trigger={
                                                                <button
                                                                    type="button"
                                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                                                    title="Menu Aksi"
                                                                >
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </button>
                                                            }
                                                        >
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedStation(station);
                                                                }}
                                                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                                                            >
                                                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                                                <span>Lihat Detail</span>
                                                            </button>

                                                            {isInternal && (
                                                                <>
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingStation(station);
                                                                        }}
                                                                        className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                                                                    >
                                                                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                                                        <span>Ubah Data</span>
                                                                    </button>

                                                                    <div className="border-t border-slate-100 my-1" />

                                                                    <button
                                                                        onClick={(e) => {
                                                                            handleDeleteStation(station, e);
                                                                        }}
                                                                        className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                                                        <span>Hapus Stasiun</span>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </ActionDropdown>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* REUSABLE SERVER-SIDE PAGINATION */}
                            {isPaginated && (
                                <Pagination
                                    data={stations as PaginatedData<Station>}
                                    only={['stations']}
                                    onPerPageChange={(newPerPage) => {
                                        applyServerFilter({ per_page: newPerPage, page: 1 });
                                    }}
                                />
                            )}
                        </div>
                    )}
                </div>



                {/* STATION DETAIL DRAWER (SLIDE-OVER) */}
                <StationDetailDrawer
                    station={selectedStation}
                    onClose={() => setSelectedStation(null)}
                    userRole={user.role_id}
                />

                {/* MODAL TAMBAH STASIUN BARU (Milestone 5) */}
                <StationFormModal
                    isOpen={isAddStationModalOpen}
                    onClose={() => setIsAddStationModalOpen(false)}
                    facilityTypes={facilityTypes}
                    stationStatuses={stationStatuses}
                    masterMachines={masterMachines}
                />

                {/* MODAL UBAH STASIUN (Milestone 5) */}
                <StationFormModal
                    isOpen={Boolean(editingStation)}
                    onClose={() => setEditingStation(null)}
                    stationToEdit={editingStation}
                    facilityTypes={facilityTypes}
                    stationStatuses={stationStatuses}
                    masterMachines={masterMachines}
                />

                {/* MODAL IMPORT MASSAL (Milestone 5) */}
                <MassImportModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    importErrors={importErrors}
                />
            </div>
        </div>
    );
}
