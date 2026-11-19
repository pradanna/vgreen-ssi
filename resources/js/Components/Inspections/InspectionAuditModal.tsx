import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { 
    X, 
    ShieldCheck, 
    CheckCircle2, 
    AlertTriangle, 
    Clock, 
    MapPin, 
    Calendar, 
    User as UserIcon, 
    Maximize2, 
    Layers, 
    Car, 
    Eye, 
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    RotateCw,
    Info,
    Camera
} from 'lucide-react';

interface SlotInfo {
    id: string;
    category: 'LAHAN' | 'MESIN' | 'PANEL_TIANG';
    label: string;
    angle: string;
    is_required: boolean;
}

interface PhotoItem {
    id: number;
    checklist_slot_id: string;
    photo_url: string;
    latitude?: number;
    longitude?: number;
    taken_at?: string;
    is_approved: boolean;
    reviewer_notes?: string;
    slot?: SlotInfo;
}

interface InspectionReportDetail {
    id: number;
    station_id: number;
    station: {
        id: number;
        code: string;
        name: string;
        facility_type_id: string;
        status_id: string;
        city: string;
        province: string;
        address: string;
        latitude: number;
        longitude: number;
        power_capacity_kw?: number;
        slot_count?: number;
        facilityType?: { id: string; name: string };
        status?: { id: string; name: string };
    };
    submitted_by?: number;
    submitter?: { id: number; name: string; role_id: string; email?: string };
    reviewed_by?: number;
    reviewer?: { id: number; name: string; role_id: string };
    approval_status_id: 'PENDING_REVIEW' | 'APPROVED' | 'REVISION_REQUIRED';
    approval_status?: { id: string; name: string };
    stage: 'INITIAL_SURVEY' | 'CONSTRUCTION_PROGRESS' | 'COMMISSIONING' | 'ROUTINE_PERIODIC';
    overall_condition?: 'BAIK' | 'CUKUP' | 'RUSAK_RINGAN' | 'RUSAK_BERAT';
    physical_condition?: string;
    electrical_condition?: string;
    issues_found?: string[];
    machine_conditions?: Array<{ machine_id?: number; status?: string; notes?: string }>;
    distance_meters?: number;
    notes?: string;
    rejection_reason?: string;
    submitted_at?: string;
    reviewed_at?: string;
    photos: PhotoItem[];
}

interface InspectionAuditModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: InspectionReportDetail | null;
    canReview: boolean;
}

