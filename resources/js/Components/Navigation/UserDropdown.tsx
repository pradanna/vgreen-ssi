import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronDown, LogOut, Settings } from 'lucide-react';
import { User } from '@/types';

interface UserDropdownProps {
    user: User;
    roleName?: string;
    className?: string;
}

export default function UserDropdown({
    user,
    roleName,
    className = '',
}: UserDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    const activeRoleName = roleName || user.role?.name || user.role_id;
    const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

    return (
        <div className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 text-xs text-slate-800 transition shadow-xs hover:shadow-sm focus:outline-hidden select-none"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <div className="relative shrink-0">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                        {initial}
                    </div>
                    <span 
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" 
                        title="Status: Online"
                    />
                </div>
                <div className="text-left flex flex-col items-start leading-tight">
                    <span className="text-[10px] text-slate-400 font-medium">Peran Aktif</span>
                    <span className="font-semibold text-slate-800 max-w-[150px] truncate">
                        {activeRoleName}
                    </span>
                </div>
                <ChevronDown 
                    className={`w-3.5 h-3.5 text-slate-400 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Backdrop for outside click */}
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsOpen(false)} 
                    />

                    {/* Popover Menu Card */}
                    <div className="absolute right-0 mt-2.5 w-72 rounded-2xl bg-white border border-[#EDF1F7] shadow-[0_12px_36px_rgba(15,23,42,0.10)] p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150">
                        {/* User Identity Header */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 mb-1">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                                    {initial}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-900 text-xs truncate leading-snug">
                                        {user.name}
                                    </p>
                                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                        {user.email}
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                                            {activeRoleName}
                                        </span>
                                        {user.organization && (
                                            <span className="text-[10px] text-slate-400 truncate">
                                                {user.organization}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Link to Profile Settings */}
                        <Link
                            href={route('profile.edit')}
                            onClick={() => setIsOpen(false)}
                            className="group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 transition font-medium"
                        >
                            <Settings className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
                            <span>Pengaturan Akun</span>
                        </Link>

                        <div className="border-t border-slate-100 my-1" />

                        {/* Logout Action */}
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition font-medium text-left cursor-pointer"
                        >
                            <LogOut className="w-4 h-4 text-rose-500" />
                            <span>Keluar (Logout)</span>
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}
