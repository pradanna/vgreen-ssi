import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Station, FacilityTypeId, StationStatusId } from '@/types/station';
import { Car, BatteryCharging, Zap, MapPin, AlertCircle, ExternalLink, Navigation } from 'lucide-react';

interface GoogleMapViewProps {
    stations: Station[];
    selectedStation: Station | null;
    onSelectStation: (station: Station) => void;
    googleMapsApiKey?: string;
    isVGreen?: boolean;
}

// Generate Custom SVG Marker Data URL
function createMarkerIcon(facilityType: FacilityTypeId, statusId: StationStatusId, isSelected: boolean): string {
    let color = '#22C55E'; // Green
    if (statusId === 'CONSTRUCTION') color = '#F97316'; // Orange
    if (statusId === 'SURVEYED') color = '#EAB308'; // Yellow
    if (statusId === 'ON_HOLD') color = '#EF4444'; // Red

    const strokeColor = isSelected ? '#1E3A8A' : '#FFFFFF';
    const strokeWidth = isSelected ? '4' : '2.5';
    const size = isSelected ? 48 : 38;

    // Inner icon symbol path
    let iconPath = '';
    if (facilityType === 'EVCS') {
        // Car
        iconPath = `<path d="M14 16H34M16 26A3 3 0 1 1 16 20A3 3 0 0 1 16 26ZM32 26A3 3 0 1 1 32 20A3 3 0 0 1 32 26ZM15 20L18 13H30L33 20" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    } else if (facilityType === 'BSS') {
        // Battery swap
        iconPath = `<rect x="16" y="14" width="16" height="18" rx="2" stroke="white" stroke-width="2.5" fill="none"/><path d="M21 11H27M21 21L27 21M24 18V24" stroke="white" stroke-width="2.5" stroke-linecap="round"/>`;
    } else {
        // Combined lightning
        iconPath = `<path d="M26 10L18 24H25L22 34L30 20H23L26 10Z" fill="white"/>`;
    }

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 1.3}" viewBox="0 0 48 62">
        <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.35"/>
            </filter>
        </defs>
        <path d="M24 0C10.745 0 0 10.745 0 24C0 39.5 20 58 24 62C28 58 48 39.5 48 24C48 10.745 37.255 0 24 0Z" 
              fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}" filter="url(#shadow)"/>
        <circle cx="24" cy="22" r="16" fill="rgba(0,0,0,0.18)"/>
        ${iconPath}
    </svg>`;

    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

export default function GoogleMapView({
    stations,
    selectedStation,
    onSelectStation,
    googleMapsApiKey,
    isVGreen = false,
}: GoogleMapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
    const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Initialize Google Maps if API key is present
    useEffect(() => {
        if (!googleMapsApiKey || googleMapsApiKey.trim() === '') {
            return;
        }

        const loader = new Loader({
            apiKey: googleMapsApiKey,
            version: 'weekly',
            libraries: ['places'],
        });

        loader
            .load()
            .then(() => {
                if (!mapRef.current) return;

                const map = new google.maps.Map(mapRef.current, {
                    center: { lat: -2.5, lng: 118.0 }, // Center of Indonesia
                    zoom: 5.2,
                    mapTypeControl: true,
                    mapTypeControlOptions: {
                        position: google.maps.ControlPosition.TOP_RIGHT,
                    },
                    streetViewControl: false,
                    fullscreenControl: true,
                    styles: [
                        {
                            featureType: 'poi',
                            elementType: 'labels',
                            stylers: [{ visibility: 'off' }],
                        },
                    ],
                });

                setMapInstance(map);
            })
            .catch((err) => {
                console.error('Failed to load Google Maps:', err);
                setLoadError(err.message || 'Gagal memuat Google Maps.');
            });
    }, [googleMapsApiKey]);

    // Update markers on stations change
    useEffect(() => {
        if (!mapInstance) return;

        // Clear existing markers
        markers.forEach((m) => m.setMap(null));

        const newMarkers = stations.map((station) => {
            const isSelected = selectedStation?.id === station.id;
            const marker = new google.maps.Marker({
                position: { lat: station.latitude, lng: station.longitude },
                map: mapInstance,
                title: `${station.code} - ${station.name}`,
                icon: {
                    url: createMarkerIcon(station.facility_type_id, station.status_id, isSelected),
                    scaledSize: new google.maps.Size(isSelected ? 48 : 38, isSelected ? 62 : 49),
                    anchor: new google.maps.Point(isSelected ? 24 : 19, isSelected ? 62 : 49),
                },
                zIndex: isSelected ? 999 : 10,
            });

            marker.addListener('click', () => {
                onSelectStation(station);
                mapInstance.panTo({ lat: station.latitude, lng: station.longitude });
                if (mapInstance.getZoom()! < 12) {
                    mapInstance.setZoom(13);
                }
            });

            return marker;
        });

        setMarkers(newMarkers);

        // Fit bounds if stations are present
        if (stations.length > 0 && !selectedStation) {
            const bounds = new google.maps.LatLngBounds();
            stations.forEach((s) => bounds.extend({ lat: s.latitude, lng: s.longitude }));
            mapInstance.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
        }
    }, [mapInstance, stations, selectedStation]);

    // Pan to selected station if changed
    useEffect(() => {
        if (!mapInstance || !selectedStation) return;
        mapInstance.panTo({ lat: selectedStation.latitude, lng: selectedStation.longitude });
        if (mapInstance.getZoom()! < 12) {
            mapInstance.setZoom(14);
        }
    }, [selectedStation]);

    // FALLBACK CANVAS (Interactive Indonesia Map) if Google Maps API key is not yet set
    if (!googleMapsApiKey || googleMapsApiKey.trim() === '' || loadError) {
        return (
            <div className="relative w-full h-full bg-slate-900 overflow-hidden flex flex-col items-center justify-center">
                {/* Notice Banner */}
                <div className="absolute top-4 left-4 right-4 z-20 max-w-2xl mx-auto bg-amber-500/15 border border-amber-500/30 backdrop-blur-md rounded-xl p-3.5 text-amber-200 text-xs shadow-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                            <strong>Google Maps API Key</strong> belum dikonfigurasi di file <code>.env</code> (<code>VITE_GOOGLE_MAPS_API_KEY</code>). Menampilkan visualisasi GIS interaktif bawaan.
                        </span>
                    </div>
                    <span className="text-[11px] bg-amber-500/20 px-2 py-0.5 rounded font-mono font-medium text-amber-300 shrink-0">
                        Interactive GIS Mode
                    </span>
                </div>

                {/* Simulated Geographic Canvas */}
                <div className="relative w-full h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6 select-none">
                    {/* Background Grid & Coordinate lines */}
                    <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
                    
                    {/* Compass Rose */}
                    <div className="absolute bottom-6 left-6 z-10 flex items-center gap-2 text-slate-500 text-xs font-mono">
                        <Navigation className="w-4 h-4 text-emerald-500 rotate-45" />
                        <span>PETA JARINGAN CHARGING STATION V-GREEN INDONESIA</span>
                    </div>

                    {/* Interactive Plotting Canvas */}
                    <div className="relative w-full max-w-5xl h-[560px] border border-slate-800/80 rounded-2xl bg-slate-950/60 backdrop-blur-sm p-4 overflow-hidden shadow-2xl">
                        {/* Indonesia Archipelago Silhouette Simulation */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
                            <span className="text-8xl font-black tracking-widest text-slate-600 font-mono">INDONESIA</span>
                        </div>

                        {/* Interactive Plotted Points */}
                        {stations.map((station) => {
                            // Map real coordinates to relative CSS % position inside Indonesia box
                            // Longitude: 95° (Aceh) to 141° (Papua) -> width
                            // Latitude: 6° (North Sumatra) to -11° (Rote) -> height
                            const minLng = 95.0;
                            const maxLng = 120.0; // focused on Sumatra, Java, Bali, Kalimantan, Sulawesi
                            const minLat = -9.0;
                            const maxLat = 5.0;

                            const left = Math.max(5, Math.min(95, ((station.longitude - minLng) / (maxLng - minLng)) * 100));
                            const top = Math.max(10, Math.min(90, ((maxLat - station.latitude) / (maxLat - minLat)) * 100));

                            const isSelected = selectedStation?.id === station.id;

                            let bgBadge = 'bg-emerald-500 border-emerald-400 text-white';
                            if (station.status_id === 'CONSTRUCTION') bgBadge = 'bg-orange-500 border-orange-400 text-white';
                            if (station.status_id === 'SURVEYED') bgBadge = 'bg-yellow-500 border-yellow-400 text-white';
                            if (station.status_id === 'ON_HOLD') bgBadge = 'bg-red-500 border-red-400 text-white';

                            return (
                                <div
                                    key={station.id}
                                    style={{ left: `${left}%`, top: `${top}%` }}
                                    onClick={() => onSelectStation(station)}
                                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-10 group ${
                                        isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                                    }`}
                                >
                                    {/* Pulse effect if selected or operational */}
                                    {station.status_id === 'OPERATIONAL' && (
                                        <span className="absolute -inset-1 rounded-full bg-emerald-500/30 animate-ping pointer-events-none"></span>
                                    )}

                                    {/* Marker Pin Icon */}
                                    <div
                                        className={`w-9 h-9 rounded-full border-2 shadow-lg flex items-center justify-center transition-all ${bgBadge} ${
                                            isSelected ? 'ring-4 ring-blue-500 ring-offset-2 ring-offset-slate-900 shadow-blue-500/50' : ''
                                        }`}
                                    >
                                        {station.facility_type_id === 'EVCS' && <Car className="w-4 h-4" />}
                                        {station.facility_type_id === 'BSS' && <BatteryCharging className="w-4 h-4" />}
                                        {station.facility_type_id === 'COMBINED' && <Zap className="w-4 h-4" />}
                                    </div>

                                    {/* Tooltip on Hover */}
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none whitespace-nowrap z-40">
                                        <div className="bg-slate-900 text-slate-100 text-xs px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-700 flex flex-col gap-0.5">
                                            <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                                                <span>{station.code}</span>
                                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                                    {station.facility_type.name}
                                                </span>
                                            </div>
                                            <div className="text-slate-300 text-[11px]">{station.name}</div>
                                            <div className="text-[10px] text-slate-400">{station.city}, {station.province}</div>
                                        </div>
                                        <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45 -mt-1"></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <div ref={mapRef} className="w-full h-full" />
        </div>
    );
}
