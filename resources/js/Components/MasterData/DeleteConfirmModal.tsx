import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import Modal from '@/Components/Modal';

interface DeleteConfirmModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    itemName: string;
    warningMessage?: string;
    isDeleting?: boolean;
}

export default function DeleteConfirmModal({
    show,
    onClose,
    onConfirm,
    title,
    itemName,
    warningMessage,
    isDeleting = false,
}: DeleteConfirmModalProps) {
    return (
        <Modal show={show} onClose={onClose} maxWidth="sm">
            <div className="bg-white rounded-3xl p-6 relative">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-3 mb-6">
                    <p className="text-xs text-slate-600 leading-relaxed">
                        Apakah Anda yakin ingin menghapus data <span className="font-bold text-slate-900">"{itemName}"</span>? Tindakan ini tidak dapat dibatalkan.
                    </p>

                    {warningMessage && (
                        <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-[11px] text-amber-800 leading-normal">
                            {warningMessage}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="px-4 py-2 rounded-2xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-xs shadow-rose-500/20 transition disabled:opacity-50"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
}
