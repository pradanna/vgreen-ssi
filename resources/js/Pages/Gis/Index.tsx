import React, { useState, useMemo, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Station, FacilityType, StationStatus, FacilityTypeId, StationStatusId, StatsSummary } from '@/types/station';
import GoogleMapView from '@/Components/Map/GoogleMapView';
import FilterBar, { OwnershipFilter } from '@/Components/Map/FilterBar';
import StationDetailDrawer from '@/Components/Map/StationDetailDrawer';
import StationFormModal from '@/Components/Admin/StationFormModal';
import SidebarNav from '@/Components/Navigation/SidebarNav';
import SidebarTrigger from '@/Components/Navigation/SidebarTrigger';
import UserDropdown from '@/Components/Navigation/UserDropdown';
import { useSidebar } from '@/Contexts/SidebarContext';
import { 
    Map as MapIcon, 
    Layers, 
    Car, 
    Motorbike,
    BatteryCharging, 
    Zap, 
    Plus,
    Search,
    Bell,
    Briefcase,
    Landmark
} from 'lucide-react';

interface GisPageProps extends PageProps {
    stations: Station[];
    stats: StatsSummary;
    facilityTypes?: FacilityType[];
    stationStatuses?: StationStatus[];
    availableRoles: { id: string; name: string; description: string }[];
    googleMapsApiKey?: string;
}

