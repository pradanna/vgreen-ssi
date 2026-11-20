import React, { useState } from 'react';
import { 
    X, 
    User as UserIcon, 
    Calendar, 
    Clock, 
    Layers, 
    Monitor, 
    MapPin, 
    FileText, 
    ShieldCheck, 
    ArrowRight, 
    ChevronDown, 
    ChevronRight, 
    Info, 
    Sparkles, 
    Globe
} from 'lucide-react';
import { ActivityLogItem } from '@/types/station';

interface ActivityDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    log: ActivityLogItem | null;
}

export default function ActivityDetailModal({
    isOpen,
    onClose,
    log
}: ActivityDetailModalProps) {
    const [showRawJson, setShowRawJson] = useState(false);

    if (!isOpen || !log) return null;

    // Helper for formatting action badge
    const getActionBadge = (action: string) => {
        if (action.includes('CREATED') || action.includes('APPROVED')) {
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        }
        if (action.includes('UPDATED') || action.includes('RESUBMITTED')) {
            return 'bg-blue-50 text-blue-700 border-blue-200';
        }
        if (action.includes('DELETED') || action.includes('REJECTED')) {
            return 'bg-rose-50 text-rose-700 border-rose-200';
        }
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    // Helper for module badge
    const getModuleBadge = (module: string) => {
        switch (module) {
            case 'STATION':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'DOCUMENT':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'INSPECTION':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'TARGET':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'MASTER_DATA':
                return 'bg-cyan-50 text-cyan-700 border-cyan-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const properties = log.properties || {};
    const oldValues = properties.old_values || properties.old || null;
    const newValues = properties.new_values || properties.new || null;
    const hasDiff = oldValues && newValues && typeof oldValues === 'object' && typeof newValues === 'object';

    // Format Indonesian timestamp
    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }).format(date);
        } catch {
            return dateStr;
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
            onClick={onClose}
        >
            <div 
                className="max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 px-6 border-b border-slate-100 flex justify-between items-center bg-[#F8FAFC]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                            <Info className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                Detail Log Aktivitas &amp; Audit Trail
                            </h3>
                            <p className="text-xs text-slate-500 font-mono">
                                ID: {log.id}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
                    {/* Activity Overview Card */}
                    <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getModuleBadge(log.module)}`}>
                                    Modul: {log.module}
                                </span>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getActionBadge(log.action)}`}>
                                    {log.action}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>{formatDate(log.created_at)}</span>
                            </div>
                        </div>

                        {/* Subject */}
                        {log.subject_name && (
                            <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2 text-xs">
                                <span className="font-semibold text-slate-500">Entitas Terkait:</span>
                                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200 font-mono">
                                    {log.subject_name}
                                </span>
                            </div>
                        )}

                        {/* Description */}
                        <div className="pt-2 border-t border-slate-200/60">
                            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                                {log.description}
                            </p>
                        </div>
                    </div>

                    {/* Actor & Client Meta */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-2">
                            <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
                                Pelaksana (Aktor)
                            </span>
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                    {log.user?.name ? log.user.name.charAt(0).toUpperCase() : 'S'}
                                </div>
                                <div className="min-w-0">
                                    <span className="font-bold text-slate-900 block truncate">
                                        {log.user?.name || 'Sistem Otomatis'}
                                    </span>
                                    <span className="text-[11px] text-slate-500 block truncate">
                                        {log.user?.email || 'system@vgreen.id'} ({log.user?.role_id || 'SYSTEM'})
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-2">
                            <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
                                Metadata Perangkat &amp; Jaringan
                            </span>
                            <div className="space-y-1 font-mono text-[11px] text-slate-600">
                                <div className="flex items-center gap-1.5 truncate">
                                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>IP: {log.ip_address || '127.0.0.1'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 truncate">
                                    <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate" title={log.user_agent || undefined}>
                                        {log.user_agent ? (log.user_agent.length > 35 ? log.user_agent.substring(0, 35) + '...' : log.user_agent) : 'Browser Web / Client'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DIFF CHANGES (Sebelum vs Sesudah) */}
                    {hasDiff && (
                        <div>
                            <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-blue-600" />
                                Rekapitulasi Perubahan Data (Diff)
                            </h4>
                            <div className="rounded-2xl border border-slate-200/80 overflow-hidden text-xs">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-[#F8FAFC] border-b border-slate-200/80 text-left font-bold text-slate-500">
                                            <th className="p-3 px-4">Kolom / Atribut</th>
                                            <th className="p-3 px-4">Nilai Sebelumnya</th>
                                            <th className="p-3 px-4">Nilai Baru</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-mono">
                                        {Object.keys(newValues).map((field) => {
                                            const oldVal = oldValues[field];
                                            const newVal = newValues[field];
                                            return (
                                                <tr key={field} className="hover:bg-slate-50/50">
                                                    <td className="p-3 px-4 font-sans font-bold text-slate-800">
                                                        {field}
                                                    </td>
                                                    <td className="p-3 px-4 text-rose-700 bg-rose-50/40">
                                                        {oldVal !== null && oldVal !== undefined ? String(oldVal) : '(kosong)'}
                                                    </td>
                                                    <td className="p-3 px-4 text-emerald-700 bg-emerald-50/40 font-semibold">
                                                        {newVal !== null && newVal !== undefined ? String(newVal) : '(kosong)'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Metadata Key-Value Cards if not diff */}
                    {!hasDiff && properties && Object.keys(properties).length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-slate-900 mb-2">
                                Parameter &amp; Detail Payload:
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {Object.entries(properties).map(([k, v]) => {
                                    if (typeof v === 'object' && v !== null) return null;
                                    return (
                                        <div key={k} className="p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 flex justify-between items-center gap-2">
                                            <span className="text-slate-500 font-medium">{k}:</span>
                                            <span className="font-bold font-mono text-slate-800 truncate max-w-[200px]" title={String(v)}>
                                                {String(v)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Toggle Raw JSON Payload */}
                    <div className="pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setShowRawJson(!showRawJson)}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 font-medium transition"
                        >
                            {showRawJson ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            <span>{showRawJson ? 'Sembunyikan' : 'Tampilkan'} Raw JSON Payload</span>
                        </button>

                        {showRawJson && (
                            <pre className="mt-2 p-3 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-48">
                                {JSON.stringify(log.properties, null, 2)}
                            </pre>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 px-6 bg-[#F8FAFC] border-t border-slate-100 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
