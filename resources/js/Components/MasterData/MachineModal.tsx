import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { X, Cpu, Layers, Zap, Plug, Hash, FileText, Gauge, Scale, Ruler, Sparkles } from 'lucide-react';
import Modal from '@/Components/Modal';
import { MachineCategory, MasterMachine } from '@/types/station';

interface MachineModalProps {
    show: boolean;
    onClose: () => void;
    machineToEdit?: MasterMachine | null;
    categories: MachineCategory[];
}

export default function MachineModal({
    show,
    onClose,
    machineToEdit,
    categories,
}: MachineModalProps) {
    const isEditing = !!machineToEdit;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        category_id: categories[0]?.id || '',
        code: '',
        name: '',
        brand: 'VinFast',
        model_series: '',
        power_capacity_kw: 60,
        socket_types: '2x CCS2 Dual Gun (200A + 200A)',
        slot_or_gun_count: 2,
        dimensions: '',
        weight: '',
        cable_length: '',
        input_voltage: '400VAC ±10%, 50/60Hz, 3 Phase + N + PE',
        input_current: '',
        output_voltage: '150 ~ 1 000 VDC',
        output_current: '',
        description: '',
        is_active: true,
    });

    useEffect(() => {
        if (machineToEdit) {
            setData({
                category_id: machineToEdit.category_id,
                code: machineToEdit.code || '',
                name: machineToEdit.name || '',
                brand: machineToEdit.brand || 'VinFast',
                model_series: machineToEdit.model_series || '',
                power_capacity_kw: machineToEdit.power_capacity_kw ?? 60,
                socket_types: machineToEdit.socket_types || '',
                slot_or_gun_count: machineToEdit.slot_or_gun_count ?? 2,
                dimensions: machineToEdit.dimensions || '',
                weight: machineToEdit.weight || '',
                cable_length: machineToEdit.cable_length || '',
                input_voltage: machineToEdit.input_voltage || '',
                input_current: machineToEdit.input_current || '',
                output_voltage: machineToEdit.output_voltage || '',
                output_current: machineToEdit.output_current || '',
                description: machineToEdit.description || '',
                is_active: machineToEdit.is_active ?? true,
            });
        } else {
            reset();
            if (categories.length > 0) {
                setData('category_id', categories[0].id);
            }
        }
        clearErrors();
    }, [machineToEdit, show]);

    // Apply Official Presets (EVCS VinFast & BSS V-Green)
    const applyPreset = (preset: 'vf-20' | 'vf-30' | 'vf-60' | 'vg-bss12' | 'vg-bss6') => {
        const evcsCat = categories.find((c) => c.code === 'EVCS') || categories[0];
        const bssCat = categories.find((c) => c.code === 'BSS') || categories[0];

        if (preset === 'vf-20') {
            setData((prev) => ({
                ...prev,
                category_id: evcsCat?.id || prev.category_id,
                code: 'VF-DC-20KW',
                name: 'VinFast DC 20kW',
                brand: 'VinFast',
                model_series: 'DC Wallbox Series',
                power_capacity_kw: 20,
                socket_types: '1x CCS2 Fast Gun (55A)',
                slot_or_gun_count: 1,
                dimensions: 'H490 x W740 x D396mm',
                weight: '≤ 100kg',
                cable_length: '≥ 6m',
                input_voltage: '400VAC ±10%, 50/60Hz, 3 Phase + N + PE',
                input_current: '32A (Rating 21kW)',
                output_voltage: '150 ~ 1 000 VDC',
                output_current: '20kW, 55A',
                description: 'Wallbox DC Charger 20kW VinFast berstandar 400VAC 3-Phase untuk pengisian EVCS mobil listrik, output 150-1000 VDC 55A dengan kabel 6 meter.',
            }));
        } else if (preset === 'vf-30') {
            setData((prev) => ({
                ...prev,
                category_id: evcsCat?.id || prev.category_id,
                code: 'VF-DC-30KW',
                name: 'VinFast DC 30kW',
                brand: 'VinFast',
                model_series: 'DC Wallbox Series',
                power_capacity_kw: 30,
                socket_types: '1x CCS2 Fast Gun (80A)',
                slot_or_gun_count: 1,
                dimensions: 'H490 x W740 x D396mm (No columns)',
                weight: '≤ 100kg',
                cable_length: '≥ 5m',
                input_voltage: '400VAC ±10%, 50/60Hz, 3 Phase + N + PE',
                input_current: '48A (Rating 32kW)',
                output_voltage: '150 ~ 1 000 VDC',
                output_current: '30kW, 80A (Max)',
                description: 'Wallbox DC Charger 30kW VinFast berstandar 400VAC 3-Phase untuk pengisian EVCS mobil listrik, output 150-1000 VDC 80A dengan kabel 5 meter.',
            }));
        } else if (preset === 'vf-60') {
            setData((prev) => ({
                ...prev,
                category_id: evcsCat?.id || prev.category_id,
                code: 'VF-DC-60KW',
                name: 'VinFast DC 60kW',
                brand: 'VinFast',
                model_series: 'DC Commercial Dispenser',
                power_capacity_kw: 60,
                socket_types: '2x CCS2 Dual Gun (200A + 200A)',
                slot_or_gun_count: 2,
                dimensions: 'H1650 x W720 x D400mm',
                weight: '≤ 250kg',
                cable_length: '≥ 6m',
                input_voltage: '400VAC ±10%, 50/60Hz, 3 Phase + N + PE',
                input_current: '96A (Rating 63kW)',
                output_voltage: '150 ~ 1 000 VDC',
                output_current: '60kW, 200A + 200A',
                description: 'Commercial Standing Dispenser DC Fast Charger 60kW VinFast Dual Gun (200A + 200A) berstandar 400VAC 3-Phase dengan kabel 6 meter untuk EVCS mobil listrik.',
            }));
        } else if (preset === 'vg-bss12') {
            setData((prev) => ({
                ...prev,
                category_id: bssCat?.id || prev.category_id,
                code: 'VG-BSS-12S',
                name: 'V-Green BSS Cabinet 12-Slot',
                brand: 'V-Green',
                model_series: 'Smart BSS Cabinet 12-Bay',
                power_capacity_kw: 10,
                socket_types: '12 Battery Slots (11 Active LFP + 1 Swap Bay)',
                slot_or_gun_count: 12,
                dimensions: 'H1850 x W1000 x D600mm',
                weight: '≤ 280kg',
                cable_length: 'Internal Bay Busbar',
                input_voltage: '380VAC ±10%, 50Hz, 3 Phase + N + PE',
                input_current: '16A - 25A (Rating 10kW)',
                output_voltage: '72 VDC (Baterai LFP 1.5 kWh)',
                output_current: 'Multi-bay Intelligent Fast Charging',
                description: 'Kabinet penukaran baterai pintar 12-slot standar nasional V-Green untuk motor listrik VinFast (Evo, Feliz II). Dilengkapi 11 slot baterai terisi + 1 slot swap kosong otomatis via QR Code aplikasi VinFast.',
            }));
        } else if (preset === 'vg-bss6') {
            setData((prev) => ({
                ...prev,
                category_id: bssCat?.id || prev.category_id,
                code: 'VG-BSS-6S',
                name: 'V-Green BSS Cabinet 6-Slot Compact',
                brand: 'V-Green',
                model_series: 'Smart BSS Cabinet 6-Bay Compact',
                power_capacity_kw: 5,
                socket_types: '6 Battery Slots (5 Active LFP + 1 Swap Bay)',
                slot_or_gun_count: 6,
                dimensions: 'H1600 x W650 x D600mm',
                weight: '≤ 150kg',
                cable_length: 'Internal Bay Busbar',
                input_voltage: '220VAC ±10%, 50Hz, 1 Phase + N + PE',
                input_current: '16A - 20A (Rating 5kW)',
                output_voltage: '72 VDC (Baterai LFP 1.5 kWh)',
                output_current: 'Multi-bay Intelligent Fast Charging',
                description: 'Kabinet penukaran baterai pintar 6-slot kompak V-Green untuk kemitraan minimarket dan area komersial urban. 5 slot baterai aktif + 1 slot swap kosong otomatis via QR Code aplikasi VinFast.',
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing && machineToEdit) {
            put(route('master-data.machines.update', { machine: machineToEdit.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        } else {
            post(route('master-data.machines.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        }
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="bg-white rounded-3xl p-7 relative max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                            {isEditing ? 'Ubah Model Mesin' : 'Tambah Model Mesin Baru'}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Preset Cepat Bar (Only for Add Mode) */}
                {!isEditing && (
                    <div className="mb-5 p-3.5 rounded-2xl bg-linear-to-r from-blue-50/80 via-slate-50 to-emerald-50/80 border border-blue-200/60 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                                <span>Preset Cepat Spesifikasi:</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-semibold">1-Klik untuk mengisi form otomatis</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {/* EVCS Group */}
                            <div className="flex items-center gap-1 bg-white/90 p-1 rounded-xl border border-blue-200 shadow-2xs">
                                <span className="text-[10px] font-black uppercase text-blue-700 px-1.5">EVCS:</span>
                                <button
                                    type="button"
                                    onClick={() => applyPreset('vf-20')}
                                    className="px-2 py-1 rounded-lg text-xs font-bold text-blue-700 hover:bg-blue-600 hover:text-white transition"
                                >
                                    DC 20kW
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyPreset('vf-30')}
                                    className="px-2 py-1 rounded-lg text-xs font-bold text-blue-700 hover:bg-blue-600 hover:text-white transition"
                                >
                                    DC 30kW
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyPreset('vf-60')}
                                    className="px-2 py-1 rounded-lg text-xs font-bold text-blue-700 hover:bg-blue-600 hover:text-white transition"
                                >
                                    DC 60kW Dual
                                </button>
                            </div>

                            {/* BSS Group */}
                            <div className="flex items-center gap-1 bg-white/90 p-1 rounded-xl border border-emerald-200 shadow-2xs">
                                <span className="text-[10px] font-black uppercase text-emerald-700 px-1.5">BSS (V-Green):</span>
                                <button
                                    type="button"
                                    onClick={() => applyPreset('vg-bss12')}
                                    className="px-2 py-1 rounded-lg text-xs font-bold text-emerald-700 hover:bg-emerald-600 hover:text-white transition"
                                >
                                    BSS 12-Slot
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyPreset('vg-bss6')}
                                    className="px-2 py-1 rounded-lg text-xs font-bold text-emerald-700 hover:bg-emerald-600 hover:text-white transition"
                                >
                                    BSS 6-Slot Compact
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* SECTION 1: IDENTITAS DASAR */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                <Layers className="w-3.5 h-3.5 text-slate-400" />
                                <span>Kategori</span>
                                <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={data.category_id}
                                onChange={(e) => setData('category_id', Number(e.target.value))}
                                className={`w-full bg-white border rounded-2xl px-3 py-2 text-xs font-semibold text-slate-900 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                                    errors.category_id ? 'border-rose-400' : 'border-slate-200'
                                }`}
                            >
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.code} - {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                <Hash className="w-3.5 h-3.5 text-slate-400" />
                                <span>Kode Model (SKU)</span>
                                <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                placeholder="VF-DC-60KW"
                                className={`w-full bg-[#F8FAFC] border rounded-2xl px-3 py-2 text-xs font-mono font-bold tracking-wider text-slate-900 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                                    errors.code ? 'border-rose-400' : 'border-slate-200'
                                }`}
                            />
                            {errors.code && <p className="mt-1 text-[11px] text-rose-500">{errors.code}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Merk / Brand
                                <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.brand}
                                onChange={(e) => setData('brand', e.target.value)}
                                placeholder="VinFast"
                                className={`w-full bg-white border rounded-2xl px-3 py-2 text-xs font-semibold text-slate-900 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                                    errors.brand ? 'border-rose-400' : 'border-slate-200'
                                }`}
                            />
                        </div>
                    </div>

                    {/* SECTION 2: NAMA & DAYA */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Nama Model Mesin
                                <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="VinFast DC 60kW Dual Gun"
                                className={`w-full bg-white border rounded-2xl px-3 py-2 text-xs font-semibold text-slate-900 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                                    errors.name ? 'border-rose-400' : 'border-slate-200'
                                }`}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                <span>Daya Output (kW)</span>
                                <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={data.power_capacity_kw}
                                onChange={(e) => setData('power_capacity_kw', parseInt(e.target.value) || 0)}
                                className={`w-full bg-white border rounded-2xl px-3 py-2 text-xs font-bold text-slate-900 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                                    errors.power_capacity_kw ? 'border-rose-400' : 'border-slate-200'
                                }`}
                            />
                        </div>
                    </div>

                    {/* SECTION 3: SPESIFIKASI FISIK & KABEL */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Ruler className="w-3.5 h-3.5 text-blue-600" />
                            <span>Spesifikasi Fisik & Colokan</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                    Dimensi (H × W × D)
                                </label>
                                <input
                                    type="text"
                                    value={data.dimensions}
                                    onChange={(e) => setData('dimensions', e.target.value)}
                                    placeholder="H1650 x W720 x D400mm"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                                    <Scale className="w-3 h-3 text-slate-400" />
                                    <span>Berat Unit</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.weight}
                                    onChange={(e) => setData('weight', e.target.value)}
                                    placeholder="≤ 250kg"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                    Panjang Kabel
                                </label>
                                <input
                                    type="text"
                                    value={data.cable_length}
                                    onChange={(e) => setData('cable_length', e.target.value)}
                                    placeholder="≥ 6m"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                                    <Plug className="w-3 h-3 text-slate-400" />
                                    <span>Tipe Soket & Colokan</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.socket_types}
                                    onChange={(e) => setData('socket_types', e.target.value)}
                                    placeholder="2x CCS2 Dual Gun (200A + 200A)"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                    Jml Gun / Slot
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={data.slot_or_gun_count}
                                    onChange={(e) => setData('slot_or_gun_count', parseInt(e.target.value) || 1)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: KELISTRIKAN INPUT / OUTPUT */}
                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                        <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                            <Gauge className="w-3.5 h-3.5 text-blue-600" />
                            <span>Spesifikasi Kelistrikan AC & DC</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                    Tegangan Input (AC)
                                </label>
                                <input
                                    type="text"
                                    value={data.input_voltage}
                                    onChange={(e) => setData('input_voltage', e.target.value)}
                                    placeholder="400VAC ±10%, 50/60Hz, 3 Phase + N + PE"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                    Arus / Rating Input
                                </label>
                                <input
                                    type="text"
                                    value={data.input_current}
                                    onChange={(e) => setData('input_current', e.target.value)}
                                    placeholder="96A (Rating 63kW)"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                    Rentang Tegangan Output (DC)
                                </label>
                                <input
                                    type="text"
                                    value={data.output_voltage}
                                    onChange={(e) => setData('output_voltage', e.target.value)}
                                    placeholder="150 ~ 1 000 VDC"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                    Arus Output (DC)
                                </label>
                                <input
                                    type="text"
                                    value={data.output_current}
                                    onChange={(e) => setData('output_current', e.target.value)}
                                    placeholder="60kW, 200A + 200A"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 5: DESKRIPSI & STATUS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-center">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                <span>Deskripsi / Catatan Teknis</span>
                            </label>
                            <input
                                type="text"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Keterangan operasional..."
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                            />
                        </div>

                        <div className="pt-4">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="w-4 h-4 rounded-sm text-blue-600 border-slate-300 focus:ring-blue-500"
                                />
                                <span className="text-xs font-bold text-slate-800">
                                    Katalog Aktif
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20 transition disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambah ke Katalog'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
