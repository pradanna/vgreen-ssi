import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { X, Layers, Tag, AlignLeft } from 'lucide-react';
import Modal from '@/Components/Modal';
import { MachineCategory } from '@/types/station';

interface CategoryModalProps {
    show: boolean;
    onClose: () => void;
    categoryToEdit?: MachineCategory | null;
}

export default function CategoryModal({
    show,
    onClose,
    categoryToEdit,
}: CategoryModalProps) {
    const isEditing = !!categoryToEdit;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        code: '',
        name: '',
        description: '',
    });

    useEffect(() => {
        if (categoryToEdit) {
            setData({
                code: categoryToEdit.code || '',
                name: categoryToEdit.name || '',
                description: categoryToEdit.description || '',
            });
        } else {
            reset();
        }
        clearErrors();
    }, [categoryToEdit, show]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing && categoryToEdit) {
            put(route('master-data.categories.update', { category: categoryToEdit.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        } else {
            post(route('master-data.categories.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        }
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="bg-white rounded-3xl p-7 relative">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                            {isEditing ? 'Ubah Kategori Mesin' : 'Tambah Kategori Mesin'}
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

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Kode Kategori */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-slate-400" />
                            <span>Kode Kategori (Singkatan Unik)</span>
                            <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                            placeholder="Contoh: EVCS atau BSS"
                            disabled={isEditing}
                            className={`w-full bg-[#F8FAFC] border rounded-2xl px-3.5 py-2.5 text-xs font-mono font-bold tracking-wider text-slate-900 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                                errors.code ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                            } ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                        {errors.code && (
                            <p className="mt-1 text-[11px] font-medium text-rose-500">{errors.code}</p>
                        )}
                        <span className="text-[10px] text-slate-400 block mt-1">
                            Digunakan sebagai identitas baku sistem (misal: EVCS untuk Mobil, BSS untuk Motor).
                        </span>
                    </div>

                    {/* Nama Kategori */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            <span>Nama Lengkap Kategori</span>
                            <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Contoh: EVCS - Electric Vehicle Charging Station"
                            className={`w-full bg-white border rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                                errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                            }`}
                        />
                        {errors.name && (
                            <p className="mt-1 text-[11px] font-medium text-rose-500">{errors.name}</p>
                        )}
                    </div>

                    {/* Deskripsi */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                            <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
                            <span>Deskripsi / Cakupan Operasional</span>
                        </label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            placeholder="Tuliskan keterangan mengenai jenis perangkat atau layanan yang dinaungi..."
                            className={`w-full bg-white border rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                                errors.description ? 'border-rose-400' : 'border-slate-200'
                            }`}
                        />
                        {errors.description && (
                            <p className="mt-1 text-[11px] font-medium text-rose-500">{errors.description}</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
                            {processing ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambah Kategori'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
