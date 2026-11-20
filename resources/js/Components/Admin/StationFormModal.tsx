import React, { useState, useEffect, useMemo } from 'react';
import { Station, FacilityType, StationStatus, StationMachine, LandlordType, MasterMachine } from '@/types/station';
import { useForm } from '@inertiajs/react';
import MapPickerModal from '@/Components/Map/MapPickerModal';
import Select2, { Select2Option } from '@/Components/Common/Select2';
import { toast } from '@/Components/Common/Toast';
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

    // Initial default machines linked to first master machine if available
    const defaultMachines: StationMachine[] = useMemo(() => {
        const first = masterMachines && masterMachines.length > 0 ? masterMachines[0] : null;
        if (first) {
            return [
                {
                    machine_id: first.id,
                    name: `${first.name} 01`,
                    brand: first.brand,
                    model_series: first.model_series || '',
                    serial_number: '',
                    facility_type_id: (first.category?.code === 'BSS' ? 'BSS' : 'EVCS') as any,
                    power_capacity_kw: first.power_capacity_kw,
                    socket_types: first.socket_types || '',
                    slot_or_gun_count: first.slot_or_gun_count,
                    status: 'OPERATIONAL',
                }
            ];
        }
        return [
            {
                name: 'Unit Mesin 01 (Utama)',
                brand: 'Autel',
                model_series: 'MaxiCharger DC 60kW',
                serial_number: '',
                facility_type_id: 'EVCS',
                power_capacity_kw: 60,
                socket_types: '2x CCS2 Fast Gun',
                slot_or_gun_count: 2,
                status: 'OPERATIONAL',
            }
        ];
    }, [masterMachines]);

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

    // Ensure all machines are mapped to a valid master machine if available
    useEffect(() => {
        if (!masterMachines || masterMachines.length === 0) return;
        if (!data.machines || data.machines.length === 0) return;

        let changed = false;
        const updated = data.machines.map((m: StationMachine, idx: number) => {
            if (!m.machine_id) {
                changed = true;
                const match = masterMachines.find(
                    (mm) => (m.brand && mm.brand.toLowerCase() === m.brand.toLowerCase()) ||
                            (m.name && mm.name.toLowerCase().includes(m.name.toLowerCase()))
                ) || masterMachines[0];

                return {
                    ...m,
                    machine_id: match.id,
                    name: m.name || `${match.name} 0${idx + 1}`,
                    brand: match.brand,
                    model_series: match.model_series || '',
                    facility_type_id: (match.category?.code === 'BSS' ? 'BSS' : 'EVCS') as any,
                    power_capacity_kw: match.power_capacity_kw,
                    socket_types: match.socket_types || '',
                    slot_or_gun_count: match.slot_or_gun_count,
                };
            }
            return m;
        });

        if (changed) {
            setData('machines', updated);
        }
    }, [masterMachines]);

    const masterMachineOptions = useMemo<Select2Option<string>[]>(() => {
        if (!masterMachines || masterMachines.length === 0) return [];
        return masterMachines.map((mm) => {
            const catCode = mm.category?.code || 'EVCS';
            return {
                value: String(mm.id),
                label: `[${catCode}] ${mm.brand} - ${mm.name}`,
                subtext: `${mm.power_capacity_kw} kW • ${mm.slot_or_gun_count} Slot/Gun ${mm.socket_types ? `• ${mm.socket_types}` : ''}`,
                badge: `${mm.power_capacity_kw} kW`,
                badgeColor: catCode === 'BSS' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800',
                keywords: [
                    mm.brand,
                    mm.name,
                    mm.model_series || '',
                    catCode,
                    `${mm.power_capacity_kw} kW`,
                    `${mm.power_capacity_kw}kW`,
                    mm.socket_types || '',
                ],
            };
        });
    }, [masterMachines]);

    const addMachine = () => {
        const nextIdx = (data.machines?.length || 0) + 1;
        const defaultMm = masterMachines && masterMachines.length > 0 ? masterMachines[0] : null;
        const newMachine: StationMachine = defaultMm
            ? {
                  machine_id: defaultMm.id,
                  name: `${defaultMm.name} 0${nextIdx}`,
                  brand: defaultMm.brand,
                  model_series: defaultMm.model_series || '',
                  serial_number: '',
                  facility_type_id: (defaultMm.category?.code === 'BSS' ? 'BSS' : 'EVCS') as any,
                  power_capacity_kw: defaultMm.power_capacity_kw,
                  socket_types: defaultMm.socket_types || '',
                  slot_or_gun_count: defaultMm.slot_or_gun_count,
                  status: 'OPERATIONAL',
              }
            : {
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

    const handleSelectMasterMachine = (index: number, masterMachineId: string) => {
        if (!masterMachineId) return;
        const selected = masterMachines.find((m) => m.id === String(masterMachineId));
        if (!selected) return;

        const updated = [...(data.machines || [])];
        const currentSerial = updated[index]?.serial_number || '';
        const currentStatus = updated[index]?.status || 'OPERATIONAL';

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
            serial_number: currentSerial,
            status: currentStatus,
        };
        setData('machines', updated);
    };

    // Helper untuk mendapatkan tanggal hari ini dalam format lokal YYYY-MM-DD
    const getTodayLocalDateStr = (): string => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Helper durasi kontrak: menghitung tanggal jatuh tempo otomatis dari tanggal mulai + durasi tahun
    const handleApplyDuration = (
        startField: 'contract_vgreen_start_date' | 'contract_landlord_start_date',
        endField: 'contract_vgreen_end_date' | 'contract_landlord_end_date',
        years: number
    ) => {
        const currentStart = data[startField] || getTodayLocalDateStr();
        const parts = currentStart.split('-').map(Number);
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
            const [year, month, day] = parts;
            const targetYear = year + years;
            let targetDay = day;
            let targetMonth = month;
            // Penyesuaian tahun kabisat (29 Februari)
            if (month === 2 && day === 29) {
                const isLeap = (targetYear % 4 === 0 && targetYear % 100 !== 0) || (targetYear % 400 === 0);
                if (!isLeap) targetDay = 28;
            }
            const formattedEnd = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;

            setData((prev) => ({
                ...prev,
                [startField]: currentStart,
                [endField]: formattedEnd,
            }));
        }
    };

    // Deteksi apakah rentang tanggal saat ini cocok dengan durasi N tahun
    const getActiveDurationYears = (startDate?: string, endDate?: string): number | null => {
        if (!startDate || !endDate) return null;
        const startParts = startDate.split('-').map(Number);
        const endParts = endDate.split('-').map(Number);
        if (startParts.length !== 3 || endParts.length !== 3) return null;
        if (isNaN(startParts[0]) || isNaN(endParts[0])) return null;

        const diffYears = endParts[0] - startParts[0];
        if (diffYears <= 0) return null;

        // Cocok jika bulan sama dan hari sama (atau selisih 1 hari untuk kontrak 365 hari)
        if (startParts[1] === endParts[1] && (startParts[2] === endParts[2] || Math.abs(startParts[2] - endParts[2]) <= 1)) {
            return diffYears;
        }
        return null;
    };

    const vgreenDurationYears = useMemo(() => {
        return getActiveDurationYears(data.contract_vgreen_start_date, data.contract_vgreen_end_date);
    }, [data.contract_vgreen_start_date, data.contract_vgreen_end_date]);

    const landlordDurationYears = useMemo(() => {
        return getActiveDurationYears(data.contract_landlord_start_date, data.contract_landlord_end_date);
    }, [data.contract_landlord_start_date, data.contract_landlord_end_date]);

    const step1Keys = [
        'code',
        'name',
        'facility_type_id',
        'status_id',
        'latitude',
        'longitude',
        'address',
        'city',
        'province',
        'postal_code',
        'operational_hours',
    ];

    const hasStep1Errors = useMemo(() => {
        return Object.keys(errors).some((key) => step1Keys.includes(key));
    }, [errors]);

    const hasStep2Errors = useMemo(() => {
        return Object.keys(errors).some((key) => key === 'machines' || key.startsWith('machines.'));
    }, [errors]);

    const hasStep3Errors = useMemo(() => {
        return Object.keys(errors).some((key) =>
            [
                'landlord_type',
                'landlord_name',
                'landlord_phone',
                'contract_vgreen_start_date',
                'contract_vgreen_end_date',
                'contract_vgreen_doc_number',
                'contract_landlord_start_date',
                'contract_landlord_end_date',
                'contract_landlord_doc_number',
            ].includes(key)
        );
    }, [errors]);

    const handleValidationError = (errs: Record<string, string>) => {
        const errorKeys = Object.keys(errs);
        const errorCount = errorKeys.length;

        toast.error(
            `Terdapat ${errorCount} kesalahan validasi data. Silakan periksa kolom yang ditandai merah.`,
            'Validasi Gagal'
        );

        // Otomatis lompat ke langkah yang memiliki kesalahan pertama
        if (errorKeys.some((k) => step1Keys.includes(k))) {
            setCurrentStep(1);
        } else if (errorKeys.some((k) => k === 'machines' || k.startsWith('machines.'))) {
            setCurrentStep(2);
        } else if (
            errorKeys.some((k) =>
                [
                    'landlord_type',
                    'landlord_name',
                    'landlord_phone',
                    'contract_vgreen_start_date',
                    'contract_vgreen_end_date',
                    'contract_vgreen_doc_number',
                    'contract_landlord_start_date',
                    'contract_landlord_end_date',
                    'contract_landlord_doc_number',
                ].includes(k)
            )
        ) {
            setCurrentStep(3);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Hanya boleh submit jika pengguna berada di langkah terakhir (Langkah 3)
        if (currentStep !== 3) {
            return;
        }

        if (isEditing && stationToEdit) {
            put(route('admin.stations.update', { station: stationToEdit.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        `Data stasiun "${data.name || stationToEdit.name}" berhasil diperbarui.`,
                        'Berhasil Memperbarui'
                    );
                    onClose();
                    reset();
                },
                onError: (errs) => handleValidationError(errs),
            });
        } else {
            post(route('admin.stations.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    localStorage.removeItem(DRAFT_STORAGE_KEY);
                    toast.success(
                        `Titik stasiun "${data.name}" berhasil didaftarkan ke sistem.`,
                        'Berhasil Menyimpan'
                    );
                    onClose();
                    reset();
                    setCurrentStep(1);
                },
                onError: (errs) => handleValidationError(errs),
            });
        }
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

    const provinceOptions = useMemo<Select2Option<string>[]>(() => {
        return provinceList.map((prov) => ({
            value: prov,
            label: prov,
        }));
    }, [provinceList]);

    const cityOptions = useMemo<Select2Option<string>[]>(() => {
        return availableCities.map((city) => ({
            value: city,
            label: city,
        }));
    }, [availableCities]);

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
            >
                <div 
                    className="max-w-5xl xl:max-w-6xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] my-auto transition-all"
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
                            { step: 1, title: 'Identitas & Lokasi', icon: Building, desc: 'Kode, nama & koordinat', hasError: hasStep1Errors },
                            { step: 2, title: 'Konfigurasi Mesin', icon: Cpu, desc: `${data.machines?.length || 1} unit mesin terpasang`, hasError: hasStep2Errors },
                            { step: 3, title: 'Landlord & Kontrak', icon: FileText, desc: 'Kontrak & profil pemilik lahan', hasError: hasStep3Errors },
                        ].map((s, idx) => {
                            const isCurrent = currentStep === s.step;
                            const isCompleted = currentStep > s.step;
                            const hasError = s.hasError;
                            const Icon = s.icon;

                            return (
                                <React.Fragment key={s.step}>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(s.step as 1 | 2 | 3)}
                                        className={`flex items-center gap-3 text-left transition px-3 py-2 rounded-2xl group flex-1 max-w-[320px] cursor-pointer ${
                                            hasError
                                                ? 'bg-rose-50/70 border border-rose-300/80 shadow-2xs'
                                                : isCurrent 
                                                ? 'bg-white shadow-2xs border border-blue-200/80' 
                                                : 'hover:bg-white/60 border border-transparent'
                                        }`}
                                    >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition shadow-2xs shrink-0 ${
                                            hasError
                                                ? 'bg-rose-600 text-white ring-4 ring-rose-500/10'
                                                : isCurrent
                                                ? 'bg-blue-600 text-white ring-4 ring-blue-500/10'
                                                : isCompleted
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-slate-200/80 text-slate-600 group-hover:bg-slate-300'
                                        }`}>
                                            {hasError ? (
                                                <AlertCircle className="w-4 h-4 stroke-3" />
                                            ) : isCompleted ? (
                                                <Check className="w-4 h-4 stroke-3" />
                                            ) : (
                                                s.step
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className={`text-xs font-bold leading-tight truncate flex items-center gap-1.5 ${
                                                hasError ? 'text-rose-900' : isCurrent ? 'text-blue-900' : 'text-slate-800'
                                            }`}>
                                                <span>{s.title}</span>
                                                {hasError && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5 truncate hidden sm:block">
                                                {hasError ? 'Ada kolom perlu diperbaiki' : s.desc}
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

                {/* VALIDATION ERROR BANNER */}
                {Object.keys(errors).length > 0 && (
                    <div className="mx-6 sm:mx-8 mt-4 p-4 rounded-2xl bg-rose-50/90 border border-rose-200/90 text-rose-900 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200 shrink-0">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                                <AlertCircle className="w-4.5 h-4.5 stroke-2.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <h4 className="text-xs font-bold text-rose-900">
                                        Gagal Menyimpan: Terdapat {Object.keys(errors).length} Kesalahan Validasi Formulir
                                    </h4>
                                    <div className="flex items-center gap-1.5">
                                        {hasStep1Errors && currentStep !== 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setCurrentStep(1)}
                                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white text-rose-700 hover:bg-rose-100 border border-rose-200 shadow-2xs transition cursor-pointer"
                                            >
                                                Buka Langkah 1 &rarr;
                                            </button>
                                        )}
                                        {hasStep2Errors && currentStep !== 2 && (
                                            <button
                                                type="button"
                                                onClick={() => setCurrentStep(2)}
                                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white text-rose-700 hover:bg-rose-100 border border-rose-200 shadow-2xs transition cursor-pointer"
                                            >
                                                Buka Langkah 2 &rarr;
                                            </button>
                                        )}
                                        {hasStep3Errors && currentStep !== 3 && (
                                            <button
                                                type="button"
                                                onClick={() => setCurrentStep(3)}
                                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white text-rose-700 hover:bg-rose-100 border border-rose-200 shadow-2xs transition cursor-pointer"
                                            >
                                                Buka Langkah 3 &rarr;
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <ul className="mt-2 space-y-1 text-[11px] text-rose-700 list-disc list-inside">
                                    {Object.entries(errors).map(([field, msg]) => (
                                        <li key={field} className="leading-relaxed">
                                            <span className="font-semibold capitalize">{field.replace(/_/g, ' ')}</span>: {msg}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* FORM BODY */}
                <form 
                    onSubmit={handleSubmit} 
                    onKeyDown={(e) => {
                        // Cegah tombol Enter pada input mengirim formulir sebelum langkah terakhir
                        if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                            e.preventDefault();
                            if (currentStep < 3) {
                                setCurrentStep((prev) => (prev < 3 ? (prev + 1) as 2 | 3 : 3));
                            }
                        }
                    }}
                    className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-xs"
                >
                    {/* STEP 1: IDENTITAS LOKASI & GEOLOKASI */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in fade-in duration-150">
                            {/* Identitas Pokok */}
                            <div className="space-y-3.5">
                                <div className="border-b border-slate-100 pb-2">
                                    <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                                        <span>Identitas Pokok & Status Stasiun</span>
                                    </h3>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Tentukan nama lokasi publik, status kesiapan operasional, dan jam operasional stasiun.
                                    </p>
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
                                            className={`w-full h-9 px-3 text-xs font-medium bg-white rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition shadow-2xs ${
                                                errors.name
                                                    ? 'border border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/15'
                                                    : 'border border-slate-200/90 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                                            }`}
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
                                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                                            <Navigation className="w-3.5 h-3.5 text-blue-600" />
                                            <span>Geolokasi & Koordinat GIS (Indonesia)</span>
                                        </h3>
                                        <p className="text-[11px] text-slate-400 mt-0.5 whitespace-nowrap truncate">
                                            Koordinat lintang dan bujur untuk pemetaan GIS nasional.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsMapPickerOpen(true)}
                                        className="h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition shadow-2xs shrink-0"
                                        title="Buka peta visual untuk memilih titik koordinat secara langsung"
                                    >
                                        <MapPin className="w-3.5 h-3.5 stroke-[2.5]" />
                                        <span>Pilih Titik di Peta</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Provinsi <span className="text-rose-500">*</span>
                                        </label>
                                        <Select2
                                            value={data.province}
                                            onChange={(val) => handleProvinceChange(String(val))}
                                            options={provinceOptions}
                                            placeholder="-- Pilih Provinsi --"
                                            searchPlaceholder="Cari provinsi..."
                                            isSearchable={true}
                                            variant="default"
                                            size="sm"
                                            className="w-full"
                                            triggerClassName="w-full h-9 rounded-lg"
                                        />
                                        {errors.province && <span className="text-rose-500 text-[11px] mt-1 block">{errors.province}</span>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Kota / Kabupaten <span className="text-rose-500">*</span>
                                        </label>
                                        <Select2
                                            value={data.city}
                                            onChange={(val) => setData('city', String(val))}
                                            options={cityOptions}
                                            disabled={!data.province || availableCities.length === 0}
                                            placeholder={data.province ? '-- Pilih Kota / Kab --' : '-- Pilih Provinsi Dulu --'}
                                            searchPlaceholder="Cari kota / kab..."
                                            isSearchable={true}
                                            variant="default"
                                            size="sm"
                                            className="w-full"
                                            triggerClassName="w-full h-9 rounded-lg"
                                        />
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
                                            className={`w-full p-2.5 text-xs font-medium bg-white rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition shadow-2xs ${
                                                errors.address
                                                    ? 'border border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/15'
                                                    : 'border border-slate-200/90 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                                            }`}
                                            required
                                        />
                                        {errors.address && <span className="text-rose-500 text-[11px] mt-1 block">{errors.address}</span>}
                                    </div>

                                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Latitude (-12.0 s/d 7.0) <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                step="0.0000001"
                                                value={data.latitude}
                                                onChange={(e) => setData('latitude', parseFloat(e.target.value) || 0)}
                                                className={`w-full h-9 px-3 text-xs font-mono font-semibold bg-white rounded-lg text-slate-900 focus:outline-hidden transition shadow-2xs ${
                                                    errors.latitude
                                                        ? 'border border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/15'
                                                        : 'border border-slate-200/90 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                                                }`}
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
                                                className={`w-full h-9 px-3 text-xs font-mono font-semibold bg-white rounded-lg text-slate-900 focus:outline-hidden transition shadow-2xs ${
                                                    errors.longitude
                                                        ? 'border border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/15'
                                                        : 'border border-slate-200/90 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                                                }`}
                                                required
                                            />
                                            {errors.longitude && <span className="text-rose-500 text-[11px] mt-1 block">{errors.longitude}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: KONFIGURASI MESIN SPKLU & BSS */}
                    {currentStep === 2 && (
                        <div className="space-y-4 animate-in fade-in duration-150">
                            {/* Machine Items List */}
                            <div className="space-y-3.5">
                                {(data.machines || []).map((m: StationMachine, idx: number) => {
                                    const selectedMaster = masterMachines.find(mm => mm.id === m.machine_id);
                                    const displayBrand = selectedMaster?.brand || m.brand || 'V-Green';
                                    const displayType = (selectedMaster?.category?.code || m.facility_type_id) === 'BSS' ? 'BSS (Motor Swap)' : 'EVCS (Mobil Listrik)';
                                    const displayKw = selectedMaster?.power_capacity_kw ?? m.power_capacity_kw ?? 0;
                                    const displaySlots = selectedMaster?.slot_or_gun_count ?? m.slot_or_gun_count ?? 1;
                                    const displaySockets = selectedMaster?.socket_types || m.socket_types || '-';

                                    return (
                                        <div
                                            key={idx}
                                            className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-3.5 shadow-2xs hover:border-slate-300 transition"
                                        >
                                            {/* Header Kartu Mesin */}
                                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="font-bold text-slate-800 text-xs">
                                                        {m.name || `Unit Mesin 0${idx + 1}`}
                                                    </span>
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600">
                                                        {m.facility_type_id}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                                        {displayKw} kW
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

                                            {/* SELECT2: Pilih Mesin dari Katalog Master */}
                                            <div className="space-y-1.5">
                                                <label className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                                                    <span className="flex items-center gap-1.5">
                                                        <Cpu className="w-3.5 h-3.5 text-blue-600" />
                                                        Pilih Model Mesin (Katalog Master) <span className="text-rose-500">*</span>
                                                    </span>
                                                    <span className="text-[10px] font-medium text-slate-400">
                                                        Spesifikasi diisi otomatis dari master data
                                                    </span>
                                                </label>
                                                <Select2
                                                    value={m.machine_id ? String(m.machine_id) : (masterMachines.length > 0 ? masterMachines[0].id : '')}
                                                    onChange={(val) => handleSelectMasterMachine(idx, String(val))}
                                                    options={masterMachineOptions}
                                                    placeholder="-- Cari dan Pilih Mesin dari Katalog Master --"
                                                    searchPlaceholder="Cari merk, model, daya (kW), atau jenis (EVCS/BSS)..."
                                                    variant="default"
                                                    size="md"
                                                    className="w-full"
                                                    triggerClassName="w-full flex items-center justify-between py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-white transition cursor-pointer text-left shadow-2xs font-medium text-xs text-slate-800"
                                                />
                                            </div>

                                            {/* PANEL SPESIFIKASI OTOMATIS (READ-ONLY) */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 text-xs">
                                                <div>
                                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                                                        Merk / Brand
                                                    </span>
                                                    <span className="font-bold text-slate-800 text-xs mt-0.5 block truncate">
                                                        {displayBrand}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                                                        Jenis Mesin
                                                    </span>
                                                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                                                        {displayType}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                                                        Kapasitas Daya
                                                    </span>
                                                    <span className="font-bold text-blue-700 text-xs mt-0.5 block">
                                                        {displayKw} kW
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                                                        Jumlah Slot / Gun
                                                    </span>
                                                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                                                        {displaySlots} Slot / Gun
                                                    </span>
                                                </div>
                                                {displaySockets !== '-' && (
                                                    <div className="col-span-2 sm:col-span-4 pt-2 border-t border-slate-200/50">
                                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                                                            Tipe Konektor / Soket
                                                        </span>
                                                        <span className="font-medium text-slate-700 text-xs mt-0.5 block">
                                                            {displaySockets}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* IDENTITAS UNIT FISIK (Opsional: Nomor Seri & Status) */}
                                            <div className="pt-1 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                                                <div className="flex-1">
                                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                                        Nomor Seri / SN <span className="text-slate-400 font-normal">(Opsional)</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={m.serial_number || ''}
                                                        onChange={(e) => updateMachine(idx, 'serial_number', e.target.value)}
                                                        placeholder="Contoh: ATC-2025-0012"
                                                        className="w-full h-8.5 px-2.5 text-xs font-mono text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder-slate-400"
                                                    />
                                                </div>

                                                <div className="sm:w-48">
                                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                                        Status Operasional
                                                    </label>
                                                    <select
                                                        value={m.status || 'OPERATIONAL'}
                                                        onChange={(e) => updateMachine(idx, 'status', e.target.value)}
                                                        className="w-full h-8.5 px-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer"
                                                    >
                                                        <option value="OPERATIONAL">OPERATIONAL</option>
                                                        <option value="MAINTENANCE">MAINTENANCE</option>
                                                        <option value="OFFLINE">OFFLINE</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Tombol Tambah Mesin Lain (Soft Background) */}
                            <div className="pt-1">
                                <button
                                    type="button"
                                    onClick={addMachine}
                                    className="w-full py-3 px-4 rounded-xl border border-dashed border-blue-200 bg-blue-50/70 hover:bg-blue-100/90 text-blue-700 font-bold text-xs transition flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs cursor-pointer group"
                                >
                                    <Plus className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                                    <span>Tambah Mesin Lain</span>
                                </button>
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
                                                className={`w-full h-9 pl-9 pr-3 text-xs font-mono rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition shadow-2xs ${
                                                    errors.landlord_phone
                                                        ? 'border border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/15'
                                                        : 'border border-slate-200/90 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white'
                                                }`}
                                            />
                                        </div>
                                        {errors.landlord_phone && <span className="text-rose-500 text-[11px] mt-1 block">{errors.landlord_phone}</span>}
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
                                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">No. Kontrak Kerjasama</label>
                                            <input
                                                type="text"
                                                value={data.contract_vgreen_doc_number}
                                                onChange={(e) => setData('contract_vgreen_doc_number', e.target.value)}
                                                placeholder="KTR/VG-SSI/2025/001"
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
                                                    className={`w-full h-8.5 px-2.5 text-xs bg-white rounded-lg text-slate-900 focus:outline-hidden cursor-pointer ${
                                                        errors.contract_vgreen_start_date
                                                            ? 'border border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/15'
                                                            : 'border border-slate-200/90 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                                                    }`}
                                                />
                                                {errors.contract_vgreen_start_date && <span className="text-rose-500 text-[10px] mt-0.5 block">{errors.contract_vgreen_start_date}</span>}
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jatuh Tempo</label>
                                                <input
                                                    type="date"
                                                    value={data.contract_vgreen_end_date}
                                                    onChange={(e) => setData('contract_vgreen_end_date', e.target.value)}
                                                    className={`w-full h-8.5 px-2.5 text-xs bg-white rounded-lg text-slate-900 focus:outline-hidden cursor-pointer ${
                                                        errors.contract_vgreen_end_date
                                                            ? 'border border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/15'
                                                            : 'border border-slate-200/90 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                                                    }`}
                                                />
                                                {errors.contract_vgreen_end_date && <span className="text-rose-500 text-[10px] mt-0.5 block">{errors.contract_vgreen_end_date}</span>}
                                            </div>
                                        </div>

                                        {/* Quick Preset Durasi Kontrak */}
                                        <div className="pt-2 border-t border-blue-100">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] font-semibold text-slate-500">Preset Durasi (Auto-Hitung):</span>
                                                {vgreenDurationYears && (
                                                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded">
                                                        {vgreenDurationYears} Tahun Aktif
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {[1, 2, 3, 5, 10].map((yr) => {
                                                    const isActive = vgreenDurationYears === yr;
                                                    return (
                                                        <button
                                                            key={yr}
                                                            type="button"
                                                            onClick={() => handleApplyDuration('contract_vgreen_start_date', 'contract_vgreen_end_date', yr)}
                                                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition shadow-2xs cursor-pointer ${
                                                                isActive
                                                                    ? 'bg-blue-600 text-white border border-blue-600 shadow-xs'
                                                                    : 'bg-white hover:bg-blue-100/60 border border-blue-200/90 text-blue-900 hover:text-blue-700'
                                                            }`}
                                                            title={`Hitung jatuh tempo ${yr} tahun dari tanggal mulai`}
                                                        >
                                                            {yr} Thn
                                                        </button>
                                                    );
                                                })}
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
                                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">No. Kontrak Sewa Lahan</label>
                                            <input
                                                type="text"
                                                value={data.contract_landlord_doc_number}
                                                onChange={(e) => setData('contract_landlord_doc_number', e.target.value)}
                                                placeholder="KTR/SSI-LND/2025/001"
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
                                                    className={`w-full h-8.5 px-2.5 text-xs bg-white rounded-lg text-slate-900 focus:outline-hidden cursor-pointer ${
                                                        errors.contract_landlord_start_date
                                                            ? 'border border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/15'
                                                            : 'border border-slate-200/90 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                                                    }`}
                                                />
                                                {errors.contract_landlord_start_date && <span className="text-rose-500 text-[10px] mt-0.5 block">{errors.contract_landlord_start_date}</span>}
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jatuh Tempo Sewa</label>
                                                <input
                                                    type="date"
                                                    value={data.contract_landlord_end_date}
                                                    onChange={(e) => setData('contract_landlord_end_date', e.target.value)}
                                                    className={`w-full h-8.5 px-2.5 text-xs font-bold text-slate-900 bg-white rounded-lg focus:outline-hidden cursor-pointer ${
                                                        errors.contract_landlord_end_date
                                                            ? 'border border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/15'
                                                            : 'border border-slate-200/90 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                                                    }`}
                                                />
                                                {errors.contract_landlord_end_date && <span className="text-rose-500 text-[10px] mt-0.5 block">{errors.contract_landlord_end_date}</span>}
                                            </div>
                                        </div>

                                        {/* Quick Preset Durasi Sewa */}
                                        <div className="pt-2 border-t border-amber-100">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] font-semibold text-slate-500">Preset Durasi (Auto-Hitung):</span>
                                                {landlordDurationYears && (
                                                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded">
                                                        {landlordDurationYears} Tahun Aktif
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {[1, 2, 3, 5, 10].map((yr) => {
                                                    const isActive = landlordDurationYears === yr;
                                                    return (
                                                        <button
                                                            key={yr}
                                                            type="button"
                                                            onClick={() => handleApplyDuration('contract_landlord_start_date', 'contract_landlord_end_date', yr)}
                                                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition shadow-2xs cursor-pointer ${
                                                                isActive
                                                                    ? 'bg-amber-600 text-white border border-amber-600 shadow-xs'
                                                                    : 'bg-white hover:bg-amber-100/60 border border-amber-200/90 text-amber-900 hover:text-amber-700'
                                                            }`}
                                                            title={`Hitung jatuh tempo ${yr} tahun dari tanggal mulai`}
                                                        >
                                                            {yr} Thn
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
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
                                key="btn-cancel"
                                type="button"
                                onClick={onClose}
                                className="h-9 px-4 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
                            >
                                Batal
                            </button>

                            {currentStep > 1 && (
                                <button
                                    key="btn-prev"
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setCurrentStep((prev) => (prev > 1 ? (prev - 1) as 1 | 2 : 1));
                                    }}
                                    className="h-9 px-4 rounded-lg border border-slate-200/90 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    <span>Sebelumnya</span>
                                </button>
                            )}

                            {currentStep < 3 ? (
                                <button
                                    key={`btn-next-${currentStep}`}
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setCurrentStep((prev) => (prev < 3 ? (prev + 1) as 2 | 3 : 3));
                                    }}
                                    className="h-9 px-4.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    <span>Lanjut ke Langkah {currentStep + 1}</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <button
                                    key="btn-submit"
                                    type="submit"
                                    disabled={processing}
                                    className="h-9 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
            initialAddress={data.address}
            initialPostalCode={data.postal_code}
            onConfirm={(coords) => {
                setData((prev) => ({
                    ...prev,
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    ...(coords.province ? { province: coords.province } : {}),
                    ...(coords.city ? { city: coords.city } : {}),
                    ...(coords.postal_code ? { postal_code: coords.postal_code } : {}),
                    ...(coords.address ? { address: coords.address } : {}),
                }));
            }}
        />
    </>
);
}
