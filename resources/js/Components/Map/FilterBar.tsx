import React, { useState, useMemo } from 'react';
import { FacilityTypeId, StationStatusId, StatsSummary, Station, MasterMachine } from '@/types/station';
import Select2, { Select2Option } from '@/Components/Common/Select2';
import { 
    Search, 
    Car, 
    Motorbike, 
    Zap, 
    CheckCircle2, 
    MapPin, 
    Building2, 
    Landmark, 
    Briefcase, 
    RotateCcw, 
    Cpu, 
    SlidersHorizontal, 
    ChevronDown, 
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

export type OwnershipFilter = 'ALL' | 'SWASTA' | 'NEGERI_BUMN';

export interface FilterBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedFacilityType: FacilityTypeId | 'ALL';
    onFacilityTypeChange: (type: FacilityTypeId | 'ALL') => void;
    selectedStatus: StationStatusId | 'ALL';
    onStatusChange: (status: StationStatusId | 'ALL') => void;
    stats?: StatsSummary;
    totalFiltered: number;
    isVGreen?: boolean;
    variant?: 'default' | 'floating';
    
    // Spasial & Kepemilikan Lahan
    selectedProvince?: string;
    onProvinceChange?: (province: string) => void;
    availableProvinces?: string[];
    selectedCity?: string;
    onCityChange?: (city: string) => void;
    availableCities?: string[];
    selectedOwnership?: OwnershipFilter;
    onOwnershipChange?: (ownership: OwnershipFilter) => void;
    onResetFilters?: () => void;

    // Filter Model Mesin (EVCS / BSS Hardware)
    selectedMachineId?: string | 'ALL';
    onMachineChange?: (machineId: string | 'ALL') => void;
    masterMachines?: MasterMachine[];

    // Daftar stasiun untuk Select2
    stations?: Station[];
    onSelectStation?: (station: Station) => void;

    // Collapsible (Menciut jadi tombol filter)
    isCollapsible?: boolean;
    defaultCollapsed?: boolean;
    onToggleCollapse?: (collapsed: boolean) => void;
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
    variant = 'floating',
    selectedProvince = 'ALL',
    onProvinceChange,
    availableProvinces = [],
    selectedCity = 'ALL',
    onCityChange,
    availableCities = [],
    selectedOwnership = 'ALL',
    onOwnershipChange,
    selectedMachineId = 'ALL',
    onMachineChange,
    masterMachines = [],
    onResetFilters,
    stations = [],
    onSelectStation,
    isCollapsible = true,
    defaultCollapsed = false,
    onToggleCollapse,
}: FilterBarProps) {
    const isFloating = variant === 'floating';
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    const toggleCollapse = (nextVal: boolean) => {
        setIsCollapsed(nextVal);
        if (onToggleCollapse) onToggleCollapse(nextVal);
    };

    const hasActiveFilters = 
        searchQuery !== '' || 
        selectedFacilityType !== 'ALL' || 
        selectedStatus !== 'ALL' || 
        selectedProvince !== 'ALL' || 
        selectedCity !== 'ALL' || 
        selectedOwnership !== 'ALL' || 
        (selectedMachineId !== undefined && selectedMachineId !== 'ALL');

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (searchQuery.trim() !== '') count++;
        if (selectedProvince !== 'ALL') count++;
        if (selectedCity !== 'ALL') count++;
        if (selectedOwnership !== 'ALL') count++;
        if (selectedFacilityType !== 'ALL') count++;
        if (selectedMachineId !== undefined && selectedMachineId !== 'ALL') count++;
        if (selectedStatus !== 'ALL') count++;
        return count;
    }, [searchQuery, selectedProvince, selectedCity, selectedOwnership, selectedFacilityType, selectedMachineId, selectedStatus]);

    // Opsi Select2 Stasiun
    const stationSelectOptions = useMemo<Select2Option<string>[]>(() => {
        const opts: Select2Option<string>[] = [
            { value: 'ALL', label: 'Semua Stasiun' }
        ];

        if (stations && stations.length > 0) {
            stations.forEach((s) => {
                opts.push({
                    value: s.code || String(s.id),
                    label: `${s.code} - ${s.name}`,
                    subtext: `${s.city}, ${s.province}`,
                });
            });
        }

        return opts;
    }, [stations]);

    // Opsi Select2 Model Mesin
    const machineSelectOptions = useMemo<Select2Option<string | 'ALL'>[]>(() => {
        const opts: Select2Option<string | 'ALL'>[] = [
            { value: 'ALL', label: 'Semua Mesin' }
        ];

        if (masterMachines && masterMachines.length > 0) {
            masterMachines.forEach((m) => {
                opts.push({
                    value: m.id,
                    label: m.name,
                    subtext: `${m.code} • ${m.power_capacity_kw} kW (${m.slot_or_gun_count} ${m.category?.code === 'BSS' ? 'Slot' : 'Gun'})`,
                    badge: m.category?.code === 'BSS' ? 'BSS' : 'EVCS',
                    badgeColor: m.category?.code === 'BSS' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700',
                    icon: Cpu,
                });
            });
        }

        return opts;
    }, [masterMachines]);

    // 1. TAMPILAN MENCIUT JADI TOMBOL FILTER (COLLAPSED FLOATING CARD BUTTON)
    if (isFloating && isCollapsible && isCollapsed) {
        return (
            <button
                type="button"
                onClick={() => toggleCollapse(false)}
                className="bg-white/85 backdrop-blur-md rounded-xl border border-slate-200/70 shadow-[0_8px_30px_rgba(15,23,42,0.12)] hover:bg-white px-3.5 py-2.5 flex items-center gap-2.5 text-xs font-bold text-slate-800 transition-all duration-200 hover:scale-[1.02] cursor-pointer group animate-in fade-in zoom-in-95"
                title="Buka panel filter"
            >
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-1.5">
                    <span>Filter Stasiun</span>
                    {activeFilterCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-md bg-blue-600 text-white text-[10px] font-extrabold">
                            {activeFilterCount}
                        </span>
                    )}
                </div>

                <span className="w-px h-3.5 bg-slate-200" />

                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                    {totalFiltered} Titik
                </span>

                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-all" />
            </button>
        );
    }

    // 2. TAMPILAN PANEL VERTIKAL MEMANJANG KE BAWAH (SEMI-TRANSPARENT GLASS PANEL)
    return (
        <div className="w-72 sm:w-80 bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200/70 shadow-[0_12px_40px_rgba(15,23,42,0.12)] flex flex-col transition-all duration-200 animate-in fade-in zoom-in-95 overflow-hidden">
            {/* Header Panel */}
            <div className="px-4 py-3 border-b border-slate-200/60 flex items-center justify-between bg-white/40">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-900 tracking-tight">Filter Stasiun</h3>
                        <span className="text-[10px] text-slate-500 font-medium">{totalFiltered} Titik Aktif</span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    {hasActiveFilters && onResetFilters && (
                        <button
                            type="button"
                            onClick={onResetFilters}
                            className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Reset semua filter"
                        >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset</span>
                        </button>
                    )}
                    {isCollapsible && (
                        <button
                            type="button"
                            onClick={() => toggleCollapse(true)}
                            className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
                            title="Ciutkan panel filter"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Form Fields Stack (Memanjang ke Bawah) */}
            <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-14rem)] scrollbar-thin">
                {/* 1. CARI / PILIH STASIUN */}
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Cari / Pilih Stasiun
                    </label>
                    <Select2
                        className="w-full"
                        variant="default"
                        value={searchQuery || 'ALL'}
                        onChange={(val) => {
                            if (val === 'ALL') {
                                onSearchChange('');
                            } else {
                                onSearchChange(String(val));
                                if (onSelectStation && stations.length > 0) {
                                    const found = stations.find(
                                        (s) => s.code === val || String(s.id) === String(val) || s.name === val
                                    );
                                    if (found) onSelectStation(found);
                                }
                            }
                        }}
                        options={stationSelectOptions}
                        placeholder="Semua Stasiun..."
                        searchPlaceholder="Ketik kode, nama stasiun..."
                        isSearchable={true}
                        isClearable={Boolean(searchQuery)}
                        onClear={() => onSearchChange('')}
                        size="sm"
                        prefixIcon={Search}
                    />
                </div>

                {/* 2. WILAYAH (PROVINSI & KOTA/KAB) */}
                {(onProvinceChange || onCityChange) && (
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Wilayah
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {onProvinceChange && (
                                <Select2
                                    className="w-full"
                                    variant="default"
                                    value={selectedProvince}
                                    onChange={(val) => {
                                        onProvinceChange(String(val));
                                        if (onCityChange) onCityChange('ALL');
                                    }}
                                    options={[
                                        { value: 'ALL', label: 'Semua Prov' },
                                        ...availableProvinces.map((prov) => ({
                                            value: prov,
                                            label: prov,
                                        }))
                                    ]}
                                    placeholder="Semua Prov"
                                    searchPlaceholder="Cari prov..."
                                    isSearchable={true}
                                    size="sm"
                                    prefixIcon={MapPin}
                                />
                            )}
                            {onCityChange && (
                                <Select2
                                    className="w-full"
                                    variant="default"
                                    value={selectedCity}
                                    onChange={(val) => onCityChange(String(val))}
                                    options={[
                                        { value: 'ALL', label: 'Semua Kota' },
                                        ...availableCities.map((city) => ({
                                            value: city,
                                            label: city,
                                        }))
                                    ]}
                                    placeholder="Semua Kota"
                                    searchPlaceholder="Cari kota..."
                                    isSearchable={true}
                                    size="sm"
                                    prefixIcon={Building2}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* 3. STATUS STASIUN */}
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Status Stasiun
                    </label>
                    <Select2
                        className="w-full"
                        variant="default"
                        value={selectedStatus}
                        onChange={(val) => onStatusChange(val as StationStatusId | 'ALL')}
                        options={[
                            { value: 'ALL', label: 'Semua Status' },
                            { value: 'OPERATIONAL', label: 'Operasional', badge: 'Live', badgeColor: 'bg-emerald-100 text-emerald-700' },
                            { value: 'CONSTRUCTION', label: 'Pembangunan', badge: 'In Progress', badgeColor: 'bg-orange-100 text-orange-700' },
                            { value: 'SURVEYED', label: 'Survei', badge: 'Survei', badgeColor: 'bg-amber-100 text-amber-700' },
                            { value: 'ON_HOLD', label: 'On Hold', badge: 'Hold', badgeColor: 'bg-rose-100 text-rose-700' },
                        ]}
                        placeholder="Semua Status"
                        isSearchable={false}
                        size="sm"
                        prefixIcon={CheckCircle2}
                    />
                </div>

                {/* 4. TIPE ARMADA */}
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Tipe Armada (Layanan)
                    </label>
                    <Select2
                        className="w-full"
                        variant="default"
                        value={selectedFacilityType}
                        onChange={(val) => onFacilityTypeChange(val as FacilityTypeId | 'ALL')}
                        options={[
                            { value: 'ALL', label: 'Semua Armada' },
                            { value: 'EVCS', label: 'Mobil (EVCS)', icon: Car },
                            { value: 'BSS', label: 'Motor (BSS)', icon: Motorbike },
                            { value: 'COMBINED', label: 'Dual Hub (Kombinasi)', icon: Zap },
                        ]}
                        placeholder="Semua Armada"
                        isSearchable={false}
                        size="sm"
                        prefixIcon={Zap}
                    />
                </div>

                {/* 5. MODEL MESIN */}
                {onMachineChange && (
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Model Mesin
                        </label>
                        <Select2
                            className="w-full"
                            variant="default"
                            value={selectedMachineId ?? 'ALL'}
                            onChange={(val) => onMachineChange(val as string | 'ALL')}
                            options={machineSelectOptions}
                            placeholder="Semua Mesin"
                            searchPlaceholder="Cari mesin..."
                            isSearchable={true}
                            size="sm"
                            prefixIcon={Cpu}
                        />
                    </div>
                )}

                {/* 6. KEPEMILIKAN LAHAN */}
                {onOwnershipChange && (
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Kepemilikan Lahan
                        </label>
                        <Select2
                            className="w-full"
                            variant="default"
                            value={selectedOwnership}
                            onChange={(val) => onOwnershipChange(val as OwnershipFilter)}
                            options={[
                                { value: 'ALL', label: 'Semua Lahan' },
                                { value: 'SWASTA', label: 'Swasta', icon: Briefcase },
                                { value: 'NEGERI_BUMN', label: 'BUMN / Pemda', icon: Landmark },
                            ]}
                            placeholder="Semua Lahan"
                            isSearchable={false}
                            size="sm"
                            prefixIcon={Briefcase}
                        />
                    </div>
                )}
            </div>

            {/* Footer Ringkasan */}
            <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-200/60 flex items-center justify-between text-2xs font-semibold text-slate-600">
                <span>Hasil Filter:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-200/60 shadow-2xs">
                    {totalFiltered} Titik Stasiun
                </span>
            </div>
        </div>
    );
}