export default function GisIndex({
    auth,
    stations = [],
    stats,
    facilityTypes = [],
    stationStatuses = [],
    availableRoles = [],
    googleMapsApiKey = '',
}: GisPageProps) {
    const user = auth.user;
    const isVGreen = user.role_id === 'VGREEN_REP';
    const isInternal = user.role_id === 'DIRECTOR_SSI' || user.role_id === 'ADMIN_SSI';

    // Pastikan navbar selalu dalam ukuran normal penuh (tidak disempitkan)
    const { setCollapsed } = useSidebar();
    useEffect(() => {
        setCollapsed(false);
    }, []);

    // State Filter & Pencarian
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProvince, setSelectedProvince] = useState<string>('ALL');
    const [selectedCity, setSelectedCity] = useState<string>('ALL');
    const [selectedOwnership, setSelectedOwnership] = useState<OwnershipFilter>('ALL');
    const [selectedFacilityType, setSelectedFacilityType] = useState<FacilityTypeId | 'ALL'>('ALL');
    const [selectedStatus, setSelectedStatus] = useState<StationStatusId | 'ALL'>('ALL');

    // Drawer & Modals
    const [selectedStation, setSelectedStation] = useState<Station | null>(null);
    const [isAddStationModalOpen, setIsAddStationModalOpen] = useState(false);

    // 1. Ekstraksi Daftar Unik Provinsi
    const availableProvinces = useMemo(() => {
        const provinces = new Set<string>();
        stations.forEach((s) => {
            if (s.province && s.province.trim() !== '') {
                provinces.add(s.province.trim());
            }
        });
        return Array.from(provinces).sort();
    }, [stations]);

    // 2. Ekstraksi Daftar Unik Kota (Cascade dari Provinsi yang dipilih)
    const availableCities = useMemo(() => {
        const cities = new Set<string>();
        stations.forEach((s) => {
            if (selectedProvince === 'ALL' || s.province?.trim() === selectedProvince.trim()) {
                if (s.city && s.city.trim() !== '') {
                    cities.add(s.city.trim());
                }
            }
        });
        return Array.from(cities).sort();
    }, [stations, selectedProvince]);

    // 3. Filtering stations komprehensif
    const filteredStations = useMemo(() => {
        return stations.filter((station) => {
            // Filter Facility Type
            if (selectedFacilityType !== 'ALL' && station.facility_type_id !== selectedFacilityType) {
                return false;
            }

            // Filter Status
            if (selectedStatus !== 'ALL' && station.status_id !== selectedStatus) {
                return false;
            }

            // Filter Provinsi
            if (selectedProvince !== 'ALL' && station.province?.trim() !== selectedProvince.trim()) {
                return false;
            }

            // Filter Kota
            if (selectedCity !== 'ALL' && station.city?.trim() !== selectedCity.trim()) {
                return false;
            }

            // Filter Kepemilikan Lahan: Swasta vs Negeri/BUMN
            if (selectedOwnership !== 'ALL') {
                const isNegeri = 
                    station.ownership_type === 'NEGERI_BUMN' || 
                    station.landlord_type === 'PEMERINTAH';

                if (selectedOwnership === 'NEGERI_BUMN' && !isNegeri) return false;
                if (selectedOwnership === 'SWASTA' && isNegeri) return false;
            }

            // Filter Teks Bebas
            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase();
                const matchCode = station.code?.toLowerCase().includes(q) || false;
                const matchName = station.name?.toLowerCase().includes(q) || false;
                const matchAddress = station.address?.toLowerCase().includes(q) || false;
                const matchCity = station.city?.toLowerCase().includes(q) || false;
                const matchProvince = station.province?.toLowerCase().includes(q) || false;
                const matchLandlord = station.landlord_name?.toLowerCase().includes(q) || false;

                if (!matchCode && !matchName && !matchAddress && !matchCity && !matchProvince && !matchLandlord) {
                    return false;
                }
            }

            return true;
        });
    }, [stations, selectedFacilityType, selectedStatus, selectedProvince, selectedCity, selectedOwnership, searchQuery]);

    // Reset semua filter
    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedProvince('ALL');
        setSelectedCity('ALL');
        setSelectedOwnership('ALL');
        setSelectedFacilityType('ALL');
        setSelectedStatus('ALL');
    };

    return (
        <div className="flex h-screen w-screen bg-canvas text-slate-800 font-sans overflow-hidden antialiased">
            <Head title="Peta GIS Nasional - V-Green SSI Platform" />

            {/* SIDEBAR NAVIGATION (LEBAR NORMAL w-64) */}
            <SidebarNav 
                user={user} 
                activeNav="gis" 
                pendingCount={stats.construction + stats.surveyed} 
            />

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* 1. TOP NAVBAR (HEADER STANDAR PERSIS SEPERTI GAMBAR CONTOH) */}
                <header className="h-20 px-8 flex items-center justify-between shrink-0 bg-transparent z-10">
                    {/* View Title & Trigger */}
                    <div className="flex items-center gap-4">
                        <SidebarTrigger />
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                            Peta GIS Sebaran Nasional
                        </h1>
                    </div>

                    {/* Right Controls: Search Pill + Notification Bell + User Profile */}
                    <div className="flex items-center gap-4">
                        {/* Search Input Pill */}
                        <div className="relative w-64 md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari stasiun, kode VG-..., kota..."
                                className="w-full bg-white border border-[#E8ECF2] rounded-full pl-11 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 shadow-subtle focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 transition"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[9px] transition"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Notification Bell */}
                        <button 
                            className="relative w-10 h-10 rounded-full bg-white border border-[#E8ECF2] flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-subtle hover:shadow-sm transition"
                            title="Notifikasi Verifikasi"
                        >
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                        </button>

                        {/* User Profile & Role Dropdown */}
                        <UserDropdown
                            user={user}
                            roleName={user.role?.name || availableRoles.find((r) => r.id === user.role_id)?.name}
                        />
                    </div>
                </header>

                {/* 2. MAP CONTAINER: FULL SCREEN / FULL BLEED DI BAWAH NAVBAR */}
                <div className="flex-1 relative w-full h-full overflow-hidden">
                    {/* PETA FULLSCREEN */}
                    <div className="absolute inset-0 z-0 w-full h-full">
                        <GoogleMapView
                            stations={filteredStations}
                            selectedStation={selectedStation}
                            onSelectStation={(s) => setSelectedStation(s)}
                            googleMapsApiKey={googleMapsApiKey}
                            isVGreen={isVGreen}
                        />
                    </div>

                    {/* 3. PENCARIAN & FILTER MELAYANG DI DEPAN PETA (FLOATING BAR 1 BARIS) */}
                    <div className="absolute top-4 left-6 z-20 max-w-[calc(100vw-3rem)]">
                        <FilterBar
                            variant="floating"
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            selectedProvince={selectedProvince}
                            onProvinceChange={setSelectedProvince}
                            availableProvinces={availableProvinces}
                            selectedCity={selectedCity}
                            onCityChange={setSelectedCity}
                            availableCities={availableCities}
                            selectedOwnership={selectedOwnership}
                            onOwnershipChange={setSelectedOwnership}
                            selectedFacilityType={selectedFacilityType}
                            onFacilityTypeChange={setSelectedFacilityType}
                            selectedStatus={selectedStatus}
                            onStatusChange={setSelectedStatus}
                            stats={stats}
                            totalFiltered={filteredStations.length}
                            isVGreen={isVGreen}
                            onResetFilters={handleResetFilters}
                            stations={stations}
                            onSelectStation={(s) => setSelectedStation(s)}
                        />
                    </div>

                    {/* 4. SLIDE-OVER DETAIL STASIUN (PETA TETAP AKTIF BEBAS DIJALANKAN) */}
                    <StationDetailDrawer
                        station={selectedStation}
                        onClose={() => setSelectedStation(null)}
                        userRole={user.role_id}
                        hasBackdrop={false}
                    />

                    {/* 6. MODAL TAMBAH STASIUN BARU (INTERNAL ADMIN/DIREKTUR) */}
                    {isInternal && (
                        <StationFormModal
                            isOpen={isAddStationModalOpen}
                            onClose={() => setIsAddStationModalOpen(false)}
                            facilityTypes={facilityTypes}
                            stationStatuses={stationStatuses}
                            stationToEdit={null}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
