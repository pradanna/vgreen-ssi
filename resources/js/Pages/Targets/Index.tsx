import React, { useState, useMemo, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { ProvinceTargetItem, TargetSummary } from '@/types/station';
import { PaginatedData, PaginationLink } from '@/types/pagination';
import SidebarNav from '@/Components/Navigation/SidebarNav';
import SidebarTrigger from '@/Components/Navigation/SidebarTrigger';
import UserDropdown from '@/Components/Navigation/UserDropdown';
import Select2, { Select2Option } from '@/Components/Common/Select2';
import Pagination from '@/Components/Common/Pagination';
import { 
    Target, 
    Car, 
    BatteryCharging, 
    MapPin, 
    Search, 
    Plus, 
    Edit2, 
    TrendingUp, 
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
    Clock
} from 'lucide-react';

interface TargetsPageProps extends PageProps {
    targets: ProvinceTargetItem[];
    summary: TargetSummary;
    availableYears: number[];
    regions: string[];
}

export default function TargetsIndex({
    auth,
    targets = [],
    summary,
    availableYears = [2026],
    regions = [],
}: TargetsPageProps) {
    const user = auth.user;
    const isInternal = user.role_id === 'DIRECTOR_SSI' || user.role_id === 'ADMIN_SSI';

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<string>('TARGET_DESC');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [editingTarget, setEditingTarget] = useState<ProvinceTargetItem | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Options for Select2 filters
    const regionOptions = useMemo<Select2Option<string>[]>(() => {
        const list: Select2Option<string>[] = [
            { value: 'ALL', label: 'Semua Wilayah', badge: targets.length }
        ];
        regions.forEach(reg => {
            const count = targets.filter(t => t.region === reg).length;
            list.push({
                value: reg,
                label: reg === 'Bali-Nusra' ? 'Bali & Nusa Tenggara' : reg,
                badge: count,
            });
        });
        return list;
    }, [regions, targets]);

    const sortOptions: Select2Option<string>[] = [
        { value: 'TARGET_DESC', label: 'Target Terbesar ▾' },
        { value: 'TARGET_ASC', label: 'Target Terkecil ▴' },
        { value: 'ACTUAL_DESC', label: 'Realisasi Live Terbanyak ▾' },
        { value: 'NAME_ASC', label: 'Nama Provinsi (A - Z)' },
    ];

    // Operational readiness status counts for filter badges (Option 2)
    const statusCounts = useMemo(() => {
        let operational = 0;
        let construction = 0;
        let planning = 0;

        targets.forEach((t) => {
            if ((t.actual_live || 0) > 0) {
                operational++;
            } else if ((t.in_construction || 0) > 0) {
                construction++;
            } else {
                planning++;
            }
        });

        return { operational, construction, planning, total: targets.length };
    }, [targets]);

    const statusOptions = useMemo<Select2Option<string>[]>(() => [
        { 
            value: 'ALL', 
            label: 'Semua Status Kesiapan', 
            badge: statusCounts.total 
        },
        { 
            value: 'OPERATIONAL', 
            label: 'Operasional Aktif', 
            subtext: 'Sudah ada stasiun live melayani',
            badge: statusCounts.operational,
            badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
        },
        { 
            value: 'CONSTRUCTION', 
            label: 'Tahap Konstruksi', 
            subtext: 'Sedang pembangunan instalasi fisik',
            badge: statusCounts.construction,
            badgeColor: 'bg-amber-50 text-amber-700 border border-amber-200/60'
        },
        { 
            value: 'PLANNING', 
            label: 'Tahap Perencanaan', 
            subtext: 'Penetapan kuota & persiapan survei',
            badge: statusCounts.planning,
            badgeColor: 'bg-slate-100 text-slate-700 border border-slate-200/60'
        },
    ], [statusCounts]);

    const isAnyFilterActive = selectedRegion !== 'ALL' || statusFilter !== 'ALL' || searchQuery.trim() !== '' || sortBy !== 'TARGET_DESC';

    const handleResetFilters = () => {
        setSelectedRegion('ALL');
        setStatusFilter('ALL');
        setSearchQuery('');
        setSortBy('TARGET_DESC');
    };

    // Filter and sort targets
    const filteredTargets = useMemo(() => {
        return targets
            .filter((item) => {
                if (selectedRegion !== 'ALL' && item.region !== selectedRegion) {
                    return false;
                }
                if (statusFilter === 'OPERATIONAL' && (item.actual_live || 0) <= 0) {
                    return false;
                }
                if (statusFilter === 'CONSTRUCTION' && !((item.actual_live || 0) === 0 && (item.in_construction || 0) > 0)) {
                    return false;
                }
                if (statusFilter === 'PLANNING' && !((item.actual_live || 0) === 0 && (item.in_construction || 0) === 0)) {
                    return false;
                }
                if (searchQuery.trim() !== '') {
                    const q = searchQuery.toLowerCase();
                    const matchName = item.province_name.toLowerCase().includes(q);
                    const matchRegion = item.region.toLowerCase().includes(q);
                    const matchNotes = item.notes ? item.notes.toLowerCase().includes(q) : false;
                    return matchName || matchRegion || matchNotes;
                }
                return true;
            })
            .sort((a, b) => {
                if (sortBy === 'TARGET_DESC') {
                    return b.target_total - a.target_total;
                }
                if (sortBy === 'TARGET_ASC') {
                    return a.target_total - b.target_total;
                }
                if (sortBy === 'ACTUAL_DESC') {
                    return (b.actual_live || 0) - (a.actual_live || 0);
                }
                if (sortBy === 'NAME_ASC') {
                    return a.province_name.localeCompare(b.province_name);
                }
                return 0;
            });
    }, [targets, selectedRegion, statusFilter, searchQuery, sortBy]);

    // Pagination states
    const [targetPage, setTargetPage] = useState(1);
    const [targetPerPage, setTargetPerPage] = useState(10);

    // Reset pagination when search query or filters change
    useEffect(() => {
        setTargetPage(1);
    }, [searchQuery, selectedRegion, statusFilter, sortBy]);

    // Paginated Targets
    const paginatedTargets = useMemo<PaginatedData<ProvinceTargetItem>>(() => {
        const total = filteredTargets.length;
        const lastPage = Math.max(1, Math.ceil(total / targetPerPage));
        const currentPage = Math.min(Math.max(1, targetPage), lastPage);
        const from = total > 0 ? (currentPage - 1) * targetPerPage + 1 : null;
        const to = total > 0 ? Math.min(currentPage * targetPerPage, total) : null;
        const sliceData = total > 0 ? filteredTargets.slice((currentPage - 1) * targetPerPage, currentPage * targetPerPage) : [];

        const links: PaginationLink[] = [
            {
                url: currentPage > 1 ? `#page=${currentPage - 1}` : null,
                label: '&laquo; Previous',
                active: false,
            },
        ];

        for (let p = 1; p <= lastPage; p++) {
            links.push({
                url: `#page=${p}`,
                label: `${p}`,
                active: p === currentPage,
            });
        }

        links.push({
            url: currentPage < lastPage ? `#page=${currentPage + 1}` : null,
            label: 'Next &raquo;',
            active: false,
        });

        return {
            data: sliceData,
            current_page: currentPage,
            last_page: lastPage,
            from,
            to,
            per_page: targetPerPage,
            total,
            links,
            prev_page_url: currentPage > 1 ? `#page=${currentPage - 1}` : null,
            next_page_url: currentPage < lastPage ? `#page=${currentPage + 1}` : null,
        };
    }, [filteredTargets, targetPage, targetPerPage]);

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
        postCreate(route('targets.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetCreate();
            },
        });
    };

    return (
        <div className="flex h-screen bg-[#F7F9FC] font-sans antialiased overflow-hidden text-slate-800">
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

                    <div className="flex items-center gap-4">
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
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-400 tracking-normal">
                                        Total Target Nasional
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100/60">
                                        <TrendingUp className="w-3 h-3 text-blue-600" />
                                        <span>Target V-Green</span>
                                    </span>
                                </div>
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
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-400 tracking-normal">
                                        Target EVCS Mobil Listrik
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100/60">
                                        <Car className="w-3 h-3 text-blue-600" />
                                        <span>Charging Station</span>
                                    </span>
                                </div>
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
                                        className="h-full bg-[#2D60FF] rounded-full transition-all duration-500" 
                                        style={{ width: `${summary.total_target_national > 0 ? (summary.total_target_evcs / summary.total_target_national) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* CARD 3: Target BSS Motor Listrik */}
                        <div className="bg-white rounded-3xl p-6 border border-[#EDF1F7] shadow-card flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-400 tracking-normal">
                                        Target BSS Motor Listrik
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100/60">
                                        <BatteryCharging className="w-3 h-3 text-amber-600" />
                                        <span>Swap Station</span>
                                    </span>
                                </div>
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
                                        className="h-full bg-[#FF7A00] rounded-full transition-all duration-500" 
                                        style={{ width: `${summary.total_target_national > 0 ? (summary.total_target_bss / summary.total_target_national) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* CARD 4: Sebaran Provinsi */}
                        <div className="bg-white rounded-3xl p-6 border border-[#EDF1F7] shadow-card flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-400 tracking-normal">
                                        Cakupan Wilayah Provinsi
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100/60">
                                        <MapPin className="w-3 h-3 text-purple-600" />
                                        <span>Available</span>
                                    </span>
                                </div>
                                <div className="mt-2">
                                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                        {summary.total_provinces} Provinsi
                                    </span>
                                </div>
                            </div>

                            <div className="pt-5 flex items-center justify-between text-xs text-slate-500">
                                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                                    <Layers className="w-4 h-4 text-slate-400" />
                                    <span>Aktif Terdaftar</span>
                                </span>
                                <span className="font-bold text-slate-800">{summary.total_in_construction} Titik Konstruksi</span>
                            </div>
                        </div>
                    </div>

                    {/* TABLE SECTION */}
                    <div className="bg-white rounded-3xl border border-[#EDF1F7] shadow-card overflow-hidden">
                        {/* Table Header Filter Toolbar with Modern Select2 Components */}
                        <div className="p-6 border-b border-[#EDF1F7] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                    Daftar Kuota Target per Provinsi (Tahun {summary.selected_year})
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Menampilkan {filteredTargets.length} dari total {targets.length} provinsi terdaftar
                                </p>
                            </div>

                            {/* Select2 Toolbar Controls */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                {/* Inline Quick Search */}
                                <div className="relative w-44 md:w-52">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Cari provinsi..."
                                        className="w-full bg-[#F4F5F8] hover:bg-[#ECEFF4] border border-slate-200/60 rounded-full pl-9 pr-7 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>

                                {/* Select2 Region Filter */}
                                <Select2
                                    value={selectedRegion}
                                    onChange={(val) => setSelectedRegion(String(val))}
                                    options={regionOptions}
                                    placeholder="Semua Wilayah"
                                    searchPlaceholder="Cari wilayah..."
                                    prefixIcon={MapPin}
                                    variant="pill"
                                />

                                {/* Select2 Status Filter */}
                                <Select2
                                    value={statusFilter}
                                    onChange={(val) => setStatusFilter(String(val))}
                                    options={statusOptions}
                                    placeholder="Kesiapan Operasional"
                                    searchPlaceholder="Filter status kesiapan..."
                                    prefixIcon={SlidersHorizontal}
                                    variant="pill"
                                />

                                {/* Select2 Sorting */}
                                <Select2
                                    value={sortBy}
                                    onChange={(val) => setSortBy(String(val))}
                                    options={sortOptions}
                                    placeholder="Urutan Data"
                                    prefixIcon={ArrowUpDown}
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

                                {/* Tambah Target Button (Disamping kanan filter) */}
                                {isInternal && (
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 flex items-center gap-1.5 transition shrink-0"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Tambah Target</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-[#EDF1F7] bg-slate-50/60 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                                        <th className="py-4 px-6">Provinsi & Wilayah</th>
                                        <th className="py-4 px-6 text-center">Target EVCS (Mobil)</th>
                                        <th className="py-4 px-6 text-center">Target BSS (Motor)</th>
                                        <th className="py-4 px-6 text-center">Total Target</th>
                                        <th className="py-4 px-6 text-center">Realisasi Live</th>
                                        <th className="py-4 px-6">Progres Capaian</th>
                                        <th className="py-4 px-6">Catatan / Wilayah Operasi</th>
                                        {isInternal && <th className="py-4 px-6 text-right">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#EDF1F7]">
                                    {paginatedTargets.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={isInternal ? 8 : 7} className="py-12 text-center text-slate-400 text-xs">
                                                Tidak ada target provinsi yang cocok dengan filter pencarian.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedTargets.data.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                                {/* Provinsi & Region */}
                                                <td className="py-4 px-6">
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
                                                                        <span>Konstruksi</span>
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/60">
                                                                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                                                                        <span>Perencanaan</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-[11px] text-slate-400 font-medium">Wilayah {item.region}</div>
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

                                                {/* Realisasi Live */}
                                                <td className="py-4 px-6 text-center">
                                                    {(item.actual_live || 0) > 0 ? (
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-100/60">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                            <span>{item.actual_live} Live</span>
                                                        </div>
                                                    ) : (item.in_construction || 0) > 0 ? (
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-xs border border-amber-100/60">
                                                            <Hammer className="w-3 h-3 text-amber-600" />
                                                            <span>{item.in_construction} Konstruksi</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs font-semibold">0 Live</span>
                                                    )}
                                                    {(item.actual_live || 0) > 0 && (item.in_construction ?? 0) > 0 && (
                                                        <div className="text-[10px] text-blue-600 font-medium mt-1">
                                                            +{item.in_construction} Konstruksi
                                                        </div>
                                                    )}
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

                                                {/* Catatan */}
                                                <td className="py-4 px-6 text-xs text-slate-500 max-w-xs truncate" title={item.notes || ''}>
                                                    {item.notes || '-'}
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

                        {/* Pagination for Targets */}
                        <Pagination
                            data={paginatedTargets}
                            onPageChange={(page) => setTargetPage(page)}
                            onPerPageChange={(newPerPage) => {
                                setTargetPerPage(newPerPage);
                                setTargetPage(1);
                            }}
                        />
                    </div>
                </div>

                {/* MODAL EDIT TARGET PROVINSI */}
                {editingTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Ubah Target Kuota Provinsi</h3>
                                    <p className="text-xs text-slate-400 mt-0.5 font-medium">
                                        {editingTarget.province_name} ({editingTarget.region}) - Tahun {editingTarget.year}
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
                                        className="w-full bg-[#F7F9FC] border border-[#E8ECF2] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
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
                                        className="w-full bg-[#F7F9FC] border border-[#E8ECF2] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
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
                                        className="w-full bg-[#F7F9FC] border border-[#E8ECF2] rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
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
                                        className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
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
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Tambah Target Provinsi Baru</h3>
                                    <p className="text-xs text-slate-400 mt-0.5 font-medium">
                                        Masukkan kuota penugasan V-Green untuk provinsi baru
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="p-1 rounded-full text-slate-400 hover:text-slate-700 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveCreate} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Nama Provinsi
                                    </label>
                                    <input 
                                        type="text"
                                        value={createData.province_name}
                                        onChange={(e) => setCreateData('province_name', e.target.value)}
                                        placeholder="Contoh: Kalimantan Timur, Banten..."
                                        className="w-full bg-[#F7F9FC] border border-[#E8ECF2] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        required
                                    />
                                    {createErrors.province_name && <p className="text-rose-500 text-[11px] mt-1">{createErrors.province_name}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Wilayah / Region
                                    </label>
                                    <select
                                        value={createData.region}
                                        onChange={(e) => setCreateData('region', e.target.value)}
                                        className="w-full bg-[#F7F9FC] border border-[#E8ECF2] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                    >
                                        {regions.map((r) => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Target EVCS (Mobil)
                                        </label>
                                        <input 
                                            type="number"
                                            min="0"
                                            value={createData.target_evcs}
                                            onChange={(e) => setCreateData('target_evcs', parseInt(e.target.value) || 0)}
                                            className="w-full bg-[#F7F9FC] border border-[#E8ECF2] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
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
                                            className="w-full bg-[#F7F9FC] border border-[#E8ECF2] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Catatan Perencanaan
                                    </label>
                                    <textarea 
                                        rows={2}
                                        value={createData.notes}
                                        onChange={(e) => setCreateData('notes', e.target.value)}
                                        placeholder="Catatan prioritas..."
                                        className="w-full bg-[#F7F9FC] border border-[#E8ECF2] rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                    />
                                </div>

                                <div className="flex justify-end gap-2.5 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createProcessing}
                                        className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                                    >
                                        {createProcessing ? 'Menyimpan...' : 'Simpan Target'}
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
