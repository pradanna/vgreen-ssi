import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Shield, ChevronDown, Check, UserCheck, Sparkles } from 'lucide-react';

interface RoleOption {
    id: string;
    name: string;
    description: string;
}

interface RoleSwitcherProps {
    currentRoleId: string;
    currentUserName: string;
    availableRoles: RoleOption[];
}

export default function RoleSwitcher({
    currentRoleId,
    currentUserName,
    availableRoles,
}: RoleSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSwitch = (roleId: string) => {
        if (roleId === currentRoleId) {
            setIsOpen(false);
            return;
        }

        router.post(route('demo.switch-role'), { role_id: roleId }, {
            preserveScroll: true,
            onFinish: () => setIsOpen(false),
        });
    };

    const currentRole = availableRoles.find(r => r.id === currentRoleId);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs text-white transition shadow-sm"
            >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <div className="text-left flex flex-col items-start leading-tight">
                    <span className="text-[10px] text-slate-400 font-mono">Simulasi Role</span>
                    <span className="font-semibold text-emerald-300">{currentRole?.name || currentRoleId}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 text-xs space-y-1">
                        <div className="px-3 py-2 border-b border-slate-800 mb-1 flex items-center justify-between text-slate-400 text-[11px]">
                            <span>Ganti Sudut Pandang Peran:</span>
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        {availableRoles.map((role) => {
                            const isSelected = role.id === currentRoleId;
                            return (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => handleSwitch(role.id)}
                                    className={`w-full text-left p-2.5 rounded-xl transition flex items-start justify-between gap-2 ${
                                        isSelected 
                                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
                                            : 'hover:bg-slate-800 text-slate-300'
                                    }`}
                                >
                                    <div>
                                        <div className="font-semibold text-xs flex items-center gap-1.5">
                                            <span>{role.name}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                                            {role.description}
                                        </div>
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
