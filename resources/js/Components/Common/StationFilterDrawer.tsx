import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, 
    SlidersHorizontal, 
    MapPin, 
    Building2, 
    Car, 
    Motorbike, 
    RotateCcw,
    Check,
    Compass,
    Building
} from 'lucide-react';
import Select2 from './Select2';
import { FacilityTypeId, StationStatusId } from '@/types/station';

export interface StationFilterValues {
    province: string;
    city: string;
    stationId: string;
    status: StationStatusId | 'ALL';
    facilityType: FacilityTypeId | 'ALL';
    landlordType?: 'ALL' | 'SWASTA' | 'PEMERINTAH';
}

export interface StationFilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    currentFilters?: StationFilterValues;
    onApply?: ((filters: StationFilterValues) => void) | (() => void);
    availableProvinces?: string[];
    availableStations?: {
        id: string;
        code: string;
        name: string;
        province?: string;
        city?: string;
        status_id?: string;
        facility_type_id?: string;
        landlord_type?: string | null;
    }[];
    availableCities?: string[];
    isInternal?: boolean;

    selectedProvince?: string;
    onProvinceChange?: (p: string) => void;
    selectedCity?: string;
    onCityChange?: (c: string) => void;
    selectedStationId?: string;
    onStationIdChange?: (sid: string) => void;
    selectedStatus?: StationStatusId | 'ALL';
    onStatusChange?: (status: StationStatusId | 'ALL') => void;
    selectedFacilityType?: FacilityTypeId | 'ALL';
    onFacilityTypeChange?: (type: FacilityTypeId | 'ALL') => void;
    selectedLandlordType?: 'ALL' | 'SWASTA' | 'PEMERINTAH';
    onLandlordTypeChange?: (landlord: 'ALL' | 'SWASTA' | 'PEMERINTAH') => void;
    onReset?: () => void;
    totalFilteredCount?: number;
    activeFilterCount?: number;
}

