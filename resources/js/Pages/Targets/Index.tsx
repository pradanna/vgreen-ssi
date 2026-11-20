import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { ProvinceTargetItem, TargetSummary } from '@/types/station';
import { PaginatedData, PaginationLink } from '@/types/pagination';
import SidebarNav from '@/Components/Navigation/SidebarNav';
import SidebarTrigger from '@/Components/Navigation/SidebarTrigger';
import UserDropdown from '@/Components/Navigation/UserDropdown';
import Select2, { Select2Option } from '@/Components/Common/Select2';
import Pagination from '@/Components/Common/Pagination';
import SortableHeader from '@/Components/Common/SortableHeader';
import { INDONESIA_REGIONS, getCitiesByProvince } from '@/utils/indonesiaRegions';
import { 
    Target, 
    MapPin, 
    Search, 
    Plus, 
    Edit2, 
    CheckCircle2, 
    AlertCircle, 
    Layers, 
    ArrowUpRight,
    X,
    Filter,
    ArrowUpDown,
    SlidersHorizontal,
    RotateCcw,
    Hammer,
    Clock,
    Calendar
} from 'lucide-react';

interface TargetsPageProps extends PageProps {
    targets: PaginatedData<ProvinceTargetItem> | ProvinceTargetItem[];
    summary: TargetSummary;
    filters?: {
        year?: number;
        search?: string;
        province?: string;
        status?: string;
        sort?: string;
        per_page?: number;
    };
    allProvinces?: { name: string; target_total: number }[];
    existingTargetsInYear?: {
        province_name: string;
        target_evcs: number;
        target_bss: number;
        notes?: string | null;
        year: number;
    }[];
    availableYears?: number[];
    regions?: string[];
}

// Normalized mapping of all 38 Indonesian provinces to 6 platform target regions
const PROVINCE_TO_REGION: Record<string, string> = {
    'DKI Jakarta': 'Jawa',
    'Jawa Barat': 'Jawa',
    'Jawa Tengah': 'Jawa',
    'D.I. Yogyakarta': 'Jawa',
    'Jawa Timur': 'Jawa',
    'Banten': 'Jawa',
    'Aceh': 'Sumatera',
    'Sumatera Utara': 'Sumatera',
    'Sumatera Barat': 'Sumatera',
    'Riau': 'Sumatera',
    'Kepulauan Riau': 'Sumatera',
    'Jambi': 'Sumatera',
    'Sumatera Selatan': 'Sumatera',
    'Bengkulu': 'Sumatera',
    'Lampung': 'Sumatera',
    'Kepulauan Bangka Belitung': 'Sumatera',
    'Bali': 'Bali-Nusra',
    'Nusa Tenggara Barat': 'Bali-Nusra',
    'Nusa Tenggara Timur': 'Bali-Nusra',
    'Kalimantan Barat': 'Kalimantan',
    'Kalimantan Tengah': 'Kalimantan',
    'Kalimantan Selatan': 'Kalimantan',
    'Kalimantan Timur': 'Kalimantan',
    'Kalimantan Utara': 'Kalimantan',
    'Sulawesi Utara': 'Sulawesi',
    'Sulawesi Tengah': 'Sulawesi',
    'Sulawesi Selatan': 'Sulawesi',
    'Sulawesi Tenggara': 'Sulawesi',
    'Gorontalo': 'Sulawesi',
    'Sulawesi Barat': 'Sulawesi',
    'Maluku': 'Maluku-Papua',
    'Maluku Utara': 'Maluku-Papua',
    'Papua': 'Maluku-Papua',
    'Papua Barat': 'Maluku-Papua',
    'Papua Barat Daya': 'Maluku-Papua',
    'Papua Tengah': 'Maluku-Papua',
    'Papua Pegunungan': 'Maluku-Papua',
    'Papua Selatan': 'Maluku-Papua',
};

