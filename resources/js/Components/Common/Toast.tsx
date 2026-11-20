import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { router } from '@inertiajs/react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    duration?: number;
}

const TOAST_EVENT = 'vgreen-app-toast';

/**
 * Imperative helper for triggering toasts from anywhere in the application.
 */
export const toast = {
    success: (message: string, title = 'Berhasil', duration = 4500) => {
        dispatchToast('success', message, title, duration);
    },
    error: (message: string, title = 'Gagal', duration = 5000) => {
        dispatchToast('error', message, title, duration);
    },
    warning: (message: string, title = 'Peringatan', duration = 4500) => {
        dispatchToast('warning', message, title, duration);
    },
    info: (message: string, title = 'Informasi', duration = 4000) => {
        dispatchToast('info', message, title, duration);
    },
};

function dispatchToast(type: ToastType, message: string, title?: string, duration?: number) {
    if (typeof window === 'undefined') return;
    const detail: ToastItem = {
        id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type,
        title,
        message,
        duration,
    };
    window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail }));
}

export function ToastContainer() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Periksa flash message awal dari data-page jika ada
        try {
            const appEl = document.getElementById('app');
            if (appEl && appEl.dataset.page) {
                const initialData = JSON.parse(appEl.dataset.page);
                const flash = initialData?.props?.flash;
                if (flash?.success) toast.success(flash.success);
                if (flash?.error) toast.error(flash.error);
            }
        } catch {
            // Ignore parse errors
        }
    }, []);

    // Listen to imperative toast events
    useEffect(() => {
        const handleToast = (e: Event) => {
            const customEvent = e as CustomEvent<ToastItem>;
            if (customEvent.detail) {
                setToasts((prev) => [...prev, customEvent.detail].slice(-4));
            }
        };

        window.addEventListener(TOAST_EVENT, handleToast);
        return () => window.removeEventListener(TOAST_EVENT, handleToast);
    }, []);

    // Listen to Inertia session flash messages via router event stream
    useEffect(() => {
        const removeListener = router.on('success', (event: any) => {
            const flash = event?.detail?.page?.props?.flash;
            if (flash?.success) {
                toast.success(flash.success);
            }
            if (flash?.error) {
                toast.error(flash.error);
            }
        });

        return () => {
            if (typeof removeListener === 'function') {
                removeListener();
            }
        };
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    if (!mounted || toasts.length === 0) return null;

    return createPortal(
        <div 
            className="fixed top-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none"
            aria-live="polite"
        >
            {toasts.map((item) => (
                <ToastItemView key={item.id} item={item} onDismiss={() => removeToast(item.id)} />
            ))}
        </div>,
        document.body
    );
}

function ToastItemView({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, item.duration || 4500);

        return () => clearTimeout(timer);
    }, [item, onDismiss]);

    const config = {
        success: {
            icon: CheckCircle2,
            iconClass: 'text-emerald-600',
            iconBg: 'bg-emerald-50',
            borderColor: 'border-emerald-200/90',
            titleColor: 'text-emerald-950',
            bg: 'bg-white',
        },
        error: {
            icon: AlertCircle,
            iconClass: 'text-rose-600',
            iconBg: 'bg-rose-50',
            borderColor: 'border-rose-200/90',
            titleColor: 'text-rose-950',
            bg: 'bg-white',
        },
        warning: {
            icon: AlertTriangle,
            iconClass: 'text-amber-600',
            iconBg: 'bg-amber-50',
            borderColor: 'border-amber-200/90',
            titleColor: 'text-amber-950',
            bg: 'bg-white',
        },
        info: {
            icon: Info,
            iconClass: 'text-blue-600',
            iconBg: 'bg-blue-50',
            borderColor: 'border-blue-200/90',
            titleColor: 'text-blue-950',
            bg: 'bg-white',
        },
    }[item.type];

    const Icon = config.icon;

    return (
        <div
            className={`pointer-events-auto p-4 rounded-2xl border ${config.borderColor} ${config.bg} shadow-xl shadow-slate-900/10 flex items-start gap-3 transition-all transform animate-in slide-in-from-top-3 fade-in duration-200`}
            role="alert"
        >
            <div className={`w-8 h-8 rounded-xl ${config.iconBg} ${config.iconClass} flex items-center justify-center shrink-0 mt-0.5 shadow-2xs`}>
                <Icon className="w-4.5 h-4.5 stroke-2.5" />
            </div>

            <div className="flex-1 min-w-0 pr-1">
                {item.title && (
                    <div className={`text-xs font-bold leading-tight ${config.titleColor}`}>
                        {item.title}
                    </div>
                )}
                <div className="text-[11.5px] text-slate-600 mt-0.5 leading-relaxed break-words">
                    {item.message}
                </div>
            </div>

            <button
                type="button"
                onClick={onDismiss}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition shrink-0 cursor-pointer"
                aria-label="Tutup notifikasi"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

export default ToastContainer;