// Haversine distance in meters
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
}

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
    INITIAL_SURVEY: { label: 'Survei Awal', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    CONSTRUCTION_PROGRESS: { label: 'Konstruksi Fisik', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    COMMISSIONING: { label: 'Komisioning (Uji Fungsi)', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    ROUTINE_PERIODIC: { label: 'Rutin 4 Bulan', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
};

const CATEGORY_TABS = [
    { id: 'ALL', label: 'Semua 7 Sudut' },
    { id: 'LAHAN', label: 'Area Lahan (3)' },
    { id: 'MESIN', label: 'Mesin Charger / BSS (2)' },
    { id: 'PANEL_TIANG', label: 'Panel & Tiang (2)' },
];

export default function InspectionAuditModal({
    isOpen,
    onClose,
    report,
    canReview,
}: InspectionAuditModalProps) {
    if (!isOpen || !report) return null;

    const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'LAHAN' | 'MESIN' | 'PANEL_TIANG'>('ALL');
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
    const [reviewNotes, setReviewNotes] = useState(report.notes || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);

    // Filtered photos
    const filteredPhotos = useMemo(() => {
        if (!report.photos) return [];
        if (categoryFilter === 'ALL') return report.photos;
        return report.photos.filter((p) => {
            const cat = p.slot?.category || (p.checklist_slot_id.startsWith('LAHAN') ? 'LAHAN' : p.checklist_slot_id.startsWith('MESIN') ? 'MESIN' : 'PANEL_TIANG');
            return cat === categoryFilter;
        });
    }, [report.photos, categoryFilter]);

    // Handle Review Submission (Approve / Reject)
    const handleSubmitReview = (action: 'APPROVE' | 'REJECT') => {
        if (!canReview) return;
        if (action === 'REJECT' && !reviewNotes.trim()) {
            alert('Silakan masukkan alasan revisi atau instruksi perbaikan untuk tim lapangan.');
            return;
        }

        setIsSubmitting(true);
        setActionType(action);

        router.post(
            route('stations.inspections.review', {
                station: report.station_id,
                report: report.id,
            }),
            {
                action,
                notes: reviewNotes.trim() || (action === 'APPROVE' ? 'Dokumentasi 7 sudut lapangan terverifikasi dan memenuhi standar teknis.' : 'Perlu perbaikan dokumentasi.'),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    setActionType(null);
                    onClose();
                },
                onError: () => {
                    setIsSubmitting(false);
                    setActionType(null);
                },
            }
        );
    };

    const stageInfo = STAGE_LABELS[report.stage] || { label: report.stage, color: 'bg-slate-50 text-slate-700 border-slate-200' };

    // Quick notes chips
    const quickNotes = [
        'Dokumentasi 7 sudut lengkap dan sesuai standar teknis.',
        'Foto tampak belakang mesin buram, mohon pengambilan foto ulang.',
        'Kabel grounding dan tiang panel belum tersambung dengan rapi.',
        'Akses masuk stasiun terhalang material, pastikan jalur kendaraan leluasa.',
    ];

    const currentLightboxPhoto = selectedPhotoIndex !== null ? filteredPhotos[selectedPhotoIndex] : null;

    return (
        <div 
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isSubmitting) {
                    onClose();
                }
            }}
        >
            <div 
                className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-5xl flex flex-col overflow-hidden max-h-[92vh] animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                                    {report.station.code}
                                </span>
                                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                                    {report.station.name}
                                </h3>
                                <span className={`text-2xs font-extrabold px-2.5 py-0.5 rounded-full border ${stageInfo.color}`}>
                                    {stageInfo.label}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                    {report.station.city}, {report.station.province}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                                    {report.submitter?.name || 'Surveyor Lapangan'}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    {report.submitted_at ? new Date(report.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                </span>
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                        title="Tutup Modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sub-Header: Category Tabs & Info Bar */}
                <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {CATEGORY_TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setCategoryFilter(tab.id as any)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                                    categoryFilter === tab.id
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center gap-2">
                        {report.approval_status_id === 'PENDING_REVIEW' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3.5 h-3.5" />
                                Menunggu Verifikasi
                            </span>
                        )}
                        {report.approval_status_id === 'REVISION_REQUIRED' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Perlu Revisi Lapangan
                            </span>
                        )}
                        {report.approval_status_id === 'APPROVED' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Lolos Verifikasi & Publik
                            </span>
                        )}
                    </div>
                </div>

                {/* Scrollable Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Geolocation Audit & Submitter Notes Banner */}
                    <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Validasi Koordinat GPS Stasiun
                            </span>
                            <div className="flex items-center gap-3 text-xs font-semibold text-slate-800">
                                <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                    Lat: {report.station.latitude.toFixed(6)}, Lng: {report.station.longitude.toFixed(6)}
                                </span>
                                {report.photos && report.photos.length > 0 && report.photos[0].latitude && report.photos[0].longitude ? (
                                    (() => {
                                        const dist = calculateDistanceMeters(
                                            report.station.latitude,
                                            report.station.longitude,
                                            report.photos[0].latitude!,
                                            report.photos[0].longitude!
                                        );
                                        const isValid = dist <= 150;
                                        return (
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold ${
                                                isValid 
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                <MapPin className="w-3 h-3" />
                                                {isValid ? `GPS Sesuai (~${dist}m)` : `Deviasi GPS (~${dist}m)`}
                                            </span>
                                        );
                                    })()
                                ) : (
                                    <span className="text-2xs text-slate-400 italic">Audit GPS otomatis</span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 md:max-w-md w-full">
                            {/* Kondisi Lapangan Banner */}
                            {report.overall_condition && (
                                <div className="bg-white p-3 rounded-xl border border-slate-200/70 text-xs flex flex-col gap-1.5 shadow-2xs">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-700">Kondisi Fisik Lapangan:</span>
                                        <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                                            report.overall_condition === 'BAIK'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : report.overall_condition === 'CUKUP'
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-rose-100 text-rose-800'
                                        }`}>
                                            {report.overall_condition}
                                        </span>
                                    </div>
                                    {report.physical_condition && (
                                        <p className="text-slate-600 text-2xs"><strong className="text-slate-700">Lahan:</strong> {report.physical_condition}</p>
                                    )}
                                    {report.electrical_condition && (
                                        <p className="text-slate-600 text-2xs"><strong className="text-slate-700">Kelistrikan:</strong> {report.electrical_condition}</p>
                                    )}
                                    {report.issues_found && report.issues_found.length > 0 && (
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {report.issues_found.map((issue, iIdx) => (
                                                <span key={iIdx} className="bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded text-[10px]">
                                                    ⚠ {issue}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {report.notes && (
                                <div className="bg-white p-3 rounded-xl border border-slate-200/70 text-xs shadow-2xs">
                                    <span className="font-bold text-slate-700 block mb-0.5">Catatan Tim Lapangan:</span>
                                    <p className="text-slate-600 italic">"{report.notes}"</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Photo Grid (7 Angles) */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Camera className="w-4 h-4 text-blue-600" />
                                Dokumentasi Fisik 7 Sudut ({filteredPhotos.length} Foto Ditampilkan)
                            </h4>
                            <span className="text-2xs text-slate-400">
                                Klik foto untuk memperbesar resolusi tinggi
                            </span>
                        </div>

                        {filteredPhotos.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                                Tidak ada foto pada kategori sudut ini.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredPhotos.map((photo, idx) => {
                                    const slotLabel = photo.slot?.label || photo.checklist_slot_id;
                                    const angle = photo.slot?.angle || 'Sudut Standar';
                                    const category = photo.slot?.category || (photo.checklist_slot_id.startsWith('LAHAN') ? 'LAHAN' : photo.checklist_slot_id.startsWith('MESIN') ? 'MESIN' : 'PANEL_TIANG');

                                    return (
                                        <div
                                            key={photo.id || idx}
                                            className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col"
                                        >
                                            {/* Image Thumbnail */}
                                            <div 
                                                className="relative aspect-4/3 bg-slate-100 overflow-hidden cursor-pointer"
                                                onClick={() => setSelectedPhotoIndex(idx)}
                                            >
                                                <img 
                                                    src={photo.photo_url} 
                                                    alt={slotLabel}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    loading="lazy"
                                                />
                                                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center">
                                                    <span className="w-9 h-9 rounded-full bg-white/90 text-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                                                        <Maximize2 className="w-4 h-4" />
                                                    </span>
                                                </div>

                                                {/* Angle badge on top-left */}
                                                <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-900/70 text-white text-[11px] font-bold backdrop-blur-xs">
                                                    {angle}
                                                </span>

                                                {/* Category badge on top-right */}
                                                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-white/90 text-slate-800 text-[10px] font-bold backdrop-blur-xs">
                                                    {category}
                                                </span>
                                            </div>

                                            {/* Details below photo */}
                                            <div className="p-3.5 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <h5 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1" title={slotLabel}>
                                                        {slotLabel}
                                                    </h5>
                                                    <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                                                        <span>Waktu Ambil:</span>
                                                        <span className="font-semibold text-slate-700">
                                                            {photo.taken_at ? new Date(photo.taken_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                                                        </span>
                                                    </p>
                                                </div>

                                                {photo.latitude && photo.longitude && (
                                                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                                                        <span className="flex items-center gap-1 font-mono">
                                                            <MapPin className="w-3 h-3 text-slate-400" />
                                                            {photo.latitude.toFixed(4)}, {photo.longitude.toFixed(4)}
                                                        </span>
                                                        <span className="text-emerald-600 font-bold">GPS Tagged</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Review Decision Section (Khusus Direktur / Admin PT SSI) */}
                    {canReview && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                                    Form Keputusan Verifikasi & Tindak Lanjut
                                </h4>
                                <span className="text-2xs font-semibold text-slate-500">
                                    Wewenang: Direktur / Admin PT SSI
                                </span>
                            </div>

                            {/* Quick Note Presets */}
                            <div>
                                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                                    Pilih Catatan Standar Cepat:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {quickNotes.map((note, nIdx) => (
                                        <button
                                            key={nIdx}
                                            type="button"
                                            onClick={() => setReviewNotes(note)}
                                            className="text-2xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 transition"
                                        >
                                            + {note}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Note Textarea */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Catatan Verifikasi / Alasan Perbaikan:
                                </label>
                                <textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Tuliskan catatan teknis atau poin yang wajib direvisi oleh tim lapangan..."
                                    rows={3}
                                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => handleSubmitReview('REJECT')}
                                    disabled={isSubmitting}
                                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80 transition flex items-center gap-2 disabled:opacity-50"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>{isSubmitting && actionType === 'REJECT' ? 'Menyimpan...' : 'Minta Revisi Lapangan'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleSubmitReview('APPROVE')}
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-2 shadow-sm shadow-emerald-600/20 disabled:opacity-50"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>{isSubmitting && actionType === 'APPROVE' ? 'Memproses...' : 'Setujui & Publikasikan'}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Review Info if already approved */}
                    {!canReview && report.approval_status_id === 'APPROVED' && (
                        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div className="text-xs text-emerald-900">
                                <strong>Laporan ini telah disetujui</strong> oleh {report.reviewer?.name || 'Direktur PT SSI'} pada{' '}
                                {report.reviewed_at ? new Date(report.reviewed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}.
                                {report.notes && <div className="mt-1 text-emerald-800 italic">"{report.notes}"</div>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0 text-xs text-slate-500">
                    <span>
                        Total <strong>{report.photos?.length ?? 0} foto</strong> tersimpan untuk sesi #{report.id}
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition"
                    >
                        Tutup
                    </button>
                </div>
            </div>

            {/* Lightbox Photo Viewer Modal */}
            {currentLightboxPhoto && (
                <div 
                    className="fixed inset-0 z-[90] bg-black/90 flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-200"
                    onClick={() => setSelectedPhotoIndex(null)}
                >
                    {/* Lightbox Header */}
                    <div className="flex items-center justify-between text-white shrink-0" onClick={(e) => e.stopPropagation()}>
                        <div>
                            <h4 className="text-sm font-bold">
                                {currentLightboxPhoto.slot?.label || currentLightboxPhoto.checklist_slot_id}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Sudut: {currentLightboxPhoto.slot?.angle} • Kategori: {currentLightboxPhoto.slot?.category} • Foto {selectedPhotoIndex! + 1} dari {filteredPhotos.length}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedPhotoIndex(null)}
                            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                            title="Tutup Preview"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Lightbox Image Container */}
                    <div 
                        className="flex-1 flex items-center justify-center p-4 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img 
                            src={currentLightboxPhoto.photo_url} 
                            alt={currentLightboxPhoto.slot?.label}
                            className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl"
                        />

                        {/* Navigation Arrows */}
                        {selectedPhotoIndex! > 0 && (
                            <button
                                type="button"
                                onClick={() => setSelectedPhotoIndex(selectedPhotoIndex! - 1)}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition shadow-lg"
                                title="Foto Sebelumnya"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        )}

                        {selectedPhotoIndex! < filteredPhotos.length - 1 && (
                            <button
                                type="button"
                                onClick={() => setSelectedPhotoIndex(selectedPhotoIndex! + 1)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition shadow-lg"
                                title="Foto Selanjutnya"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        )}
                    </div>

                    {/* Lightbox Footer Info */}
                    <div className="flex items-center justify-between text-xs text-slate-400 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span>
                            Waktu Ambil: {currentLightboxPhoto.taken_at ? new Date(currentLightboxPhoto.taken_at).toLocaleString('id-ID') : '-'}
                        </span>
                        {currentLightboxPhoto.latitude && currentLightboxPhoto.longitude && (
                            <span className="font-mono text-slate-300 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                                Lat: {currentLightboxPhoto.latitude.toFixed(6)}, Lng: {currentLightboxPhoto.longitude.toFixed(6)}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
