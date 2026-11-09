import React from 'react';
import { FacilityTypeId, StationStatusId, StatsSummary } from '@/types/station';
import { Search, Car, BatteryCharging, Zap, Filter, CheckCircle2, AlertCircle, Clock, Construction } from 'lucide-react';

interface FilterBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedFacilityType: FacilityTypeId | 'ALL';
    onFacilityTypeChange: (type: FacilityTypeId | 'ALL') => void;
    selectedStatus: StationStatusId | 'ALL';
    onStatusChange: (status: StationStatusId | 'ALL') => void;
    stats: StatsSummary;
    totalFiltered: number;
    isVGreen?: boolean;
}

export default function FilterBar({
    searchQuery,
    onSearchChange,
    selectedFacilityType,
    onFacilityTypeChange,
    selectedStatus,
    onStatusChange,
    stats,
    totalFiltered,
    isVGreen = false,
}: FilterBarProps) {
    return (
        <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4 space-y-3 z-30 shadow-lg">
            {/* Top row: Search and summary metrics */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search input */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Cari stasiun, kode titik (VG-...), kota atau jalan..."
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Quick KPI stats chips */}
                <div className="flex items-center gap-2 overflow-x-auto text-[11px] font-medium text-slate-300 pb-1 md:pb-0">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 shrink-0">
                        Total: <strong className="text-white">{stats.total}</strong> Titik
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{stats.operational} Operasional</span>
                    </span>
                    {!isVGreen && (
                        <>
                            <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-300 border border-orange-500/20 shrink-0 flex items-center gap-1">
                                <Construction className="w-3 h-3 text-orange-400" />
                                <span>{stats.construction} Konstruksi</span>
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 shrink-0 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-yellow-400" />
                                <span>{stats.surveyed} Survei</span>
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Bottom row: Facility type buttons and Status buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-800/60">
                {/* Facility Type Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                    <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Tipe:</span>
                    <button
                        onClick={() => onFacilityTypeChange('ALL')}
                        className={`px-3 py-1.5 rounded-lg font-medium transition ${
                            selectedFacilityType === 'ALL'
                                ? 'bg-slate-100 text-slate-900 shadow'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                        Semua Tipe
                    </button>
                    <button
                        onClick={() => onFacilityTypeChange('EVCS')}
                        className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition ${
                            selectedFacilityType === 'EVCS'
                                ? 'bg-blue-600 text-white shadow'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                        <Car className="w-3.5 h-3.5" />
                        <span>EVCS (Mobil)</span>
                    </button>
                    <button
                        onClick={() => onFacilityTypeChange('BSS')}
                        className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition ${
                            selectedFacilityType === 'BSS'
                                ? 'bg-emerald-600 text-white shadow'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                        <BatteryCharging className="w-3.5 h-3.5" />
                        <span>BSS (Motor)</span>
                    </button>
                    <button
                        onClick={() => onFacilityTypeChange('COMBINED')}
                        className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition ${
                            selectedFacilityType === 'COMBINED'
                                ? 'bg-purple-600 text-white shadow'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Kombinasi (Dual)</span>
                    </button>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                    <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Status:</span>
                    <button
                        onClick={() => onStatusChange('ALL')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                            selectedStatus === 'ALL'
                                ? 'bg-slate-700 text-white'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Semua
                    </button>
                    <button
                        onClick={() => onStatusChange('OPERATIONAL')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition ${
                            selectedStatus === 'OPERATIONAL'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'text-slate-400 hover:text-emerald-400'
                        }`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>Operasional</span>
                    </button>
                    {!isVGreen && (
                        <>
                            <button
                                onClick={() => onStatusChange('CONSTRUCTION')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition ${
                                    selectedStatus === 'CONSTRUCTION'
                                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                                        : 'text-slate-400 hover:text-orange-400'
                                }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                                <span>Pembangunan</span>
                            </button>
                            <button
                                onClick={() => onStatusChange('SURVEYED')}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition ${
                                    selectedStatus === 'SURVEYED'
                                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                                        : 'text-slate-400 hover:text-yellow-400'
                                }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                                <span>Survei</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
