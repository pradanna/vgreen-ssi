import React, { useMemo } from 'react';
import { FacilityTypeId, StationStatusId, StatsSummary, Station } from '@/types/station';
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
    RotateCcw
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

    // Daftar stasiun untuk Select2
    stations?: Station[];
    onSelectStation?: (station: Station) => void;
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
    onResetFilters,
    stations = [],
    onSelectStation,
}: FilterBarProps) {
    const isFloating = variant === 'floating';

    const hasActiveFilters = 
        searchQuery !== '' || 
        selectedFacilityType !== 'ALL' || 
        selectedStatus !== 'ALL' || 
        selectedProvince !== 'ALL' || 
        selectedCity !== 'ALL' || 
        selectedOwnership !== 'ALL';

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

    const containerStyle = isFloating
        ? 'bg-white/95 backdrop-blur-md rounded-full border border-slate-200/80 shadow-[0_8px_30px_rgba(15,23,42,0.12)] p-1.5 flex flex-wrap items-center gap-2 transition-all duration-200'
        : 'bg-white border-b border-slate-100 px-6 py-3 flex flex-wrap items-center gap-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.02)]';

    return (
        <div className={containerStyle}>
            {/* 1. SELECT2 PENCARIAN / PILIH STASIUN */}
            <div className="w-48 sm:w-56">
                <Select2
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
            </div>

            {/* 2. SELECT2 FILTER PROVINSI */}
            {onProvinceChange && (
                <div className="w-36 sm:w-40">
                    <Select2
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
                </div>
            )}

            {/* 3. SELECT2 FILTER KOTA / KAB */}
            {onCityChange && (
                <div className="w-36 sm:w-40">
                    <Select2
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
                </div>
            )}

            {/* 4. SELECT2 KEPEMILIKAN LAHAN (SWASTA VS BUMN) */}
            {onOwnershipChange && (
                <div className="w-32 sm:w-36">
                    <Select2
                        value={selectedOwnership}
                        onChange={(val) => onOwnershipChange(val as OwnershipFilter)}
                        options={[
                            { value: 'ALL', label: 'Semua Lahan' },
                            { value: 'SWASTA', label: 'Swasta', icon: Briefcase },
                            { value: 'NEGERI_BUMN', label: 'BUMN/Negeri', icon: Landmark }
                        ]}
                        placeholder="Tipe Lahan..."
                        isSearchable={false}
                        variant="pill"
                        size="sm"
                        prefixIcon={Briefcase}
                    />
                </div>
            )}

            {/* 5. SELECT2 TIPE ARMADA */}
            <div className="w-32 sm:w-36">
                <Select2
                    value={selectedFacilityType}
                    onChange={(val) => onFacilityTypeChange(val as FacilityTypeId | 'ALL')}
                    options={[
                        { value: 'ALL', label: 'Semua Armada' },
                        { value: 'EVCS', label: 'Mobil (EVCS)', icon: Car },
                        { value: 'BSS', label: 'Motor (BSS)', icon: Motorbike },
                        { value: 'COMBINED', label: 'Dual Hub', icon: Zap }
                    ]}
                    placeholder="Armada..."
                    isSearchable={false}
                    variant="pill"
                    size="sm"
                    prefixIcon={Zap}
                />
            </div>

            {/* 6. SELECT2 STATUS KESIAPAN */}
            <div className="w-36 sm:w-40">
                <Select2
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
                    placeholder="Status..."
                    isSearchable={false}
                    variant="pill"
                    size="sm"
                    prefixIcon={CheckCircle2}
                />
            </div>

            {/* 7. QUICK BADGE INFO TITIK */}
            <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 text-xs font-bold shrink-0">
                {totalFiltered} Titik
            </span>

            {/* 8. TOMBOL RESET FILTER */}
            {hasActiveFilters && onResetFilters && (
                <button
                    type="button"
                    onClick={onResetFilters}
                    className="px-2.5 py-1.5 rounded-full border border-slate-200/80 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1 transition shrink-0"
                    title="Reset semua filter"
                >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px] font-bold">Reset</span>
                </button>
            )}
        </div>
    );
}
