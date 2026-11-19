import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    ShieldCheck, 
    CheckCircle2, 
    AlertTriangle, 
    Clock, 
    Search, 
    Filter, 
    RotateCcw, 
    Camera, 
    Layers, 
    MapPin, 
    Calendar, 
    User as UserIcon, 
    Eye, 
    MoreVertical, 
    ExternalLink, 
    Car, 
    Sparkles, 
    ChevronRight,
    Bell,
    Check,
    AlertCircle,
    ClipboardCheck
} from 'lucide-react';
import SidebarNav from '@/Components/Navigation/SidebarNav';
import SidebarTrigger from '@/Components/Navigation/SidebarTrigger';
import UserDropdown from '@/Components/Navigation/UserDropdown';
import Pagination from '@/Components/Common/Pagination';
import ActionDropdown from '@/Components/Common/ActionDropdown';
import Select2, { Select2Option } from '@/Components/Common/Select2';
import InspectionAuditModal from '@/Components/Inspections/InspectionAuditModal';
import StationDetailDrawer from '@/Components/Map/StationDetailDrawer';
import { PaginatedData } from '@/types/pagination';
import { PageProps } from '@/types';
import { getAllProvinces, getCitiesByProvince } from '@/utils/indonesiaRegions';

interface InspectionPhotoItem {
    id: number;
    checklist_slot_id: string;
    photo_url: string;
    latitude?: number;
    longitude?: number;
    taken_at?: string;
    is_approved: boolean;
    reviewer_notes?: string;
    slot?: {
        id: string;
        category: 'LAHAN' | 'MESIN' | 'PANEL_TIANG';
        label: string;
        angle: string;
        is_required: boolean;
    };
}

interface InspectionReportItem {
    id: number;
    station_id: number;
    station: {
        id: number;
        code: string;
        name: string;
        facility_type_id: string;
        status_id: string;
        city: string;
        province: string;
        address: string;
        latitude: number;
        longitude: number;
        power_capacity_kw?: number;
        slot_count?: number;
        facilityType?: { id: string; name: string };
        status?: { id: string; name: string };
    };
    submitted_by?: number;
    submitter?: { id: number; name: string; role_id: string; email?: string };
    reviewed_by?: number;
    reviewer?: { id: number; name: string; role_id: string };
    approval_status_id: 'PENDING_REVIEW' | 'APPROVED' | 'REVISION_REQUIRED';
    approval_status?: { id: string; name: string };
    stage: 'INITIAL_SURVEY' | 'CONSTRUCTION_PROGRESS' | 'COMMISSIONING' | 'ROUTINE_PERIODIC';
    notes?: string;
    rejection_reason?: string;
    submitted_at?: string;
    reviewed_at?: string;
    photos: InspectionPhotoItem[];
}

interface InspectionsIndexProps extends PageProps {
    reports: PaginatedData<InspectionReportItem>;
    stats: {
        total_reports: number;
        pending_count: number;
        revision_count: number;
        approved_count: number;
    };
    filters: {
        status: string;
        stage: string;
        search: string;
        province: string;
        city: string;
        per_page: number;
    };
    approvalStatuses: { id: string; name: string }[];
    checklistSlots: any[];
    activeNav?: string;
    availableRoles?: any[];
    provinces: string[];
}

