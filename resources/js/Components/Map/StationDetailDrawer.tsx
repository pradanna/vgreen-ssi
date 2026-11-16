import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Station, PhotoItem, InspectionData, StationDocument, StationMachine } from '@/types/station';
import { useForm, router } from '@inertiajs/react';
import { 
    X, 
    MapPin, 
    Zap, 
    Car, 
    Motorbike,
    BatteryCharging, 
    Clock, 
    ExternalLink, 
    ShieldCheck, 
    CheckCircle2, 
    XCircle, 
    Image as ImageIcon,
    Building2,
    Check,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    UploadCloud,
    History,
    Calendar,
    UserCheck,
    AlertTriangle,
    Compass,
    Cpu,
    FileText,
    FileCheck,
    Download,
    Trash2,
    Plus,
    Phone,
    FilePlus,
    Layers,
    Loader2
} from 'lucide-react';
import { compressImage, getCurrentDeviceLocation } from '@/utils/imageCompression';

interface StationDetailDrawerProps {
    station: Station | null;
    onClose: () => void;
    userRole: string; // DIRECTOR_SSI, ADMIN_SSI, VGREEN_REP, etc.
    hasBackdrop?: boolean;
}

const CHECKLIST_SLOTS = [
    { id: 'LAHAN_DEPAN', category: 'LAHAN', angle: 'Depan', label: 'Lahan - Tampak Depan' },
    { id: 'LAHAN_SAMPING', category: 'LAHAN', angle: 'Samping', label: 'Lahan - Tampak Samping' },
    { id: 'LAHAN_AKSES', category: 'LAHAN', angle: 'Akses Masuk', label: 'Lahan - Akses Masuk' },
    { id: 'MESIN_DEPAN', category: 'MESIN', angle: 'Depan', label: 'Mesin Charger - Depan' },
    { id: 'MESIN_BELAKANG', category: 'MESIN', angle: 'Belakang', label: 'Mesin Charger - Belakang' },
    { id: 'PANEL_DEPAN', category: 'PANEL_TIANG', angle: 'Depan', label: 'Panel & Tiang - Depan' },
    { id: 'PANEL_BELAKANG', category: 'PANEL_TIANG', angle: 'Belakang', label: 'Panel & Tiang - Belakang' },
];

