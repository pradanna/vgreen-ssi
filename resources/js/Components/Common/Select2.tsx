import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

export interface Select2Option<T = string | number> {
    value: T;
    label: string;
    subtext?: string;
    badge?: string | number;
    badgeColor?: string;
    icon?: React.ComponentType<{ className?: string }>;
    disabled?: boolean;
}

export interface Select2Props<T = string | number> {
    value: T;
    onChange: (value: T) => void;
    options: Select2Option<T>[];
    placeholder?: string;
    searchPlaceholder?: string;
    isSearchable?: boolean;
    isClearable?: boolean;
    onClear?: () => void;
    disabled?: boolean;
    className?: string;
    dropdownClassName?: string;
    variant?: 'pill' | 'default';
    size?: 'sm' | 'md';
    prefixIcon?: React.ComponentType<{ className?: string }>;
    align?: 'left' | 'right';
}

export default function Select2<T extends string | number = string>({
    value,
    onChange,
    options,
    placeholder = 'Pilih...',
    searchPlaceholder = 'Cari opsi...',
    isSearchable = true,
    isClearable = false,
    onClear,
    disabled = false,
    className = '',
    dropdownClassName = '',
    variant = 'pill',
    size = 'md',
    prefixIcon: PrefixIcon,
    align = 'left',
}: Select2Props<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Selected option object
    const selectedOption = useMemo(() => {
        return options.find(opt => opt.value === value) || null;
    }, [options, value]);

    // Filter options based on search query
    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) return options;
        const q = searchQuery.toLowerCase();
        return options.filter(opt => {
            const matchLabel = opt.label.toLowerCase().includes(q);
            const matchSubtext = opt.subtext ? opt.subtext.toLowerCase().includes(q) : false;
            return matchLabel || matchSubtext;
        });
    }, [options, searchQuery]);

    // Handle outside click to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && isSearchable && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        }
    }, [isOpen, isSearchable]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const handleSelect = (option: Select2Option<T>) => {
        if (option.disabled) return;
        onChange(option.value);
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClear) {
            onClear();
        } else if (options.length > 0) {
            onChange(options[0].value);
        }
    };

    // Styling variants
    const isPill = variant === 'pill';
    const isSm = size === 'sm';

    const triggerBaseClass = isPill
        ? `rounded-full bg-[#F4F5F8] hover:bg-[#ECEFF4] border border-slate-200/60 ${isSm ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs'} font-bold text-slate-800 shadow-subtle`
        : `rounded-2xl bg-white border border-[#E8ECF2] hover:border-slate-300 ${isSm ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-xs'} font-semibold text-slate-800 shadow-subtle`;

    return (
        <div ref={containerRef} className={`relative inline-block text-left select-none ${className} ${isOpen ? 'z-40' : ''}`}>
            {/* TRIGGER BUTTON */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-2.5 transition-all duration-200 outline-hidden focus:ring-2 focus:ring-blue-500/20 ${triggerBaseClass} ${
                    isOpen ? 'ring-2 ring-blue-500/20 border-blue-500 bg-white' : ''
                } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <div className="flex items-center gap-2 min-w-0 truncate">
                    {PrefixIcon && <PrefixIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    {selectedOption?.icon && (
                        <selectedOption.icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                    <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    {selectedOption?.badge !== undefined && (
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                            selectedOption.badgeColor || 'bg-blue-50 text-blue-700'
                        }`}>
                            {selectedOption.badge}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {isClearable && selectedOption && (
                        <span
                            onClick={handleClear}
                            className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
                            title="Reset pilihan"
                        >
                            <X className="w-3 h-3" />
                        </span>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                    }`} />
                </div>
            </button>

            {/* FLOATING DROPDOWN POPOVER */}
            {isOpen && (
                <div 
                    className={`absolute z-50 mt-1.5 min-w-[220px] max-w-sm w-max bg-white border border-[#EDF1F7] rounded-2xl shadow-[0_12px_32px_rgba(15,23,42,0.12)] p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150 ${
                        align === 'right' ? 'right-0' : 'left-0'
                    } ${dropdownClassName}`}
                >
                    {/* LIVE SEARCH INPUT */}
                    {isSearchable && (
                        <div className="relative px-1 pt-0.5 pb-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full bg-canvas border border-[#EDF1F7] rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}

                    {/* OPTIONS LIST */}
                    <div className="max-h-56 overflow-y-auto space-y-0.5 py-0.5 scrollbar-thin scrollbar-thumb-slate-200">
                        {filteredOptions.length === 0 ? (
                            <div className="py-4 px-3 text-center text-xs text-slate-400 font-medium">
                                Tidak ada opsi yang cocok
                            </div>
                        ) : (
                            filteredOptions.map((opt) => {
                                const isSelected = opt.value === value;
                                return (
                                    <button
                                        key={String(opt.value)}
                                        type="button"
                                        disabled={opt.disabled}
                                        onClick={() => handleSelect(opt)}
                                        className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs transition text-left ${
                                            isSelected
                                                ? 'bg-blue-50 text-blue-700 font-bold'
                                                : opt.disabled
                                                ? 'opacity-40 cursor-not-allowed text-slate-400'
                                                : 'text-slate-700 hover:bg-slate-50 font-medium'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0 truncate">
                                            {opt.icon && (
                                                <opt.icon className={`w-3.5 h-3.5 shrink-0 ${
                                                    isSelected ? 'text-blue-600' : 'text-slate-400'
                                                }`} />
                                            )}
                                            <div className="truncate">
                                                <div className="truncate">{opt.label}</div>
                                                {opt.subtext && (
                                                    <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                                                        {opt.subtext}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {opt.badge !== undefined && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    opt.badgeColor || (isSelected ? 'bg-blue-100/80 text-blue-800' : 'bg-slate-100 text-slate-600')
                                                }`}>
                                                    {opt.badge}
                                                </span>
                                            )}
                                            {isSelected && (
                                                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
