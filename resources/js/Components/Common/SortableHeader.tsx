import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

export interface SortableHeaderProps {
    field: string;
    currentSort: string;
    onSort: (newSort: string) => void;
    children: React.ReactNode;
    align?: 'left' | 'center' | 'right';
    defaultDirection?: 'asc' | 'desc';
    className?: string;
    title?: string;
}

export default function SortableHeader({
    field,
    currentSort,
    onSort,
    children,
    align = 'left',
    defaultDirection = 'desc',
    className = '',
    title,
}: SortableHeaderProps) {
    const isAscActive = currentSort === `${field}_ASC`;
    const isDescActive = currentSort === `${field}_DESC`;
    const isActive = isAscActive || isDescActive;

    const handleClick = () => {
        if (isActive) {
            // Toggle direction if already active
            const nextDirection = isAscActive ? 'DESC' : 'ASC';
            onSort(`${field}_${nextDirection}`);
        } else {
            // Activate with default direction
            const initialDirection = defaultDirection.toUpperCase();
            onSort(`${field}_${initialDirection}`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };

    const alignmentClasses = {
        left: 'justify-start text-left',
        center: 'justify-center text-center',
        right: 'justify-end text-right',
    }[align];

    return (
        <button
            type="button"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            title={title || `Urutkan berdasarkan ${typeof children === 'string' ? children : field}`}
            aria-sort={isAscActive ? 'ascending' : isDescActive ? 'descending' : 'none'}
            className={`group inline-flex items-center gap-1.5 cursor-pointer select-none py-1 transition-colors rounded-md focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500/50 ${alignmentClasses} ${
                isActive 
                    ? 'text-blue-600 font-extrabold' 
                    : 'text-slate-500 hover:text-slate-800'
            } ${className}`}
        >
            <span className="tracking-wider uppercase text-[11px] transition-colors">
                {children}
            </span>

            <span className={`inline-flex items-center justify-center transition-all ${
                isActive ? 'text-blue-600 scale-105' : 'text-slate-300 group-hover:text-slate-500'
            }`}>
                {isAscActive ? (
                    <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : isDescActive ? (
                    <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 stroke-[1.75]" />
                )}
            </span>
        </button>
    );
}
