import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { ActivityLogItem, ActivityLogStats } from '@/types/station';
import { PaginatedData } from '@/types/pagination';
import SidebarNav from '@/Components/Navigation/SidebarNav';
import SidebarTrigger from '@/Components/Navigation/SidebarTrigger';
import UserDropdown from '@/Components/Navigation/UserDropdown';
import Pagination from '@/Components/Common/Pagination';
import ActivityDetailModal from '@/Components/ActivityLog/ActivityDetailModal';
import ActivityLogFilterDrawer from '@/Components/ActivityLog/ActivityLogFilterDrawer';
import { 
    Activity, 
    Search, 
    SlidersHorizontal, 
    RotateCcw, 
    Calendar, 
    Clock, 
    Layers, 
    User as UserIcon, 
    Eye, 
    X
} from 'lucide-react';

interface ActivityLogPageProps extends PageProps {
    logs: PaginatedData<ActivityLogItem>;
    stats: ActivityLogStats;
    filters: {
        module: string;
        action: string;
        user_id: string;
        search: string;
        date_from?: string;
        date_to?: string;
        per_page: number;
        page?: number;
    };
    actors: {
        id: string;
        name: string;
        email: string;
        role_id: string;
    }[];
}

export default function ActivityLogIndex({
    auth,
    logs,
    stats,
    filters,
    actors
}: ActivityLogPageProps) {
    const user = auth.user;

    const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedModule, setSelectedModule] = useState(filters.module || 'ALL');
    const [selectedUser, setSelectedUser] = useState(filters.user_id || 'ALL');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    // Active filters count for badge
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (selectedModule !== 'ALL') count++;
        if (selectedUser !== 'ALL') count++;
        if (dateFrom !== '' || dateTo !== '') count++;
        return count;
    }, [selectedModule, selectedUser, dateFrom, dateTo]);

    const applyFilters = (overrides: Record<string, any> = {}) => {
        router.get(
            route('activity-logs.index'),
            {
                module: overrides.module !== undefined ? overrides.module : selectedModule,
                user_id: overrides.user_id !== undefined ? overrides.user_id : selectedUser,
                search: overrides.search !== undefined ? overrides.search : searchQuery,
                date_from: overrides.date_from !== undefined ? overrides.date_from : dateFrom,
                date_to: overrides.date_to !== undefined ? overrides.date_to : dateTo,
                per_page: filters.per_page || 20,
                ...overrides,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search: searchQuery, page: 1 });
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedModule('ALL');
        setSelectedUser('ALL');
        setDateFrom('');
        setDateTo('');
        router.get(
            route('activity-logs.index'),
            {},
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    // Format relative time helper
    const getRelativeTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffSec = Math.floor(diffMs / 1000);
            const diffMin = Math.floor(diffSec / 60);
            const diffHour = Math.floor(diffMin / 60);
            const diffDays = Math.floor(diffHour / 24);

            if (diffSec < 60) return 'Baru saja';
            if (diffMin < 60) return `${diffMin} menit lalu`;
            if (diffHour < 24) return `${diffHour} jam lalu`;
            if (diffDays === 1) return 'Kemarin';
            if (diffDays < 7) return `${diffDays} hari lalu`;
            return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(date);
        } catch {
            return dateStr;
        }
    };

    // Format full date
    const formatFullDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(date);
        } catch {
            return dateStr;
        }
    };

    // Badge color mapper
    const getModuleBadgeClass = (module: string) => {
        switch (module) {
            case 'STATION':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'DOCUMENT':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'INSPECTION':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'TARGET':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'MASTER_DATA':
                return 'bg-cyan-50 text-cyan-700 border-cyan-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getActionBadgeClass = (action: string) => {
        if (action.includes('CREATED') || action.includes('APPROVED')) {
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        }
        if (action.includes('UPDATED') || action.includes('RESUBMITTED')) {
            return 'bg-blue-50 text-blue-700 border-blue-200';
        }
        if (action.includes('DELETED') || action.includes('REJECTED')) {
            return 'bg-rose-50 text-rose-700 border-rose-200';
        }
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    // Selected user name for pill
    const selectedUserName = useMemo(() => {
        if (selectedUser === 'ALL') return null;
        return actors.find(a => a.id === selectedUser)?.name || selectedUser;
    }, [selectedUser, actors]);

    return (
        <div className="flex h-screen bg-canvas font-sans antialiased overflow-hidden text-slate-800">
            <Head title="Log Aktivitas & Audit Trail - V-Green SSI" />

            {/* SIDEBAR NAVIGATION */}
            <SidebarNav 
                user={user} 
                activeNav="activity-logs" 
            />

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* HEADER */}
                <header className="h-20 px-8 flex items-center justify-between shrink-0 bg-transparent z-10">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger />
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                            <Activity className="w-6 h-6 text-blue-600" />
                            <span>Log Aktivitas &amp; Audit Trail</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <UserDropdown
                            user={user}
                            roleName={user.role?.name || user.role_id}
                        />
                    </div>
                </header>

                {/* SCROLLABLE BODY */}
                <div className="flex-1 overflow-y-auto px-8 pb-24 space-y-6">
                    {/* KPI CARDS (Sinao Style) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {/* CARD 1: Total Aktivitas Hari Ini */}
                        <div className="bg-white rounded-3xl p-6 border border-[#EDF1F7] shadow-card flex flex-col justify-between">
                            <div>
                                <span className="text-xs font-semibold text-slate-400 tracking-normal">
                                    Aktivitas Hari Ini
                                </span>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                        {stats.total_today.toLocaleString('id-ID')}
                                    </span>
                                    <span className="text-xs font-medium text-slate-500">
                                        log tercatat
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="text-slate-400 font-medium">Total Keseluruhan</span>
                                <span className="font-bold text-slate-700">{stats.total_all.toLocaleString('id-ID')}</span>
                            </div>
                        </div>

                        {/* CARD 2: Titik Stasiun & Impor */}
                        <div className="bg-white rounded-3xl p-6 border border-[#EDF1F7] shadow-card flex flex-col justify-between">
                            <div>
                                <span className="text-xs font-semibold text-slate-400 tracking-normal">
                                    Kelola &amp; Impor Stasiun
                                </span>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-3xl font-extrabold text-blue-600 tracking-tight">
                                        {stats.stations_count.toLocaleString('id-ID')}
                                    </span>
                                    <span className="text-xs font-medium text-slate-500">
                                        entri data
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="text-slate-400 font-medium">Modul</span>
                                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">STATION</span>
                            </div>
                        </div>

                        {/* CARD 3: Dokumen Legalitas */}
                        <div className="bg-white rounded-3xl p-6 border border-[#EDF1F7] shadow-card flex flex-col justify-between">
                            <div>
                                <span className="text-xs font-semibold text-slate-400 tracking-normal">
                                    Dokumen &amp; Kontrak
                                </span>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-3xl font-extrabold text-purple-600 tracking-tight">
                                        {stats.documents_count.toLocaleString('id-ID')}
                                    </span>
                                    <span className="text-xs font-medium text-slate-500">
                                        berkas diunggah/hapus
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="text-slate-400 font-medium">Kategori Lahan</span>
                                <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">Swasta &amp; Pemda</span>
                            </div>
                        </div>

                        {/* CARD 4: Inspeksi & QC Lapangan */}
                        <div className="bg-white rounded-3xl p-6 border border-[#EDF1F7] shadow-card flex flex-col justify-between">
                            <div>
                                <span className="text-xs font-semibold text-slate-400 tracking-normal">
                                    Inspeksi &amp; Review QC
                                </span>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                                        {stats.inspections_count.toLocaleString('id-ID')}
                                    </span>
                                    <span className="text-xs font-medium text-slate-500">
                                        sesi diverifikasi
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="text-slate-400 font-medium">Audit Bukti</span>
                                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">7 Sudut Foto + GPS</span>
                            </div>
                        </div>
                    </div>

                    {/* UNIFIED FILTER TOOLBAR & PILLS (Matches Station Filter & Dashboard pattern) */}
                    <div className="bg-white rounded-3xl border border-[#EDF1F7] shadow-card overflow-hidden">
                        {/* Quick Toolbar */}
                        <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5">
                                {/* Tombol Buka Filter Drawer */}
                                <button
                                    type="button"
                                    onClick={() => setIsFilterDrawerOpen(true)}
                                    className={`px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition shadow-2xs cursor-pointer ${
                                        activeFilterCount > 0 
                                            ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs' 
                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                                    }`}
                                    title="Buka panel filter log (Modul, Pengguna, Rentang Tanggal)"
                                >
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Filter Log</span>
                                    {activeFilterCount > 0 && (
                                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>

                                {/* Reset Filter Button */}
                                {(activeFilterCount > 0 || searchQuery.trim() !== '') && (
                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        className="px-3.5 py-2 text-xs text-slate-500 hover:text-slate-800 font-semibold hover:bg-slate-100 rounded-2xl transition flex items-center gap-1.5 cursor-pointer"
                                        title="Reset semua filter"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Reset</span>
                                    </button>
                                )}
                            </div>

                            {/* Search Box */}
                            <form onSubmit={handleSearchSubmit} className="relative min-w-[260px] sm:w-80">
                                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari stasiun, nama user, deskripsi..."
                                    className="w-full pl-9 pr-8 py-2.5 bg-[#F8FAFC] border border-slate-200/80 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('');
                                            applyFilters({ search: '', page: 1 });
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                        title="Hapus pencarian"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </form>
                        </div>

                        {/* ACTIVE FILTER PILLS (REMOVABLE WITH [X]) */}
                        {(activeFilterCount > 0 || searchQuery.trim() !== '') && (
                            <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[#EDF1F7] flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                                    Filter Aktif ({activeFilterCount + (searchQuery.trim() !== '' ? 1 : 0)}):
                                </span>

                                {/* Pill: Modul */}
                                {selectedModule !== 'ALL' && (
                                    <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
                                        <Layers className="w-3 h-3 text-blue-500" />
                                        <span>Modul: {selectedModule}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedModule('ALL');
                                                applyFilters({ module: 'ALL', page: 1 });
                                            }}
                                            className="w-4 h-4 rounded-full hover:bg-blue-200/70 text-blue-600 hover:text-blue-900 flex items-center justify-center transition cursor-pointer"
                                            title="Hapus filter modul"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}

                                {/* Pill: Pengguna */}
                                {selectedUser !== 'ALL' && (
                                    <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
                                        <UserIcon className="w-3 h-3 text-blue-500" />
                                        <span>Pengguna: {selectedUserName}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedUser('ALL');
                                                applyFilters({ user_id: 'ALL', page: 1 });
                                            }}
                                            className="w-4 h-4 rounded-full hover:bg-blue-200/70 text-blue-600 hover:text-blue-900 flex items-center justify-center transition cursor-pointer"
                                            title="Hapus filter pengguna"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}

                                {/* Pill: Rentang Tanggal */}
                                {(dateFrom !== '' || dateTo !== '') && (
                                    <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
                                        <Calendar className="w-3 h-3 text-blue-500" />
                                        <span>Periode: {dateFrom || '...'} s/d {dateTo || '...'}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDateFrom('');
                                                setDateTo('');
                                                applyFilters({ date_from: '', date_to: '', page: 1 });
                                            }}
                                            className="w-4 h-4 rounded-full hover:bg-blue-200/70 text-blue-600 hover:text-blue-900 flex items-center justify-center transition cursor-pointer"
                                            title="Hapus filter periode tanggal"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}

                                {/* Pill: Pencarian */}
                                {searchQuery.trim() !== '' && (
                                    <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                                        <Search className="w-3 h-3 text-slate-400" />
                                        <span>Cari: "{searchQuery}"</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchQuery('');
                                                applyFilters({ search: '', page: 1 });
                                            }}
                                            className="w-4 h-4 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
                                            title="Hapus filter pencarian"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ACTIVITY LOG TABLE */}
                    <div className="bg-white rounded-3xl border border-[#EDF1F7] shadow-card overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Daftar Rekam Jejak Sistem
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Menampilkan {logs.data.length} dari total {logs.total} log aktivitas tercatat.
                                </p>
                            </div>
                        </div>

                        {logs.data.length === 0 ? (
                            <div className="p-16 text-center space-y-3">
                                <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                                    <Activity className="w-7 h-7" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-700">Belum Ada Log Aktivitas</h4>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                    Tidak ada data aktivitas yang sesuai dengan kriteria filter saat ini. Coba sesuaikan kata kunci atau reset filter.
                                </p>
                                {(activeFilterCount > 0 || searchQuery.trim() !== '') && (
                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition cursor-pointer"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Reset Filter</span>
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-[#F8FAFC] border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                            <th className="p-4 px-6">Waktu &amp; Tanggal</th>
                                            <th className="p-4 px-6">Pengguna (Aktor)</th>
                                            <th className="p-4 px-6">Modul &amp; Aksi</th>
                                            <th className="p-4 px-6">Entitas Terkait</th>
                                            <th className="p-4 px-6">Deskripsi Aktivitas</th>
                                            <th className="p-4 px-6 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {logs.data.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/75 transition-colors">
                                                {/* Timestamp */}
                                                <td className="p-4 px-6 whitespace-nowrap">
                                                    <span className="font-bold text-slate-900 block">
                                                        {getRelativeTime(item.created_at)}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                                                        <Clock className="w-3 h-3" />
                                                        {formatFullDate(item.created_at)}
                                                    </span>
                                                </td>

                                                {/* User */}
                                                <td className="p-4 px-6 whitespace-nowrap">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                                                            {item.user?.name ? item.user.name.charAt(0).toUpperCase() : 'S'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="font-bold text-slate-900 block truncate max-w-[150px]">
                                                                {item.user?.name || 'Sistem'}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 block font-mono">
                                                                {item.user?.role_id || 'SYSTEM'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Modul & Aksi */}
                                                <td className="p-4 px-6 whitespace-nowrap space-y-1">
                                                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${getModuleBadgeClass(item.module)}`}>
                                                        {item.module}
                                                    </span>
                                                    <span className={`block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border w-max ${getActionBadgeClass(item.action)}`}>
                                                        {item.action}
                                                    </span>
                                                </td>

                                                {/* Entitas */}
                                                <td className="p-4 px-6">
                                                    {item.subject_name ? (
                                                        <span className="font-bold font-mono text-slate-800 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/60 block truncate max-w-[200px]" title={item.subject_name}>
                                                            {item.subject_name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 italic">-</span>
                                                    )}
                                                </td>

                                                {/* Deskripsi */}
                                                <td className="p-4 px-6 min-w-[240px]">
                                                    <p className="font-medium text-slate-800 line-clamp-2 leading-relaxed">
                                                        {item.description}
                                                    </p>
                                                </td>

                                                {/* Aksi Button */}
                                                <td className="p-4 px-6 text-right whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedLog(item);
                                                            setIsDetailModalOpen(true);
                                                        }}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-xs border border-slate-200/80 transition cursor-pointer"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>Detail</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* PAGINATION */}
                        <div className="border-t border-slate-100">
                            <Pagination 
                                data={logs} 
                                onPerPageChange={(newPerPage) => applyFilters({ per_page: newPerPage, page: 1 })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* DETAIL MODAL */}
            <ActivityDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedLog(null);
                }}
                log={selectedLog}
            />

            {/* FILTER DRAWER SLIDE-OVER */}
            <ActivityLogFilterDrawer
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                selectedModule={selectedModule}
                onModuleChange={(m) => setSelectedModule(m)}
                selectedUser={selectedUser}
                onUserChange={(u) => setSelectedUser(u)}
                dateFrom={dateFrom}
                onDateFromChange={(d) => setDateFrom(d)}
                dateTo={dateTo}
                onDateToChange={(d) => setDateTo(d)}
                actors={actors}
                activeFilterCount={activeFilterCount}
                onReset={handleResetFilters}
                onApply={() => {
                    applyFilters({
                        module: selectedModule,
                        user_id: selectedUser,
                        date_from: dateFrom,
                        date_to: dateTo,
                        page: 1,
                    });
                }}
            />
        </div>
    );
}
