import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { X, Cpu, Layers, Zap, Plug, Hash, FileText, Gauge, Scale, Ruler } from 'lucide-react';
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
        <Modal show={show} onClose={onClose} maxWidth="5xl">
            <div className="bg-white rounded-3xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                {isEditing ? 'Ubah Model Mesin' : 'Tambah Model Mesin Baru'}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Lengkapi spesifikasi teknis model charger atau kabinet baterai untuk master katalog
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* 2-COLUMN GRID BODY */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* ========================================================
                            KOLOM KIRI: Identitas, Fisik, dan Catatan
                        ======================================================== */}
                        <div className="space-y-4">
                            {/* Group 1: Identitas & Model */}
                            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3.5">
                                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <Cpu className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Identitas Model Mesin</span>
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Kategori</span>
                                            <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={data.category_id}
                                            onChange={(e) => setData('category_id', e.target.value)}
                                            className={`w-full bg-white border rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
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
                                            className={`w-full bg-[#F8FAFC] border rounded-xl px-3 py-2 text-xs font-mono font-bold tracking-wider text-slate-900 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                                                errors.code ? 'border-rose-400' : 'border-slate-200'
                                            }`}
                                        />
                                        {errors.code && <p className="mt-1 text-[11px] text-rose-500">{errors.code}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                            className={`w-full bg-white border rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                                                errors.brand ? 'border-rose-400' : 'border-slate-200'
                                            }`}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Seri Model
                                        </label>
                                        <input
                                            type="text"
                                            value={data.model_series}
                                            onChange={(e) => setData('model_series', e.target.value)}
                                            placeholder="DC Wallbox Series"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Nama Model Mesin
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="VinFast DC 60kW Dual Gun"
                                        className={`w-full bg-white border rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                                            errors.name ? 'border-rose-400' : 'border-slate-200'
                                        }`}
                                    />
                                    {errors.name && <p className="mt-1 text-[11px] text-rose-500">{errors.name}</p>}
                                </div>
                            </div>

                            {/* Group 2: Spesifikasi Fisik & Ukuran */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5">
                                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <Ruler className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Spesifikasi Fisik Unit</span>
                                </h4>

                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                        Dimensi (H × W × D)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.dimensions}
                                        onChange={(e) => setData('dimensions', e.target.value)}
                                        placeholder="H1650 x W720 x D400mm"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
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
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Group 3: Status Katalog Aktif */}
                            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between">
                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="w-4 h-4 rounded-sm text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <div>
                                        <span className="text-xs font-bold text-slate-800 block">
                                            Katalog Aktif
                                        </span>
                                        <span className="text-[11px] text-slate-400 block">
                                            Dapat dipilih saat pendaftaran titik stasiun baru
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* ========================================================
                            KOLOM KANAN: Kapasitas Listrik & Kelistrikan AC/DC
                        ======================================================== */}
                        <div className="space-y-4">
                            {/* Group 4: Kapasitas Daya & Soket */}
                            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3.5">
                                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Kapasitas Daya & Soket</span>
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Daya Output (kW)
                                            <span className="text-rose-500 ml-0.5">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={data.power_capacity_kw}
                                            onChange={(e) => setData('power_capacity_kw', parseInt(e.target.value) || 0)}
                                            className={`w-full bg-white border rounded-xl px-3 py-2 text-xs font-bold text-slate-900 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                                                errors.power_capacity_kw ? 'border-rose-400' : 'border-slate-200'
                                            }`}
                                        />
                                        {errors.power_capacity_kw && <p className="mt-1 text-[11px] text-rose-500">{errors.power_capacity_kw}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Jml Gun / Slot
                                            <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={data.slot_or_gun_count}
                                            onChange={(e) => setData('slot_or_gun_count', parseInt(e.target.value) || 1)}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>

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
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>

                            {/* Group 5: Spesifikasi Kelistrikan AC & DC */}
                            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3.5">
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
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
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
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
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
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
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
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Group 6: Deskripsi / Catatan Teknis */}
                            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Deskripsi / Catatan Teknis</span>
                                </label>
                                <textarea
                                    rows={2}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Keterangan operasional mesin, catatan kabel atau instalasi..."
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2.5 rounded-2xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20 transition disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambah ke Katalog'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
