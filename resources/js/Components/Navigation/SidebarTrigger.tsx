import React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useSidebar } from '@/Contexts/SidebarContext';

interface SidebarTriggerProps {
    className?: string;
}

export default function SidebarTrigger({ className = '' }: SidebarTriggerProps) {
    const { isCollapsed, toggleSidebar } = useSidebar();

    return (
        <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Buka Navigasi Sidebar' : 'Ciutkan Navigasi Sidebar'}
            title={isCollapsed ? 'Buka Navigasi Sidebar' : 'Ciutkan Navigasi Sidebar'}
            className={`w-10 h-10 rounded-xl bg-white border border-[#E8ECF2] flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-subtle hover:shadow-sm transition duration-150 shrink-0 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${className}`}
        >
            {isCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-slate-700" />
            ) : (
                <PanelLeftClose className="w-5 h-5 text-slate-700" />
            )}
        </button>
    );
}
