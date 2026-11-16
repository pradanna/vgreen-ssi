import React from 'react';
import { 
    X, 
    Cpu, 
    Zap, 
    Layers, 
    CheckCircle2, 
    Ruler, 
    Scale, 
    Cable, 
    Gauge, 
    FileText, 
    Edit3 
} from 'lucide-react';
import Modal from '@/Components/Modal';
import { MasterMachine } from '@/types/station';

interface MachineDetailModalProps {
    show: boolean;
    onClose: () => void;
    machine: MasterMachine | null;
    onEdit?: (machine: MasterMachine) => void;
}

export default function MachineDetailModal({
    show,
    onClose,
    machine,
    onEdit,
}: MachineDetailModalProps) {
    if (!machine) return null;

    const isBss = machine.category?.code === 'BSS';

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="bg-white rounded-3xl p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-slate-900">
                                    {machine.name}
                                </h3>
                                <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/80">
                                    {machine.code}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-5">
                    {/* Key Attributes Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/70">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Kategori
                            </span>
                            <div className="mt-1">
                                {isBss ? (
                                    <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 inline-flex items-center gap-1">
                                        <Layers className="w-3 h-3 text-emerald-600" />
                                        <span>BSS Motor</span>
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60 inline-flex items-center gap-1">
                                        <Zap className="w-3 h-3 fill-current text-blue-600" />
                                        <span>EVCS Mobil</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/70">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Daya Kapasitas
                            </span>
                            <div className="mt-1 font-bold text-slate-900 text-sm flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                <span>{machine.power_capacity_kw} kW</span>
                            </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/70">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                {isBss ? 'Slot Baterai' : 'Jumlah Gun'}
                            </span>
                            <div className="mt-1 font-bold text-slate-900 text-sm">
                                {machine.slot_or_gun_count} {isBss ? 'Slot' : 'Gun'}
                            </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/70">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Status Terpasang
                            </span>
                            <div className="mt-1">
                                {(machine.station_machines_count ?? 0) > 0 ? (
                                    <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 inline-flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                                        <span>{machine.station_machines_count} Titik</span>
                                    </span>
                                ) : (
                                    <span className="text-xs text-slate-400 italic">
                                        Belum terpasang
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Soket & Port */}
                    <div className="p-4 rounded-2xl bg-[#FAFBFD] border border-slate-200/80 space-y-2">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Gauge className="w-3.5 h-3.5 text-blue-600" />
                            <span>Spesifikasi Port / Kompartemen</span>
                        </span>
                        <p className="text-xs font-semibold text-slate-800">
                            {machine.socket_types || '-'}
                        </p>
                    </div>

                    {/* Section 2: Fisik & Dimensi */}
                    <div className="p-4 rounded-2xl bg-[#FAFBFD] border border-slate-200/80 space-y-3">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Ruler className="w-3.5 h-3.5 text-blue-600" />
                            <span>Dimensi & Karakteristik Fisik</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                                <span className="text-[10px] text-slate-400 font-semibold block">Dimensi (T × L × D)</span>
                                <span className="font-bold text-slate-800">{machine.dimensions || '-'}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                                <span className="text-[10px] text-slate-400 font-semibold block flex items-center gap-1">
                                    <Scale className="w-3 h-3" />
                                    <span>Bobot / Berat</span>
                                </span>
                                <span className="font-bold text-slate-800">{machine.weight || '-'}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
                                <span className="text-[10px] text-slate-400 font-semibold block flex items-center gap-1">
                                    <Cable className="w-3 h-3" />
                                    <span>Panjang Kabel</span>
                                </span>
                                <span className="font-bold text-slate-800">{machine.cable_length || '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Parameter Kelistrikan (AC & DC) */}
                    <div className="p-4 rounded-2xl bg-[#FAFBFD] border border-slate-200/80 space-y-3">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>Parameter Kelistrikan (Input & Output)</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="bg-white p-3 rounded-xl border border-slate-200/70 space-y-1">
                                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                                    Sisi Masukan (Input AC)
                                </span>
                                <div className="text-xs font-bold text-slate-800">
                                    {machine.input_voltage || '400VAC ±10%, 3 Phase + N + PE'}
                                </div>
                                {machine.input_current && (
                                    <div className="text-[11px] text-slate-500 font-medium">
                                        Arus Masukan: {machine.input_current}
                                    </div>
                                )}
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-200/70 space-y-1">
                                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                                    Sisi Keluaran (Output DC)
                                </span>
                                <div className="text-xs font-bold text-slate-800">
                                    {machine.output_voltage || '150 ~ 1 000 VDC'}
                                </div>
                                {machine.output_current && (
                                    <div className="text-[11px] text-slate-500 font-medium">
                                        Arus Keluaran: {machine.output_current}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Deskripsi */}
                    {machine.description && (
                        <div className="p-4 rounded-2xl bg-[#FAFBFD] border border-slate-200/80 space-y-1.5">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                <span>Deskripsi & Catatan Teknis</span>
                            </span>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                {machine.description}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 font-medium">
                        Model ID: #{machine.id}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                        >
                            Tutup
                        </button>
                        {onEdit && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onEdit(machine);
                                }}
                                className="px-4 py-2 rounded-2xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Ubah Spesifikasi</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