export default function StationDetailDrawer({
    station,
    onClose,
    userRole,
    hasBackdrop = true,
}: StationDetailDrawerProps) {
    const isVGreen = userRole === 'VGREEN_REP';
    const isInternal = userRole === 'DIRECTOR_SSI' || userRole === 'ADMIN_SSI';

    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DOCUMENTS' | 'PHOTOS' | 'TIMELINE'>('OVERVIEW');
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
    const [isZoomed, setIsZoomed] = useState(false);
    const [photoCategoryFilter, setPhotoCategoryFilter] = useState<'ALL' | 'LAHAN' | 'MESIN' | 'PANEL_TIANG'>('ALL');
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        if (isClosing) return;
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 240);
    };

    // On-Demand Data Caching for Photos and Documents (Lazy Loading by Tab)
    const [photosCache, setPhotosCache] = useState<Record<number, {
        latest_inspection?: InspectionData | null;
        inspections_history?: InspectionData[];
        verified_photos?: PhotoItem[];
    }>>({});
    const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);

    const [docsCache, setDocsCache] = useState<Record<number, {
        documents: StationDocument[];
        document_compliance?: any;
    }>>({});
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);

    // Fetch Documents on-demand when DOCUMENTS tab is opened
    useEffect(() => {
        if (!station || !isInternal) return;
        const alreadyLoaded = (docsCache[station.id]?.documents?.length ?? 0) > 0 || (station.documents && station.documents.length > 0);
        if (activeTab === 'DOCUMENTS' && !alreadyLoaded && !isLoadingDocs) {
            setIsLoadingDocs(true);
            axios.get(`/stations/${station.id}/documents`)
                .then(res => {
                    setDocsCache(prev => ({
                        ...prev,
                        [station.id]: res.data,
                    }));
                })
                .catch(err => {
                    console.error('Failed to load station documents', err);
                })
                .finally(() => {
                    setIsLoadingDocs(false);
                });
        }
    }, [station?.id, activeTab, isInternal]);

    // Fetch Photos on-demand when PHOTOS or TIMELINE tab is opened
    useEffect(() => {
        if (!station) return;
        const alreadyLoaded = isVGreen 
            ? ((photosCache[station.id]?.verified_photos?.length ?? 0) > 0 || (station.verified_photos && station.verified_photos.length > 0))
            : ((photosCache[station.id]?.inspections_history?.length ?? 0) > 0 || (station.inspections_history && station.inspections_history.length > 0));

        if ((activeTab === 'PHOTOS' || activeTab === 'TIMELINE') && !alreadyLoaded && !isLoadingPhotos) {
            setIsLoadingPhotos(true);
            axios.get(`/stations/${station.id}/photos`)
                .then(res => {
                    setPhotosCache(prev => ({
                        ...prev,
                        [station.id]: res.data,
                    }));
                    if (res.data.latest_inspection?.id && !selectedInspectionId) {
                        setSelectedInspectionId(res.data.latest_inspection.id);
                    }
                })
                .catch(err => {
                    console.error('Failed to load station photos', err);
                })
                .finally(() => {
                    setIsLoadingPhotos(false);
                });
        }
    }, [station?.id, activeTab, isVGreen]);

    const cachedPhotosData = station ? photosCache[station.id] : undefined;
    const cachedDocsData = station ? docsCache[station.id] : undefined;

    // Selected inspection report for timeline navigation (defaults to latest)
    const inspectionHistory: InspectionData[] = cachedPhotosData?.inspections_history 
        || (station?.inspections_history && station.inspections_history.length > 0 ? station.inspections_history : [])
        || (station?.latest_inspection ? [station.latest_inspection] : []);

    const [selectedInspectionId, setSelectedInspectionId] = useState<number | null>(
        cachedPhotosData?.latest_inspection?.id || station?.latest_inspection?.id || (inspectionHistory[0]?.id ?? null)
    );

    // Reset drawer state when switching stations
    useEffect(() => {
        if (station) {
            setSelectedInspectionId(station.latest_inspection?.id ?? null);
            setActiveTab('OVERVIEW');
            setSelectedPhotoIndex(null);
            setReviewNotes('');
            setReviewFeedback(null);
        }
    }, [station?.id]);

    // Active inspection session being viewed
    const activeInspection = inspectionHistory.find(i => i.id === selectedInspectionId) 
        || cachedPhotosData?.latest_inspection 
        || station?.latest_inspection 
        || null;

    // Photos list corresponding to selected inspection
    const activePhotos: PhotoItem[] = isVGreen
        ? (cachedPhotosData?.verified_photos || station?.verified_photos || [])
        : (activeInspection?.photos || cachedPhotosData?.latest_inspection?.photos || station?.latest_inspection?.photos || []);

    const documentsToDisplay: StationDocument[] = cachedDocsData?.documents || station?.documents || [];
    const complianceToDisplay = cachedDocsData?.document_compliance || station?.document_compliance;

    const filteredPhotos = activePhotos.filter(p => {
        if (photoCategoryFilter === 'ALL') return true;
        return p.category === photoCategoryFilter;
    });

    // Machines data for summary overview
    const machinesToDisplay = (station?.machines && station.machines.length > 0)
        ? station.machines
        : station ? [
            {
                id: 1,
                name: station.facility_type_id === 'BSS' ? 'Kabinet BSS Swap Motor 01' : 'Unit DC Fast Charger 01',
                brand: station.facility_type_id === 'BSS' ? 'V-Green BSS' : 'Autel',
                model_series: station.facility_type_id === 'BSS' ? 'BSS Gen-3 8-Slot' : 'MaxiCharger DC 120kW',
                facility_type_id: station.facility_type_id,
                power_capacity_kw: station.power_capacity_kw || (station.facility_type_id === 'BSS' ? 25 : 60),
                socket_types: station.socket_types || (station.facility_type_id === 'BSS' ? '8-Slot Battery Swapping Bay' : '2x CCS2 Fast Gun'),
                slot_or_gun_count: station.slot_count || (station.facility_type_id === 'BSS' ? 8 : 2),
                status: station.status_id === 'OPERATIONAL' ? 'OPERATIONAL' : 'CONSTRUCTION',
            } as StationMachine
        ] : [];

    // Modal Upload New Inspection state
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadStage, setUploadStage] = useState<'INITIAL_SURVEY' | 'CONSTRUCTION_PROGRESS' | 'COMMISSIONING' | 'ROUTINE_PERIODIC'>('ROUTINE_PERIODIC');
    const [uploadNotes, setUploadNotes] = useState('');
    const [uploadingFiles, setUploadingFiles] = useState<Record<string, { file: File; dataUrl: string; sizeKb: number }>>({});
    const [uploadGps, setUploadGps] = useState<{ latitude: number; longitude: number } | null>(null);
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);

    // Approval review state
    const [reviewNotes, setReviewNotes] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewFeedback, setReviewFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleApprovalSubmit = async (action: 'APPROVE' | 'REJECT') => {
        const currentStation = station;
        if (!activeInspection || !currentStation) return;

        if (action === 'REJECT' && !reviewNotes.trim()) {
            setReviewFeedback({
                type: 'error',
                message: 'Harap berikan catatan atau alasan revisi sebelum meminta perbaikan ke tim lapangan.'
            });
            return;
        }

        setIsSubmittingReview(true);
        setReviewFeedback(null);

        try {
            await axios.post(`/stations/${currentStation.id}/inspections/${activeInspection.id}/review`, {
                action,
                notes: reviewNotes.trim() || undefined,
            });

            // Refetch fresh photos & inspection status to update local drawer view
            const photosRes = await axios.get(`/stations/${currentStation.id}/photos`);
            setPhotosCache(prev => ({
                ...prev,
                [currentStation.id]: photosRes.data,
            }));

            // Clear review notes
            setReviewNotes('');

            // Set success feedback
            setReviewFeedback({
                type: 'success',
                message: action === 'APPROVE'
                    ? 'Titik stasiun berhasil diverifikasi & disetujui!'
                    : 'Permintaan revisi lapangan telah berhasil dicatat & dikirim ke surveyor.'
            });

            // Reload background Inertia props to sync map pins and sidebar counts
            router.reload({ only: ['stations', 'stats'] });
        } catch (err: any) {
            console.error('Failed to review inspection', err);
            const errMsg = err?.response?.data?.message || 'Gagal memproses verifikasi titik. Silakan coba kembali.';
            setReviewFeedback({
                type: 'error',
                message: errMsg,
            });
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // Document Upload state
    const [isDocUploadOpen, setIsDocUploadOpen] = useState(false);
    const [docCategory, setDocCategory] = useState<'SWASTA' | 'PEMERINTAH' | 'VENDOR'>((station?.landlord_type as any) || 'SWASTA');
    const [docType, setDocType] = useState('MOU');
    const [docTitle, setDocTitle] = useState('');
    const [docNotes, setDocNotes] = useState('');
    const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);

    // Keyboard shortcut to close drawer via Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (selectedPhotoIndex !== null) {
                    setSelectedPhotoIndex(null);
                    return;
                }
                if (isUploadModalOpen) {
                    setIsUploadModalOpen(false);
                    return;
                }
                if (isDocUploadOpen) {
                    setIsDocUploadOpen(false);
                    return;
                }
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleClose, selectedPhotoIndex, isUploadModalOpen, isDocUploadOpen]);

    const handleOpenDocUpload = (category: 'SWASTA' | 'PEMERINTAH' | 'VENDOR', typeKey: string, defaultTitle: string) => {
        setDocCategory(category);
        setDocType(typeKey);
        setDocTitle(defaultTitle);
        setDocNotes('');
        setSelectedDocFile(null);
        setIsDocUploadOpen(true);
    };

    const handleUploadDocSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const currentStation = station;
        if (!selectedDocFile || !currentStation) {
            alert('Silakan pilih berkas dokumen.');
            return;
        }

        setIsUploadingDoc(true);
        const formData = new FormData();
        formData.append('category', docCategory);
        formData.append('document_type', docType);
        formData.append('title', docTitle);
        formData.append('file', selectedDocFile);
        if (docNotes) formData.append('notes', docNotes);

        router.post(route('admin.stations.documents.upload', { station: currentStation.id }), formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDocUploadOpen(false);
                setIsUploadingDoc(false);
                setSelectedDocFile(null);
            },
            onError: (err) => {
                console.error(err);
                setIsUploadingDoc(false);
                alert('Gagal mengunggah dokumen.');
            }
        });
    };

    const handleDeleteDoc = (docId: number, title: string) => {
        const currentStation = station;
        if (!currentStation) return;
        if (!confirm(`Hapus dokumen "${title}"?`)) return;
        router.delete(route('admin.stations.documents.destroy', { station: currentStation.id, document: docId }), {
            preserveScroll: true,
        });
    };

    // Keyboard navigation for photo modal viewer
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedPhotoIndex === null) return;
            if (e.key === 'ArrowRight' && selectedPhotoIndex < filteredPhotos.length - 1) {
                setSelectedPhotoIndex(selectedPhotoIndex + 1);
            } else if (e.key === 'ArrowLeft' && selectedPhotoIndex > 0) {
                setSelectedPhotoIndex(selectedPhotoIndex - 1);
            } else if (e.key === 'Escape') {
                setSelectedPhotoIndex(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPhotoIndex, filteredPhotos.length]);

    // Color and icon styling matching Sinao palette
    let statusPill = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    if (station?.status_id === 'CONSTRUCTION') statusPill = 'bg-orange-50 text-orange-700 border-orange-200/80';
    if (station?.status_id === 'SURVEYED') statusPill = 'bg-amber-50 text-amber-700 border-amber-200/80';
    if (station?.status_id === 'ON_HOLD') statusPill = 'bg-rose-50 text-rose-700 border-rose-200/80';

    // Current viewed photo for zoom modal
    const currentPhoto = selectedPhotoIndex !== null ? filteredPhotos[selectedPhotoIndex] : null;

    // Handle photo file selection with automatic compression & GPS audit tag
    const handleSlotFileChange = async (slotId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        try {
            // Compress client-side < 1.5MB
            const compressed = await compressImage(file, 1.5 * 1024 * 1024);
            setUploadingFiles(prev => ({
                ...prev,
                [slotId]: {
                    file: compressed.file,
                    dataUrl: compressed.dataUrl,
                    sizeKb: compressed.sizeKb,
                }
            }));

            // Record device location if not yet fetched
            if (!uploadGps) {
                const loc = await getCurrentDeviceLocation();
                setUploadGps({ latitude: loc.latitude, longitude: loc.longitude });
            }
        } catch (err) {
            console.error('Gagal mengompres gambar:', err);
            alert('Gagal memproses gambar. Silakan coba kembali.');
        }
    };

    // Submit new inspection session
    const handleNewInspectionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const currentStation = station;
        if (!currentStation) return;
        setIsSubmittingReport(true);

        const photosPayload = CHECKLIST_SLOTS.map(slot => {
            const uploaded = uploadingFiles[slot.id];
            return {
                checklist_slot_id: slot.id,
                photo_url: uploaded?.dataUrl || 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
                latitude: uploadGps?.latitude || currentStation.latitude,
                longitude: uploadGps?.longitude || currentStation.longitude,
                taken_at: new Date().toISOString(),
            };
        });

        router.post(route('stations.inspections.submit', { station: currentStation.id }), {
            stage: uploadStage,
            notes: uploadNotes,
            photos: photosPayload,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsUploadModalOpen(false);
                setUploadingFiles({});
                setUploadNotes('');
                setIsSubmittingReport(false);
                alert('Laporan inspeksi baru dan 7 sudut foto berhasil diajukan.');
            },
            onError: () => {
                setIsSubmittingReport(false);
            }
        });
    };

    if (!station) return null;

    return (
        <>
            {/* Backdrop with soft dim (only shown when hasBackdrop is true) */}
            {hasBackdrop && (
                <div 
                    className={`fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${
                        isClosing ? 'opacity-0' : 'opacity-100'
                    }`}
                    onClick={handleClose}
                />
            )}

            {/* Slide-over Drawer Panel with Smooth Slide to Left Animation */}
            <div className={`fixed top-0 right-0 bottom-0 w-full sm:w-[620px] md:w-[720px] lg:w-[840px] xl:w-[920px] max-w-[95vw] bg-white border-l border-slate-200/80 z-50 flex flex-col ${
                hasBackdrop ? 'shadow-2xl' : 'shadow-[-12px_0_35px_rgba(0,0,0,0.12)]'
            } ${isClosing ? 'animate-drawer-out' : 'animate-drawer-in'}`}>
                {/* Header with generous breathing room */}
                <div className="p-6 md:p-7 border-b border-slate-100 bg-[#FCFCFD] flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800">
                                {station.code}
                            </span>
                            <span className={`text-xs px-3 py-0.5 rounded-full font-medium border flex items-center gap-1.5 ${statusPill}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                {station.status.name}
                            </span>
                            <span className="text-xs px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-medium">
                                {station.facility_type.name}
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-snug truncate" title={station.name}>
                            {station.name}
                        </h2>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{station.city}, {station.province}</span>
                        </p>
                    </div>

                    <button
                        onClick={handleClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        title="Tutup Panel"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs with generous touch targets */}
                <div className="flex border-b border-slate-100 px-6 bg-white text-xs font-medium overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('OVERVIEW')}
                        className={`py-3.5 px-4 border-b-2 font-semibold transition shrink-0 ${
                            activeTab === 'OVERVIEW'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Ringkasan Titik
                    </button>

                    {isInternal && (
                        <button
                            onClick={() => setActiveTab('DOCUMENTS')}
                            className={`py-3.5 px-4 border-b-2 font-semibold flex items-center gap-1.5 transition shrink-0 ${
                                activeTab === 'DOCUMENTS'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span>Dokumen &amp; Legalitas</span>
                            {complianceToDisplay && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    complianceToDisplay.is_complete 
                                        ? 'bg-emerald-50 text-emerald-700' 
                                        : 'bg-amber-50 text-amber-700'
                                }`}>
                                    {complianceToDisplay.total_uploaded}/{complianceToDisplay.total_required}
                                </span>
                            )}
                        </button>
                    )}

                    <button
                        onClick={() => setActiveTab('PHOTOS')}
                        className={`py-3.5 px-4 border-b-2 font-semibold flex items-center gap-2 transition shrink-0 ${
                            activeTab === 'PHOTOS'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <ImageIcon className="w-4 h-4 text-slate-400" />
                        <span>Foto dan Kondisi</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-600 font-bold">
                            {activePhotos.length} Foto
                        </span>
                    </button>

                    {isInternal && (
                        <button
                            onClick={() => setActiveTab('TIMELINE')}
                            className={`py-3.5 px-4 border-b-2 font-semibold flex items-center gap-2 transition shrink-0 ${
                                activeTab === 'TIMELINE'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <History className="w-4 h-4 text-slate-400" />
                            <span>Linimasa</span>
                            {inspectionHistory.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold">
                                    {inspectionHistory.length}
                                </span>
                            )}
                        </button>
                    )}
                </div>

                {/* Tab Contents */}
                <div className="flex-1 overflow-y-auto p-6 md:p-7 space-y-6 text-slate-800 text-sm">
                    {/* TAB 1: OVERVIEW */}
                    {activeTab === 'OVERVIEW' && (
                        <>
                            {isVGreen && (
                                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-start gap-3.5">
                                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-bold text-emerald-900 text-xs">
                                            Data Resmi Terverifikasi V-Green
                                        </div>
                                        <div className="text-[11px] text-emerald-700/90 mt-0.5 leading-relaxed">
                                            Spesifikasi teknis dan koordinat geolokasi titik ini telah divalidasi oleh tim inspektur PT SSI.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 1. MESIN YANG TERPASANG */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Cpu className="w-3.5 h-3.5 text-blue-600" />
                                        Mesin yang Terpasang
                                    </h3>
                                    <span className="text-[11px] font-semibold text-slate-500">
                                        Total: <strong className="text-slate-900">{machinesToDisplay.length} Unit</strong>
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {machinesToDisplay.map((m, idx) => {
                                        const isMotor = m.facility_type_id === 'BSS';
                                        return (
                                            <div 
                                                key={m.id || idx}
                                                className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 hover:border-blue-300 transition space-y-2.5 shadow-xs"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                                            isMotor ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            {isMotor ? (
                                                                <Motorbike className="w-4 h-4" />
                                                            ) : (
                                                                <Car className="w-4 h-4" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                                                                    Mesin {idx + 1}
                                                                </span>
                                                                <span className="text-xs font-bold text-slate-900 truncate">
                                                                    {m.name}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                                                {m.brand} {m.model_series ? `• ${m.model_series}` : ''}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                                        m.status === 'OPERATIONAL' 
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                                                    }`}>
                                                        {m.status || 'OPERATIONAL'}
                                                    </span>
                                                </div>

                                                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
                                                    <div>
                                                        <span className="text-slate-400 block text-[10px] font-medium">Kapasitas Daya:</span>
                                                        <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                                                            <Zap className="w-3 h-3 text-amber-500" />
                                                            {m.power_capacity_kw} kW
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block text-[10px] font-medium">Tipe Soket & Port:</span>
                                                        <span className="font-semibold text-slate-800 truncate block mt-0.5" title={m.socket_types || ''}>
                                                            {m.socket_types || `${m.slot_or_gun_count || 1} Slot/Gun`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 2. DATA LOKASI & ALAMAT */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                                    Lokasi &amp; Alamat Stasiun
                                </h3>
                                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-2.5 shadow-xs">
                                    <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                                        {station.address}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        {station.city}, {station.province} {station.postal_code ? `(${station.postal_code})` : ''}
                                    </p>
                                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/60 text-xs">
                                        <span className="font-mono text-slate-500 text-[11px]">
                                            GPS: {station.latitude.toFixed(5)}, {station.longitude.toFixed(5)}
                                        </span>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold transition"
                                        >
                                            <span>Buka Google Maps</span>
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* 3. DATA PEMILIK LAHAN */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                    Data Pemilik Lahan
                                </h3>
                                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-2.5 text-xs shadow-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Nama Pemilik:</span>
                                        <span className="font-bold text-slate-900 text-right">
                                            {station.landlord_name || 'Mitra Pengelola Lahan Terverifikasi'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Tipe Kepemilikan:</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            (station.ownership_type === 'NEGERI_BUMN' || station.landlord_type === 'PEMERINTAH')
                                                ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                                                : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                        }`}>
                                            {(station.ownership_type === 'NEGERI_BUMN' || station.landlord_type === 'PEMERINTAH') ? 'Negeri / BUMN' : 'Swasta'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                                        <span className="text-slate-500">Nomor Telepon:</span>
                                        {station.landlord_phone ? (
                                            <a 
                                                href={`https://wa.me/${station.landlord_phone.replace(/[^0-9]/g, '')}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-emerald-600 hover:text-emerald-700 font-mono font-bold hover:underline flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60"
                                            >
                                                <Phone className="w-3.5 h-3.5" />
                                                <span>{station.landlord_phone}</span>
                                            </a>
                                        ) : (
                                            <span className="font-mono text-slate-400">-</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* TAB: DOCUMENTS (Internal PT SSI only) */}
                    {isInternal && activeTab === 'DOCUMENTS' && (
                        isLoadingDocs ? (
                            <div className="py-20 text-center space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center animate-pulse">
                                    <FileText className="w-6 h-6 animate-bounce" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-800">Memuat Dokumen &amp; Legalitas...</h4>
                                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                                    Mengambil data berkas PKS, IMB, dan kepatuhan perizinan stasiun secara langsung.
                                </p>
                            </div>
                        ) : (
                        <div className="space-y-5">
                            {/* Compliance Progress Card */}
                            {complianceToDisplay && (
                                <div className={`p-4 rounded-2xl border ${
                                    complianceToDisplay.is_complete 
                                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                                        : 'bg-amber-50/80 border-amber-200 text-amber-950'
                                }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {complianceToDisplay.is_complete ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                            ) : (
                                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                                            )}
                                            <div>
                                                <h4 className="font-bold text-xs">
                                                    {complianceToDisplay.is_complete 
                                                        ? 'Dokumen Legalitas Lengkap (100%)' 
                                                        : `Kelengkapan Legalitas: ${complianceToDisplay.total_uploaded} dari ${complianceToDisplay.total_required} Dokumen (${complianceToDisplay.percentage}%)`
                                                    }
                                                </h4>
                                                <p className="text-[11px] opacity-80 mt-0.5">
                                                    Kategori Lahan: <strong>{complianceToDisplay.landlord_type}</strong> • Akses terbatas Direktur & Admin PT SSI
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                            complianceToDisplay.is_complete
                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                                : 'bg-amber-100 text-amber-800 border-amber-300'
                                        }`}>
                                            {complianceToDisplay.status}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden my-2">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                complianceToDisplay.is_complete ? 'bg-emerald-600' : 'bg-amber-600'
                                            }`}
                                            style={{ width: `${complianceToDisplay.percentage}%` }}
                                        />
                                    </div>

                                    {/* Missing documents list alert */}
                                    {!complianceToDisplay.is_complete && complianceToDisplay.missing_details.length > 0 && (
                                        <div className="mt-3 pt-2.5 border-t border-amber-200/60 text-[11px]">
                                            <span className="font-bold text-amber-900 block mb-1">Dokumen Wajib yang Masih Kurang:</span>
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {complianceToDisplay.missing_details.map((m: { type: string; label: string }, idx: number) => (
                                                    <span key={idx} className="px-2 py-0.5 rounded-lg bg-white/80 border border-amber-300 text-amber-900 font-semibold text-[10px]">
                                                        ⚠️ {m.label}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Section: Dokumen Legalitas Lahan */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                        <FileText className="w-4 h-4 text-blue-600" />
                                        <span>Checklist Dokumen Lahan ({station.landlord_type || 'SWASTA'})</span>
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenDocUpload(station.landlord_type || 'SWASTA', 'MOU', 'MOU Kerjasama')}
                                        className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-bold text-[11px] transition flex items-center gap-1"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Unggah Berkas</span>
                                    </button>
                                </div>

                                {/* Matrix Checklist Slots */}
                                <div className="space-y-2.5">
                                    {(() => {
                                        const landlordType = station.landlord_type || 'SWASTA';
                                        const requiredMap: Record<string, string> = landlordType === 'PEMERINTAH'
                                            ? { 'SK': 'Surat Keputusan (SK)', 'MOU': 'MOU Kontrak Kerjasama', 'BUKTI_BAYAR': 'Bukti Bayar / Retribusi' }
                                            : {
                                                'SHM': 'Sertifikat Hak Milik (SHM)',
                                                'KTP': 'KTP Pemilik Lahan',
                                                'SURAT_PERSETUJUAN': 'Surat Persetujuan',
                                                'LOI': 'Letter of Intent (LOI)',
                                                'PINJAM_PAKAI': 'Perjanjian Pinjam Pakai',
                                                'MOU': 'MOU / Perjanjian Kerjasama',
                                                'KWITANSI': 'Kwitansi Pembayaran',
                                                'BUKTI_BAYAR': 'Bukti Bayar / Transfer',
                                            };

                                        return Object.entries(requiredMap).map(([typeKey, typeLabel]) => {
                                            const doc = documentsToDisplay?.find(d => d.document_type === typeKey);
                                            return (
                                                <div 
                                                    key={typeKey}
                                                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                                                        doc 
                                                            ? 'bg-white border-slate-200/80 shadow-xs' 
                                                            : 'bg-amber-50/30 border-dashed border-amber-300/80'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                                            doc ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                                        }`}>
                                                            {doc ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-slate-800 text-xs truncate">
                                                                    {typeLabel}
                                                                </span>
                                                                {doc ? (
                                                                    <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-50 text-emerald-700">
                                                                        TERSEDIA
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-100 text-amber-800">
                                                                        WAJIB
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {doc ? (
                                                                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                                                    {doc.file_name} • {doc.file_size_formatted || 'PDF'} • Diunggah {doc.uploaded_at}
                                                                </p>
                                                            ) : (
                                                                <p className="text-[10px] text-amber-700/80 mt-0.5">
                                                                    Belum diunggah. Diperlukan untuk kelengkapan audit legal.
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        {doc ? (
                                                            <>
                                                                <a
                                                                    href={doc.id ? route('stations.documents.file', { station: station.id, document: doc.id }) : (doc.file_path ? `/storage/${doc.file_path}` : '#')}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                                                                    title="Lihat / Unduh Berkas"
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                </a>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteDoc(doc.id, doc.title)}
                                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                                                    title="Hapus Dokumen"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenDocUpload(landlordType, typeKey, typeLabel)}
                                                                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] transition"
                                                            >
                                                                + Unggah
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>

                            {/* Section: Dokumen Survei Vendor */}
                            <div className="pt-3 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                        <FileText className="w-4 h-4 text-emerald-600" />
                                        <span>Laporan & Dokumen Survei Vendor</span>
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenDocUpload('VENDOR', 'SSR_VENDOR', 'Site Survey Report (SSR)')}
                                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition flex items-center gap-1"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Tambah Laporan</span>
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {documentsToDisplay?.filter(d => d.category === 'VENDOR').map((doc) => (
                                        <div key={doc.id} className="p-3 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <div className="min-w-0">
                                                    <span className="font-bold text-slate-800 block truncate">{doc.title}</span>
                                                    <span className="text-[10px] text-slate-400 block truncate">{doc.file_name} • {doc.file_size_formatted || 'PDF'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <a
                                                    href={doc.id ? route('stations.documents.file', { station: station.id, document: doc.id }) : (doc.file_path ? `/storage/${doc.file_path}` : '#')}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                                                    title="Unduh Laporan"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteDoc(doc.id, doc.title)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        )
                    )}

                    {/* TAB 2: PHOTOS (7-ANGLE CHECKLIST) */}
                    {activeTab === 'PHOTOS' && (
                        isLoadingPhotos ? (
                            <div className="py-20 text-center space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center animate-pulse">
                                    <ImageIcon className="w-6 h-6 animate-bounce" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-800">Memuat Foto &amp; Status QC...</h4>
                                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                                    Mengambil 7 sudut dokumentasi fisik stasiun dan evaluasi inspeksi terkini.
                                </p>
                            </div>
                        ) : (
                        <div className="space-y-4">
                            {/* Session Info Banner */}
                            {!isVGreen && (
                                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs shadow-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500 font-medium">Sesi Inspeksi:</span>
                                        {inspectionHistory.length > 1 ? (
                                            <select
                                                value={selectedInspectionId || ''}
                                                onChange={(e) => setSelectedInspectionId(Number(e.target.value))}
                                                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            >
                                                {inspectionHistory.map((ins) => (
                                                    <option key={ins.id} value={ins.id}>
                                                        {ins.stage.replace('_', ' ')} ({ins.submitted_at ? ins.submitted_at.substring(0, 10) : 'Terbaru'})
                                                    </option>
                                                ))}
                                            </select>
                                        ) : activeInspection ? (
                                            <div>
                                                <strong className="text-slate-900 font-bold">{activeInspection.stage.replace('_', ' ')}</strong>
                                                <span className="text-slate-400 ml-2">({activeInspection.submitted_at || 'Terbaru'})</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400">Belum ada inspeksi</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setIsUploadModalOpen(true)}
                                        className="px-3 py-1.5 rounded-full bg-blue-600 text-white font-bold text-[11px] hover:bg-blue-700 transition flex items-center gap-1 shadow-xs ml-auto"
                                    >
                                        <UploadCloud className="w-3.5 h-3.5" />
                                        <span>Unggah Sesi Baru</span>
                                    </button>
                                </div>
                            )}

                            {/* Filter category pills */}
                            <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
                                <button
                                    onClick={() => setPhotoCategoryFilter('ALL')}
                                    className={`px-3.5 py-1.5 rounded-full font-medium transition ${
                                        photoCategoryFilter === 'ALL'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    Semua ({activePhotos.length})
                                </button>
                                <button
                                    onClick={() => setPhotoCategoryFilter('LAHAN')}
                                    className={`px-3.5 py-1.5 rounded-full font-medium transition ${
                                        photoCategoryFilter === 'LAHAN'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    Lahan
                                </button>
                                <button
                                    onClick={() => setPhotoCategoryFilter('MESIN')}
                                    className={`px-3.5 py-1.5 rounded-full font-medium transition ${
                                        photoCategoryFilter === 'MESIN'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    Mesin Charger
                                </button>
                                <button
                                    onClick={() => setPhotoCategoryFilter('PANEL_TIANG')}
                                    className={`px-3.5 py-1.5 rounded-full font-medium transition ${
                                        photoCategoryFilter === 'PANEL_TIANG'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    Panel & Tiang
                                </button>
                            </div>

                            {/* Photos Grid */}
                            {filteredPhotos.length === 0 ? (
                                <div className="p-10 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                    <span>Belum ada foto yang tersedia untuk kategori ini.</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3.5">
                                    {filteredPhotos.map((photo, index) => (
                                        <div
                                            key={index}
                                            onClick={() => setSelectedPhotoIndex(index)}
                                            className="group cursor-pointer rounded-2xl overflow-hidden bg-white border border-slate-100 hover:border-blue-500/60 transition flex flex-col shadow-card hover:shadow-card-hover"
                                        >
                                            <div className="relative aspect-video bg-slate-100 overflow-hidden">
                                                <img
                                                    src={photo.photo_url}
                                                    alt={photo.slot_label}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                />
                                                <span className="absolute bottom-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white">
                                                    {photo.angle || photo.slot_label}
                                                </span>
                                                {photo.is_approved && (
                                                    <span className="absolute top-2 right-2 p-1 rounded-full bg-emerald-500 text-white shadow">
                                                        <Check className="w-3 h-3" />
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-3 text-xs">
                                                <div className="font-bold text-slate-900 truncate" title={photo.slot_label}>
                                                    {photo.slot_label}
                                                </div>
                                                <div className="text-[11px] text-slate-500 mt-0.5 flex justify-between">
                                                    <span>{photo.category}</span>
                                                    <span>{photo.taken_at || 'Terverifikasi'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* PANEL VERIFIKASI & QC (KHUSUS INTERNAL ADMIN & DIREKTUR) */}
                            {isInternal && activeInspection && (
                                <div className="pt-5 border-t border-slate-200/80 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                                            Verifikasi &amp; QC Kondisi Stasiun
                                        </h3>
                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                            activeInspection.approval_status_id === 'APPROVED'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : activeInspection.approval_status_id === 'REVISION_REQUIRED'
                                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                            {activeInspection.approval_status_name || activeInspection.approval_status_id}
                                        </span>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-2 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500">Tahap Inspeksi:</span>
                                            <span className="font-bold text-slate-800">{activeInspection.stage.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500">Diajukan Oleh:</span>
                                            <span className="font-semibold text-slate-800">{activeInspection.submitted_by_name || 'Vendor Lapangan'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500">Waktu Pengajuan:</span>
                                            <span className="font-mono text-slate-700">{activeInspection.submitted_at || '-'}</span>
                                        </div>
                                        {activeInspection.rejection_reason && (
                                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-700 mt-2">
                                                <strong>Catatan Revisi Sebelumnya:</strong>
                                                <p className="mt-0.5">{activeInspection.rejection_reason}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Feedback Alert Banner */}
                                    {reviewFeedback && (
                                        <div className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2.5 transition animate-in fade-in duration-200 ${
                                            reviewFeedback.type === 'success' 
                                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                                                : 'bg-rose-50 border border-rose-200 text-rose-800'
                                        }`}>
                                            <div className="flex items-center gap-2">
                                                {reviewFeedback.type === 'success' ? (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                ) : (
                                                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                                )}
                                                <span className="font-semibold">{reviewFeedback.message}</span>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => setReviewFeedback(null)}
                                                className="p-1 hover:bg-black/5 rounded-lg text-slate-400 hover:text-slate-600 transition"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Action Form */}
                                    <div className="space-y-3 pt-1">
                                        <label className="block text-xs font-bold text-slate-700">
                                            Catatan / Feedback Verifikator (PT SSI):
                                        </label>
                                        <textarea
                                            value={reviewNotes}
                                            onChange={(e) => setReviewNotes(e.target.value)}
                                            rows={3}
                                            placeholder="Tuliskan catatan evaluasi visual atau poin revisi sebelum menyetujui..."
                                            className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        />

                                        <div className="grid grid-cols-2 gap-3 pt-1">
                                            <button
                                                type="button"
                                                disabled={isSubmittingReview}
                                                onClick={() => handleApprovalSubmit('APPROVE')}
                                                className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
                                            >
                                                {isSubmittingReview ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="w-4 h-4" />
                                                )}
                                                <span>{isSubmittingReview ? 'Memproses...' : 'Setujui Titik (Publish)'}</span>
                                            </button>

                                            <button
                                                type="button"
                                                disabled={isSubmittingReview}
                                                onClick={() => handleApprovalSubmit('REJECT')}
                                                className="py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                                            >
                                                {isSubmittingReview ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                                                ) : (
                                                    <XCircle className="w-4 h-4" />
                                                )}
                                                <span>{isSubmittingReview ? 'Mengirim...' : 'Minta Revisi Lapangan'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        )
                    )}

                    {/* TAB: TIMELINE & AUDIT TRAIL (Internal PT SSI only) */}
                    {isInternal && activeTab === 'TIMELINE' && (
                        <div className="space-y-6">
                            {/* Executive Summary Card */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500 font-medium">Status Operasional Titik:</span>
                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                        {station.status.name}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">Vendor Pelaksana:</span>
                                    <span className="font-semibold text-slate-800">{station.vendor_name || 'PT Mitra Elektrik Nusantara'}</span>
                                </div>
                                {station.pln_meter_id && (
                                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                                        <span className="text-slate-500">ID Pelanggan PLN:</span>
                                        <span className="font-mono font-bold text-slate-800">{station.pln_meter_id}</span>
                                    </div>
                                )}
                            </div>

                            {/* 1. PROJECT LIFECYCLE STEPPER */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                    Tahapan Siklus Proyek (Milestone)
                                </h3>

                                <div className="relative pl-6 space-y-5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                                    {[
                                        {
                                            step: 1,
                                            title: 'Survei Kelayakan Lahan',
                                            date: station.survey_date || 'Selesai Terverifikasi',
                                            isDone: true,
                                            statusLabel: 'Selesai',
                                            desc: 'Pengecekan koordinat geolokasi GPS, izin penempatan lahan pengelola, dan kapasitas trafo PLN.',
                                        },
                                        {
                                            step: 2,
                                            title: 'Konstruksi & Sipil Elektrikal',
                                            date: station.construction_start_date || (station.status_id === 'OPERATIONAL' ? 'Selesai' : '-'),
                                            isDone: station.status_id === 'OPERATIONAL',
                                            isInProgress: station.status_id === 'CONSTRUCTION',
                                            statusLabel: station.status_id === 'OPERATIONAL' ? 'Selesai' : station.status_id === 'CONSTRUCTION' ? 'Sedang Berjalan' : 'Rencana',
                                            desc: 'Pembangunan fondasi beton, instalasi kanopi fisik, tiang gardu, dan penarikan kabel daya trafo.',
                                        },
                                        {
                                            step: 3,
                                            title: 'Uji Operasional (Commissioning)',
                                            date: station.commissioning_date || (station.status_id === 'OPERATIONAL' ? 'Selesai' : '-'),
                                            isDone: station.status_id === 'OPERATIONAL',
                                            isInProgress: station.status_id === 'CONSTRUCTION' && !!station.commissioning_date,
                                            statusLabel: station.status_id === 'OPERATIONAL' ? 'Selesai' : (station.status_id === 'CONSTRUCTION' && !!station.commissioning_date) ? 'Terjadwal' : 'Menunggu Selesai Konstruksi',
                                            desc: 'Simulasi beban penuh daya listrik, integrasi modul IoT telemetri mesin, dan checklist keselamatan K3.',
                                        },
                                        {
                                            step: 4,
                                            title: 'Go-Live & Operasional Komersial',
                                            date: station.status_id === 'OPERATIONAL' ? (station.commissioning_date || station.target_completion_date || 'Aktif') : (station.target_completion_date || '-'),
                                            isDone: station.status_id === 'OPERATIONAL',
                                            statusLabel: station.status_id === 'OPERATIONAL' ? 'Operasional Aktif' : station.status_id === 'ON_HOLD' ? 'Ditangguhkan' : 'Target Go-Live',
                                            desc: 'Stasiun online di peta nasional dan aplikasi V-Green, melayani armada mobil listrik dan penukaran baterai motor.',
                                        },
                                    ].map((m, idx) => (
                                        <div key={idx} className="relative">
                                            {/* Step Indicator Dot */}
                                            <div className={`absolute -left-[30px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                                                m.isDone
                                                    ? 'bg-emerald-500 border-white text-white shadow-xs'
                                                    : m.isInProgress
                                                    ? 'bg-blue-600 border-white text-white shadow-xs ring-2 ring-blue-200 animate-pulse'
                                                    : 'bg-white border-slate-300 text-slate-400'
                                            }`}>
                                                {m.isDone ? <Check className="w-3 h-3 stroke-[3]" /> : m.step}
                                            </div>

                                            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-1 shadow-xs">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h4 className="font-bold text-slate-900 text-xs">{m.title}</h4>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                        m.isDone
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : m.isInProgress
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {m.statusLabel}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                                                    <Clock className="w-3 h-3 text-slate-400" />
                                                    <span>{m.date}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 leading-relaxed pt-0.5">
                                                    {m.desc}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 2. INSPECTION AUDIT TRAIL */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <History className="w-3.5 h-3.5 text-blue-600" />
                                        Log Riwayat Inspeksi &amp; QC Lapangan
                                    </h3>
                                    <span className="text-[11px] font-semibold text-slate-500">
                                        Total: <strong className="text-slate-900">{inspectionHistory.length} Sesi</strong>
                                    </span>
                                </div>

                                {isLoadingPhotos ? (
                                    <div className="py-10 text-center space-y-2 bg-[#F8FAFC] rounded-2xl border border-slate-200/80 animate-pulse">
                                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                                        <p className="text-xs text-slate-500 font-semibold">Memuat log riwayat inspeksi...</p>
                                    </div>
                                ) : inspectionHistory.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        Belum ada riwayat pengajuan inspeksi untuk titik ini.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {inspectionHistory.map((ins, idx) => {
                                            const isApproved = ins.approval_status_id === 'APPROVED';
                                            const isRejected = ins.approval_status_id === 'REVISION_REQUIRED';

                                            return (
                                                <div 
                                                    key={ins.id || idx}
                                                    className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-2.5 shadow-xs hover:border-blue-300 transition"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-5 h-5 rounded-lg bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center font-mono">
                                                                #{inspectionHistory.length - idx}
                                                            </span>
                                                            <span className="font-bold text-xs text-slate-900">
                                                                {ins.stage.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                            isApproved
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : isRejected
                                                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                                        }`}>
                                                            {ins.approval_status_name || ins.approval_status_id}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60">
                                                        <div>
                                                            <span className="text-slate-400 block text-[10px]">Diajukan Oleh:</span>
                                                            <span className="font-semibold text-slate-800">{ins.submitted_by_name || 'Vendor Lapangan'}</span>
                                                            <span className="text-slate-400 block text-[10px] font-mono">{ins.submitted_at || '-'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 block text-[10px]">Diverifikasi Oleh:</span>
                                                            <span className="font-semibold text-slate-800">{ins.reviewed_by_name || 'Direktur / Admin SSI'}</span>
                                                            <span className="text-slate-400 block text-[10px] font-mono">{ins.reviewed_at || (isApproved ? 'Disetujui' : isRejected ? 'Diminta Revisi' : 'Menunggu Review')}</span>
                                                        </div>
                                                    </div>

                                                    {ins.notes && (
                                                        <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 text-xs">
                                                            <span className="text-slate-400 font-bold block text-[10px]">Catatan Verifikator:</span>
                                                            <p className="text-slate-700 mt-0.5 text-[11px] leading-relaxed">{ins.notes}</p>
                                                        </div>
                                                    )}

                                                    {ins.rejection_reason && (
                                                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-700">
                                                            <span className="font-bold block text-[10px]">Catatan Permintaan Revisi:</span>
                                                            <p className="mt-0.5 text-[11px] leading-relaxed">{ins.rejection_reason}</p>
                                                        </div>
                                                    )}

                                                    {ins.photos && ins.photos.length > 0 && (
                                                        <div className="pt-1 flex items-center justify-between border-t border-slate-200/60">
                                                            <span className="text-[11px] text-slate-500">
                                                                Lampiran: <strong>{ins.photos.length} sudut foto</strong>
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedInspectionId(ins.id);
                                                                    setActiveTab('PHOTOS');
                                                                }}
                                                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline"
                                                            >
                                                                <span>Buka Foto Sesi Ini</span>
                                                                <ChevronRight className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* FULL PHOTO VIEWER MODAL WITH ZOOM & NEXT/PREV NAVIGATION (Milestone 3) */}
            {currentPhoto && (
                <div 
                    className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
                    onClick={() => { setSelectedPhotoIndex(null); setIsZoomed(false); }}
                >
                    <div 
                        className="max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-4 px-6 border-b border-slate-100 flex justify-between items-center bg-[#F8FAFC]">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">{currentPhoto.slot_label}</h3>
                                <p className="text-xs text-slate-500">
                                    Sudut: {currentPhoto.angle || 'Standar'} • Kategori: {currentPhoto.category} • Foto {selectedPhotoIndex! + 1} dari {filteredPhotos.length}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsZoomed(!isZoomed)}
                                    className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
                                    title={isZoomed ? "Perkecil (Zoom Out)" : "Perbesar (Zoom In)"}
                                >
                                    {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => { setSelectedPhotoIndex(null); setIsZoomed(false); }}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-800 bg-white border border-slate-200"
                                    title="Tutup (Esc)"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Image Canvas with Arrows */}
                        <div className="relative bg-slate-950 flex items-center justify-center min-h-[420px] max-h-[68vh] overflow-auto select-none">
                            <img
                                src={currentPhoto.photo_url}
                                alt={currentPhoto.slot_label}
                                className={`transition-transform duration-200 object-contain max-h-[68vh] ${
                                    isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
                                }`}
                                onClick={() => setIsZoomed(!isZoomed)}
                            />

                            {/* Left Navigation Arrow */}
                            {selectedPhotoIndex! > 0 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedPhotoIndex(selectedPhotoIndex! - 1); }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition shadow-lg"
                                    title="Foto Sebelumnya (Panah Kiri)"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                            )}

                            {/* Right Navigation Arrow */}
                            {selectedPhotoIndex! < filteredPhotos.length - 1 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedPhotoIndex(selectedPhotoIndex! + 1); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition shadow-lg"
                                    title="Foto Selanjutnya (Panah Kanan)"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            )}
                        </div>

                        {/* Modal Footer with GPS Audit Tag */}
                        <div className="p-4 px-6 bg-white text-xs text-slate-600 flex flex-wrap justify-between items-center gap-3 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-800">Status QC:</span>
                                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                    currentPhoto.is_approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                    {currentPhoto.is_approved ? '✓ Terverifikasi PT SSI' : '⏳ Menunggu Review'}
                                </span>
                            </div>

                            {currentPhoto.latitude && (
                                <div className="flex items-center gap-1.5 font-mono text-slate-500 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100">
                                    <Compass className="w-3.5 h-3.5 text-blue-600" />
                                    <span>GPS Tag: {currentPhoto.latitude.toFixed(6)}, {currentPhoto.longitude?.toFixed(6)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL UPLOAD INSPECTION REPORT 7 SUDUT (Milestone 3) */}
            {isUploadModalOpen && (
                <div 
                    className="fixed inset-0 z-[70] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
                    onClick={() => setIsUploadModalOpen(false)}
                >
                    <div 
                        className="max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 px-6 border-b border-slate-100 flex justify-between items-center bg-[#F8FAFC]">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Unggah Dokumentasi 7 Sudut Lapangan
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Stasiun: <strong className="text-blue-600 font-mono">{station.code}</strong> - {station.name}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsUploadModalOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 bg-white border border-slate-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleNewInspectionSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
                            {/* Stage Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">
                                    Tahapan Sesi Inspeksi
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                    {[
                                        { id: 'INITIAL_SURVEY', label: 'Survei Awal' },
                                        { id: 'CONSTRUCTION_PROGRESS', label: 'Konstruksi' },
                                        { id: 'COMMISSIONING', label: 'Komisioning' },
                                        { id: 'ROUTINE_PERIODIC', label: 'Rutin 4 Bulan' },
                                    ].map(item => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setUploadStage(item.id as any)}
                                            className={`p-2.5 rounded-xl text-center font-semibold transition border ${
                                                uploadStage === item.id
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 7 Angle Slots */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-700">
                                        Checklist 7 Sudut Foto Wajib (Kompresi Otomatis &lt; 1.5MB)
                                    </label>
                                    <span className="text-[11px] text-blue-600 font-semibold">
                                        {Object.keys(uploadingFiles).length} / 7 Terunggah
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {CHECKLIST_SLOTS.map(slot => {
                                        const uploaded = uploadingFiles[slot.id];
                                        return (
                                            <div 
                                                key={slot.id}
                                                className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                                                    uploaded ? 'bg-emerald-50/60 border-emerald-200' : 'bg-[#F8FAFC] border-slate-200/80'
                                                }`}
                                            >
                                                <div className="min-w-0">
                                                    <span className="text-[11px] font-bold text-slate-900 block truncate">
                                                        {slot.label}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">
                                                        {uploaded ? `✓ ${uploaded.sizeKb} KB (Terkompresi)` : 'Belum ada foto'}
                                                    </span>
                                                </div>

                                                <label className="cursor-pointer shrink-0 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-500 text-[11px] font-bold text-slate-800 hover:text-blue-600 shadow-xs transition">
                                                    {uploaded ? 'Ganti' : 'Pilih Foto'}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => handleSlotFileChange(slot.id, e)}
                                                    />
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Notes field */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Catatan Temuan Lapangan
                                </label>
                                <textarea
                                    value={uploadNotes}
                                    onChange={(e) => setUploadNotes(e.target.value)}
                                    rows={2}
                                    placeholder="Keterangan kondisi fisik, kelistrikan, atau grounding stasiun..."
                                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            {/* GPS device status */}
                            <div className="p-3 rounded-xl bg-blue-50 text-blue-800 text-[11px] flex items-center gap-2">
                                <Compass className="w-4 h-4 text-blue-600 shrink-0" />
                                <span>
                                    GPS Tag Perangkat: {uploadGps ? `${uploadGps.latitude.toFixed(6)}, ${uploadGps.longitude.toFixed(6)}` : 'Akan ditandai otomatis dengan koordinat stasiun'}
                                </span>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingReport}
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                                >
                                    {isSubmittingReport ? 'Mengunggah...' : 'Simpan & Ajukan Verifikasi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL UPLOAD LEGAL & CONTRACT DOCUMENT */}
            {isDocUploadOpen && (
                <div 
                    className="fixed inset-0 z-[75] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
                    onClick={() => setIsDocUploadOpen(false)}
                >
                    <div 
                        className="max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 px-6 border-b border-slate-100 flex justify-between items-center bg-[#F8FAFC]">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                                    <FilePlus className="w-4 h-4 text-blue-600" />
                                    <span>Unggah Dokumen Legalitas & Kontrak</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Stasiun: <strong className="text-blue-600 font-mono">{station.code}</strong> • {station.name}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsDocUploadOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 bg-white border border-slate-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleUploadDocSubmit} className="p-6 space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Kategori Dokumen</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['SWASTA', 'PEMERINTAH', 'VENDOR'] as const).map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setDocCategory(cat)}
                                            className={`py-2 rounded-xl text-xs font-bold border transition ${
                                                docCategory === cat
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Jenis Dokumen *</label>
                                <select
                                    value={docType}
                                    onChange={(e) => {
                                        setDocType(e.target.value);
                                        // auto update title if not customized
                                        const labels: Record<string, string> = {
                                            'SHM': 'Sertifikat Hak Milik (SHM)',
                                            'KTP': 'KTP Pemilik Lahan',
                                            'SURAT_PERSETUJUAN': 'Surat Persetujuan',
                                            'LOI': 'Letter of Intent (LOI)',
                                            'PINJAM_PAKAI': 'Perjanjian Pinjam Pakai',
                                            'MOU': 'MOU Kerjasama',
                                            'KWITANSI': 'Kwitansi Pembayaran',
                                            'BUKTI_BAYAR': 'Bukti Bayar / Transfer',
                                            'SK': 'Surat Keputusan (SK)',
                                            'SSR_VENDOR': 'Site Survey Report (SSR)',
                                            'LAPORAN_SURVEY': 'Laporan Survey Teknis',
                                        };
                                        if (labels[e.target.value]) {
                                            setDocTitle(labels[e.target.value]);
                                        }
                                    }}
                                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <optgroup label="Dokumen Swasta">
                                        <option value="SHM">Sertifikat Hak Milik (SHM)</option>
                                        <option value="KTP">KTP Pemilik Lahan</option>
                                        <option value="SURAT_PERSETUJUAN">Surat Persetujuan</option>
                                        <option value="LOI">Letter of Intent (LOI)</option>
                                        <option value="PINJAM_PAKAI">Perjanjian Pinjam Pakai</option>
                                        <option value="MOU">MOU / Perjanjian Kerjasama</option>
                                        <option value="KWITANSI">Kwitansi Pembayaran</option>
                                        <option value="BUKTI_BAYAR">Bukti Bayar / Transfer</option>
                                    </optgroup>
                                    <optgroup label="Dokumen Pemerintah / BUMN">
                                        <option value="SK">Surat Keputusan (SK)</option>
                                        <option value="MOU">MOU Kontrak Kerjasama</option>
                                        <option value="BUKTI_BAYAR">Bukti Bayar / Retribusi</option>
                                    </optgroup>
                                    <optgroup label="Dokumen Vendor">
                                        <option value="SSR_VENDOR">SSR Vendor (Site Survey Report)</option>
                                        <option value="LAPORAN_SURVEY">Laporan Survey Teknis</option>
                                    </optgroup>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Judul / Keterangan Berkas *</label>
                                <input
                                    type="text"
                                    value={docTitle}
                                    onChange={(e) => setDocTitle(e.target.value)}
                                    placeholder="Contoh: SHM No. 4122 Gandaria City"
                                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Pilih File (PDF / Gambar, Maks. 10MB) *</label>
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    onChange={(e) => setSelectedDocFile(e.target.files?.[0] || null)}
                                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                                <textarea
                                    value={docNotes}
                                    onChange={(e) => setDocNotes(e.target.value)}
                                    rows={2}
                                    placeholder="Nomor akta notaris, masa berlaku perizinan..."
                                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsDocUploadOpen(false)}
                                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUploadingDoc}
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <UploadCloud className="w-4 h-4" />
                                    <span>{isUploadingDoc ? 'Mengunggah...' : 'Unggah Dokumen'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
