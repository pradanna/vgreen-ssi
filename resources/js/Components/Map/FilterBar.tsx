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
    ChevronLeft
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
    selectedMachineId?: number | 'ALL';
    onMachineChange?: (machineId: number | 'ALL') => void;
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
    totalFiltered,
    isVGreen = false,
    variant = 'default',
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
    const machineSelectOptions = useMemo<Select2Option<number | 'ALL'>[]>(() => {
        const opts: Select2Option<number | 'ALL'>[] = [
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

    const containerStyle = isFloating
        ? 'bg-white/95 backdrop-blur-md rounded-2xl lg:rounded-full border border-slate-200/80 shadow-[0_8px_30px_rgba(15,23,42,0.12)] p-1.5 sm:p-2 flex flex-wrap items-center gap-2 sm:gap-2.5 transition-all duration-200 animate-in fade-in zoom-in-95'
        : 'bg-white border-b border-slate-100 px-6 py-3 flex flex-wrap items-center gap-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.02)]';

    // 1. TAMPILAN MENCIUT JADI TOMBOL FILTER (COLLAPSED FLOATING PILL BUTTON)
    if (isFloating && isCollapsible && isCollapsed) {
        return (
            <button
                type="button"
                onClick={() => toggleCollapse(false)}
                className="bg-white/95 backdrop-blur-md rounded-full border border-slate-200/80 shadow-[0_8px_30px_rgba(15,23,42,0.12)] hover:shadow-[0_12px_36px_rgba(15,23,42,0.18)] pl-2 pr-4 py-1.5 sm:py-2 flex items-center gap-2.5 text-xs font-bold text-slate-800 transition-all duration-300 hover:scale-[1.02] cursor-pointer group animate-in fade-in zoom-in-95"
                title="Buka panel filter"
            >
                <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-subtle">
                    <SlidersHorizontal className="w-3.5 h-3.5 transition-transform group-hover:rotate-180 duration-300" />
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">Filter</span>
                    {activeFilterCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold shadow-xs">
                            {activeFilterCount}
                        </span>
                    )}
                </div>

                <span className="w-px h-3.5 bg-slate-200" />

                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
                    {totalFiltered} Titik
                </span>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-y-0.5 transition-all" />
            </button>
        );
    }

    return (
        <div className={containerStyle}>
            {/* 0. TOMBOL CIUTKAN JADI TOMBOL FILTER */}
            {isFloating && isCollapsible && (
                <button
                    type="button"
                    onClick={() => toggleCollapse(true)}
                    className="h-8 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer group"
                    title="Ciutkan jadi tombol filter"
                >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 group-hover:rotate-180 transition-transform duration-300" />
                    <span className="text-[11px] font-bold">Ciutkan</span>
                </button>
            )}

            {/* 1. SELECT2 PENCARIAN / PILIH STASIUN */}
            <Select2
                className="w-48 sm:w-56 shrink-0"
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
                placeholder="Cari / Pilih Stasiun..."
                searchPlaceholder="Ketik kode, nama..."
                isSearchable={true}
                isClearable={Boolean(searchQuery)}
                onClear={() => onSearchChange('')}
                variant="pill"
                size="sm"
                prefixIcon={Search}
            />

            {/* 2. SELECT2 FILTER PROVINSI */}
            {onProvinceChange && (
                <Select2
                    className="shrink-0"
                    value={selectedProvince}
                    onChange={(val) => {
                        onProvinceChange(String(val));
                        if (onCityChange) onCityChange('ALL');
                    }}
                    options={[
                        { value: 'ALL', label: 'Semua Provinsi' },
                        ...availableProvinces.map((prov) => ({
                            value: prov,
                            label: prov,
                        }))
                    ]}
                    placeholder="Semua Provinsi"
                    searchPlaceholder="Cari provinsi..."
                    isSearchable={true}
                    variant="pill"
                    size="sm"
                    prefixIcon={MapPin}
                />
            )}

            {/* 3. SELECT2 FILTER KOTA / KAB */}
            {onCityChange && (
                <Select2
                    className="shrink-0"
                    value={selectedCity}
                    onChange={(val) => onCityChange(String(val))}
                    options={[
                        { value: 'ALL', label: 'Semua Kota/Kab' },
                        ...availableCities.map((city) => ({
                            value: city,
                            label: city,
                        }))
                    ]}
                    placeholder="Semua Kota/Kab"
                    searchPlaceholder="Cari kota..."
                    isSearchable={true}
                    variant="pill"
                    size="sm"
                    prefixIcon={Building2}
                />
            )}

            {/* 4. SELECT2 KEPEMILIKAN LAHAN (SWASTA VS BUMN) */}
            {onOwnershipChange && (
                <Select2
                    className="shrink-0"
                    value={selectedOwnership}
                    onChange={(val) => onOwnershipChange(val as OwnershipFilter)}
                    options={[
                        { value: 'ALL', label: 'Semua Lahan' },
                        { value: 'SWASTA', label: 'Swasta', icon: Briefcase },
                        { value: 'NEGERI_BUMN', label: 'BUMN/Negeri', icon: Landmark }
                    ]}
                    placeholder="Semua Lahan"
                    isSearchable={false}
                    variant="pill"
                    size="sm"
                    prefixIcon={Briefcase}
                />
            )}

            {/* 5. SELECT2 TIPE ARMADA */}
            <Select2
                className="shrink-0"
                value={selectedFacilityType}
                onChange={(val) => onFacilityTypeChange(val as FacilityTypeId | 'ALL')}
                options={[
                    { value: 'ALL', label: 'Semua Armada' },
                    { value: 'EVCS', label: 'Mobil (EVCS)', icon: Car },
                    { value: 'BSS', label: 'Motor (BSS)', icon: Motorbike },
                    { value: 'COMBINED', label: 'Dual Hub', icon: Zap }
                ]}
                placeholder="Semua Armada"
                isSearchable={false}
                variant="pill"
                size="sm"
                prefixIcon={Zap}
            />

            {/* 6. SELECT2 MODEL MESIN */}
            {onMachineChange && (
                <Select2
                    className="shrink-0"
                    value={selectedMachineId ?? 'ALL'}
                    onChange={(val) => onMachineChange(val as number | 'ALL')}
                    options={machineSelectOptions}
                    placeholder="Semua Mesin"
                    searchPlaceholder="Cari mesin..."
                    isSearchable={true}
                    variant="pill"
                    size="sm"
                    prefixIcon={Cpu}
                    align="right"
                />
            )}

            {/* 7. SELECT2 STATUS KESIAPAN */}
            <Select2
                className="shrink-0"
                value={selectedStatus}
                onChange={(val) => onStatusChange(val as StationStatusId | 'ALL')}
                options={[
                    { value: 'ALL', label: 'Semua Status' },
                    { value: 'OPERATIONAL', label: 'Operasional', badge: 'Live', badgeColor: 'bg-emerald-100 text-emerald-700' },
                    ...(!isVGreen ? [
                        { value: 'CONSTRUCTION', label: 'Pembangunan', badge: 'WIP', badgeColor: 'bg-orange-100 text-orange-700' },
                        { value: 'SURVEYED', label: 'Survei', badge: 'Survei', badgeColor: 'bg-amber-100 text-amber-700' },
                        { value: 'ON_HOLD', label: 'On Hold', badge: 'Hold', badgeColor: 'bg-rose-100 text-rose-700' },
                    ] : [])
                ]}
                placeholder="Semua Status"
                isSearchable={false}
                variant="pill"
                size="sm"
                prefixIcon={CheckCircle2}
                align="right"
            />

            {/* 8. QUICK BADGE INFO TITIK */}
            <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 text-xs font-bold shrink-0">
                {totalFiltered} Titik
            </span>

            {/* 9. TOMBOL RESET FILTER */}
            {hasActiveFilters && onResetFilters && (
                <button
                    type="button"
                    onClick={onResetFilters}
                    className="px-2.5 py-1.5 rounded-full border border-slate-200/80 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1 transition shrink-0 cursor-pointer"
                    title="Reset semua filter"
                >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px] font-bold">Reset</span>
                </button>
            )}

            {/* 10. TOMBOL CIUTKAN KANAN */}
            {isFloating && isCollapsible && (
                <button
                    type="button"
                    onClick={() => toggleCollapse(true)}
                    className="p-1.5 rounded-full border border-slate-200/80 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition shrink-0 cursor-pointer"
                    title="Ciutkan jadi tombol filter"
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}
