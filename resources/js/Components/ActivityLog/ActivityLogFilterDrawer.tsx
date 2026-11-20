import React, { useEffect } from 'react';
import { 
    X, 
    SlidersHorizontal, 
    Layers, 
    User as UserIcon, 
    Calendar, 
    RotateCcw, 
    Check, 
    MapPin, 
    FileText, 
    ShieldCheck, 
    Cpu, 
    Target
} from 'lucide-react';
import Select2, { Select2Option } from '@/Components/Common/Select2';

export interface ActivityLogFilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    selectedModule: string;
    onModuleChange: (module: string) => void;
    selectedUser: string;
    onUserChange: (userId: string) => void;
    dateFrom: string;
    onDateFromChange: (val: string) => void;
    dateTo: string;
    onDateToChange: (val: string) => void;
    actors: {
        id: string;
        name: string;
        email: string;
        role_id: string;
    }[];
    activeFilterCount: number;
    onReset: () => void;
    onApply: () => void;
}

const MODULE_OPTIONS: { id: string; label: string; icon: any; color: string }[] = [
    { id: 'ALL', label: 'Semua Modul', icon: Layers, color: 'text-slate-600 bg-slate-100 border-slate-200' },
    { id: 'STATION', label: 'Stasiun', icon: MapPin, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { id: 'DOCUMENT', label: 'Dokumen', icon: FileText, color: 'text-purple-700 bg-purple-50 border-purple-200' },
    { id: 'INSPECTION', label: 'Inspeksi & QC', icon: ShieldCheck, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { id: 'TARGET', label: 'Target Provinsi', icon: Target, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { id: 'MASTER_DATA', label: 'Master Data', icon: Cpu, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
];

export default function ActivityLogFilterDrawer({
    isOpen,
    onClose,
    selectedModule,
    onModuleChange,
    selectedUser,
    onUserChange,
    dateFrom,
    onDateFromChange,
    dateTo,
    onDateToChange,
    actors,
    activeFilterCount,
    onReset,
    onApply,
}: ActivityLogFilterDrawerProps) {
    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const actorOptions: Select2Option<string>[] = [
        { value: 'ALL', label: 'Semua Pengguna' },
        ...actors.map(a => ({
            value: a.id,
            label: `${a.name} (${a.role_id})`,
        }))
    ];

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Slide-over Drawer Panel */}
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
                <div className="w-screen max-w-md pointer-events-auto bg-white border-l border-slate-200 shadow-2xl flex flex-col">
                    
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-slate-100 bg-[#FCFCFD] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                <SlidersHorizontal className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                                        Filter Log Aktivitas
                                    </h2>
                                    {activeFilterCount > 0 && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                                            {activeFilterCount} Aktif
                                        </span>
                                    )}
                                </div>
                                <p className="text-2xs text-slate-400 mt-0.5">
                                    Saring data audit trail berdasarkan kriteria spesifik
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 flex items-center justify-center transition cursor-pointer"
                            title="Tutup Filter"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Scrollable Form Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        
                        {/* 1. FILTER MODUL */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                                <Layers className="w-3.5 h-3.5 text-blue-600" />
                                <span>Modul Sistem</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {MODULE_OPTIONS.map((opt) => {
                                    const isSelected = selectedModule === opt.id;
                                    const IconComponent = opt.icon;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => onModuleChange(opt.id)}
                                            className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition font-semibold cursor-pointer ${
                                                isSelected 
                                                    ? 'border-blue-600 bg-blue-50/80 text-blue-800 shadow-2xs ring-1 ring-blue-500' 
                                                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                            }`}
                                        >
                                            <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                                            <span className="truncate">{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. FILTER PENGGUNA / AKTOR */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                                <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                                <span>Pengguna (Aktor)</span>
                            </div>

                            <div>
                                <label className="block text-2xs font-semibold text-slate-500 mb-1.5">
                                    Pilih Pengguna yang Melakukan Aksi
                                </label>
                                <Select2
                                    value={selectedUser}
                                    onChange={(val) => onUserChange(val as string)}
                                    options={actorOptions}
                                    placeholder="Cari nama pengguna..."
                                    searchPlaceholder="Ketik nama atau peran..."
                                    isSearchable={true}
                                    variant="default"
                                    size="sm"
                                />
                            </div>
                        </div>

                        {/* 3. FILTER RENTANG TANGGAL */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                <span>Rentang Tanggal</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <label className="block text-2xs font-semibold text-slate-500 mb-1">
                                        Tanggal Mulai
                                    </label>
                                    <input 
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => onDateFromChange(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-2xs font-semibold text-slate-500 mb-1">
                                        Tanggal Selesai
                                    </label>
                                    <input 
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => onDateToChange(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="p-5 border-t border-slate-100 bg-[#FCFCFD] flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={onReset}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 transition cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                onApply();
                                onClose();
                            }}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                            <Check className="w-4 h-4" />
                            <span>Terapkan Filter</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
