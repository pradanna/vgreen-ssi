import React from 'react';
import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PaginatedData, PaginationLink } from '@/types/pagination';

interface PaginationProps {
    data: PaginatedData<any>;
    onPageChange?: (page: number, url?: string) => void;
    onPerPageChange?: (perPage: number) => void;
    perPageOptions?: number[];
    showPerPageSelector?: boolean;
    showSummary?: boolean;
    preserveScroll?: boolean;
    preserveState?: boolean;
    only?: string[];
    className?: string;
}

export default function Pagination({
    data,
    onPageChange,
    onPerPageChange,
    perPageOptions = [10, 25, 50, 100],
    showPerPageSelector = true,
    showSummary = true,
    preserveScroll = true,
    preserveState = true,
    only,
    className = '',
}: PaginationProps) {
    if (!data || data.total === 0) {
        return (
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 bg-white border-t border-[#EDF1F7] text-xs text-slate-400 ${className}`}>
                <div>Tidak ada data yang tersedia untuk ditampilkan</div>
            </div>
        );
    }

    const handleNavigate = (url: string | null, pageNumber?: number) => {
        if (!url) return;

        if (onPageChange && pageNumber) {
            onPageChange(pageNumber, url);
            return;
        }

        router.get(
            url,
            {},
            {
                preserveScroll,
                preserveState,
                only: only && only.length > 0 ? only : undefined,
            }
        );
    };

    const handlePerPageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = parseInt(e.target.value, 10);
        if (onPerPageChange) {
            onPerPageChange(newPerPage);
            return;
        }

        // Default: update query param in current URL
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('per_page', newPerPage.toString());
        currentUrl.searchParams.set('page', '1'); // reset to page 1

        router.get(
            currentUrl.pathname + currentUrl.search,
            {},
            {
                preserveScroll,
                preserveState,
                only: only && only.length > 0 ? only : undefined,
            }
        );
    };

    // Filter and normalize page links from Laravel paginator
    // Laravel links include "Previous", page numbers, and "Next"
    const prevLink = data.links?.find((l) => l.label.includes('Previous') || l.label.includes('&laquo;'));
    const nextLink = data.links?.find((l) => l.label.includes('Next') || l.label.includes('&raquo;'));
    const pageNumberLinks = (data.links || []).filter(
        (l) => !l.label.includes('Previous') && !l.label.includes('&laquo;') && !l.label.includes('Next') && !l.label.includes('&raquo;')
    );

    return (
        <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 bg-white border-t border-[#EDF1F7] text-xs ${className}`}
        >
            {/* Left: Data Summary */}
            {showSummary && (
                <div className="text-slate-500 font-medium flex items-center gap-1.5 flex-wrap">
                    <span>Menampilkan</span>
                    <span className="font-bold text-slate-800">{data.from ?? 0}</span>
                    <span>–</span>
                    <span className="font-bold text-slate-800">{data.to ?? 0}</span>
                    <span>dari</span>
                    <span className="font-bold text-blue-700">{data.total}</span>
                    <span>total data</span>
                </div>
            )}

            {/* Right: Per Page Selector & Navigation Buttons */}
            <div className="flex items-center gap-4 flex-wrap justify-between sm:justify-end">
                {/* Per Page Selector */}
                {showPerPageSelector && (
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium hidden md:inline">Baris:</span>
                        <select
                            value={data.per_page}
                            onChange={handlePerPageSelect}
                            className="h-8 px-2.5 text-xs font-semibold bg-white border border-slate-200/90 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs cursor-pointer"
                            title="Jumlah baris per halaman"
                        >
                            {perPageOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Pagination Controls */}
                <div className="flex items-center gap-1">
                    {/* Previous Button */}
                    <button
                        type="button"
                        onClick={() => handleNavigate(prevLink?.url || null, data.current_page - 1)}
                        disabled={!prevLink?.url}
                        className={`h-8 w-8 rounded-lg flex items-center justify-center border text-xs transition ${
                            prevLink?.url
                                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90 shadow-2xs cursor-pointer'
                                : 'bg-slate-50/50 text-slate-300 border-slate-100 cursor-not-allowed'
                        }`}
                        title="Halaman Sebelumnya"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                        {pageNumberLinks.map((link, idx) => {
                            const isEllipsis = link.label === '...';
                            const pageNum = parseInt(link.label, 10);

                            if (isEllipsis) {
                                return (
                                    <span
                                        key={`ellipsis-${idx}`}
                                        className="h-8 w-7 flex items-center justify-center text-slate-400 font-bold select-none text-[11px]"
                                    >
                                        ...
                                    </span>
                                );
                            }

                            return (
                                <button
                                    key={link.label}
                                    type="button"
                                    onClick={() => handleNavigate(link.url, pageNum)}
                                    disabled={link.active || !link.url}
                                    className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                                        link.active
                                            ? 'bg-blue-600 text-white shadow-2xs border border-blue-600 cursor-default'
                                            : link.url
                                            ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs cursor-pointer'
                                            : 'bg-slate-50/50 text-slate-300 border border-slate-100 cursor-not-allowed'
                                    }`}
                                >
                                    {link.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Next Button */}
                    <button
                        type="button"
                        onClick={() => handleNavigate(nextLink?.url || null, data.current_page + 1)}
                        disabled={!nextLink?.url}
                        className={`h-8 w-8 rounded-lg flex items-center justify-center border text-xs transition ${
                            nextLink?.url
                                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90 shadow-2xs cursor-pointer'
                                : 'bg-slate-50/50 text-slate-300 border-slate-100 cursor-not-allowed'
                        }`}
                        title="Halaman Berikutnya"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
