import React, { useState } from 'react';
import { Station, PhotoItem } from '@/types/station';
import { useForm } from '@inertiajs/react';
import { 
    X, 
    MapPin, 
    Zap, 
    Car, 
    BatteryCharging, 
    Clock, 
    ExternalLink, 
    ShieldCheck, 
    AlertTriangle, 
    CheckCircle2, 
    XCircle, 
    Info, 
    Image as ImageIcon,
    Calendar,
    Building2,
    Compass,
    Check,
    MessageSquare
} from 'lucide-react';

interface StationDetailDrawerProps {
    station: Station | null;
    onClose: () => void;
    userRole: string; // DIRECTOR_SSI, ADMIN_SSI, VGREEN_REP, etc.
}

export default function StationDetailDrawer({
    station,
    onClose,
    userRole,
}: StationDetailDrawerProps) {
    if (!station) return null;

    const isVGreen = userRole === 'VGREEN_REP';
    const isInternal = userRole === 'DIRECTOR_SSI' || userRole === 'ADMIN_SSI';

    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PHOTOS' | 'APPROVAL'>('OVERVIEW');
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
    const [photoCategoryFilter, setPhotoCategoryFilter] = useState<'ALL' | 'LAHAN' | 'MESIN' | 'PANEL_TIANG'>('ALL');

    // Review form for Direktur / Admin
    const { data, setData, post, processing } = useForm({
        action: 'APPROVE',
        notes: '',
    });

    const latestInspection = station.latest_inspection;

    const handleApprovalSubmit = (action: 'APPROVE' | 'REJECT') => {
        if (!latestInspection) return;
        
        data.action = action;
        post(route('stations.inspections.review', { station: station.id, report: latestInspection.id }), {
            preserveScroll: true,
            onSuccess: () => {
                alert(`Laporan titik ${station.code} berhasil diproses.`);
            },
        });
    };

    // Color and icon styling
    let statusBg = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (station.status_id === 'CONSTRUCTION') statusBg = 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    if (station.status_id === 'SURVEYED') statusBg = 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
    if (station.status_id === 'ON_HOLD') statusBg = 'bg-red-500/15 text-red-400 border-red-500/30';

    // Photos list
    const allPhotos: PhotoItem[] = isVGreen 
        ? (station.verified_photos || [])
        : (latestInspection?.photos || []);

    const filteredPhotos = allPhotos.filter(p => {
        if (photoCategoryFilter === 'ALL') return true;
        return p.category === photoCategoryFilter;
    });

    return (
        <>
            {/* Backdrop on mobile */}
            <div 
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
                onClick={onClose}
            />

            {/* Slide-over Drawer Panel */}
            <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] lg:w-[540px] bg-slate-900 border-l border-slate-800 z-50 flex flex-col shadow-2xl transition-transform duration-300">
                {/* Header */}
                <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {station.code}
                            </span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border flex items-center gap-1 ${statusBg}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                {station.status.name}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                                {station.facility_type.name}
                            </span>
                        </div>
                        <h2 className="text-lg font-bold text-white truncate" title={station.name}>
                            {station.name}
                        </h2>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            {station.city}, {station.province}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-800 px-5 bg-slate-950/20 text-xs">
                    <button
                        onClick={() => setActiveTab('OVERVIEW')}
                        className={`py-3 px-3 border-b-2 font-medium transition ${
                            activeTab === 'OVERVIEW'
                                ? 'border-emerald-500 text-emerald-400'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Ringkasan Titik
                    </button>
                    <button
                        onClick={() => setActiveTab('PHOTOS')}
                        className={`py-3 px-3 border-b-2 font-medium flex items-center gap-1.5 transition ${
                            activeTab === 'PHOTOS'
                                ? 'border-emerald-500 text-emerald-400'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <span>Dokumentasi Foto ({allPhotos.length})</span>
                        {!isVGreen && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                                7 Sudut
                            </span>
                        )}
                    </button>
                    {isInternal && latestInspection && (
                        <button
                            onClick={() => setActiveTab('APPROVAL')}
                            className={`py-3 px-3 border-b-2 font-medium flex items-center gap-1.5 transition ${
                                activeTab === 'APPROVAL'
                                    ? 'border-emerald-500 text-emerald-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>Verifikasi & QC</span>
                        </button>
                    )}
                </div>

                {/* Tab Contents (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 text-slate-200 text-sm">
                    {/* OVERVIEW TAB */}
                    {activeTab === 'OVERVIEW' && (
                        <>
                            {/* V-Green Verification Banner */}
                            {isVGreen && (
                                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                                    <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                                    <div>
                                        <div className="font-semibold text-emerald-300 text-xs">
                                            Data Resmi Terverifikasi V-Green
                                        </div>
                                        <div className="text-[11px] text-emerald-200/80">
                                            Spesifikasi dan koordinat titik ini telah divalidasi oleh tim pengawas PT SSI & V-Green.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Technical Specifications Grid */}
                            <div>
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                                    Spesifikasi Pengisian Daya
                                </h3>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
                                        <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                                            Kapasitas Daya
                                        </span>
                                        <span className="text-base font-bold text-white mt-1">
                                            {station.power_capacity_kw ? `${station.power_capacity_kw} kW` : 'Standar'}
                                        </span>
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
                                        <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                                            Jam Operasional
                                        </span>
                                        <span className="text-base font-bold text-white mt-1">
                                            {station.operational_hours}
                                        </span>
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 col-span-2">
                                        <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                            {station.facility_type_id === 'BSS' ? (
                                                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                                            ) : (
                                                <Car className="w-3.5 h-3.5 text-emerald-400" />
                                            )}
                                            Tipe Soket & Port
                                        </span>
                                        <span className="text-sm font-semibold text-white mt-1 block">
                                            {station.socket_types || 'CCS2 Combo / Fast Gun'}
                                        </span>
                                        <span className="text-xs text-slate-400 mt-0.5 block">
                                            Kapasitas: {station.slot_count} Slot Pengisian
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Location Details & Navigation Link */}
                            <div>
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                                    Lokasi & Alamat
                                </h3>
                                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        {station.address}
                                    </p>
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs">
                                        <span className="font-mono text-slate-400 text-[11px]">
                                            GPS: {station.latitude.toFixed(5)}, {station.longitude.toFixed(5)}
                                        </span>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium transition"
                                        >
                                            <span>Buka di Google Maps</span>
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Amenities Chips */}
                            {station.amenities && station.amenities.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                        Fasilitas Sekitar
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {station.amenities.map((item, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs border border-slate-700/60"
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* INTERNAL SSI DETAILS (Hidden from V-Green) */}
                            {isInternal && (
                                <div className="pt-3 border-t border-slate-800">
                                    <div className="flex items-center justify-between mb-2.5">
                                        <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Building2 className="w-3.5 h-3.5" />
                                            Data Operasional Internal PT SSI
                                        </h3>
                                        <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                                            Internal Only
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-xs">
                                        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Vendor Pelaksana:</span>
                                                <span className="font-medium text-slate-200">{station.vendor_name || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">ID Pelanggan PLN:</span>
                                                <span className="font-mono text-slate-200">{station.pln_meter_id || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Tgl Survei Lahan:</span>
                                                <span className="text-slate-200">{station.survey_date || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Target Go-Live:</span>
                                                <span className="text-slate-200">{station.target_completion_date || station.commissioning_date || '-'}</span>
                                            </div>
                                        </div>

                                        {station.internal_notes && (
                                            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
                                                <span className="text-[11px] text-slate-400 font-semibold block mb-1">
                                                    Catatan Lapangan & Rekomendasi:
                                                </span>
                                                <p className="text-slate-300 italic">
                                                    "{station.internal_notes}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* PHOTOS TAB: 7-Angle Inspection Checklist */}
                    {activeTab === 'PHOTOS' && (
                        <div className="space-y-4">
                            {/* Filter category pills */}
                            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                                <button
                                    onClick={() => setPhotoCategoryFilter('ALL')}
                                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                                        photoCategoryFilter === 'ALL'
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Semua ({allPhotos.length})
                                </button>
                                <button
                                    onClick={() => setPhotoCategoryFilter('LAHAN')}
                                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                                        photoCategoryFilter === 'LAHAN'
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Lahan
                                </button>
                                <button
                                    onClick={() => setPhotoCategoryFilter('MESIN')}
                                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                                        photoCategoryFilter === 'MESIN'
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Mesin Charger
                                </button>
                                <button
                                    onClick={() => setPhotoCategoryFilter('PANEL_TIANG')}
                                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                                        photoCategoryFilter === 'PANEL_TIANG'
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Panel & Tiang
                                </button>
                            </div>

                            {/* Checklist Instruction for Internal */}
                            {isInternal && (
                                <div className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                                    Standarisasi 7 Sudut Foto Lapangan: Lahan (Depan, Samping, Akses), Mesin (Depan, Belakang), Panel & Tiang (Depan, Belakang).
                                </div>
                            )}

                            {/* Photos Grid */}
                            {filteredPhotos.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 bg-slate-950/20 rounded-2xl border border-dashed border-slate-800">
                                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                    <span>Belum ada foto yang tersedia untuk kategori ini.</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {filteredPhotos.map((photo, index) => (
                                        <div
                                            key={index}
                                            onClick={() => setSelectedPhoto(photo)}
                                            className="group cursor-pointer rounded-xl overflow-hidden bg-slate-800 border border-slate-700 hover:border-emerald-500/60 transition flex flex-col shadow-lg"
                                        >
                                            <div className="relative aspect-video bg-slate-950 overflow-hidden">
                                                <img
                                                    src={photo.photo_url}
                                                    alt={photo.slot_label}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                />
                                                <span className="absolute bottom-1.5 left-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/80 backdrop-blur-sm text-slate-200 border border-slate-700/60">
                                                    {photo.angle || photo.slot_label}
                                                </span>
                                                {photo.is_approved && (
                                                    <span className="absolute top-1.5 right-1.5 p-1 rounded-full bg-emerald-500 text-white shadow">
                                                        <Check className="w-3 h-3" />
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-2.5 text-xs">
                                                <div className="font-semibold text-slate-200 truncate" title={photo.slot_label}>
                                                    {photo.slot_label}
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between">
                                                    <span>{photo.category}</span>
                                                    <span>{photo.taken_at || 'Terverifikasi'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* APPROVAL & QC TAB (Internal Direktur / Admin only) */}
                    {isInternal && activeTab === 'APPROVAL' && latestInspection && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">Status Pengajuan:</span>
                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                        {latestInspection.approval_status_name || latestInspection.approval_status_id}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400">Diajukan Oleh:</span>
                                    <span className="font-medium text-slate-200">{latestInspection.submitted_by_name || 'Vendor Lapangan'}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400">Waktu Pengajuan:</span>
                                    <span className="font-mono text-slate-300">{latestInspection.submitted_at || '-'}</span>
                                </div>
                                {latestInspection.rejection_reason && (
                                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                                        <strong>Catatan Penolakan Sebelumnya:</strong>
                                        <p className="mt-0.5">{latestInspection.rejection_reason}</p>
                                    </div>
                                )}
                            </div>

                            {/* Action Form */}
                            <div className="space-y-3 pt-2">
                                <label className="block text-xs font-medium text-slate-300">
                                    Catatan / Feedback Verifikator (PT SSI):
                                </label>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    placeholder="Tuliskan catatan teknis atau poin revisi sebelum menyetujui..."
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                />

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button
                                        type="button"
                                        disabled={processing}
                                        onClick={() => handleApprovalSubmit('APPROVE')}
                                        className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition disabled:opacity-50"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Setujui Titik (Publish)</span>
                                    </button>

                                    <button
                                        type="button"
                                        disabled={processing}
                                        onClick={() => handleApprovalSubmit('REJECT')}
                                        className="py-2.5 px-4 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        <span>Minta Revisi Vendor</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Zoom Viewer for Photo */}
            {selectedPhoto && (
                <div 
                    className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <div 
                        className="max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                            <div>
                                <h3 className="text-sm font-bold text-white">{selectedPhoto.slot_label}</h3>
                                <p className="text-xs text-slate-400">Sudut: {selectedPhoto.angle || 'Standar'} • Kategori: {selectedPhoto.category}</p>
                            </div>
                            <button
                                onClick={() => setSelectedPhoto(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="bg-black flex items-center justify-center max-h-[65vh] overflow-hidden">
                            <img
                                src={selectedPhoto.photo_url}
                                alt={selectedPhoto.slot_label}
                                className="max-h-[65vh] w-auto object-contain"
                            />
                        </div>
                        <div className="p-4 bg-slate-900 text-xs text-slate-300 flex justify-between items-center">
                            <span>Status: {selectedPhoto.is_approved ? '✅ Terverifikasi' : '⏳ Menunggu Review'}</span>
                            {selectedPhoto.latitude && (
                                <span className="font-mono text-slate-400">
                                    GPS Tag: {selectedPhoto.latitude.toFixed(6)}, {selectedPhoto.longitude?.toFixed(6)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