export default function TargetsIndex({
    auth,
    targets,
    summary,
    filters = {
        year: 2026,
        search: '',
        province: 'ALL',
        status: 'ALL',
        sort: 'UPDATED_DESC',
        per_page: 10,
    },
    allProvinces = [],
    existingTargetsInYear = [],
    availableYears = [2025, 2026, 2027],
    regions = [],
}: TargetsPageProps) {
    const user = auth.user;
    const isInternal = user.role_id === 'DIRECTOR_SSI' || user.role_id === 'ADMIN_SSI';

    // Normalize targets to PaginatedData structure (supports SSR Laravel paginator or array)
    const paginatedData: PaginatedData<ProvinceTargetItem> = useMemo(() => {
        if (targets && 'data' in targets && Array.isArray((targets as any).data)) {
            return targets as PaginatedData<ProvinceTargetItem>;
        }
        const arr = Array.isArray(targets) ? targets : [];
        return {
            data: arr,
            current_page: 1,
            last_page: 1,
            per_page: arr.length || 10,
            total: arr.length,
            from: arr.length > 0 ? 1 : 0,
            to: arr.length,
            links: [],
            next_page_url: null,
            prev_page_url: null,
        };
    }, [targets]);

    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedProvince, setSelectedProvince] = useState<string>(filters?.province || 'ALL');
    const [sortBy, setSortBy] = useState<string>(filters?.sort || 'UPDATED_DESC');
    const [statusFilter, setStatusFilter] = useState<string>(filters?.status || 'ALL');
    const [editingTarget, setEditingTarget] = useState<ProvinceTargetItem | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createValidationError, setCreateValidationError] = useState<string>('');

    // Keep filter states synchronized when backend sends new props
    useEffect(() => {
        setSearchQuery(filters?.search || '');
        setSelectedProvince(filters?.province || 'ALL');
        setStatusFilter(filters?.status || 'ALL');
        setSortBy(filters?.sort || 'UPDATED_DESC');
    }, [filters]);

    // Apply Server-Side Filters via Inertia router
    const applyFilters = (overrides: Record<string, any> = {}) => {
        const nextFilters = {
            year: overrides.year !== undefined ? overrides.year : (filters?.year || summary.selected_year || 2026),
            search: overrides.search !== undefined ? overrides.search : searchQuery,
            province: overrides.province !== undefined ? overrides.province : selectedProvince,
            status: overrides.status !== undefined ? overrides.status : statusFilter,
            sort: overrides.sort !== undefined ? overrides.sort : sortBy,
            per_page: overrides.per_page !== undefined ? overrides.per_page : (filters?.per_page || 10),
            page: overrides.page !== undefined ? overrides.page : 1,
            ...overrides,
        };

        const cleanParams: Record<string, any> = {};
        Object.entries(nextFilters).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== 'ALL' && v !== '') {
                cleanParams[k] = v;
            }
        });

        router.get(route('targets.index'), cleanParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // Debounce search input for automatic server querying
    const isInitialMount = useRef(true);
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        const timer = setTimeout(() => {
            if (searchQuery !== (filters?.search || '')) {
                applyFilters({ search: searchQuery, page: 1 });
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Options for Province Select2 filter (shows all registered provinces for the selected year)
    const provinceFilterOptions = useMemo<Select2Option<string>[]>(() => {
        const totalCount = allProvinces.length > 0 ? allProvinces.length : summary.total_provinces;
        const list: Select2Option<string>[] = [
            { value: 'ALL', label: 'Semua Provinsi', badge: totalCount }
        ];

        if (allProvinces.length > 0) {
            allProvinces.forEach((p) => {
                list.push({
                    value: p.name,
                    label: p.name,
                    badge: `${p.target_total} Titik`,
                });
            });
        } else {
            paginatedData.data.forEach((t) => {
                list.push({
                    value: t.province_name,
                    label: t.province_name,
                    badge: `${t.target_total} Titik`,
                });
            });
        }
        return list;
    }, [allProvinces, summary.total_provinces, paginatedData.data]);

    const handleSort = (newSort: string) => {
        setSortBy(newSort);
        applyFilters({ sort: newSort, page: 1 });
    };

    // Options for Year in Main Header (Select2 variant="pill")
    const yearFilterOptions = useMemo<Select2Option<number>[]>(() => {
        return availableYears.map((yr) => ({
            value: yr,
            label: `Tahun ${yr}`,
            badge: yr === summary.selected_year ? 'Aktif' : undefined,
        }));
    }, [availableYears, summary.selected_year]);

    // Options for Year in Create Modal (Select2 variant="default")
    const yearFormOptions = useMemo<Select2Option<number>[]>(() => {
        const years = [2025, 2026, 2027, 2028, 2029, 2030];
        return years.map((yr) => ({
            value: yr,
            label: `Tahun ${yr}`,
            badge: yr === (summary.selected_year || 2026) ? 'Tahun Aktif' : undefined,
            badgeColor: yr === (summary.selected_year || 2026) ? 'bg-blue-50 text-blue-700 border border-blue-200/60' : undefined,
        }));
    }, [summary.selected_year]);

    const statusOptions = useMemo<Select2Option<string>[]>(() => [
        { 
            value: 'ALL', 
            label: 'Semua Status Kesiapan', 
            badge: summary.total_provinces 
        },
        { 
            value: 'OPERATIONAL', 
            label: 'Operasional Aktif', 
            subtext: 'Sudah ada stasiun live melayani',
            badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
        },
        { 
            value: 'CONSTRUCTION', 
            label: 'In Progress', 
            subtext: 'Sedang pembangunan instalasi fisik',
            badgeColor: 'bg-amber-50 text-amber-700 border border-amber-200/60'
        },
        { 
            value: 'PLANNING', 
            label: 'Tahap Perencanaan', 
            subtext: 'Penetapan kuota & persiapan survei',
            badgeColor: 'bg-slate-100 text-slate-700 border border-slate-200/60'
        },
    ], [summary.total_provinces]);

    const isAnyFilterActive = selectedProvince !== 'ALL' || statusFilter !== 'ALL' || searchQuery.trim() !== '' || sortBy !== 'UPDATED_DESC';

    const handleResetFilters = () => {
        setSelectedProvince('ALL');
        setStatusFilter('ALL');
        setSearchQuery('');
        setSortBy('UPDATED_DESC');
        router.get(
            route('targets.index'),
            { year: filters?.year || summary.selected_year || 2026 },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    // Form for editing target
    const { 
        data: editData, 
        setData: setEditData, 
        put: putEdit, 
        processing: editProcessing, 
        reset: resetEdit,
        errors: editErrors
    } = useForm({
        target_evcs: 0,
        target_bss: 0,
        notes: '',
    });

    // Form for creating new province target
    const { 
        data: createData, 
        setData: setCreateData, 
        post: postCreate, 
        processing: createProcessing, 
        reset: resetCreate,
        errors: createErrors
    } = useForm({
        province_name: '',
        region: 'Jawa',
        year: summary.selected_year || 2026,
        target_evcs: 10,
        target_bss: 5,
        notes: '',
    });

    // Options for Province Select2 in Create Modal (tied to selected year from server dataset)
    const provinceOptions = useMemo<Select2Option<string>[]>(() => {
        const pool = existingTargetsInYear.length > 0 ? existingTargetsInYear : paginatedData.data;
        const existingNames = new Set(
            pool
                .filter(t => t.year === Number(createData.year))
                .map(t => t.province_name.toLowerCase())
        );

        return INDONESIA_REGIONS.map((item) => {
            const isExisting = existingNames.has(item.name.toLowerCase());
            return {
                value: item.name,
                label: item.name,
                keywords: item.cities,
                badge: isExisting ? 'Terdaftar' : undefined,
                badgeColor: isExisting ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : undefined,
            };
        }).sort((a, b) => a.label.localeCompare('id'));
    }, [existingTargetsInYear, paginatedData.data, createData.year]);

    // Check if the currently selected province already has a record in the chosen year
    const existingProvinceTarget = useMemo(() => {
        if (!createData.province_name) return null;
        const pool = existingTargetsInYear.length > 0 ? existingTargetsInYear : paginatedData.data;
        return pool.find(t => 
            t.province_name.toLowerCase() === createData.province_name.toLowerCase() &&
            t.year === Number(createData.year)
        ) || null;
    }, [existingTargetsInYear, paginatedData.data, createData.province_name, createData.year]);

    // Handle province change with automatic region mapping & smart auto-fill
    const handleProvinceSelect = (provName: string) => {
        const autoRegion = PROVINCE_TO_REGION[provName] || 'Jawa';
        const pool = existingTargetsInYear.length > 0 ? existingTargetsInYear : paginatedData.data;
        const existing = pool.find(t => 
            t.province_name.toLowerCase() === provName.toLowerCase() &&
            t.year === Number(createData.year)
        );

        setCreateData((prev) => ({
            ...prev,
            province_name: provName,
            region: autoRegion,
            target_evcs: existing ? existing.target_evcs : 10,
            target_bss: existing ? existing.target_bss : 5,
            notes: existing ? (existing.notes || '') : '',
        }));
        setCreateValidationError('');
    };

    // Handle year change in Create Modal
    const handleYearChange = (newYear: number) => {
        const pool = existingTargetsInYear.length > 0 ? existingTargetsInYear : paginatedData.data;
        const existing = pool.find(t => 
            createData.province_name &&
            t.province_name.toLowerCase() === createData.province_name.toLowerCase() &&
            t.year === newYear
        );

        setCreateData((prev) => ({
            ...prev,
            year: newYear,
            target_evcs: existing ? existing.target_evcs : 10,
            target_bss: existing ? existing.target_bss : 5,
            notes: existing ? (existing.notes || '') : '',
        }));
    };

    const handleOpenEdit = (target: ProvinceTargetItem) => {
        setEditingTarget(target);
        setEditData({
            target_evcs: target.target_evcs,
            target_bss: target.target_bss,
            notes: target.notes || '',
        });
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTarget) return;

        putEdit(route('targets.update', { target: editingTarget.id }), {
            preserveScroll: true,
            onSuccess: () => {
                setEditingTarget(null);
                resetEdit();
            },
        });
    };

    const handleSaveCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!createData.province_name) {
            setCreateValidationError('Silakan pilih nama provinsi terlebih dahulu.');
            return;
        }

        postCreate(route('targets.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetCreate();
                setCreateValidationError('');
            },
        });
    };

    return (
        <div className="flex h-screen bg-canvas font-sans antialiased overflow-hidden text-slate-800">
            <Head title="Target & Kuota Jaringan Nasional - V-Green SSI" />

            {/* SIDEBAR NAVIGATION */}
            <SidebarNav 
                user={user} 
                activeNav="targets" 
            />

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* HEADER */}
                <header className="h-20 px-8 flex items-center justify-between shrink-0 bg-transparent z-10">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger />
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                            <Target className="w-6 h-6 text-blue-600" />
                            <span>Target & Kuota Nasional</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Selector Tahun Rencana di Header menggunakan Select2 */}
                        <Select2<number>
                            value={summary.selected_year}
                            onChange={(val) => applyFilters({ year: Number(val), page: 1 })}
                            options={yearFilterOptions}
                            placeholder="Pilih Tahun"
                            prefixIcon={Calendar}
                            variant="pill"
                            size="sm"
                            isSearchable={false}
                        />

                        {/* User Profile */}
                        <UserDropdown
                            user={user}
                            roleName={user.role?.name || user.role_id}
                        />
                    </div>
                </header>

                {/* SCROLLABLE BODY */}
                <div className="flex-1 overflow-y-auto px-8 pb-24 space-y-7">
                    {/* EXECUTIVE KPI SUMMARY CARDS (Adopted from Infographic) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {/* CARD 1: Total Target Nasional */}
                        <div className="bg-white rounded-3xl p-6 border border-[#EDF1F7] shadow-card flex flex-col justify-between">
                            <div>
                                <span className="text-xs font-semibold text-slate-400 tracking-normal">
                                    Total Target Nasional
                                </span>
                                <div className="mt-2">
                                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                        {summary.total_target_national.toLocaleString('id-ID')} Titik
                                    </span>
                                </div>
                            </div>

                            <div className="pt-5 space-y-2">
                                <div className="flex justify-between items-center text-xs font-semibold">
                                    <span className="text-slate-500">Realisasi Nasional</span>
                                    <span className="text-emerald-600 font-bold">
                                        {summary.total_actual_live} Live ({summary.national_progress_percentage}%)
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                                        style={{ width: `${Math.min(100, Math.max(2, summary.national_progress_percentage))}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* CARD 2: Target EVCS Mobil Listrik */}
                        <div className="bg-white rounded-3xl p-6 border border-[#EDF1F7] shadow-card flex flex-col justify-between">
                            <div>
                                <span className="text-xs font-semibold text-slate-400 tracking-normal">
                                    Target EVCS Mobil Listrik
                                </span>
                                <div className="mt-2">
                                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                        {summary.total_target_evcs.toLocaleString('id-ID')} Titik
                                    </span>
                                </div>
                            </div>

                            <div className="pt-5 space-y-2">
                                <div className="flex justify-between items-center text-xs font-semibold">
                                    <span className="text-slate-500">Proporsi Portofolio</span>
                                    <span className="text-slate-800 font-bold">
                                        {summary.total_target_national > 0 ? Math.round((summary.total_target_evcs / summary.total_target_national) * 100) : 0}% Nasional
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-brand-600 rounded-full transition-all duration-500" 
                                        style={{ width: `${summary.total_target_national > 0 ? (summary.total_target_evcs / summary.total_target_national) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* CARD 3: Target BSS Motor Listrik */}
                        <div className="bg-white rounded-3xl p-6 border border-[#EDF1F7] shadow-card flex flex-col justify-between">
                            <div>
                                <span className="text-xs font-semibold text-slate-400 tracking-normal">
                                    Target BSS Motor Listrik
                                </span>
                                <div className="mt-2">
                                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                        {summary.total_target_bss.toLocaleString('id-ID')} Titik
                                    </span>
                                </div>
                            </div>

                            <div className="pt-5 space-y-2">
                                <div className="flex justify-between items-center text-xs font-semibold">
                                    <span className="text-slate-500">Proporsi Portofolio</span>
                                    <span className="text-slate-800 font-bold">
                                        {summary.total_target_national > 0 ? Math.round((summary.total_target_bss / summary.total_target_national) * 100) : 0}% Nasional
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-accent-500 rounded-full transition-all duration-500" 
                                        style={{ width: `${summary.total_target_national > 0 ? (summary.total_target_bss / summary.total_target_national) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* CARD 4: Sebaran Provinsi */}
                        <div className="bg-white rounded-3xl p-6 border border-[#EDF1F7] shadow-card flex flex-col justify-between">
                            <div>
                                <span className="text-xs font-semibold text-slate-400 tracking-normal">
                                    Cakupan Provinsi
                                </span>
                                <div className="mt-2">
                                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                        {summary.total_provinces} Provinsi
                                    </span>
                                </div>
                            </div>

                            <div className="pt-5 flex items-center justify-between text-xs font-semibold">
                                <span className="text-slate-500">In Progress</span>
                                <span className="font-bold text-slate-800">{summary.total_in_construction} Titik</span>
                            </div>
                        </div>
                    </div>

                    {/* TABLE SECTION */}
                    <div className="bg-white rounded-3xl border border-[#EDF1F7] shadow-card overflow-hidden">
                        {/* Table Header Filter Toolbar with Modern Select2 Components */}
                        <div className="p-6 border-b border-[#EDF1F7] flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4">
                            <div className="shrink-0">
                                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                    Daftar Kuota Target per Provinsi (Tahun {summary.selected_year})
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Menampilkan {paginatedData.total > 0 ? `${paginatedData.from ?? 1}–${paginatedData.to ?? paginatedData.data.length}` : '0'} dari total {paginatedData.total} provinsi terdaftar
                                </p>
                            </div>

                            {/* Select2 Toolbar Controls & Action Button */}
                            <div className="flex items-start justify-between gap-3 w-full 2xl:w-auto min-w-0">
                                {/* Filters Container */}
                                <div className="flex flex-wrap items-center gap-2.5 min-w-0 flex-1 2xl:flex-initial">
                                    {/* Inline Quick Search */}
                                    <div className="relative w-44 md:w-52">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    applyFilters({ search: searchQuery, page: 1 });
                                                }
                                            }}
                                            placeholder="Cari provinsi..."
                                            className="w-full bg-[#F4F5F8] hover:bg-[#ECEFF4] border border-slate-200/60 rounded-full pl-9 pr-7 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => {
                                                    setSearchQuery('');
                                                    applyFilters({ search: '', page: 1 });
                                                }}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Select2 Province Filter */}
                                    <Select2
                                        value={selectedProvince}
                                        onChange={(val) => {
                                            const nextVal = String(val);
                                            setSelectedProvince(nextVal);
                                            applyFilters({ province: nextVal, page: 1 });
                                        }}
                                        options={provinceFilterOptions}
                                        placeholder="Semua Provinsi"
                                        searchPlaceholder="Pilih atau cari provinsi..."
                                        prefixIcon={MapPin}
                                        variant="pill"
                                    />

                                    {/* Select2 Status Filter */}
                                    <Select2
                                        value={statusFilter}
                                        onChange={(val) => {
                                            const nextVal = String(val);
                                            setStatusFilter(nextVal);
                                            applyFilters({ status: nextVal, page: 1 });
                                        }}
                                        options={statusOptions}
                                        placeholder="Kesiapan Operasional"
                                        searchPlaceholder="Filter status kesiapan..."
                                        prefixIcon={SlidersHorizontal}
                                        variant="pill"
                                    />

                                    {/* Reset Filter Button */}
                                    {isAnyFilterActive && (
                                        <button
                                            onClick={handleResetFilters}
                                            className="px-3 py-2 rounded-full text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition flex items-center gap-1.5"
                                            title="Reset semua filter"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Reset</span>
                                        </button>
                                    )}
                                </div>

                                {/* Tambah Target Button (Always pinned on the right, never wraps into filters) */}
                                {isInternal && (
                                    <div className="shrink-0 ml-auto">
                                        <button
                                            onClick={() => {
                                                resetCreate();
                                                setCreateData({
                                                    province_name: '',
                                                    region: 'Jawa',
                                                    year: summary.selected_year || 2026,
                                                    target_evcs: 10,
                                                    target_bss: 5,
                                                    notes: '',
                                                });
                                                setCreateValidationError('');
                                                setIsCreateModalOpen(true);
                                            }}
                                            className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs shadow-blue-500/20 flex items-center gap-1.5 transition shrink-0 whitespace-nowrap"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Tambah Target</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-[#EDF1F7] bg-slate-50/60 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                                        <th className="py-4 px-6">
                                            <SortableHeader 
                                                field="NAME" 
                                                currentSort={sortBy} 
                                                onSort={handleSort} 
                                                defaultDirection="asc"
                                            >
                                                Provinsi
                                            </SortableHeader>
                                        </th>
                                        <th className="py-4 px-6 text-center">
                                            <SortableHeader 
                                                field="EVCS" 
                                                currentSort={sortBy} 
                                                onSort={handleSort} 
                                                align="center" 
                                                defaultDirection="desc"
                                            >
                                                Target EVCS (Mobil)
                                            </SortableHeader>
                                        </th>
                                        <th className="py-4 px-6 text-center">
                                            <SortableHeader 
                                                field="BSS" 
                                                currentSort={sortBy} 
                                                onSort={handleSort} 
                                                align="center" 
                                                defaultDirection="desc"
                                            >
                                                Target BSS (Motor)
                                            </SortableHeader>
                                        </th>
                                        <th className="py-4 px-6 text-center">
                                            <SortableHeader 
                                                field="TARGET" 
                                                currentSort={sortBy} 
                                                onSort={handleSort} 
                                                align="center" 
                                                defaultDirection="desc"
                                            >
                                                Total Target
                                            </SortableHeader>
                                        </th>
                                        <th className="py-4 px-6 text-center">
                                            <SortableHeader 
                                                field="ACTUAL" 
                                                currentSort={sortBy} 
                                                onSort={handleSort} 
                                                align="center" 
                                                defaultDirection="desc"
                                            >
                                                Realisasi Live
                                            </SortableHeader>
                                        </th>
                                        <th className="py-4 px-6">
                                            <SortableHeader 
                                                field="PROGRESS" 
                                                currentSort={sortBy} 
                                                onSort={handleSort} 
                                                defaultDirection="desc"
                                            >
                                                Progres Capaian
                                            </SortableHeader>
                                        </th>
                                        <th className="py-4 px-6 hidden 3xl:table-cell">
                                            <SortableHeader 
                                                field="UPDATED" 
                                                currentSort={sortBy} 
                                                onSort={handleSort} 
                                                defaultDirection="desc" 
                                                title="Urutkan berdasarkan waktu pembaruan terakhir"
                                            >
                                                Catatan Operasional
                                            </SortableHeader>
                                        </th>
                                        {isInternal && <th className="py-4 px-6 text-right font-bold uppercase tracking-wider text-[11px] text-slate-400">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#EDF1F7]">
                                    {paginatedData.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={isInternal ? 8 : 7} className="py-12 text-center text-slate-400 text-xs">
                                                Tidak ada target provinsi yang cocok dengan filter pencarian.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.data.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                                {/* Provinsi */}
                                                <td className="py-4 px-6 whitespace-nowrap">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                            {item.province_name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                                                <span>{item.province_name}</span>
                                                                {(item.actual_live || 0) > 0 ? (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                                                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                                                        <span>Operasional</span>
                                                                    </span>
                                                                ) : (item.in_construction || 0) > 0 ? (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                                                                        <Hammer className="w-2.5 h-2.5 text-amber-600" />
                                                                        <span>In Progress</span>
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/60">
                                                                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                                                                        <span>Perencanaan</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-[11px] text-slate-400 font-medium">
                                                                {getCitiesByProvince(item.province_name).length > 0
                                                                    ? `${getCitiesByProvince(item.province_name).length} Kota & Kabupaten`
                                                                    : 'Target Nasional'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Target EVCS */}
                                                <td className="py-4 px-6 text-center font-bold text-slate-700">
                                                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold">
                                                        {item.target_evcs} Titik
                                                    </span>
                                                </td>

                                                {/* Target BSS */}
                                                <td className="py-4 px-6 text-center font-bold text-slate-700">
                                                    <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold">
                                                        {item.target_bss} Titik
                                                    </span>
                                                </td>

                                                {/* Total Target */}
                                                <td className="py-4 px-6 text-center">
                                                    <span className="text-sm font-extrabold text-slate-900">
                                                        {item.target_total} Titik
                                                    </span>
                                                </td>

                                                {/* Realisasi Live (Pills sejajar satu baris agar tinggi baris seragam) */}
                                                <td className="py-4 px-6 text-center whitespace-nowrap">
                                                    <div className="inline-flex items-center justify-center gap-1.5">
                                                        {(item.actual_live || 0) > 0 ? (
                                                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-100/60">
                                                                {item.actual_live} Live
                                                            </span>
                                                        ) : (item.in_construction || 0) === 0 ? (
                                                            <span className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-400 font-semibold text-xs border border-slate-100">
                                                                0 Live
                                                            </span>
                                                        ) : null}

                                                        {(item.in_construction || 0) > 0 && (
                                                            <span 
                                                                className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-xs border border-amber-100/60"
                                                                title={`${item.in_construction} stasiun in progress`}
                                                            >
                                                                {(item.actual_live || 0) > 0 ? `+${item.in_construction}` : item.in_construction} In Progress
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Progres Capaian */}
                                                <td className="py-4 px-6 min-w-[170px]">
                                                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                                                        <span className="text-slate-600">{item.actual_live || 0} / {item.target_total}</span>
                                                        <span className="text-blue-600 font-extrabold">{item.percentage}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                                            style={{ width: `${Math.min(100, Math.max(3, item.percentage || 0))}%` }}
                                                        />
                                                    </div>
                                                </td>

                                                {/* Catatan Operasional (Otomatis disembunyikan di layar laptop, desktop Full HD & layar tanggung / < 3xl / < 2000px) */}
                                                <td className="py-4 px-6 text-xs text-slate-500 max-w-xs hidden 3xl:table-cell">
                                                    <div className="truncate font-medium text-slate-700" title={item.notes || ''}>
                                                        {item.notes || '-'}
                                                    </div>
                                                    {item.updated_at && (
                                                        <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                                            Diperbarui: {item.updated_at}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Aksi */}
                                                {isInternal && (
                                                    <td className="py-4 px-6 text-right">
                                                        <button
                                                            onClick={() => handleOpenEdit(item)}
                                                            className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                                            title="Ubah Target Kuota"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination for Targets (Server-Side) */}
                        <Pagination
                            data={paginatedData}
                            preserveScroll={true}
                            preserveState={true}
                        />
                    </div>
                </div>

                {/* MODAL EDIT TARGET PROVINSI */}
                {editingTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Ubah Target Kuota Provinsi</h3>
                                    <p className="text-xs text-slate-400 mt-0.5 font-medium">
                                        {editingTarget.province_name} - Tahun {editingTarget.year}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setEditingTarget(null)}
                                    className="p-1 rounded-full text-slate-400 hover:text-slate-700 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveEdit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Target EVCS Mobil Listrik (Titik)
                                    </label>
                                    <input 
                                        type="number"
                                        min="0"
                                        value={editData.target_evcs}
                                        onChange={(e) => setEditData('target_evcs', parseInt(e.target.value) || 0)}
                                        className="w-full bg-canvas border border-[#E8ECF2] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        required
                                    />
                                    {editErrors.target_evcs && <p className="text-rose-500 text-[11px] mt-1">{editErrors.target_evcs}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Target BSS Motor Listrik (Titik)
                                    </label>
                                    <input 
                                        type="number"
                                        min="0"
                                        value={editData.target_bss}
                                        onChange={(e) => setEditData('target_bss', parseInt(e.target.value) || 0)}
                                        className="w-full bg-canvas border border-[#E8ECF2] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        required
                                    />
                                    {editErrors.target_bss && <p className="text-rose-500 text-[11px] mt-1">{editErrors.target_bss}</p>}
                                </div>

                                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs flex justify-between items-center">
                                    <span className="font-semibold text-blue-800">Total Kuota Baru:</span>
                                    <span className="font-extrabold text-blue-900 text-sm">
                                        {(editData.target_evcs + editData.target_bss)} Titik
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Catatan / Catatan Perencanaan
                                    </label>
                                    <textarea 
                                        rows={2}
                                        value={editData.notes}
                                        onChange={(e) => setEditData('notes', e.target.value)}
                                        placeholder="Catatan prioritas, rest area tol, dll..."
                                        className="w-full bg-canvas border border-[#E8ECF2] rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                    />
                                </div>

                                <div className="flex justify-end gap-2.5 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingTarget(null)}
                                        className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={editProcessing}
                                        className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition disabled:opacity-50"
                                    >
                                        {editProcessing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL TAMBAH PROVINSI BARU */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Tambah Target Provinsi Baru</h3>
                                    <p className="text-xs text-slate-400 mt-0.5 font-medium">
                                        Masukkan kuota penugasan V-Green untuk provinsi baru
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        setCreateValidationError('');
                                    }}
                                    className="p-1 rounded-full text-slate-400 hover:text-slate-700 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveCreate} className="space-y-4">
                                {/* Pilihan Tahun Target di Bagian Paling Atas (Select2) */}
                                <div className="relative z-40">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Tahun Target
                                    </label>
                                    <Select2<number>
                                        value={createData.year}
                                        onChange={(val) => handleYearChange(Number(val))}
                                        options={yearFormOptions}
                                        placeholder="Pilih Tahun Target..."
                                        variant="default"
                                        size="md"
                                        className="w-full"
                                        dropdownClassName="shadow-xl border-slate-200"
                                        prefixIcon={Calendar}
                                        isSearchable={false}
                                    />
                                </div>

                                {/* Nama Provinsi (Select2 dengan Korelasi Kota & Auto-Fill) */}
                                <div className="relative z-30">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Nama Provinsi
                                    </label>
                                    <Select2
                                        value={createData.province_name}
                                        onChange={(val) => handleProvinceSelect(String(val))}
                                        options={provinceOptions}
                                        placeholder="Pilih atau cari provinsi..."
                                        searchPlaceholder="Cari provinsi atau ketik nama kota..."
                                        variant="default"
                                        size="md"
                                        className="w-full"
                                        dropdownClassName="shadow-xl border-slate-200"
                                        prefixIcon={MapPin}
                                    />
                                    {(createErrors.province_name || createValidationError) && (
                                        <p className="text-rose-500 text-xs font-semibold mt-1.5 flex items-center gap-1 animate-in fade-in duration-150">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                            <span>{createErrors.province_name || createValidationError}</span>
                                        </p>
                                    )}

                                    {/* Indikator Auto-Fill jika sudah terdaftar di tahun yang dipilih */}
                                    {existingProvinceTarget && (
                                        <div className="mt-2.5 p-3 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in duration-200">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                            <div className="min-w-0">
                                                <span className="font-bold">Provinsi ini sudah terdaftar di tahun {createData.year}.</span>
                                                <p className="text-[11px] text-emerald-700 mt-0.5 leading-snug">
                                                    Data target untuk provinsi ini sudah ada, masukkan angka baru dan simpan untuk perbarui targetnya.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3 relative z-10">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Target EVCS (Mobil)
                                        </label>
                                        <input 
                                            type="number"
                                            min="0"
                                            value={createData.target_evcs}
                                            onChange={(e) => setCreateData('target_evcs', parseInt(e.target.value) || 0)}
                                            className="w-full bg-canvas border border-[#E8ECF2] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Target BSS (Motor)
                                        </label>
                                        <input 
                                            type="number"
                                            min="0"
                                            value={createData.target_bss}
                                            onChange={(e) => setCreateData('target_bss', parseInt(e.target.value) || 0)}
                                            className="w-full bg-canvas border border-[#E8ECF2] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="relative z-10">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Catatan Perencanaan
                                    </label>
                                    <textarea 
                                        rows={2}
                                        value={createData.notes}
                                        onChange={(e) => setCreateData('notes', e.target.value)}
                                        placeholder="Catatan prioritas..."
                                        className="w-full bg-canvas border border-[#E8ECF2] rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                    />
                                </div>

                                <div className="flex justify-end gap-2.5 pt-2 relative z-10">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreateModalOpen(false);
                                            setCreateValidationError('');
                                        }}
                                        className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createProcessing}
                                        className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                                    >
                                        {createProcessing 
                                            ? 'Menyimpan...' 
                                            : existingProvinceTarget 
                                            ? 'Perbarui Target' 
                                            : 'Simpan Target'
                                        }
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
