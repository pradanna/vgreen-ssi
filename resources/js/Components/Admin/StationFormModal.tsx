import React, { useState, useEffect, useMemo } from 'react';
import { Station, FacilityType, StationStatus, StationMachine, LandlordType, MasterMachine } from '@/types/station';
import { useForm } from '@inertiajs/react';
import MapPickerModal from '@/Components/Map/MapPickerModal';
import { getAllProvinces, getCitiesByProvince } from '@/utils/indonesiaRegions';
import { 
    X, 
    MapPin, 
    Zap, 
    Navigation, 
    Save, 
    Building, 
    AlertCircle, 
    Plus, 
    Trash2, 
    Cpu, 
    FileText, 
    Phone, 
    Calendar,
    Car,
    BatteryCharging,
    Check,
    ChevronRight,
    ChevronLeft,
    RotateCcw
} from 'lucide-react';

interface StationFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    stationToEdit?: Station | null;
    facilityTypes: FacilityType[];
    stationStatuses: StationStatus[];
    masterMachines?: MasterMachine[];
}

const DRAFT_STORAGE_KEY = 'vgreen_station_form_draft_v1';

export default function StationFormModal({
    isOpen,
    onClose,
    stationToEdit = null,
    facilityTypes = [],
    stationStatuses = [],
    masterMachines = [],
}: StationFormModalProps) {
    if (!isOpen) return null;

    const isEditing = Boolean(stationToEdit);
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
    const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
    const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

    // Initial default machines
    const defaultMachines: StationMachine[] = [
        {
            name: 'Unit Mesin 01 (Utama)',
            brand: 'Autel',
            model_series: 'MaxiCharger DC 120kW',
            serial_number: '',
            facility_type_id: 'EVCS',
            power_capacity_kw: 60,
            socket_types: '2x CCS2 Fast Gun',
            slot_or_gun_count: 2,
            status: 'OPERATIONAL',
        }
    ];

    // Build initial form state (from stationToEdit or localStorage draft or defaults)
    const initialValues = useMemo(() => {
        if (stationToEdit) {
            return {
                code: stationToEdit.code || '',
                name: stationToEdit.name || '',
                facility_type_id: stationToEdit.facility_type_id || 'EVCS',
                status_id: stationToEdit.status_id || 'SURVEYED',
                latitude: stationToEdit.latitude || -6.2088,
                longitude: stationToEdit.longitude || 106.8456,
                address: stationToEdit.address || '',
                city: stationToEdit.city || '',
                province: stationToEdit.province || '',
                postal_code: stationToEdit.postal_code || '',
                operational_hours: stationToEdit.operational_hours || '24 Jam',
                amenities: stationToEdit.amenities?.join(', ') || '',
                vendor_name: stationToEdit.vendor_name || '',
                pln_meter_id: stationToEdit.pln_meter_id || '',
                internal_notes: stationToEdit.internal_notes || '',

                // Landlord Profile
                landlord_type: (stationToEdit.landlord_type || 'SWASTA') as LandlordType,
                landlord_name: stationToEdit.landlord_name || '',
                landlord_phone: stationToEdit.landlord_phone || '',

                // Dual Contracts
                contract_vgreen_start_date: stationToEdit.contract_vgreen_start_date || '',
                contract_vgreen_end_date: stationToEdit.contract_vgreen_end_date || '',
                contract_vgreen_doc_number: stationToEdit.contract_vgreen_doc_number || '',
                contract_landlord_start_date: stationToEdit.contract_landlord_start_date || '',
                contract_landlord_end_date: stationToEdit.contract_landlord_end_date || stationToEdit.lease_end_date || '',
                contract_landlord_doc_number: stationToEdit.contract_landlord_doc_number || '',

                // Multi Machines
                machines: stationToEdit.machines && stationToEdit.machines.length > 0 
                    ? stationToEdit.machines 
                    : defaultMachines,
            };
        }

        // Try load draft for new station
        try {
            const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (rawDraft) {
                const parsed = JSON.parse(rawDraft);
                if (parsed && typeof parsed === 'object') {
                    return {
                        code: parsed.code || '',
                        name: parsed.name || '',
                        facility_type_id: parsed.facility_type_id || 'EVCS',
                        status_id: parsed.status_id || 'SURVEYED',
                        latitude: parsed.latitude || -6.2088,
                        longitude: parsed.longitude || 106.8456,
                        address: parsed.address || '',
                        city: parsed.city || '',
                        province: parsed.province || '',
                        postal_code: parsed.postal_code || '',
                        operational_hours: parsed.operational_hours || '24 Jam',
                        amenities: parsed.amenities || '',
                        vendor_name: parsed.vendor_name || '',
                        pln_meter_id: parsed.pln_meter_id || '',
                        internal_notes: parsed.internal_notes || '',

                        landlord_type: (parsed.landlord_type || 'SWASTA') as LandlordType,
                        landlord_name: parsed.landlord_name || '',
                        landlord_phone: parsed.landlord_phone || '',

                        contract_vgreen_start_date: parsed.contract_vgreen_start_date || '',
                        contract_vgreen_end_date: parsed.contract_vgreen_end_date || '',
                        contract_vgreen_doc_number: parsed.contract_vgreen_doc_number || '',
                        contract_landlord_start_date: parsed.contract_landlord_start_date || '',
                        contract_landlord_end_date: parsed.contract_landlord_end_date || '',
                        contract_landlord_doc_number: parsed.contract_landlord_doc_number || '',

                        machines: Array.isArray(parsed.machines) && parsed.machines.length > 0 
                            ? parsed.machines 
                            : defaultMachines,
                    };
                }
            }
        } catch (e) {
            console.error('Error restoring station form draft:', e);
        }

        return {
            code: '',
            name: '',
            facility_type_id: 'EVCS' as const,
            status_id: 'SURVEYED' as const,
            latitude: -6.2088,
            longitude: 106.8456,
            address: '',
            city: '',
            province: '',
            postal_code: '',
            operational_hours: '24 Jam',
            amenities: '',
            vendor_name: '',
            pln_meter_id: '',
            internal_notes: '',

            landlord_type: 'SWASTA' as LandlordType,
            landlord_name: '',
            landlord_phone: '',

            contract_vgreen_start_date: '',
            contract_vgreen_end_date: '',
            contract_vgreen_doc_number: '',
            contract_landlord_start_date: '',
            contract_landlord_end_date: '',
            contract_landlord_doc_number: '',

            machines: defaultMachines,
        };
    }, [stationToEdit]);

    const { data, setData, post, put, processing, errors, reset } = useForm(initialValues);

    // Track if draft was present
    useEffect(() => {
        if (!isEditing) {
            const hasDraft = Boolean(localStorage.getItem(DRAFT_STORAGE_KEY));
            setHasRestoredDraft(hasDraft);
        }
    }, [isEditing]);

    // Auto-save form draft to localStorage whenever fields change (new station only)
    useEffect(() => {
        if (!isEditing && isOpen) {
            try {
                localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
                const now = new Date();
                setLastSavedAt(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            } catch (e) {
                console.error('Failed to auto-save station draft:', e);
            }
        }
    }, [data, isEditing, isOpen]);

    // Clear local draft handler
    const handleClearDraft = () => {
        if (confirm('Kosongkan semua isian formulir dan hapus draf tersimpan dari browser?')) {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
            setHasRestoredDraft(false);
            reset();
            setData({
                code: '',
                name: '',
                facility_type_id: 'EVCS',
                status_id: 'SURVEYED',
                latitude: -6.2088,
                longitude: 106.8456,
                address: '',
                city: '',
                province: '',
                postal_code: '',
                operational_hours: '24 Jam',
                amenities: '',
                vendor_name: '',
                pln_meter_id: '',
                internal_notes: '',
                landlord_type: 'SWASTA',
                landlord_name: '',
                landlord_phone: '',
                contract_vgreen_start_date: '',
                contract_vgreen_end_date: '',
                contract_vgreen_doc_number: '',
                contract_landlord_start_date: '',
                contract_landlord_end_date: '',
                contract_landlord_doc_number: '',
                machines: defaultMachines,
            });
            setCurrentStep(1);
        }
    };

    // Calculate aggregated power and slots from machines
    const totalKw = (data.machines || []).reduce((sum: number, m: StationMachine) => sum + (Number(m.power_capacity_kw) || 0), 0);
    const totalSlots = (data.machines || []).reduce((sum: number, m: StationMachine) => sum + (Number(m.slot_or_gun_count) || 0), 0);

    // Otomatis hitung tipe fasilitas utama berdasarkan mesin yang dipasang (EVCS, BSS, atau COMBINED)
    const computedFacilityType = useMemo<'EVCS' | 'BSS' | 'COMBINED'>(() => {
        const machines = data.machines || [];
        if (machines.length === 0) return 'EVCS';
        const hasEvcs = machines.some((m: StationMachine) => m.facility_type_id === 'EVCS');
        const hasBss = machines.some((m: StationMachine) => m.facility_type_id === 'BSS');
        if (hasEvcs && hasBss) return 'COMBINED';
        if (hasBss) return 'BSS';
        return 'EVCS';
    }, [data.machines]);

    // Sinkronisasi otomatis ke form data
    useEffect(() => {
        if (data.facility_type_id !== computedFacilityType) {
            setData('facility_type_id', computedFacilityType);
        }
    }, [computedFacilityType, data.facility_type_id]);

    const addMachine = () => {
        const nextIdx = (data.machines?.length || 0) + 1;
        const newMachine: StationMachine = {
            name: `Unit Mesin 0${nextIdx}`,
            brand: 'Autel',
            model_series: 'MaxiCharger DC 60kW',
            serial_number: '',
            facility_type_id: 'EVCS',
            power_capacity_kw: 60,
            socket_types: '2x CCS2 Fast Gun',
            slot_or_gun_count: 2,
            status: 'OPERATIONAL',
        };
        setData('machines', [...(data.machines || []), newMachine]);
    };

    const removeMachine = (index: number) => {
        if ((data.machines || []).length <= 1) return;
        const updated = [...(data.machines || [])];
        updated.splice(index, 1);
        setData('machines', updated);
    };

    const updateMachine = (index: number, field: keyof StationMachine, value: any) => {
        const updated = [...(data.machines || [])];
        updated[index] = { ...updated[index], [field]: value };
        setData('machines', updated);
    };

    const handleSelectMasterMachine = (index: number, masterMachineId: number | string) => {
        if (!masterMachineId) return;
        const selected = masterMachines.find((m) => m.id === Number(masterMachineId));
        if (!selected) return;

        const updated = [...(data.machines || [])];
        updated[index] = {
            ...updated[index],
            machine_id: selected.id,
            name: `${selected.name} 0${index + 1}`,
            brand: selected.brand,
            model_series: selected.model_series || '',
            facility_type_id: (selected.category?.code === 'BSS' ? 'BSS' : 'EVCS') as any,
            power_capacity_kw: selected.power_capacity_kw,
            socket_types: selected.socket_types || '',
            slot_or_gun_count: selected.slot_or_gun_count,
        };
        setData('machines', updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing && stationToEdit) {
            put(route('admin.stations.update', { station: stationToEdit.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        } else {
            post(route('admin.stations.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    localStorage.removeItem(DRAFT_STORAGE_KEY);
                    onClose();
                    reset();
                    setCurrentStep(1);
                },
            });
        }
    };

    // Quick presets for Indonesian cities coordinates
    const cityPresets = [
        { label: 'Jakarta', lat: -6.2088, lng: 106.8456, city: 'Jakarta Selatan', prov: 'DKI Jakarta' },
        { label: 'Bandung', lat: -6.9175, lng: 107.6191, city: 'Bandung', prov: 'Jawa Barat' },
        { label: 'Surabaya', lat: -7.2575, lng: 112.7521, city: 'Surabaya', prov: 'Jawa Timur' },
        { label: 'Semarang', lat: -6.9667, lng: 110.4167, city: 'Semarang', prov: 'Jawa Tengah' },
        { label: 'Bali (Denpasar)', lat: -8.6705, lng: 115.2126, city: 'Denpasar', prov: 'Bali' },
        { label: 'Medan', lat: 3.5952, lng: 98.6722, city: 'Medan', prov: 'Sumatera Utara' },
        { label: 'Makassar', lat: -5.1477, lng: 119.4327, city: 'Makassar', prov: 'Sulawesi Selatan' },
        { label: 'IKN Nusantara', lat: -0.9634, lng: 116.7027, city: 'Penajam Paser', prov: 'Kalimantan Timur' },
    ];

    const applyPreset = (preset: typeof cityPresets[0]) => {
        setData(prev => ({
            ...prev,
            latitude: preset.lat,
            longitude: preset.lng,
            city: preset.city,
            province: preset.prov,
        }));
    };

    const provinceList = useMemo(() => {
        return [...getAllProvinces()].sort((a, b) => a.localeCompare('id'));
    }, []);

    const availableCities = useMemo(() => {
        if (!data.province) return [];
        const cities = getCitiesByProvince(data.province);
        if (data.city && !cities.includes(data.city)) {
            return [data.city, ...cities];
        }
        return cities;
    }, [data.province, data.city]);

    const handleProvinceChange = (newProvince: string) => {
        const cities = getCitiesByProvince(newProvince);
        setData(prev => ({
            ...prev,
            province: newProvince,
            city: cities.length > 0 ? cities[0] : '',
        }));
    };

    return (
        <>
            <div 
                className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto animate-in fade-in duration-200"
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        onClose();
                    }
                }}
            >
                <div 
                    className="max-w-5xl xl:max-w-6xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] my-auto transition-all"
                    onClick={(e) => e.stopPropagation()}
                >
                {/* Modal Header */}
                <div className="p-6 px-8 border-b border-slate-100 flex justify-between items-center bg-[#FCFCFD] shrink-0">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                                {isEditing ? `Ubah Data Titik: ${stationToEdit?.code}` : 'Pendaftaran Titik Baru Stasiun'}
                            </h2>
                            {!isEditing && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 inline-flex items-center gap-1">
                                    <Check className="w-2.5 h-2.5" />
                                    Auto-Save Draf Aktif
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {!isEditing && (
                            <button
                                type="button"
                                onClick={handleClearDraft}
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-100"
                                title="Kosongkan formulir dan hapus draf"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reset Draf</span>
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-800 bg-white border border-slate-200/80 transition"
                            title="Tutup (Draf tersimpan di browser)"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* STEPPER NAVIGATION BAR */}
                <div className="px-8 py-3.5 bg-slate-50/70 border-b border-slate-100 shrink-0 select-none">
                    <div className="flex items-center justify-between gap-3">
                        {[
                            { step: 1, title: 'Identitas & Lokasi', icon: Building, desc: 'Kode, nama & koordinat' },
                            { step: 2, title: 'Konfigurasi Mesin', icon: Cpu, desc: `${data.machines?.length || 1} unit mesin terpasang` },
                            { step: 3, title: 'Landlord & Kontrak', icon: FileText, desc: 'PKS & profil pemilik lahan' },
                        ].map((s, idx) => {
                            const isCurrent = currentStep === s.step;
                            const isCompleted = currentStep > s.step;
                            const Icon = s.icon;

                            return (
                                <React.Fragment key={s.step}>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(s.step as 1 | 2 | 3)}
                                        className={`flex items-center gap-3 text-left transition px-3 py-2 rounded-2xl group flex-1 max-w-[320px] ${
                                            isCurrent 
                                                ? 'bg-white shadow-2xs border border-blue-200/80' 
                                                : 'hover:bg-white/60 border border-transparent'
                                        }`}
                                    >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition shadow-2xs shrink-0 ${
                                            isCurrent
                                                ? 'bg-blue-600 text-white ring-4 ring-blue-500/10'
                                                : isCompleted
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-slate-200/80 text-slate-600 group-hover:bg-slate-300'
                                        }`}>
                                            {isCompleted ? <Check className="w-4 h-4 stroke-3" /> : s.step}
                                        </div>
                                        <div className="min-w-0">
                                            <div className={`text-xs font-bold leading-tight truncate ${isCurrent ? 'text-blue-900' : 'text-slate-800'}`}>
                                                {s.title}
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5 truncate hidden sm:block">
                                                {s.desc}
                                            </div>
                                        </div>
                                    </button>
                                    {idx < 2 && (
                                        <div className={`hidden md:block w-8 lg:w-12 h-0.5 rounded-full transition-colors shrink-0 ${
                                            currentStep > idx + 1 ? 'bg-emerald-400' : 'bg-slate-200'
                                        }`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* FORM BODY */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-xs">
                    {/* STEP 1: IDENTITAS LOKASI & GEOLOKASI */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in fade-in duration-150">
                            {/* Identitas Pokok */}
                            <div className="space-y-3.5">
                                <div className="border-b border-slate-100 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                                            <span>Identitas Pokok & Status Stasiun</span>
                                        </h3>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            Tentukan nama lokasi publik, status kesiapan operasional, dan jam operasional stasiun.
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 w-fit">
                                        ⚡ Kode stasiun otomatis diterbitkan: VG-[KOTA]-00001
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Nama Stasiun / Lokasi Publik <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Contoh: V-Green Hub SCBD Sudirman"
                                            className="w-full h-9 px-3 text-xs font-medium bg-white border border-slate-200/90 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs"
                                            required
                                        />
                                        {errors.name && <span className="text-rose-500 text-[11px] mt-1 block">{errors.name}</span>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Status Kesiapan Operasional <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={data.status_id}
                                            onChange={(e) => setData('status_id', e.target.value as any)}
                                            className="w-full h-9 px-3 text-xs font-semibold bg-white border border-slate-200/90 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs cursor-pointer"
                                        >
                                            {stationStatuses.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Jam Operasional
                                        </label>
                                        <input
                                            type="text"
                                            value={data.operational_hours}
                                            onChange={(e) => setData('operational_hours', e.target.value)}
                                            placeholder="24 Jam / 08:00 - 22:00"
                                            className="w-full h-9 px-3 text-xs font-medium bg-white border border-slate-200/90 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Geolokasi & Alamat */}
                            <div className="space-y-3.5 pt-4 border-t border-slate-100">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                                            <Navigation className="w-3.5 h-3.5 text-blue-600" />
                                            <span>Geolokasi & Koordinat GIS (Indonesia)</span>
                                        </h3>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            Koordinat lintang dan bujur untuk pemetaan GIS nasional.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            type="button"
                                            onClick={() => setIsMapPickerOpen(true)}
                                            className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition shadow-2xs"
                                            title="Buka peta visual untuk memilih titik koordinat secara langsung"
                                        >
                                            <MapPin className="w-3.5 h-3.5 stroke-[2.5]" />
                                            <span>Pilih Titik di Peta</span>
                                        </button>
                                        <div className="flex items-center gap-1 flex-wrap">
                                            <span className="text-[11px] font-semibold text-slate-400 mr-0.5 hidden md:inline">Preset:</span>
                                            {cityPresets.map(preset => (
                                                <button
                                                    key={preset.label}
                                                    type="button"
                                                    onClick={() => applyPreset(preset)}
                                                    className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200/60 text-[11px] font-medium transition"
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Provinsi <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={data.province}
                                            onChange={(e) => handleProvinceChange(e.target.value)}
                                            className="w-full h-9 px-3 text-xs font-semibold bg-white border border-slate-200/90 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs cursor-pointer"
                                            required
                                        >
                                            <option value="">-- Pilih Provinsi --</option>
                                            {provinceList.map((prov) => (
                                                <option key={prov} value={prov}>{prov}</option>
                                            ))}
                                        </select>
                                        {errors.province && <span className="text-rose-500 text-[11px] mt-1 block">{errors.province}</span>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Kota / Kabupaten <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                            disabled={!data.province}
                                            className="w-full h-9 px-3 text-xs font-semibold bg-white border border-slate-200/90 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                            required
                                        >
                                            <option value="">{data.province ? '-- Pilih Kota / Kab --' : '-- Pilih Provinsi Dulu --'}</option>
                                            {availableCities.map((c) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                        {errors.city && <span className="text-rose-500 text-[11px] mt-1 block">{errors.city}</span>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Pos</label>
                                        <input
                                            type="text"
                                            value={data.postal_code}
                                            onChange={(e) => setData('postal_code', e.target.value)}
                                            placeholder="Contoh: 12190"
                                            className="w-full h-9 px-3 text-xs font-medium bg-white border border-slate-200/90 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs"
                                        />
                                    </div>

                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Alamat Lengkap <span className="text-rose-500">*</span>
                                        </label>
                                        <textarea
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            rows={2}
                                            placeholder="Jl. Jend. Sudirman Kav. 52-53, Kawasan Niaga Terpadu SCBD..."
                                            className="w-full p-2.5 text-xs font-medium bg-white border border-slate-200/90 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs"
                                            required
                                        />
                                        {errors.address && <span className="text-rose-500 text-[11px] mt-1 block">{errors.address}</span>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Latitude (-12.0 s/d 7.0) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.0000001"
                                            value={data.latitude}
                                            onChange={(e) => setData('latitude', parseFloat(e.target.value) || 0)}
                                            className="w-full h-9 px-3 text-xs font-mono font-semibold bg-white border border-slate-200/90 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs"
                                            required
                                        />
                                        {errors.latitude && <span className="text-rose-500 text-[11px] mt-1 block">{errors.latitude}</span>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Longitude (94.0 s/d 142.0) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.0000001"
                                            value={data.longitude}
                                            onChange={(e) => setData('longitude', parseFloat(e.target.value) || 0)}
                                            className="w-full h-9 px-3 text-xs font-mono font-semibold bg-white border border-slate-200/90 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs"
                                            required
                                        />
                                        {errors.longitude && <span className="text-rose-500 text-[11px] mt-1 block">{errors.longitude}</span>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Visual GIS Peta
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setIsMapPickerOpen(true)}
                                            className="w-full h-9 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-2xs"
                                            title="Buka peta visual untuk memilih titik koordinat secara langsung"
                                        >
                                            <MapPin className="w-3.5 h-3.5 stroke-[2.5]" />
                                            <span>Pilih Titik di Peta</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: KONFIGURASI MESIN SPKLU & BSS */}
                    {currentStep === 2 && (
                        <div className="space-y-5 animate-in fade-in duration-150">
                            {/* Summary & Toolbar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
                                <div>
                                    <h3 className="font-bold text-blue-900 text-xs flex items-center gap-2">
                                        <Cpu className="w-4 h-4 text-blue-600" />
                                        <span>Konfigurasi Multi-Mesin ({data.machines?.length || 0} Unit Terdaftar)</span>
                                    </h3>
                                    <p className="text-[11px] text-blue-700/80 mt-0.5">
                                        Atur spesifikasi daya (kW), jenis soket/port, dan status masing-masing unit charger.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="text-xs font-bold px-3 py-1 bg-white text-blue-800 rounded-lg border border-blue-200/80 shadow-2xs flex items-center gap-1.5">
                                        <span className="text-slate-500 font-semibold">Tipe Stasiun:</span>
                                        {data.facility_type_id === 'COMBINED' ? (
                                            <span className="text-amber-600 font-bold">Kombinasi (EVCS + BSS)</span>
                                        ) : data.facility_type_id === 'BSS' ? (
                                            <span className="text-emerald-600 font-bold">BSS (Motor)</span>
                                        ) : (
                                            <span className="text-blue-600 font-bold">EVCS (Mobil)</span>
                                        )}
                                    </span>
                                    <span className="text-xs font-bold px-3 py-1 bg-white text-blue-800 rounded-lg border border-blue-200/80 shadow-2xs">
                                        Total: {totalKw} kW • {totalSlots} Slot/Gun
                                    </span>
                                    <button
                                        type="button"
                                        onClick={addMachine}
                                        className="h-8 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Tambah Mesin</span>
                                    </button>
                                </div>
                            </div>

                            {/* Machine Items List */}
                            <div className="space-y-3.5">
                                {(data.machines || []).map((m: StationMachine, idx: number) => (
                                    <div key={idx} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3 shadow-2xs">
                                        <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                                                    {idx + 1}
                                                </span>
                                                <span className="font-bold text-slate-800 text-xs">
                                                    {m.name || `Unit Mesin 0${idx + 1}`}
                                                </span>
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                                                    {m.facility_type_id}
                                                </span>
                                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                                    {m.power_capacity_kw || 0} kW
                                                </span>
                                            </div>

                                            {(data.machines || []).length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeMachine(idx)}
                                                    className="text-slate-400 hover:text-rose-600 transition p-1 rounded-md hover:bg-rose-50"
                                                    title="Hapus unit mesin ini"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Quick Preset Selector from Master Machine Catalog */}
                                        {masterMachines && masterMachines.length > 0 && (
                                            <div className="bg-white p-2.5 rounded-lg border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Cpu className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                    <span className="text-[11px] font-bold text-slate-700">
                                                        Katalog Master Mesin:
                                                    </span>
                                                </div>
                                                <select
                                                    value={m.machine_id || ''}
                                                    onChange={(e) => handleSelectMasterMachine(idx, e.target.value)}
                                                    className="h-8 bg-slate-50 border border-slate-200 rounded-md px-2.5 text-xs font-semibold text-slate-800 transition focus:outline-hidden focus:border-blue-600 max-w-md w-full sm:w-auto cursor-pointer"
                                                >
                                                    <option value="">-- Kustom (Input Manual) --</option>
                                                    {masterMachines.map((mm) => (
                                                        <option key={mm.id} value={mm.id}>
                                                            [{mm.category?.code || 'UNIT'}] {mm.brand} - {mm.name} ({mm.power_capacity_kw} kW)
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                                    Nama / Label Unit <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={m.name}
                                                    onChange={(e) => updateMachine(idx, 'name', e.target.value)}
                                                    placeholder="Unit DC Fast Charger 01"
                                                    className="w-full h-8.5 px-2.5 text-xs bg-white border border-slate-200/90 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                                    Merk / Brand
                                                </label>
                                                <input
                                                    type="text"
                                                    value={m.brand || ''}
                                                    onChange={(e) => updateMachine(idx, 'brand', e.target.value)}
                                                    placeholder="Autel / Delta / V-Green"
                                                    className="w-full h-8.5 px-2.5 text-xs bg-white border border-slate-200/90 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                                    Nomor Seri (SN)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={m.serial_number || ''}
                                                    onChange={(e) => updateMachine(idx, 'serial_number', e.target.value)}
                                                    placeholder="ATC-2025-0012"
                                                    className="w-full h-8.5 px-2.5 text-xs font-mono text-slate-900 bg-white border border-slate-200/90 rounded-lg focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                                    Jenis Mesin
                                                </label>
                                                <select
                                                    value={m.facility_type_id}
                                                    onChange={(e) => updateMachine(idx, 'facility_type_id', e.target.value)}
                                                    className="w-full h-8.5 px-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200/90 rounded-lg focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer"
                                                >
                                                    <option value="EVCS">EVCS (Mobil Listrik)</option>
                                                    <option value="BSS">BSS (Motor Swap)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                                    Kapasitas Daya (kW) <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={m.power_capacity_kw}
                                                    onChange={(e) => updateMachine(idx, 'power_capacity_kw', parseInt(e.target.value) || 0)}
                                                    placeholder="60, 120, 22"
                                                    className="w-full h-8.5 px-2.5 text-xs font-bold text-slate-900 bg-white border border-slate-200/90 rounded-lg focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                                    Tipe Konektor / Gun
                                                </label>
                                                <input
                                                    type="text"
                                                    value={m.socket_types || ''}
                                                    onChange={(e) => updateMachine(idx, 'socket_types', e.target.value)}
                                                    placeholder="2x CCS2 Fast Gun"
                                                    className="w-full h-8.5 px-2.5 text-xs bg-white border border-slate-200/90 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                                    Jumlah Slot / Gun <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={m.slot_or_gun_count}
                                                    onChange={(e) => updateMachine(idx, 'slot_or_gun_count', parseInt(e.target.value) || 1)}
                                                    className="w-full h-8.5 px-2.5 text-xs bg-white border border-slate-200/90 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                                    Status Operasional
                                                </label>
                                                <select
                                                    value={m.status}
                                                    onChange={(e) => updateMachine(idx, 'status', e.target.value)}
                                                    className="w-full h-8.5 px-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200/90 rounded-lg focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer"
                                                >
                                                    <option value="OPERATIONAL">OPERATIONAL</option>
                                                    <option value="MAINTENANCE">MAINTENANCE</option>
                                                    <option value="OFFLINE">OFFLINE</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: LANDLORD & DUAL KONTRAK */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-in fade-in duration-150">
                            {/* Profil Landlord */}
                            <div className="space-y-3">
                                <div className="border-b border-slate-100 pb-2">
                                    <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Profil Pemilik Lahan (Landlord)</span>
                                    </h3>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Pilih klasifikasi pemilik lahan untuk menentukan standar berkas legalitas (8 dokumen untuk Swasta, 3 untuk Pemda).
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Tipe Pemilik Lahan <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setData('landlord_type', 'SWASTA')}
                                                className={`h-9 px-2.5 rounded-lg text-xs font-bold border transition ${
                                                    data.landlord_type === 'SWASTA'
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                Swasta (8 Dokumen)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setData('landlord_type', 'PEMERINTAH')}
                                                className={`h-9 px-2.5 rounded-lg text-xs font-bold border transition ${
                                                    data.landlord_type === 'PEMERINTAH'
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                Pemerintah (3 Dokumen)
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Nama Pemilik / Pengelola Lahan
                                        </label>
                                        <input
                                            type="text"
                                            value={data.landlord_name}
                                            onChange={(e) => setData('landlord_name', e.target.value)}
                                            placeholder="PT Danayasa / Jasa Marga / Pemda"
                                            className="w-full h-9 px-3 text-xs bg-white border border-slate-200/90 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Nomor Kontak / WhatsApp
                                        </label>
                                        <div className="relative">
                                            <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                value={data.landlord_phone}
                                                onChange={(e) => setData('landlord_phone', e.target.value)}
                                                placeholder="0812-3456-7890"
                                                className="w-full h-9 pl-9 pr-3 text-xs font-mono bg-white border border-slate-200/90 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dual Contracts Row */}
                            <div className="space-y-3 pt-3 border-t border-slate-100">
                                <div className="border-b border-slate-100 pb-2">
                                    <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Dual Periode Kontrak Kerjasama</span>
                                    </h3>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Monitor masa berlaku kontrak kemitraan V-Green dengan SSI dan sewa lahan SSI dengan Landlord.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Contract 1: V-Green x PT SSI */}
                                    <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-100 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                                            <h4 className="font-bold text-blue-900 text-xs">Periode Kontrak: V-Green × PT SSI</h4>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">No. PKS / Perjanjian</label>
                                            <input
                                                type="text"
                                                value={data.contract_vgreen_doc_number}
                                                onChange={(e) => setData('contract_vgreen_doc_number', e.target.value)}
                                                placeholder="PKS/VG-SSI/2025/001"
                                                className="w-full h-8.5 px-3 text-xs font-mono bg-white border border-slate-200/90 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2.5">
                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mulai Berlaku</label>
                                                <input
                                                    type="date"
                                                    value={data.contract_vgreen_start_date}
                                                    onChange={(e) => setData('contract_vgreen_start_date', e.target.value)}
                                                    className="w-full h-8.5 px-2.5 text-xs bg-white border border-slate-200/90 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jatuh Tempo</label>
                                                <input
                                                    type="date"
                                                    value={data.contract_vgreen_end_date}
                                                    onChange={(e) => setData('contract_vgreen_end_date', e.target.value)}
                                                    className="w-full h-8.5 px-2.5 text-xs bg-white border border-slate-200/90 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contract 2: PT SSI x Landlord */}
                                    <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-100 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-amber-600" />
                                            <h4 className="font-bold text-amber-900 text-xs">Periode Kontrak: PT SSI × Landlord (Sewa Lahan)</h4>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">No. Perjanjian Sewa</label>
                                            <input
                                                type="text"
                                                value={data.contract_landlord_doc_number}
                                                onChange={(e) => setData('contract_landlord_doc_number', e.target.value)}
                                                placeholder="PKS/SSI-LND/2025/001"
                                                className="w-full h-8.5 px-3 text-xs font-mono bg-white border border-slate-200/90 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2.5">
                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mulai Sewa</label>
                                                <input
                                                    type="date"
                                                    value={data.contract_landlord_start_date}
                                                    onChange={(e) => setData('contract_landlord_start_date', e.target.value)}
                                                    className="w-full h-8.5 px-2.5 text-xs bg-white border border-slate-200/90 rounded-lg text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jatuh Tempo Sewa</label>
                                                <input
                                                    type="date"
                                                    value={data.contract_landlord_end_date}
                                                    onChange={(e) => setData('contract_landlord_end_date', e.target.value)}
                                                    className="w-full h-8.5 px-2.5 text-xs font-bold text-slate-900 bg-white border border-slate-200/90 rounded-lg focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Data Teknis Lapangan Tambahan */}
                            <div className="space-y-3 pt-3 border-t border-slate-100">
                                <div className="border-b border-slate-100 pb-2">
                                    <h3 className="font-bold text-slate-800 text-xs">
                                        Data Teknis Lapangan Tambahan
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Vendor Pelaksana Survei / Pembangunan
                                        </label>
                                        <input
                                            type="text"
                                            value={data.vendor_name}
                                            onChange={(e) => setData('vendor_name', e.target.value)}
                                            placeholder="PT Mitra Elektrik Nusantara"
                                            className="w-full h-9 px-3 text-xs bg-white border border-slate-200/90 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            ID Pelanggan PLN (Meteran Gardu)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.pln_meter_id}
                                            onChange={(e) => setData('pln_meter_id', e.target.value)}
                                            placeholder="PLN-JKT-554129"
                                            className="w-full h-9 px-3 text-xs font-mono bg-white border border-slate-200/90 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Fasilitas Penunjang (Amenities)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.amenities}
                                            onChange={(e) => setData('amenities', e.target.value)}
                                            placeholder="Parkir VIP, Kafe, Toilet, Musholla, CCTV 24 Jam"
                                            className="w-full h-9 px-3 text-xs bg-white border border-slate-200/90 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Catatan Internal Lapangan
                                        </label>
                                        <textarea
                                            value={data.internal_notes}
                                            onChange={(e) => setData('internal_notes', e.target.value)}
                                            rows={2}
                                            placeholder="Rekomendasi trafo gardu, kondisi kabel tanah, akses jalan masuk..."
                                            className="w-full p-2.5 text-xs bg-white border border-slate-200/90 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FOOTER ACTIONS BAR */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky bottom-0 bg-white py-2 shrink-0">
                        <div className="flex items-center gap-2">
                            {!isEditing && (
                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Tersimpan otomatis {lastSavedAt && `(${lastSavedAt})`}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-9 px-4 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs transition"
                            >
                                Batal
                            </button>

                            {currentStep > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep((currentStep - 1) as 1 | 2)}
                                    className="h-9 px-4 rounded-lg border border-slate-200/90 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    <span>Sebelumnya</span>
                                </button>
                            )}

                            {currentStep < 3 ? (
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep((currentStep + 1) as 2 | 3)}
                                    className="h-9 px-4.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1.5"
                                >
                                    <span>Lanjut ke Langkah {currentStep + 1}</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="h-9 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>{isEditing ? 'Simpan Perubahan Titik' : 'Daftarkan Titik Baru'}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>

        {/* POPUP MODAL MAP PICKER */}
        <MapPickerModal
            isOpen={isMapPickerOpen}
            onClose={() => setIsMapPickerOpen(false)}
            initialLatitude={Number(data.latitude) || -6.2088}
            initialLongitude={Number(data.longitude) || 106.8456}
            initialProvince={data.province}
            initialCity={data.city}
            onConfirm={(coords) => {
                setData((prev) => ({
                    ...prev,
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    ...(coords.province ? { province: coords.province } : {}),
                    ...(coords.city ? { city: coords.city } : {}),
                }));
            }}
        />
    </>
);
}
