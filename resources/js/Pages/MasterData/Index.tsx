import React, { useState, useMemo, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { 
    Cpu, 
    Layers, 
    Plus, 
    Search, 
    Zap, 
    CheckCircle2, 
    AlertCircle, 
    Trash2, 
    Edit3, 
    Filter,
    Plug,
    ChevronRight,
    Sparkles,
    ShieldCheck,
    Tag,
    Info,
    MoreVertical,
    Eye,
    Lock,
    X,
    MapPin
} from 'lucide-react';
import Modal from '@/Components/Modal';
import SidebarNav from '@/Components/Navigation/SidebarNav';
import SidebarTrigger from '@/Components/Navigation/SidebarTrigger';
import UserDropdown from '@/Components/Navigation/UserDropdown';
import CategoryModal from '@/Components/MasterData/CategoryModal';
import MachineModal from '@/Components/MasterData/MachineModal';
import MachineDetailModal from '@/Components/MasterData/MachineDetailModal';
import DeleteConfirmModal from '@/Components/MasterData/DeleteConfirmModal';
import Pagination from '@/Components/Common/Pagination';
import ActionDropdown from '@/Components/Common/ActionDropdown';
import { PaginatedData, PaginationLink } from '@/types/pagination';
import { MachineCategory, MasterMachine } from '@/types/station';
import { PageProps } from '@/types';

interface MasterDataIndexProps extends PageProps {
    categories: MachineCategory[];
    machines: MasterMachine[];
    stats: {
        total_machines: number;
        total_categories: number;
        evcs_machines: number;
        bss_machines: number;
        active_machines: number;
    };
    activeNav?: 'dashboard' | 'stations' | 'gis' | 'inspections' | 'settings' | 'master-data';
    availableRoles?: any[];
}

export default function MasterDataIndex({
    auth,
    categories = [],
    machines = [],
    stats,
    activeNav = 'master-data',
    availableRoles = [],
}: MasterDataIndexProps) {
    const user = auth.user;
    const { errors, flash } = usePage().props as any;

    // Tab state: 'machines' | 'categories'
    const [activeTab, setActiveTab] = useState<'machines' | 'categories'>('machines');

    // Filter states for Machines
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

    // Modals state
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedCategoryToEdit, setSelectedCategoryToEdit] = useState<MachineCategory | null>(null);

    const [showMachineModal, setShowMachineModal] = useState(false);
    const [selectedMachineToEdit, setSelectedMachineToEdit] = useState<MasterMachine | null>(null);

    // Detail modal state
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedMachineForDetail, setSelectedMachineForDetail] = useState<MasterMachine | null>(null);

    // Action dropdown states
    const [openMachineDropdownId, setOpenMachineDropdownId] = useState<string | null>(null);
    const [openCategoryDropdownId, setOpenCategoryDropdownId] = useState<string | null>(null);

    // Restricted warning modal state
    const [restrictedModalState, setRestrictedModalState] = useState<{
        show: boolean;
        title: string;
        message: string;
        itemName: string;
        usageCount: number;
    }>({
        show: false,
        title: 'Item Tidak Bisa Dihapus',
        message: 'Item tidak bisa dihapus karena sudah ada titik yang memakai item ini.',
        itemName: '',
        usageCount: 0,
    });

    // Close action dropdowns on outside click
    useEffect(() => {
        const handleOutsideClick = () => {
            setOpenMachineDropdownId(null);
            setOpenCategoryDropdownId(null);
        };
        window.addEventListener('click', handleOutsideClick);
        return () => window.removeEventListener('click', handleOutsideClick);
    }, []);

    // Delete modal state
    const [deleteModalState, setDeleteModalState] = useState<{
        show: boolean;
        type: 'category' | 'machine';
        item: MachineCategory | MasterMachine | null;
        isDeleting: boolean;
    }>({
        show: false,
        type: 'machine',
        item: null,
        isDeleting: false,
    });

    // Pagination states
    const [machinePage, setMachinePage] = useState(1);
    const [machinePerPage, setMachinePerPage] = useState(10);

    const [categoryPage, setCategoryPage] = useState(1);
    const [categoryPerPage, setCategoryPerPage] = useState(10);

    // Reset pagination when search query or filter changes
    useEffect(() => {
        setMachinePage(1);
    }, [searchQuery, selectedCategoryFilter]);

    useEffect(() => {
        setCategoryPage(1);
    }, [searchQuery]);

    // Filtered machines
    const filteredMachines = useMemo(() => {
        return machines.filter((m) => {
            const matchesSearch =
                m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (m.brand && m.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (m.socket_types && m.socket_types.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCategory =
                selectedCategoryFilter === 'ALL' ||
                m.category?.code === selectedCategoryFilter;

            return matchesSearch && matchesCategory;
        });
    }, [machines, searchQuery, selectedCategoryFilter]);

    // Paginated Machines
    const paginatedMachines = useMemo<PaginatedData<MasterMachine>>(() => {
        const total = filteredMachines.length;
        const lastPage = Math.max(1, Math.ceil(total / machinePerPage));
        const currentPage = Math.min(Math.max(1, machinePage), lastPage);
        const from = total > 0 ? (currentPage - 1) * machinePerPage + 1 : null;
        const to = total > 0 ? Math.min(currentPage * machinePerPage, total) : null;
        const sliceData = total > 0 ? filteredMachines.slice((currentPage - 1) * machinePerPage, currentPage * machinePerPage) : [];

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
            per_page: machinePerPage,
            total,
            links,
            prev_page_url: currentPage > 1 ? `#page=${currentPage - 1}` : null,
            next_page_url: currentPage < lastPage ? `#page=${currentPage + 1}` : null,
        };
    }, [filteredMachines, machinePage, machinePerPage]);

    // Filtered categories
    const filteredCategories = useMemo(() => {
        return categories.filter((c) => {
            return (
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        });
    }, [categories, searchQuery]);

    // Paginated Categories
    const paginatedCategories = useMemo<PaginatedData<MachineCategory>>(() => {
        const total = filteredCategories.length;
        const lastPage = Math.max(1, Math.ceil(total / categoryPerPage));
        const currentPage = Math.min(Math.max(1, categoryPage), lastPage);
        const from = total > 0 ? (currentPage - 1) * categoryPerPage + 1 : null;
        const to = total > 0 ? Math.min(currentPage * categoryPerPage, total) : null;
        const sliceData = total > 0 ? filteredCategories.slice((currentPage - 1) * categoryPerPage, currentPage * categoryPerPage) : [];

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
            per_page: categoryPerPage,
            total,
            links,
            prev_page_url: currentPage > 1 ? `#page=${currentPage - 1}` : null,
            next_page_url: currentPage < lastPage ? `#page=${currentPage + 1}` : null,
        };
    }, [filteredCategories, categoryPage, categoryPerPage]);

    // Handle open category modal
    const handleOpenCreateCategory = () => {
        setSelectedCategoryToEdit(null);
        setShowCategoryModal(true);
    };

    const handleOpenEditCategory = (cat: MachineCategory) => {
        setSelectedCategoryToEdit(cat);
        setShowCategoryModal(true);
    };

    // Handle open machine modal
    const handleOpenCreateMachine = () => {
        setSelectedMachineToEdit(null);
        setShowMachineModal(true);
    };

    const handleOpenEditMachine = (mach: MasterMachine) => {
        setSelectedMachineToEdit(mach);
        setShowMachineModal(true);
    };

    const handleOpenDetailMachine = (mach: MasterMachine) => {
        setSelectedMachineForDetail(mach);
        setShowDetailModal(true);
    };

    const handleRestrictedDeleteClick = (mach: MasterMachine) => {
        setRestrictedModalState({
            show: true,
            title: 'Item Tidak Bisa Dihapus',
            message: 'Item tidak bisa dihapus karena sudah ada titik yang memakai item ini.',
            itemName: `${mach.name} (${mach.code})`,
            usageCount: mach.station_machines_count ?? 0,
        });
    };

    const handleRestrictedCatDeleteClick = (cat: MachineCategory) => {
        setRestrictedModalState({
            show: true,
            title: 'Kategori Tidak Bisa Dihapus',
            message: 'Kategori ini tidak bisa dihapus karena masih menaungi model mesin.',
            itemName: `${cat.name} (${cat.code})`,
            usageCount: cat.machines_count ?? 0,
        });
    };

    // Delete confirmation
    const promptDeleteCategory = (cat: MachineCategory) => {
        setDeleteModalState({
            show: true,
            type: 'category',
            item: cat,
            isDeleting: false,
        });
    };

    const promptDeleteMachine = (mach: MasterMachine) => {
        setDeleteModalState({
            show: true,
            type: 'machine',
            item: mach,
            isDeleting: false,
        });
    };

    const handleConfirmDelete = () => {
        if (!deleteModalState.item) return;

        setDeleteModalState((prev) => ({ ...prev, isDeleting: true }));

        if (deleteModalState.type === 'category') {
            router.delete(
                route('master-data.categories.destroy', { category: deleteModalState.item.id }),
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setDeleteModalState({ show: false, type: 'category', item: null, isDeleting: false });
                    },
                    onError: () => {
                        setDeleteModalState((prev) => ({ ...prev, isDeleting: false }));
                    },
                }
            );
        } else {
            router.delete(
                route('master-data.machines.destroy', { machine: deleteModalState.item.id }),
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setDeleteModalState({ show: false, type: 'machine', item: null, isDeleting: false });
                    },
                    onError: () => {
                        setDeleteModalState((prev) => ({ ...prev, isDeleting: false }));
                    },
                }
            );
        }
    };

    return (
        <div className="flex h-screen w-screen bg-canvas text-slate-800 font-sans overflow-hidden antialiased">
            <Head title="Master Data Mesin & Kategori - V-Green SSI" />

            {/* Unified Sinao Sidebar Navigation */}
            <SidebarNav 
                user={user} 
                activeNav="master-data" 
            />

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* TOP HEADER */}
                <header className="h-20 px-8 flex items-center justify-between shrink-0 bg-transparent z-10">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger />
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                Master Data & Katalog Perangkat
                            </h1>
                            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                                Admin PT SSI
                            </span>
                        </div>
                    </div>

                    {/* Right Header: Role Dropdown */}
                    <div className="flex items-center gap-4">
                        <UserDropdown
                            user={user}
                            roleName={user.role?.name || availableRoles.find((r) => r.id === user.role_id)?.name}
                        />
                    </div>
                </header>

                {/* SCROLLABLE BODY */}
                <div className="flex-1 overflow-y-auto px-8 pb-24 space-y-7">
                    {/* Flash messages or errors */}
                    {flash?.success && (
                        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 text-xs font-semibold shadow-2xs animate-in fade-in duration-200">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>{flash.success}</span>
                        </div>
                    )}
                    {errors?.error && (
                        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 flex items-center gap-3 text-rose-800 text-xs font-semibold shadow-2xs animate-in fade-in duration-200">
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            <span>{errors.error}</span>
                        </div>
                    )}

                    {/* TOP METRICS SUMMARY CARDS (Sinao Ergonomic Standard) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {/* 1. Total Model Mesin */}
                        <div className="bg-white rounded-3xl p-6 border border-[#EDF1F7] shadow-card flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Katalog Mesin
                                </span>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                    {stats.total_machines}
                                </h3>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Cpu className="w-6 h-6" />
                            </div>
                        </div>

                        {/* 2. Total Kategori */}
                        <div className="bg-white rounded-3xl p-6 border border-[#EDF1F7] shadow-card flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Klasifikasi Tipe
                                </span>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                    {stats.total_categories}
                                </h3>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                <Layers className="w-6 h-6" />
                            </div>
                        </div>

                        {/* 3. EVCS Models */}
                        <div className="bg-white rounded-3xl p-6 border border-[#EDF1F7] shadow-card flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Model EVCS (Mobil)
                                </span>
                                <h3 className="text-2xl font-black text-blue-600 tracking-tight">
                                    {stats.evcs_machines}
                                </h3>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Zap className="w-6 h-6 fill-current" />
                            </div>
                        </div>

                        {/* 4. BSS Models */}
                        <div className="bg-white rounded-3xl p-6 border border-[#EDF1F7] shadow-card flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Model BSS (Motor)
                                </span>
                                <h3 className="text-2xl font-black text-emerald-600 tracking-tight">
                                    {stats.bss_machines}
                                </h3>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <Layers className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>

                    {/* MAIN MANAGEMENT CARD WITH TABS */}
                    <div className="bg-white rounded-3xl border border-[#EDF1F7] shadow-card overflow-hidden">
                        {/* Tabs Bar & Action Controls */}
                        <div className="p-6 border-b border-[#EDF1F7] flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Tabs Switcher */}
                            <div className="flex items-center bg-canvas-subtle p-1.5 rounded-2xl w-fit">
                                <button
                                    onClick={() => setActiveTab('machines')}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                                        activeTab === 'machines'
                                            ? 'bg-white text-slate-900 shadow-2xs'
                                            : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    <Cpu className={`w-4 h-4 ${activeTab === 'machines' ? 'text-blue-600' : 'text-slate-400'}`} />
                                    <span>Katalog Model Mesin ({machines.length})</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('categories')}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                                        activeTab === 'categories'
                                            ? 'bg-white text-slate-900 shadow-2xs'
                                            : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    <Layers className={`w-4 h-4 ${activeTab === 'categories' ? 'text-blue-600' : 'text-slate-400'}`} />
                                    <span>Master Kategori ({categories.length})</span>
                                </button>
                            </div>

                            {/* Action Button & Search */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                {/* Search Bar */}
                                <div className="relative min-w-[220px] sm:min-w-[280px]">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={activeTab === 'machines' ? 'Cari model, brand, kode SKU...' : 'Cari kategori...'}
                                        className="w-full bg-[#F8FAFC] border border-[#E8ECF2] rounded-2xl pl-10 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    />
                                </div>

                                {activeTab === 'machines' ? (
                                    <button
                                        onClick={handleOpenCreateMachine}
                                        className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs shadow-blue-500/20 shrink-0"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Tambah Model Mesin</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleOpenCreateCategory}
                                        className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs shadow-blue-500/20 shrink-0"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Tambah Kategori</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* TAB 1: KATALOG MODEL MESIN */}
                        {activeTab === 'machines' && (
                            <div>
                                {/* Sub-filters bar */}
                                <div className="px-6 py-3.5 bg-[#FAFBFD] border-b border-[#EDF1F7] flex flex-wrap items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                                            <Filter className="w-3.5 h-3.5" />
                                            <span>Filter:</span>
                                        </span>

                                        {/* Kategori Filter Pills */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setSelectedCategoryFilter('ALL')}
                                                className={`px-3 py-1 rounded-xl font-bold transition ${
                                                    selectedCategoryFilter === 'ALL'
                                                        ? 'bg-slate-900 text-white'
                                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                }`}
                                            >
                                                Semua ({machines.length})
                                            </button>
                                            <button
                                                onClick={() => setSelectedCategoryFilter('EVCS')}
                                                className={`px-3 py-1 rounded-xl font-bold transition ${
                                                    selectedCategoryFilter === 'EVCS'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
                                                }`}
                                            >
                                                EVCS Mobil ({stats.evcs_machines})
                                            </button>
                                            <button
                                                onClick={() => setSelectedCategoryFilter('BSS')}
                                                className={`px-3 py-1 rounded-xl font-bold transition ${
                                                    selectedCategoryFilter === 'BSS'
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                                                }`}
                                            >
                                                BSS Motor ({stats.bss_machines})
                                            </button>
                                        </div>
                                    </div>

                                    <span className="text-slate-400 font-medium">
                                        Menampilkan <span className="font-bold text-slate-700">{filteredMachines.length}</span> model
                                    </span>
                                </div>

                                {/* Table of Machines */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-slate-700">
                                        <thead className="bg-[#FAFBFD] text-slate-400 font-bold uppercase tracking-wider border-b border-[#EDF1F7]">
                                            <tr>
                                                <th className="px-6 py-4">Model & SKU</th>
                                                <th className="px-6 py-4">Kategori</th>
                                                <th className="px-6 py-4">Daya & Port</th>
                                                <th className="px-6 py-4">Dimensi & Berat</th>
                                                <th className="px-6 py-4">Terpasang</th>
                                                <th className="px-6 py-4 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium">
                                            {paginatedMachines.data.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                                        <Cpu className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                        <p className="text-sm font-semibold">Tidak ada model mesin yang cocok</p>
                                                        <p className="text-xs mt-1">Silakan sesuaikan filter pencarian atau tambahkan model mesin baru.</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedMachines.data.map((m) => (
                                                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                                                        {/* Model Name & SKU */}
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/80 shrink-0">
                                                                    {m.code}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenDetailMachine(m)}
                                                                    className="font-bold text-slate-900 hover:text-blue-600 text-sm truncate max-w-[220px] text-left transition cursor-pointer"
                                                                    title={`Klik untuk melihat detail spesifikasi ${m.name}`}
                                                                >
                                                                    {m.name}
                                                                </button>
                                                            </div>
                                                        </td>

                                                        {/* Kategori */}
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {m.category?.code === 'BSS' ? (
                                                                <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 inline-flex items-center gap-1">
                                                                    <Layers className="w-3 h-3 text-emerald-600" />
                                                                    <span>BSS Motor</span>
                                                                </span>
                                                            ) : (
                                                                <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 inline-flex items-center gap-1">
                                                                    <Zap className="w-3 h-3 fill-current text-blue-600" />
                                                                    <span>EVCS Mobil</span>
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Daya & Port */}
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                                                                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                                                                <span>{m.power_capacity_kw} kW</span>
                                                                <span className="text-[11px] font-semibold text-slate-500">
                                                                    ({m.slot_or_gun_count} {m.category?.code === 'BSS' ? 'Slot' : 'Gun'})
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Fisik (Dimensi & Berat) */}
                                                        <td className="px-6 py-4">
                                                            <div className="text-[11px] font-semibold text-slate-800 truncate max-w-[180px]" title={m.dimensions}>
                                                                {m.dimensions || '-'}
                                                            </div>
                                                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                                                                {m.weight || '-'}
                                                            </div>
                                                        </td>

                                                        {/* Usage in Stations */}
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {(m.station_machines_count ?? 0) > 0 ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => router.visit(route('gis.index', { machine_id: m.id }))}
                                                                    className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100/90 text-indigo-700 font-bold border border-indigo-200/80 hover:border-indigo-300 inline-flex items-center gap-1.5 transition-all shadow-subtle hover:shadow cursor-pointer group"
                                                                    title={`Lihat ${m.station_machines_count} titik di Peta GIS`}
                                                                >
                                                                    <CheckCircle2 className="w-3 h-3 text-indigo-600 group-hover:scale-110 transition-transform" />
                                                                    <span>{m.station_machines_count} Titik</span>
                                                                    <ChevronRight className="w-3 h-3 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                                                                </button>
                                                            ) : (
                                                                <span className="text-[11px] text-slate-400 font-medium">
                                                                    0 Titik
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Aksi (3-Dot Action Menu with Portal) */}
                                                        <td className="px-6 py-4 text-right">
                                                            <ActionDropdown
                                                                isOpen={openMachineDropdownId === m.id}
                                                                onToggle={(open) => setOpenMachineDropdownId(open ? m.id : null)}
                                                                trigger={
                                                                    <button
                                                                        type="button"
                                                                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                                                                        title="Menu Aksi"
                                                                    >
                                                                        <MoreVertical className="w-4 h-4" />
                                                                    </button>
                                                                }
                                                            >
                                                                {/* 0. Lihat di Peta GIS */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => router.visit(route('gis.index', { machine_id: m.id }))}
                                                                    disabled={(m.station_machines_count ?? 0) === 0}
                                                                    className={`w-full px-3.5 py-2 text-xs font-semibold flex items-center gap-2 transition ${
                                                                        (m.station_machines_count ?? 0) > 0
                                                                            ? 'text-blue-700 hover:bg-blue-50/80 cursor-pointer'
                                                                            : 'text-slate-400 opacity-60 cursor-not-allowed'
                                                                    }`}
                                                                    title={(m.station_machines_count ?? 0) === 0 ? 'Belum ada stasiun yang menggunakan mesin ini (0 Titik)' : `Lihat ${m.station_machines_count} titik di Peta GIS`}
                                                                >
                                                                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                                                                    <span>Lihat di Peta GIS {(m.station_machines_count ?? 0) === 0 ? '(0 Titik)' : ''}</span>
                                                                </button>

                                                                <div className="my-1 border-t border-slate-100" />

                                                                {/* 1. Detail */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenDetailMachine(m)}
                                                                    className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                                                                    <span>Detail Spesifikasi</span>
                                                                </button>

                                                                {/* 2. Edit */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenEditMachine(m)}
                                                                    className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                                                    <span>Ubah Data</span>
                                                                </button>

                                                                <div className="my-1 border-t border-slate-100" />

                                                                {/* 3. Hapus */}
                                                                {(m.station_machines_count ?? 0) > 0 ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRestrictedDeleteClick(m)}
                                                                        className="w-full px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-between transition group"
                                                                        title="Item tidak bisa dihapus karena sudah ada titik yang memakai item ini"
                                                                    >
                                                                        <span className="flex items-center gap-2">
                                                                            <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500" />
                                                                            <span>Hapus</span>
                                                                        </span>
                                                                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm border border-amber-200/60">
                                                                            Terkunci
                                                                        </span>
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => promptDeleteMachine(m)}
                                                                        className="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                                                        <span>Hapus Model</span>
                                                                    </button>
                                                                )}
                                                            </ActionDropdown>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination for Machines */}
                                <Pagination
                                    data={paginatedMachines}
                                    onPageChange={(page) => setMachinePage(page)}
                                    onPerPageChange={(newPerPage) => {
                                        setMachinePerPage(newPerPage);
                                        setMachinePage(1);
                                    }}
                                />
                            </div>
                        )}

                        {/* TAB 2: MASTER KATEGORI */}
                        {activeTab === 'categories' && (
                            <div>
                                {/* Info Box */}
                                <div className="px-6 py-3.5 bg-blue-50/60 border-b border-blue-100 flex items-center gap-3 text-xs text-blue-900">
                                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span>
                                        Kategori mesin dikelompokkan secara baku menjadi <strong>EVCS (Charging Mobil)</strong> dan <strong>BSS (Battery Swapping Motor)</strong> untuk menjaga konsistensi filter peta GIS dan data stasiun.
                                    </span>
                                </div>

                                {/* Table of Categories */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-slate-700">
                                        <thead className="bg-[#FAFBFD] text-slate-400 font-bold uppercase tracking-wider border-b border-[#EDF1F7]">
                                            <tr>
                                                <th className="px-6 py-4">Kode Baku</th>
                                                <th className="px-6 py-4">Nama Lengkap Kategori</th>
                                                <th className="px-6 py-4">Deskripsi / Ruang Lingkup</th>
                                                <th className="px-6 py-4">Model Terdaftar</th>
                                                <th className="px-6 py-4 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium">
                                            {paginatedCategories.data.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                                        <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                        <p className="text-sm font-semibold">Tidak ada kategori yang cocok</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedCategories.data.map((c) => (
                                                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                                                        {/* Code */}
                                                        <td className="px-6 py-4">
                                                            <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                                                                {c.code}
                                                            </span>
                                                        </td>

                                                        {/* Name */}
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-slate-900 text-sm">
                                                                {c.name}
                                                            </div>
                                                        </td>

                                                        {/* Description */}
                                                        <td className="px-6 py-4 text-slate-600 max-w-md">
                                                            {c.description || '-'}
                                                        </td>

                                                        {/* Machines Count */}
                                                        <td className="px-6 py-4">
                                                            <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-200/60 inline-flex items-center gap-1.5">
                                                                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                                                                <span>{c.machines_count ?? 0} Model Mesin</span>
                                                            </span>
                                                        </td>

                                                        {/* Actions (3-Dot Action Menu with Portal) */}
                                                        <td className="px-6 py-4 text-right">
                                                            <ActionDropdown
                                                                isOpen={openCategoryDropdownId === c.id}
                                                                onToggle={(open) => setOpenCategoryDropdownId(open ? c.id : null)}
                                                                className="w-44"
                                                                trigger={
                                                                    <button
                                                                        type="button"
                                                                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                                                                        title="Menu Aksi"
                                                                    >
                                                                        <MoreVertical className="w-4 h-4" />
                                                                    </button>
                                                                }
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenEditCategory(c)}
                                                                    className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                                                    <span>Ubah Kategori</span>
                                                                </button>

                                                                <div className="my-1 border-t border-slate-100" />

                                                                {(c.machines_count ?? 0) > 0 ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRestrictedCatDeleteClick(c)}
                                                                        className="w-full px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-between transition group"
                                                                        title="Kategori tidak dapat dihapus karena masih menaungi model mesin"
                                                                    >
                                                                        <span className="flex items-center gap-2">
                                                                            <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500" />
                                                                            <span>Hapus</span>
                                                                        </span>
                                                                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm border border-amber-200/60">
                                                                            Terkunci
                                                                        </span>
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => promptDeleteCategory(c)}
                                                                        className="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                                                        <span>Hapus Kategori</span>
                                                                    </button>
                                                                )}
                                                            </ActionDropdown>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination for Categories */}
                                <Pagination
                                    data={paginatedCategories}
                                    onPageChange={(page) => setCategoryPage(page)}
                                    onPerPageChange={(newPerPage) => {
                                        setCategoryPerPage(newPerPage);
                                        setCategoryPage(1);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {/* 1. Category Modal */}
            <CategoryModal
                show={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                categoryToEdit={selectedCategoryToEdit}
            />

            {/* 2. Machine Modal */}
            <MachineModal
                show={showMachineModal}
                onClose={() => setShowMachineModal(false)}
                machineToEdit={selectedMachineToEdit}
                categories={categories}
            />

            {/* 3. Machine Detail Modal */}
            <MachineDetailModal
                show={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                machine={selectedMachineForDetail}
                onEdit={(m) => handleOpenEditMachine(m)}
            />

            {/* 4. Delete Confirmation Modal */}
            <DeleteConfirmModal
                show={deleteModalState.show}
                onClose={() => setDeleteModalState({ show: false, type: 'machine', item: null, isDeleting: false })}
                onConfirm={handleConfirmDelete}
                title={deleteModalState.type === 'category' ? 'Hapus Kategori Mesin' : 'Hapus Model Mesin'}
                itemName={deleteModalState.item ? deleteModalState.item.name : ''}
                warningMessage={
                    deleteModalState.type === 'category' && (deleteModalState.item as MachineCategory)?.machines_count
                        ? `Perhatian: Kategori ini masih memiliki ${(deleteModalState.item as MachineCategory).machines_count} model mesin terdaftar.`
                        : deleteModalState.type === 'machine' && (deleteModalState.item as MasterMachine)?.station_machines_count
                        ? `Perhatian: Model mesin ini telah terpasang pada ${(deleteModalState.item as MasterMachine).station_machines_count} titik stasiun operasional.`
                        : undefined
                }
                isDeleting={deleteModalState.isDeleting}
            />

            {/* 5. Restricted Warning Modal */}
            <Modal 
                show={restrictedModalState.show} 
                onClose={() => setRestrictedModalState(prev => ({ ...prev, show: false }))} 
                maxWidth="md"
            >
                <div className="bg-white rounded-3xl p-6 relative">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">{restrictedModalState.title}</h3>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setRestrictedModalState(prev => ({ ...prev, show: false }))}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-xs font-semibold text-amber-900 leading-relaxed flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold">{restrictedModalState.message}</p>
                                <p className="text-[11px] text-amber-800 font-normal mt-1">
                                    <span className="font-bold">{restrictedModalState.itemName}</span> saat ini tercatat terhubung pada{' '}
                                    <span className="font-bold underline">{restrictedModalState.usageCount} data aktif</span>.
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed">
                            Item ini tidak dapat dihapus demi menjaga integritas data operasional dan relasi stasiun di lapangan. Anda harus melepas atau memutasikan data stasiun terkait terlebih dahulu jika ingin menghapus item ini dari katalog master.
                        </p>
                    </div>

                    <div className="flex items-center justify-end">
                        <button
                            type="button"
                            onClick={() => setRestrictedModalState(prev => ({ ...prev, show: false }))}
                            className="px-5 py-2 rounded-2xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs"
                        >
                            Mengerti
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