const STAGE_CONFIG: Record<string, { label: string; badgeColor: string }> = {
    INITIAL_SURVEY: { label: 'Survei Awal', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/80' },
    CONSTRUCTION_PROGRESS: { label: 'Konstruksi', badgeColor: 'bg-orange-50 text-orange-700 border-orange-200/80' },
    COMMISSIONING: { label: 'Komisioning', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/80' },
    ROUTINE_PERIODIC: { label: 'Rutin Berkala', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/80' },
};

export default function InspectionsIndex({
    auth,
    reports,
    stats,
    filters,
    approvalStatuses = [],
    checklistSlots = [],
    activeNav = 'inspections',
    availableRoles = [],
    provinces = [],
}: InspectionsIndexProps) {
    const user = auth.user;
    const canReview = user.role_id === 'DIRECTOR_SSI' || user.role_id === 'ADMIN_SSI';

    // Local filter state
    const [statusFilter, setStatusFilter] = useState(filters.status || 'ALL');
    const [stageFilter, setStageFilter] = useState(filters.stage || 'ALL');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedProvince, setSelectedProvince] = useState(filters.province || 'ALL');
    const [selectedCity, setSelectedCity] = useState(filters.city || 'ALL');

    // Modals
    const [auditModalReport, setAuditModalReport] = useState<InspectionReportItem | null>(null);
    const [stationForDrawer, setStationForDrawer] = useState<any | null>(null);

    // Dynamic cities based on province
    const provinceList = useMemo(() => {
        const standardProvs = getAllProvinces();
        const combined = Array.from(new Set([...standardProvs, ...provinces])).sort((a, b) => a.localeCompare('id'));
        return combined;
    }, [provinces]);

    const availableCities = useMemo(() => {
        if (!selectedProvince || selectedProvince === 'ALL') return [];
        return getCitiesByProvince(selectedProvince);
    }, [selectedProvince]);

    // Apply filters via Inertia router
    const applyFilters = (overrides: Record<string, any> = {}) => {
        const nextFilters = {
            status: statusFilter,
            stage: stageFilter,
            search: searchQuery,
            province: selectedProvince,
            city: selectedCity,
            per_page: filters.per_page || 15,
            ...overrides,
        };

        // Remove 'ALL' or empty strings
        const cleanParams: Record<string, any> = {};
        Object.entries(nextFilters).forEach(([k, v]) => {
            if (v && v !== 'ALL' && v !== '') {
                cleanParams[k] = v;
            }
        });

        router.get(route('inspections.index'), cleanParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleStatusTabClick = (newStatus: string) => {
        setStatusFilter(newStatus);
        applyFilters({ status: newStatus });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search: searchQuery });
    };

    const handleResetFilters = () => {
        setStatusFilter('ALL');
        setStageFilter('ALL');
        setSearchQuery('');
        setSelectedProvince('ALL');
        setSelectedCity('ALL');
        router.get(route('inspections.index'), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const hasActiveFilters = 
        statusFilter !== 'ALL' || 
        stageFilter !== 'ALL' || 
        searchQuery.trim() !== '' || 
        selectedProvince !== 'ALL' || 
        selectedCity !== 'ALL';

    return (
        <div className="flex h-screen w-screen bg-[#F7F9FC] text-slate-800 font-sans overflow-hidden antialiased">
            <Head title="Sesi Verifikasi & Audit QC Lapangan - PT SSI" />

            {/* Sidebar Navigation */}
            <SidebarNav 
                user={user} 
                activeNav="inspections" 
                pendingCount={stats.pending_count} 
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="h-20 bg-white border-b border-[#EDF1F7] px-8 flex items-center justify-between shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger />
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                            Sesi Verifikasi & Audit QC Lapangan
                        </h1>
                        <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200/60 items-center gap-1.5 shadow-2xs">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Audit 7 Sudut Lapangan</span>
                        </span>
                    </div>

                    {/* Right Controls: Search + Notif + User Dropdown */}
                    <div className="flex items-center gap-4">
                        <form onSubmit={handleSearchSubmit} className="relative w-64 md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari stasiun, kode VG-..., surveyor..."
                                className="w-full bg-white border border-[#E8ECF2] rounded-full pl-11 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 shadow-subtle focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 transition"
                            />
                        </form>

                        <button 
                            className="relative w-10 h-10 rounded-full bg-white border border-[#E8ECF2] flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-subtle hover:shadow-sm transition"
                            title="Notifikasi Audit"
                        >
                            <Bell className="w-4 h-4" />
                            {stats.pending_count > 0 && (
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
                            )}
                        </button>

                        <UserDropdown
                            user={user}
                            roleName={user.role?.name || availableRoles.find(r => r.id === user.role_id)?.name}
                        />
                    </div>
                </header>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-8 py-7 pb-24">
                    <div className="space-y-6 max-w-7xl mx-auto">
                        {/* EXECUTIVE STATS ROW (4 CARDS) - UNIFORM COLOR WHEN NOT HOVERED */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {/* Card 1: Total Sesi */}
                            <div 
                                onClick={() => handleStatusTabClick('ALL')}
                                className={`bg-white rounded-3xl p-5 border shadow-card flex items-center justify-between cursor-pointer transition-all duration-200 group ${
                                    statusFilter === 'ALL'
                                        ? 'border-blue-400 ring-2 ring-blue-500/10'
                                        : 'border-[#EDF1F7] hover:border-slate-300 hover:shadow-md'
                                }`}
                            >
                                <div>
                                    <span className="text-xs font-semibold text-slate-400 tracking-normal">
                                        Total Sesi Inspeksi
                                    </span>
                                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
                                        {stats.total_reports} Sesi
                                    </div>
                                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                                        Seluruh rekaman lapangan
                                    </span>
                                </div>
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all duration-200 group-hover:scale-105 ${
                                    statusFilter === 'ALL'
                                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                                        : 'bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200'
                                }`}>
                                    <ClipboardCheck className="w-5 h-5" />
                                </div>
                            </div>

                            {/* Card 2: Menunggu Verifikasi */}
                            <div 
                                onClick={() => handleStatusTabClick('PENDING_REVIEW')}
                                className={`bg-white rounded-3xl p-5 border shadow-card flex items-center justify-between cursor-pointer transition-all duration-200 group ${
                                    statusFilter === 'PENDING_REVIEW'
                                        ? 'border-amber-400 ring-2 ring-amber-500/10'
                                        : 'border-[#EDF1F7] hover:border-slate-300 hover:shadow-md'
                                }`}
                            >
                                <div>
                                    <span className="text-xs font-semibold text-slate-400 tracking-normal">
                                        Menunggu Verifikasi
                                    </span>
                                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
                                        {stats.pending_count} Sesi
                                    </div>
                                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                                        Perlu tindakan pimpinan
                                    </span>
                                </div>
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all duration-200 group-hover:scale-105 ${
                                    statusFilter === 'PENDING_REVIEW'
                                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                                        : 'bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:border-amber-200'
                                }`}>
                                    <Clock className="w-5 h-5" />
                                </div>
                            </div>

                            {/* Card 3: Perlu Revisi */}
                            <div 
                                onClick={() => handleStatusTabClick('REVISION_REQUIRED')}
                                className={`bg-white rounded-3xl p-5 border shadow-card flex items-center justify-between cursor-pointer transition-all duration-200 group ${
                                    statusFilter === 'REVISION_REQUIRED'
                                        ? 'border-rose-400 ring-2 ring-rose-500/10'
                                        : 'border-[#EDF1F7] hover:border-slate-300 hover:shadow-md'
                                }`}
                            >
                                <div>
                                    <span className="text-xs font-semibold text-slate-400 tracking-normal">
                                        Perlu Revisi Lapangan
                                    </span>
                                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
                                        {stats.revision_count} Sesi
                                    </div>
                                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                                        Catatan perbaikan terkirim
                                    </span>
                                </div>
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all duration-200 group-hover:scale-105 ${
                                    statusFilter === 'REVISION_REQUIRED'
                                        ? 'bg-rose-50 text-rose-600 border-rose-200'
                                        : 'bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-rose-50 group-hover:text-rose-600 group-hover:border-rose-200'
                                }`}>
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                            </div>

                            {/* Card 4: Disetujui / Go-Live */}
                            <div 
                                onClick={() => handleStatusTabClick('APPROVED')}
                                className={`bg-white rounded-3xl p-5 border shadow-card flex items-center justify-between cursor-pointer transition-all duration-200 group ${
                                    statusFilter === 'APPROVED'
                                        ? 'border-emerald-400 ring-2 ring-emerald-500/10'
                                        : 'border-[#EDF1F7] hover:border-slate-300 hover:shadow-md'
                                }`}
                            >
                                <div>
                                    <span className="text-xs font-semibold text-slate-400 tracking-normal">
                                        Lolos Verifikasi (Approved)
                                    </span>
                                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
                                        {stats.approved_count} Sesi
                                    </div>
                                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                                        Terverifikasi & rilis ke V-Green
                                    </span>
                                </div>
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all duration-200 group-hover:scale-105 ${
                                    statusFilter === 'APPROVED'
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                        : 'bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-200'
                                }`}>
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        {/* TABLE CARD & CONTROLS */}
                        <div className="bg-white rounded-3xl border border-[#EDF1F7] shadow-card overflow-hidden">
                            {/* Card Header & Controls */}
                            <div className="p-6 border-b border-[#EDF1F7] space-y-5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                            Daftar Sesi Laporan Lapangan & Dokumentasi 7 Sudut
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Tinjau kelengkapan foto fisik dan lakukan audit kelayakan sebelum go-live.
                                        </p>
                                    </div>

                                    {/* Status Filter Tabs (Pill Segments) */}
                                    <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl self-start sm:self-auto border border-slate-200/60">
                                        <button
                                            type="button"
                                            onClick={() => handleStatusTabClick('ALL')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                                statusFilter === 'ALL'
                                                    ? 'bg-white text-slate-900 shadow-2xs'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            Semua ({stats.total_reports})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleStatusTabClick('PENDING_REVIEW')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                statusFilter === 'PENDING_REVIEW'
                                                    ? 'bg-amber-500 text-white shadow-2xs'
                                                    : 'text-amber-700 hover:bg-amber-100/50'
                                            }`}
                                        >
                                            <span>Menunggu</span>
                                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'PENDING_REVIEW' ? 'bg-white/20' : 'bg-amber-100 text-amber-800'}`}>
                                                {stats.pending_count}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleStatusTabClick('REVISION_REQUIRED')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                statusFilter === 'REVISION_REQUIRED'
                                                    ? 'bg-rose-500 text-white shadow-2xs'
                                                    : 'text-rose-700 hover:bg-rose-100/50'
                                            }`}
                                        >
                                            <span>Revisi</span>
                                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'REVISION_REQUIRED' ? 'bg-white/20' : 'bg-rose-100 text-rose-800'}`}>
                                                {stats.revision_count}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleStatusTabClick('APPROVED')}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                statusFilter === 'APPROVED'
                                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                                    : 'text-emerald-700 hover:bg-emerald-100/50'
                                            }`}
                                        >
                                            <span>Disetujui</span>
                                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'APPROVED' ? 'bg-white/20' : 'bg-emerald-100 text-emerald-800'}`}>
                                                {stats.approved_count}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Filter Row: Select2 dropdowns */}
                                <div className="flex flex-wrap items-center gap-3 pt-2">
                                    {/* Tahapan Sesi Filter */}
                                    <div className="w-48">
                                        <Select2
                                            value={stageFilter}
                                            onChange={(val) => {
                                                const v = String(val);
                                                setStageFilter(v);
                                                applyFilters({ stage: v });
                                            }}
                                            options={[
                                                { value: 'ALL', label: 'Semua Tahapan' },
                                                { value: 'INITIAL_SURVEY', label: 'Survei Awal' },
                                                { value: 'CONSTRUCTION_PROGRESS', label: 'Konstruksi Fisik' },
                                                { value: 'COMMISSIONING', label: 'Komisioning (Uji Fungsi)' },
                                                { value: 'ROUTINE_PERIODIC', label: 'Rutin Berkala' },
                                            ]}
                                            placeholder="Tahapan Sesi..."
                                            size="sm"
                                        />
                                    </div>

                                    {/* Provinsi Filter */}
                                    <div className="w-52">
                                        <Select2
                                            value={selectedProvince}
                                            onChange={(val) => {
                                                const v = String(val);
                                                setSelectedProvince(v);
                                                setSelectedCity('ALL');
                                                applyFilters({ province: v, city: 'ALL' });
                                            }}
                                            options={[
                                                { value: 'ALL', label: 'Semua Provinsi' },
                                                ...provinceList.map((p) => ({ value: p, label: p })),
                                            ]}
                                            placeholder="Pilih Provinsi..."
                                            searchPlaceholder="Cari provinsi..."
                                            prefixIcon={MapPin}
                                            size="sm"
                                        />
                                    </div>

                                    {/* Kota Filter (If province selected) */}
                                    {selectedProvince !== 'ALL' && availableCities.length > 0 && (
                                        <div className="w-52">
                                            <Select2
                                                value={selectedCity}
                                                onChange={(val) => {
                                                    const v = String(val);
                                                    setSelectedCity(v);
                                                    applyFilters({ city: v });
                                                }}
                                                options={[
                                                    { value: 'ALL', label: 'Semua Kota / Kab.' },
                                                    ...availableCities.map((c) => ({ value: c, label: c })),
                                                ]}
                                                placeholder="Pilih Kota..."
                                                searchPlaceholder="Cari kota..."
                                                size="sm"
                                            />
                                        </div>
                                    )}

                                    {/* Reset Filter Button */}
                                    {hasActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={handleResetFilters}
                                            className="h-9 px-3 rounded-xl border border-rose-200 bg-rose-50/60 text-rose-600 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 transition ml-auto"
                                            title="Reset semua filter"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            <span>Reset Filter</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-[#EDF1F7] bg-slate-50/60 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 select-none">
                                            <th className="py-3.5 px-6">Stasiun & Kode</th>
                                            <th className="py-3.5 px-6">Layanan & Mesin</th>
                                            <th className="py-3.5 px-6">Tahapan Sesi</th>
                                            <th className="py-3.5 px-6">7 Sudut Foto</th>
                                            <th className="py-3.5 px-6">Surveyor & Waktu</th>
                                            <th className="py-3.5 px-6">Status Verifikasi</th>
                                            <th className="py-3.5 px-6 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#EDF1F7] text-xs">
                                        {reports.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="py-12 text-center text-slate-400">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <ShieldCheck className="w-8 h-8 text-slate-300" />
                                                        <span className="font-semibold text-slate-600">Tidak ada sesi inspeksi yang sesuai filter</span>
                                                        <span className="text-2xs text-slate-400">Coba ubah kata kunci pencarian atau reset filter di atas</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            reports.data.map((report) => {
                                                const station = report.station;
                                                const stageInfo = STAGE_CONFIG[report.stage] || { label: report.stage, badgeColor: 'bg-slate-100 text-slate-700' };
                                                const photosCount = report.photos?.length ?? 0;
                                                const isPhotosComplete = photosCount >= 7;

                                                return (
                                                    <tr 
                                                        key={report.id}
                                                        className="hover:bg-blue-50/20 transition-colors group"
                                                    >
                                                        {/* 1. Stasiun & Kode */}
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-mono font-bold text-2xs flex items-center justify-center border border-slate-200/80 shrink-0">
                                                                    {station.code.split('-')[1] || 'VG'}
                                                                </div>
                                                                <div className="min-w-0 max-w-[220px]">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="font-mono text-2xs font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                                                                            {station.code}
                                                                        </span>
                                                                    </div>
                                                                    <div 
                                                                        onClick={() => setStationForDrawer(station)}
                                                                        className="font-bold text-slate-900 truncate mt-1 cursor-pointer hover:text-blue-600 transition-colors"
                                                                        title={station.name}
                                                                    >
                                                                        {station.name}
                                                                    </div>
                                                                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                                                        {station.city}, {station.province}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* 2. Layanan & Mesin */}
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-2">
                                                                <div 
                                                                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                                                                        station.facility_type_id === 'EVCS' 
                                                                            ? 'bg-blue-50 text-blue-600 border-blue-200/60' 
                                                                            : station.facility_type_id === 'BSS'
                                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
                                                                            : 'bg-indigo-50 text-indigo-600 border-indigo-200/60'
                                                                    }`}
                                                                    title={station.facility_type_id}
                                                                >
                                                                    <Car className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-slate-900">
                                                                        {station.facility_type_id}
                                                                    </div>
                                                                    <div className="text-2xs text-slate-400">
                                                                        {station.power_capacity_kw || 60} kW • {station.slot_count || 2} Slot
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* 3. Tahapan Sesi */}
                                                        <td className="py-4 px-6">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-2xs font-extrabold border ${stageInfo.badgeColor}`}>
                                                                {stageInfo.label}
                                                            </span>
                                                            <div className="text-[11px] text-slate-400 mt-1 font-mono">
                                                                Sesi #{report.id}
                                                            </div>
                                                        </td>

                                                        {/* 4. 7 Sudut Foto */}
                                                        <td className="py-4 px-6">
                                                            <div className="flex flex-col gap-1.5">
                                                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                                                                    isPhotosComplete ? 'text-emerald-700' : 'text-amber-700'
                                                                }`}>
                                                                    {isPhotosComplete ? (
                                                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                                    ) : (
                                                                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                                                    )}
                                                                    <span>{photosCount}/7 Sudut Lengkap</span>
                                                                </span>

                                                                {/* Mini Thumbnails */}
                                                                <div 
                                                                    onClick={() => setAuditModalReport(report)}
                                                                    className="flex items-center -space-x-1.5 cursor-pointer hover:opacity-90 transition"
                                                                    title="Klik untuk membuka galeri foto sesi ini"
                                                                >
                                                                    {report.photos.slice(0, 3).map((photo, pIdx) => (
                                                                        <img
                                                                            key={pIdx}
                                                                            src={photo.photo_url}
                                                                            alt="Sudut"
                                                                            className="w-7 h-7 rounded-lg object-cover ring-2 ring-white border border-slate-200"
                                                                        />
                                                                    ))}
                                                                    {photosCount > 3 && (
                                                                        <div className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white">
                                                                            +{photosCount - 3}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* 5. Surveyor & Waktu */}
                                                        <td className="py-4 px-6">
                                                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                                                <UserIcon className="w-3 h-3 text-slate-400" />
                                                                <span>{report.submitter?.name || 'Surveyor Lapangan'}</span>
                                                            </div>
                                                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                                <Calendar className="w-3 h-3 text-slate-400" />
                                                                <span>
                                                                    {report.submitted_at 
                                                                        ? new Date(report.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                                                        : '-'}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* 6. Status Verifikasi */}
                                                        <td className="py-4 px-6">
                                                            {report.approval_status_id === 'PENDING_REVIEW' && (
                                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-2xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                                                                    <Clock className="w-3 h-3" />
                                                                    <span>Menunggu Review</span>
                                                                </span>
                                                            )}
                                                            {report.approval_status_id === 'REVISION_REQUIRED' && (
                                                                <div className="space-y-1">
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-2xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                                                                        <AlertTriangle className="w-3 h-3" />
                                                                        <span>Perlu Revisi</span>
                                                                    </span>
                                                                    {report.rejection_reason && (
                                                                        <p className="text-[10px] text-rose-600 line-clamp-1 italic" title={report.rejection_reason}>
                                                                            "{report.rejection_reason}"
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {report.approval_status_id === 'APPROVED' && (
                                                                <div className="space-y-0.5">
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-2xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                        <span>Disetujui</span>
                                                                    </span>
                                                                    {report.reviewer && (
                                                                        <div className="text-[10px] text-slate-400">
                                                                            Oleh: {report.reviewer.name}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* 7. Aksi */}
                                                        <td className="py-4 px-6 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setAuditModalReport(report)}
                                                                    className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-2xs shadow-blue-500/20"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" />
                                                                    <span>Audit 7 Sudut</span>
                                                                </button>

                                                                {/* 3-Dot Action Menu using ActionDropdown Portal (Anti-Clipping Rule) */}
                                                                <ActionDropdown
                                                                    align="right"
                                                                    className="w-48"
                                                                    trigger={(isOpen) => (
                                                                        <button
                                                                            type="button"
                                                                            className={`p-1.5 rounded-lg border transition ${
                                                                                isOpen 
                                                                                    ? 'bg-slate-100 border-slate-300 text-slate-900' 
                                                                                    : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                                                            }`}
                                                                            title="Menu Aksi Sesi"
                                                                        >
                                                                            <MoreVertical className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                >
                                                                    {({ close }) => (
                                                                        <div className="py-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    close();
                                                                                    setStationForDrawer(station);
                                                                                }}
                                                                                className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                                            >
                                                                                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                                                                <span>Buka Detail Stasiun</span>
                                                                            </button>

                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    close();
                                                                                    setAuditModalReport(report);
                                                                                }}
                                                                                className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                                            >
                                                                                <Camera className="w-3.5 h-3.5 text-slate-400" />
                                                                                <span>Lihat Foto Sudut</span>
                                                                            </button>

                                                                            {canReview && report.approval_status_id !== 'APPROVED' && (
                                                                                <>
                                                                                    <div className="my-1 border-t border-slate-100" />
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            close();
                                                                                            setAuditModalReport(report);
                                                                                        }}
                                                                                        className="w-full px-4 py-2 text-left text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                                                                                    >
                                                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                                                        <span>Setujui Sesi Ini</span>
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </ActionDropdown>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="p-6 border-t border-[#EDF1F7]">
                                <Pagination data={reports} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inspection Audit Modal */}
            <InspectionAuditModal
                isOpen={!!auditModalReport}
                onClose={() => setAuditModalReport(null)}
                report={auditModalReport}
                canReview={canReview}
            />

            {/* Station Detail Drawer */}
            {stationForDrawer && (
                <StationDetailDrawer
                    station={stationForDrawer}
                    onClose={() => setStationForDrawer(null)}
                    userRole={user.role_id}
                    hasBackdrop={true}
                />
            )}
        </div>
    );
}