export default function StationFilterDrawer({
    isOpen,
    onClose,
    currentFilters,
    onApply,
    availableProvinces = [],
    availableStations = [],
    availableCities = [],
    isInternal = false,
    selectedProvince,
    onProvinceChange,
    selectedCity,
    onCityChange,
    selectedStationId,
    onStationIdChange,
    selectedStatus,
    onStatusChange,
    selectedFacilityType,
    onFacilityTypeChange,
    selectedLandlordType,
    onLandlordTypeChange,
    onReset,
    totalFilteredCount,
    activeFilterCount,
}: StationFilterDrawerProps) {
    const initProv = selectedProvince !== undefined ? selectedProvince : (currentFilters?.province || 'ALL');
    const initCity = selectedCity !== undefined ? selectedCity : (currentFilters?.city || 'ALL');
    const initStation = selectedStationId !== undefined ? selectedStationId : (currentFilters?.stationId || 'ALL');
    const initStatus = selectedStatus !== undefined ? selectedStatus : (currentFilters?.status || 'ALL');
    const initFacility = selectedFacilityType !== undefined ? selectedFacilityType : (currentFilters?.facilityType || 'ALL');
    const initLandlord = selectedLandlordType !== undefined ? selectedLandlordType : (currentFilters?.landlordType || 'ALL');

    // Local Draft States (Only committed when user clicks "Terapkan")
    const [draftProvince, setDraftProvince] = useState<string>(initProv);
    const [draftCity, setDraftCity] = useState<string>(initCity);
    const [draftStationId, setDraftStationId] = useState<string>(initStation);
    const [draftStatus, setDraftStatus] = useState<StationStatusId | 'ALL'>(initStatus);
    const [draftFacilityType, setDraftFacilityType] = useState<FacilityTypeId | 'ALL'>(initFacility);
    const [draftLandlordType, setDraftLandlordType] = useState<'ALL' | 'SWASTA' | 'PEMERINTAH'>(initLandlord);

    // Sync draft states when drawer is opened
    useEffect(() => {
        if (isOpen) {
            setDraftProvince(selectedProvince !== undefined ? selectedProvince : (currentFilters?.province || 'ALL'));
            setDraftCity(selectedCity !== undefined ? selectedCity : (currentFilters?.city || 'ALL'));
            setDraftStationId(selectedStationId !== undefined ? selectedStationId : (currentFilters?.stationId || 'ALL'));
            setDraftStatus(selectedStatus !== undefined ? selectedStatus : (currentFilters?.status || 'ALL'));
            setDraftFacilityType(selectedFacilityType !== undefined ? selectedFacilityType : (currentFilters?.facilityType || 'ALL'));
            setDraftLandlordType(selectedLandlordType !== undefined ? selectedLandlordType : (currentFilters?.landlordType || 'ALL'));
        }
    }, [isOpen, currentFilters, selectedProvince, selectedCity, selectedStationId, selectedStatus, selectedFacilityType, selectedLandlordType]);

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

    // Compute cities cascading from draft province
    const draftAvailableCities = useMemo(() => {
        const cities = new Set<string>();
        availableStations.forEach((s) => {
            if (draftProvince === 'ALL' || s.province?.trim() === draftProvince.trim()) {
                if (s.city && s.city.trim() !== '') {
                    cities.add(s.city.trim());
                }
            }
        });
        return Array.from(cities).sort();
    }, [availableStations, draftProvince]);

    // Cascading available stations for specific station selector
    const draftAvailableStations = useMemo(() => {
        return availableStations.filter((s) => {
            if (draftProvince !== 'ALL' && s.province?.trim() !== draftProvince.trim()) return false;
            if (draftCity !== 'ALL' && s.city?.trim() !== draftCity.trim()) return false;
            return true;
        });
    }, [availableStations, draftProvince, draftCity]);

    // Preview filtered count in draft mode
    const draftFilteredCount = useMemo(() => {
        return availableStations.filter((s) => {
            if (draftProvince !== 'ALL' && s.province?.trim() !== draftProvince.trim()) return false;
            if (draftCity !== 'ALL' && s.city?.trim() !== draftCity.trim()) return false;
            if (draftStationId !== 'ALL' && s.id !== draftStationId) return false;
            if (draftStatus !== 'ALL' && s.status_id !== draftStatus) return false;
            if (draftFacilityType !== 'ALL' && s.facility_type_id !== draftFacilityType) return false;
            if (isInternal && draftLandlordType !== 'ALL' && (s.landlord_type || 'SWASTA') !== draftLandlordType) return false;
            return true;
        }).length;
    }, [availableStations, draftProvince, draftCity, draftStationId, draftStatus, draftFacilityType, draftLandlordType, isInternal]);

    // Count of active filters in draft
    const draftActiveCount = useMemo(() => {
        let count = 0;
        if (draftProvince !== 'ALL') count++;
        if (draftCity !== 'ALL') count++;
        if (draftStationId !== 'ALL') count++;
        if (draftStatus !== 'ALL') count++;
        if (draftFacilityType !== 'ALL') count++;
        if (isInternal && draftLandlordType !== 'ALL') count++;
        return count;
    }, [draftProvince, draftCity, draftStationId, draftStatus, draftFacilityType, draftLandlordType, isInternal]);

    // Reset draft filters
    const handleResetDraft = () => {
        setDraftProvince('ALL');
        setDraftCity('ALL');
        setDraftStationId('ALL');
        setDraftStatus('ALL');
        setDraftFacilityType('ALL');
        setDraftLandlordType('ALL');
    };

    // Apply draft filters and close drawer
    const handleApply = () => {
        if (onProvinceChange) onProvinceChange(draftProvince);
        if (onCityChange) onCityChange(draftCity);
        if (onStationIdChange) onStationIdChange(draftStationId);
        if (onStatusChange) onStatusChange(draftStatus);
        if (onFacilityTypeChange) onFacilityTypeChange(draftFacilityType);
        if (onLandlordTypeChange) onLandlordTypeChange(draftLandlordType);

        if (onApply) {
            (onApply as any)({
                province: draftProvince,
                city: draftCity,
                stationId: draftStationId,
                status: draftStatus,
                facilityType: draftFacilityType,
                landlordType: draftLandlordType,
            });
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop with soft blur */}
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
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <SlidersHorizontal className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                                        Filter Stasiun
                                    </h2>
                                    {draftActiveCount > 0 && (
                                        <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-blue-100 text-blue-700">
                                            {draftActiveCount} Dipilih
                                        </span>
                                    )}
                                </div>
                                <p className="text-2xs text-slate-400 mt-0.5">
                                    Pilih kriteria lalu klik Terapkan
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 flex items-center justify-center transition cursor-pointer"
                            title="Tutup Filter"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Scrollable Form Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        
                        {/* 1. WILAYAH & LOKASI */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                                <span>Wilayah & Lokasi</span>
                            </div>

                            {/* Provinsi */}
                            <div>
                                <label className="block text-2xs font-semibold text-slate-500 mb-1.5">
                                    Provinsi
                                </label>
                                <Select2
                                    value={draftProvince}
                                    onChange={(val) => {
                                        setDraftProvince(val as string);
                                        setDraftCity('ALL'); // Reset city on province switch
                                    }}
                                    options={[
                                        { value: 'ALL', label: 'Semua Provinsi' },
                                        ...availableProvinces.map(p => ({ value: p, label: p }))
                                    ]}
                                    placeholder="Pilih Provinsi..."
                                    searchPlaceholder="Cari provinsi..."
                                    isSearchable={true}
                                    variant="default"
                                    size="sm"
                                    prefixIcon={MapPin}
                                />
                            </div>

                            {/* Kota / Kabupaten */}
                            <div>
                                <label className="block text-2xs font-semibold text-slate-500 mb-1.5">
                                    Kota / Kabupaten
                                </label>
                                <Select2
                                    value={draftCity}
                                    onChange={(val) => setDraftCity(val as string)}
                                    options={[
                                        { value: 'ALL', label: draftProvince !== 'ALL' ? `Semua Kota di ${draftProvince}` : 'Semua Kota / Kabupaten' },
                                        ...draftAvailableCities.map(c => ({ value: c, label: c }))
                                    ]}
                                    placeholder="Pilih Kota / Kabupaten..."
                                    searchPlaceholder="Cari kota..."
                                    isSearchable={true}
                                    variant="default"
                                    size="sm"
                                    prefixIcon={Building2}
                                />
                            </div>
                        </div>

                        {/* 2. SPESIFIK NAMA TITIK */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                                <Compass className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Nama Titik Stasiun</span>
                            </div>

                            <div>
                                <label className="block text-2xs font-semibold text-slate-500 mb-1.5">
                                    Pilih Stasiun Spesifik
                                </label>
                                <Select2
                                    value={draftStationId}
                                    onChange={(val) => setDraftStationId(val as string)}
                                    options={[
                                        { value: 'ALL', label: draftProvince !== 'ALL' ? `Semua Titik di ${draftProvince}` : 'Semua Titik Stasiun' },
                                        ...draftAvailableStations.map(s => ({
                                            value: s.id,
                                            label: s.name,
                                            subtext: `${s.code}${s.city ? ` • ${s.city}` : ''}`,
                                        }))
                                    ]}
                                    placeholder="Ketik nama atau kode stasiun..."
                                    searchPlaceholder="Cari nama atau kode..."
                                    isSearchable={true}
                                    variant="default"
                                    size="sm"
                                    prefixIcon={Compass}
                                />
                            </div>
                        </div>

                        {/* 3. STATUS OPERASIONAL */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span>Status Operasional</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'ALL', label: 'Semua Status' },
                                    { id: 'OPERATIONAL', label: 'Operasional', badge: 'Live' },
                                    { id: 'CONSTRUCTION', label: 'In Progress', badge: 'WIP' },
                                    { id: 'SURVEYED', label: 'Survei', badge: 'Survei' },
                                    { id: 'ON_HOLD', label: 'On Hold', badge: 'Hold' },
                                ].map((item) => {
                                    const isSelected = draftStatus === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setDraftStatus(item.id as StationStatusId | 'ALL')}
                                            className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                                                isSelected 
                                                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs' 
                                                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{item.label}</span>
                                            </div>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 4. JENIS LAYANAN / ARMADA */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                                <Car className="w-3.5 h-3.5 text-purple-600" />
                                <span>Jenis Layanan / Armada</span>
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: 'ALL', label: 'Semua Jenis Layanan', icon: null },
                                    { id: 'EVCS', label: 'EVCS (Mobil Listrik)', icon: Car },
                                    { id: 'BSS', label: 'BSS (Motor Listrik / Swap)', icon: Motorbike },
                                    { id: 'COMBINED', label: 'Kombinasi (EVCS + BSS)', icon: null },
                                ].map((item) => {
                                    const isSelected = draftFacilityType === item.id;
                                    const IconComponent = item.icon;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setDraftFacilityType(item.id as FacilityTypeId | 'ALL')}
                                            className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                                                isSelected 
                                                    ? 'border-purple-600 bg-purple-50/70 text-purple-900 shadow-xs' 
                                                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                {IconComponent && <IconComponent className="w-4 h-4 text-slate-500" />}
                                                <span>{item.label}</span>
                                            </div>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 5. TIPE LAHAN (Internal PT SSI Only) */}
                        {isInternal && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                                    <Building className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Kepemilikan Lahan</span>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'ALL', label: 'Semua' },
                                        { id: 'SWASTA', label: 'Swasta' },
                                        { id: 'PEMERINTAH', label: 'Pemda' },
                                    ].map((item) => {
                                        const isSelected = draftLandlordType === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => setDraftLandlordType(item.id as 'ALL' | 'SWASTA' | 'PEMERINTAH')}
                                                className={`p-2 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                                                    isSelected 
                                                        ? 'border-amber-600 bg-amber-50/70 text-amber-900 shadow-xs' 
                                                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                                }`}
                                            >
                                                {item.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-5 border-t border-slate-100 bg-[#FCFCFD] flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={handleResetDraft}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 transition cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleApply}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                            <Check className="w-4 h-4" />
                            <span>
                                Terapkan ({draftFilteredCount} Titik)
                            </span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
