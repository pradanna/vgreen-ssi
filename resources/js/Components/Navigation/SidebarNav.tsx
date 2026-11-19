import React from 'react';
import { Link } from '@inertiajs/react';
import { 
    LayoutGrid, 
    MapPin, 
    Map as MapIcon, 
    ShieldCheck, 
    Zap,
    Cpu,
    Target
} from 'lucide-react';
import { User } from '@/types';
import { useSidebar } from '@/Contexts/SidebarContext';

interface SidebarNavProps {
    user?: User;
    activeNav?: 'dashboard' | 'stations' | 'gis' | 'inspections' | 'settings' | 'master-data' | 'targets';
    pendingCount?: number;
}

export default function SidebarNav({
    user,
    activeNav = 'dashboard',
    pendingCount = 0,
}: SidebarNavProps) {
    const { isCollapsed } = useSidebar();

    // Check if route matches or activeNav matches
    const isDashboardActive = activeNav === 'dashboard' || (typeof route === 'function' && route().current('dashboard'));
    const isStationsActive = activeNav === 'stations' || (typeof route === 'function' && route().current('stations.index'));
    const isGisActive = activeNav === 'gis' || (typeof route === 'function' && route().current('gis.index'));
    const isTargetsActive = activeNav === 'targets' || (typeof route === 'function' && route().current('targets.*'));
    const isInspectionsActive = activeNav === 'inspections' || (typeof route === 'function' && route().current('inspections.index'));
    const isMasterDataActive = activeNav === 'master-data' || (typeof route === 'function' && route().current('master-data.*'));

    const isSsiAdminOrDirector = user?.role_id === 'ADMIN_SSI' || user?.role_id === 'DIRECTOR_SSI';
    const isVGreen = user?.role_id === 'VGREEN_REP';

    return (
        <aside 
            className={`bg-white border-r border-[#EDF1F7] flex flex-col shrink-0 select-none z-20 transition-[width] duration-300 ease-in-out ${
                isCollapsed ? 'w-20' : 'w-64'
            }`}
        >
            {/* Brand Logo */}
            <div className={`h-24 flex items-center transition-all duration-300 ${isCollapsed ? 'px-0 justify-center' : 'px-8'}`}>
                <Link href={route('dashboard')} className="flex items-center gap-3 group" title={isCollapsed ? 'V-GREEN SSI EV & BSS Platform' : undefined}>
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
                        <Zap className="w-5 h-5 fill-current" />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col whitespace-nowrap overflow-hidden transition-opacity duration-200">
                            <span className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight">
                                V-GREEN <span className="text-blue-600">SSI</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold tracking-wide">
                                EV & BSS Platform
                            </span>
                        </div>
                    )}
                </Link>
            </div>

            {/* Navigation Menu Links */}
            <nav className={`flex-1 space-y-1.5 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-4'}`}>
                {/* SECTION 1: MONITORING & GIS */}
                {!isCollapsed && (
                    <div className="px-3 pt-1 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 select-none">
                        Monitoring & GIS
                    </div>
                )}

                {/* 1. Dashboard */}
                <Link
                    href={route('dashboard')}
                    title={isCollapsed ? 'Dashboard' : undefined}
                    className={`flex items-center rounded-2xl transition-all duration-150 ${
                        isCollapsed 
                            ? 'w-12 h-12 mx-auto justify-center' 
                            : 'w-full gap-3.5 px-4 py-3 text-sm'
                    } ${
                        isDashboardActive
                            ? 'bg-[#F4F5F8] text-slate-900 shadow-subtle font-semibold'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
                    }`}
                >
                    <LayoutGrid className={`w-5 h-5 shrink-0 ${isDashboardActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">Dashboard</span>}
                </Link>

                {/* 2. Titik Stasiun */}
                <Link
                    href={route('stations.index')}
                    title={isCollapsed ? 'Titik Stasiun' : undefined}
                    className={`flex items-center rounded-2xl transition-all duration-150 ${
                        isCollapsed 
                            ? 'w-12 h-12 mx-auto justify-center' 
                            : 'w-full gap-3.5 px-4 py-3 text-sm'
                    } ${
                        isStationsActive
                            ? 'bg-[#F4F5F8] text-slate-900 shadow-subtle font-semibold'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
                    }`}
                >
                    <MapPin className={`w-5 h-5 shrink-0 ${isStationsActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">Titik Stasiun</span>}
                </Link>

                {/* 3. Peta GIS Nasional */}
                <Link
                    href={route('gis.index')}
                    title={isCollapsed ? 'Peta GIS Nasional' : undefined}
                    className={`flex items-center rounded-2xl transition-all duration-150 ${
                        isCollapsed 
                            ? 'w-12 h-12 mx-auto justify-center' 
                            : 'w-full gap-3.5 px-4 py-3 text-sm'
                    } ${
                        isGisActive
                            ? 'bg-[#F4F5F8] text-slate-900 shadow-subtle font-semibold'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
                    }`}
                >
                    <MapIcon className={`w-5 h-5 shrink-0 ${isGisActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">Peta GIS Nasional</span>}
                </Link>

                {/* SECTION 2: OPERASIONAL & QC (ATAU TARGET KEMITRAAN UNTUK V-GREEN) */}
                {!isCollapsed ? (
                    <div className="px-3 pt-4 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 select-none">
                        {isVGreen ? 'Target Kemitraan' : 'Operasional & QC'}
                    </div>
                ) : (
                    <div className="my-2 border-t border-slate-100 mx-1" />
                )}

                {/* 4. Target & Kuota Provinsi */}
                <Link
                    href={route('targets.index')}
                    title={isCollapsed ? 'Target & Kuota' : undefined}
                    className={`flex items-center rounded-2xl transition-all duration-150 ${
                        isCollapsed 
                            ? 'w-12 h-12 mx-auto justify-center' 
                            : 'w-full gap-3.5 px-4 py-3 text-sm'
                    } ${
                        isTargetsActive
                            ? 'bg-[#F4F5F8] text-slate-900 shadow-subtle font-semibold'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
                    }`}
                >
                    <Target className={`w-5 h-5 shrink-0 ${isTargetsActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">Target & Kuota</span>}
                </Link>

                {/* 5. Sesi Verifikasi & QC (Hanya untuk Internal PT SSI / Field - Dibatasi dari V-Green) */}
                {!isVGreen && (
                    <Link
                        href={route('inspections.index')}
                        title={isCollapsed ? 'Verifikasi & QC' : undefined}
                        className={`relative flex items-center rounded-2xl transition-all duration-150 ${
                            isCollapsed 
                                ? 'w-12 h-12 mx-auto justify-center' 
                                : 'w-full justify-between px-4 py-3 text-sm'
                        } ${
                            isInspectionsActive
                                ? 'bg-[#F4F5F8] text-slate-900 shadow-subtle font-semibold'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
                        }`}
                    >
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3.5'}`}>
                            <ShieldCheck className={`w-5 h-5 shrink-0 ${isInspectionsActive ? 'text-blue-600' : 'text-slate-400'}`} />
                            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">Verifikasi & QC</span>}
                        </div>
                        {pendingCount > 0 && (
                            isCollapsed ? (
                                <span className="absolute 1 top-2 right-2 bg-[#4E5BA6] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-2xs ring-2 ring-white">
                                    {pendingCount > 99 ? '99+' : pendingCount}
                                </span>
                            ) : (
                                <span className="bg-[#4E5BA6] text-white text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[28px] text-center shadow-2xs">
                                    {pendingCount}
                                </span>
                            )
                        )}
                    </Link>
                )}

                {/* SECTION 3: MASTER DATA (ADMIN & DIREKTUR) */}
                {isSsiAdminOrDirector && (
                    <>
                        {!isCollapsed ? (
                            <div className="px-3 pt-4 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 select-none">
                                Master Data
                            </div>
                        ) : (
                            <div className="my-2 border-t border-slate-100 mx-1" />
                        )}

                        {/* Master Data (Mesin & Kategori) */}
                        <Link
                            href={route('master-data.index')}
                            title={isCollapsed ? 'Master Data' : undefined}
                            className={`flex items-center rounded-2xl transition-all duration-150 ${
                                isCollapsed 
                                    ? 'w-12 h-12 mx-auto justify-center' 
                                    : 'w-full gap-3.5 px-4 py-3 text-sm'
                            } ${
                                isMasterDataActive
                                    ? 'bg-[#F4F5F8] text-slate-900 shadow-subtle font-semibold'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
                            }`}
                        >
                            <Cpu className={`w-5 h-5 shrink-0 ${isMasterDataActive ? 'text-blue-600' : 'text-slate-400'}`} />
                            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">Master Data</span>}
                        </Link>
                    </>
                )}
            </nav>
        </aside>
    );
}
