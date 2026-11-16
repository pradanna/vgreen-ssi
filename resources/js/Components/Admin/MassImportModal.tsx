import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { X, UploadCloud, FileSpreadsheet, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface MassImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    importErrors?: Array<{ row: number; code: string; error: string }>;
}

export default function MassImportModal({
    isOpen,
    onClose,
    importErrors = [],
}: MassImportModalProps) {
    if (!isOpen) return null;

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        file: null as File | null,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setData('file', file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.file) return;

        post(route('admin.stations.import'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setSelectedFile(null);
            },
        });
    };

    // Generate downloadable CSV template
    const downloadSampleCsv = () => {
        const sampleContent = 
`code,name,facility_type_id,status_id,latitude,longitude,address,city,province,power_capacity_kw,socket_types,slot_count,vendor_name,pln_meter_id
VG-SBY-002,V-Green Hub Tunjungan Plaza,EVCS,OPERATIONAL,-7.2625,112.7410,"Jl. Basuki Rahmat No. 8-12",Surabaya,Jawa Timur,120,"2x CCS2 Fast Gun",2,PT Mitra Elektrik,PLN-SBY-441029
VG-DPS-002,V-Green Swap Sunset Road,BSS,CONSTRUCTION,-8.7042,115.1780,"Jl. Sunset Road No. 88, Kuta",Badung,Bali,25,"8-Slot BSS Cabinet",8,PT Konstruksi Jaya,PLN-DPS-889102`;

        const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'template_import_stasiun_vgreen.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div 
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
            onClick={onClose}
        >
            <div 
                className="max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[88vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 px-7 border-b border-slate-100 flex justify-between items-center bg-[#FCFCFD]">
                    <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                        Import Data Massal Titik Stasiun
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-800 bg-white border border-slate-200"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-7 overflow-y-auto space-y-6 flex-1 text-xs">
                    {/* Template download notice */}
                    <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                                <FileSpreadsheet className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="font-bold text-slate-900 block text-xs">
                                    Unduh Format Template Standar
                                </span>
                                <span className="text-[11px] text-slate-500">
                                    Pastikan kolom header sesuai agar validasi geolokasi berhasil.
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={downloadSampleCsv}
                            className="px-3.5 py-1.5 rounded-xl bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download CSV</span>
                        </button>
                    </div>

                    {/* Upload drop zone */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <label className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer bg-[#F8FAFC] hover:bg-blue-50/20 transition group">
                            <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition duration-200 mb-3" />
                            <span className="font-bold text-slate-800 text-sm">
                                {selectedFile ? selectedFile.name : 'Klik untuk memilih file CSV atau Spreadsheet'}
                            </span>
                            <span className="text-xs text-slate-400 mt-1">
                                {selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : 'Format didukung: .csv, .xlsx, .tsv (Maksimal 10MB)'}
                            </span>
                            <input
                                type="file"
                                accept=".csv,.xlsx,.tsv,text/csv"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>

                        {errors.file && (
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 font-semibold">
                                {errors.file}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={!selectedFile || processing}
                                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition disabled:opacity-50"
                            >
                                {processing ? 'Memproses Berkas...' : 'Mulai Import'}
                            </button>
                        </div>
                    </form>

                    {/* Line-by-line Validation Errors List (Milestone 5 Acceptance Criteria) */}
                    {importErrors.length > 0 && (
                        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                            <div className="flex items-center gap-2 text-rose-800 font-bold">
                                <AlertTriangle className="w-4 h-4 text-rose-600" />
                                <span>Peringatan Validasi Baris ({importErrors.length} Kesalahan Ditemukan):</span>
                            </div>
                            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                                {importErrors.map((err, i) => (
                                    <div key={i} className="text-[11px] p-2.5 rounded-xl bg-white border border-rose-100 text-rose-800">
                                        <strong className="font-mono text-rose-900">Baris {err.row} [{err.code}]:</strong> {err.error}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
