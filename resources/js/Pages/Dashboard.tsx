import React, { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Station, FacilityTypeId, StationStatusId, StatsSummary } from '@/types/station';
import GoogleMapView from '@/Components/Map/GoogleMapView';
import FilterBar from '@/Components/Map/FilterBar';
import StationDetailDrawer from '@/Components/Map/StationDetailDrawer';
import RoleSwitcher from '@/Components/RoleSwitcher';
import { 
    Zap, 
    Shield, 
    LogOut, 
    Menu, 
    MapPin, 
    Layers, 
    ChevronRight,
    ListFilter,
    Car,
    BatteryCharging
} from 'lucide-react';

interface DashboardProps extends PageProps {
    stations: Station[];
    stats: StatsSummary;
    availableRoles: { id: string; name: string; description: string }[];
}

export default function Dashboard({
    auth,
    stations = [],
    stats,
    availableRoles = [],
    googleMapsApiKey = '',
}: DashboardProps) {
    const user = auth.user;
    const isVGreen = user.role_id === 'VGREEN_REP';
    const isInternal = user.role_id === 'DIRECTOR_SSI' || user.role_id === 'ADMIN_SSI';

    // State for filtering
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFacilityType, setSelectedFacilityType] = useState<FacilityTypeId | 'ALL'>('ALL');
    const [selectedStatus, setSelectedStatus] = useState<StationStatusId | 'ALL'>('ALL');
    const [selectedStation, setSelectedStation] = useState<Station | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Filter stations
    const filteredStations = useMemo(() => {
        return stations.filter((station) => {
            // Facility Type Filter
            if (selectedFacilityType !== 'ALL' && station.facility_type_id !== selectedFacilityType) {
                return false;
            }

            // Status Filter
            if (selectedStatus !== 'ALL' && station.status_id !== selectedStatus) {
                return false;
            }

            // Search query (code, name, city, province)
            if (searchQuery.trim() !== '') {
                const query = searchQuery.toLowerCase();
                const matchCode = station.code.toLowerCase().includes(query);
                const matchName = station.name.toLowerCase().includes(query);
                const matchCity = station.city.toLowerCase().includes(query);
                const matchProvince = station.province.toLowerCase().includes(query);
                if (!matchCode && !matchName && !matchCity && !matchProvince) {
                    return false;
                }
            }

            return true;
        });
    }, [stations, selectedFacilityType, selectedStatus, searchQuery]);

    return (
        <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
            <Head title="Peta Sebaran Titik Charging Station | V-Green SSI" />

            {/* Top Navigation Bar */}
            <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between shrink-0 z-30 shadow-md">
                {/* Brand & Organization Title */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition lg:hidden"
                        title="Daftar Stasiun"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
                            <Zap className="w-5 h-5 fill-current" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-extrabold tracking-tight text-white text-base">V-GREEN</span>
                                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                    SSI
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-400 hidden sm:block">
                                Sistem Pemetaan & Monitoring Charging Station (Genossys)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right controls: Role Badge, Role Switcher, User Menu */}
                <div className="flex items-center gap-3">
                    {/* Role Switcher */}
                    <RoleSwitcher
                        currentRoleId={user.role_id}
                        currentUserName={user.name}
                        availableRoles={availableRoles}
                    />

                    {/* User Profile & Logout */}
                    <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                        <div className="hidden md:flex flex-col text-right leading-tight">
                            <span className="text-xs font-semibold text-white truncate max-w-[140px]">{user.name}</span>
                            <span className="text-[10px] text-slate-400">{user.organization || 'PT SSI'}</span>
                        </div>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition"
                            title="Keluar"
                        >
                            <LogOut className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Sub-Header: Filter Bar */}
            <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedFacilityType={selectedFacilityType}
                onFacilityTypeChange={setSelectedFacilityType}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                stats={stats}
                totalFiltered={filteredStations.length}
                isVGreen={isVGreen}
            />

            {/* Main Interactive Map & Sidebar Layout */}
            <div className="flex-1 relative flex overflow-hidden">
                {/* Floating List Drawer / Sidebar for Quick Station Selection */}
                <aside 
                    className={`absolute top-0 bottom-0 left-0 w-80 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 z-20 flex flex-col transition-transform duration-300 shadow-2xl ${
                        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
                >
                    <div className="p-3.5 border-b border-slate-800 flex items-center justify-between text-xs">
                        <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                            <ListFilter className="w-4 h-4 text-emerald-400" />
                            <span>Daftar Titik ({filteredStations.length})</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                            {filteredStations.length} of {stations.length}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                        {filteredStations.map((station) => {
                            const isSelected = selectedStation?.id === station.id;

                            let statusDot = 'bg-emerald-400';
                            if (station.status_id === 'CONSTRUCTION') statusDot = 'bg-orange-400';
                            if (station.status_id === 'SURVEYED') statusDot = 'bg-yellow-400';
                            if (station.status_id === 'ON_HOLD') statusDot = 'bg-red-400';

                            return (
                                <div
                                    key={station.id}
                                    onClick={() => setSelectedStation(station)}
                                    className={`p-3 rounded-xl border cursor-pointer transition text-xs flex flex-col gap-1.5 ${
                                        isSelected
                                            ? 'bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                                            : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/70 hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-[11px] font-bold text-emerald-400">
                                            {station.code}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${statusDot}`} />
                                            <span className="text-[10px] text-slate-400">{station.status.name}</span>
                                        </div>
                                    </div>

                                    <div className="font-semibold text-slate-200 line-clamp-1">
                                        {station.name}
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/50">
                                        <span className="flex items-center gap-1 truncate">
                                            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                            {station.city}
                                        </span>
                                        <span className="font-medium text-slate-300 shrink-0">
                                            {station.power_capacity_kw ? `${station.power_capacity_kw} kW` : station.facility_type.name}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* Map View Container */}
                <main className="flex-1 relative w-full h-full lg:ml-80">
                    <GoogleMapView
                        stations={filteredStations}
                        selectedStation={selectedStation}
                        onSelectStation={(station) => setSelectedStation(station)}
                        googleMapsApiKey={googleMapsApiKey}
                        isVGreen={isVGreen}
                    />

                    {/* Toggle button on desktop to expand map */}
                    <div className="absolute bottom-6 left-6 z-10 hidden lg:block">
                        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 shadow-xl flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                <span>Operasional</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                                <span>Pembangunan</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                                <span>Survei</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                <span>Kendala</span>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Station Detail Drawer */}
                <StationDetailDrawer
                    station={selectedStation}
                    onClose={() => setSelectedStation(null)}
                    userRole={user.role_id}
                />
            </div>
        </div>
    );
}
