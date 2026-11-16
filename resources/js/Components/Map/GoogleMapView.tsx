import React, { useEffect, useRef, useState } from 'react';
import { Station, FacilityTypeId, StationStatusId } from '@/types/station';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Map as MapIcon, Globe, Navigation, ZoomIn, ZoomOut } from 'lucide-react';

interface GoogleMapViewProps {
    stations: Station[];
    selectedStation: Station | null;
    onSelectStation: (station: Station) => void;
    googleMapsApiKey?: string;
    isVGreen?: boolean;
}

interface MarkerData {
    html: string;
    width: number;
    height: number;
}

// Flat SVG icons for Car & Motorbike
const getCarSvg = (size: number) => `
<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
    <circle cx="7" cy="17" r="2"/>
    <path d="M9 17h6"/>
    <circle cx="17" cy="17" r="2"/>
</svg>`;

const getMotorbikeSvg = (size: number) => `
<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m18 14-1-3"/>
    <path d="m3 9 6 2a2 2 0 0 1 2-2h2a2 2 0 0 1 1.99 1.81"/>
    <path d="M8 17h3a1 1 0 0 0 1-1 6 6 0 0 1 6-6 1 1 0 0 0 1-1v-.75A5 5 0 0 0 17 5"/>
    <circle cx="19" cy="17" r="3"/>
    <circle cx="5" cy="17" r="3"/>
</svg>`;

// Generate Custom Flat SVG Marker HTML for Leaflet DivIcon
function createMarkerHtml(facilityType: FacilityTypeId, statusId: StationStatusId, isSelected: boolean): MarkerData {
    let color = '#10B981'; // Emerald (OPERATIONAL)
    if (statusId === 'CONSTRUCTION') color = '#F97316'; // Orange
    if (statusId === 'SURVEYED') color = '#F59E0B'; // Amber
    if (statusId === 'ON_HOLD') color = '#EF4444'; // Red

    const strokeColor = isSelected ? '#2D60FF' : '#FFFFFF';
    const strokeWidth = isSelected ? '3.5' : '2.5';
    const isCombined = facilityType === 'COMBINED';

    const width = isCombined ? (isSelected ? 66 : 54) : (isSelected ? 44 : 36);
    const height = isCombined ? (isSelected ? 38 : 32) : (isSelected ? 44 : 36);
    const pulseRing = isSelected ? `<span class="absolute -inset-1.5 rounded-full bg-blue-500/30 animate-ping pointer-events-none"></span>` : '';

    let innerContent = '';
    if (facilityType === 'EVCS') {
        innerContent = getCarSvg(isSelected ? 20 : 16);
    } else if (facilityType === 'BSS') {
        innerContent = getMotorbikeSvg(isSelected ? 20 : 16);
    } else {
        // COMBINED: Flat Car and Motorbike together in one capsule marker
        const iconSize = isSelected ? 16 : 14;
        innerContent = `
            <div class="flex items-center justify-center gap-1.5 px-0.5 text-white">
                ${getCarSvg(iconSize)}
                <span style="width: 1px; height: ${isSelected ? 14 : 11}px; background-color: rgba(255,255,255,0.45); display: inline-block;"></span>
                ${getMotorbikeSvg(iconSize)}
            </div>
        `;
    }

    const html = `
    <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110">
        ${pulseRing}
        <div style="width: ${width}px; height: ${height}px; background-color: ${color}; border: ${strokeWidth}px solid ${strokeColor};"
             class="rounded-full shadow-lg flex items-center justify-center text-white ring-2 ring-black/10">
            ${innerContent}
        </div>
    </div>`;

    return { html, width, height };
}

export default function GoogleMapView({
    stations,
    selectedStation,
    onSelectStation,
    googleMapsApiKey,
    isVGreen = false,
}: GoogleMapViewProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    const activeTileLayerRef = useRef<L.TileLayer | null>(null);
    const markersMapRef = useRef<Map<number, { marker: L.Marker; station: Station }>>(new Map());
    const prevSelectedIdRef = useRef<number | null>(null);
    const prevStationsCountRef = useRef<number>(stations.length);
    const isFirstFilterRef = useRef<boolean>(true);

    // Map Tile Style: Google Road, Google Satellite, Google Terrain
    const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'terrain'>('streets');
    const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);

    // 1. Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        // Create Leaflet Map instance
        const map = L.map(mapContainerRef.current, {
            center: [-2.5, 118.0], // Center of Indonesia
            zoom: 5,
            zoomControl: false, // We use custom zoom buttons
            attributionControl: false,
        });

        // Add Google Maps Tile Layer (with POI pins hidden: pantai, kafe, toko, dll.)
        const googleRoads = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&apistyle=s.t:2|p.v:off', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        });

        googleRoads.addTo(map);
        activeTileLayerRef.current = googleRoads;

        // Add Layer Group for Markers
        const markersLayer = L.layerGroup().addTo(map);
        markersLayerRef.current = markersLayer;

        mapInstanceRef.current = map;

        // Invalidate size after layout stabilization
        setTimeout(() => {
            map.invalidateSize();
        }, 200);

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    // 2. Change Google Maps Tile Type (Road / Satellite / Terrain)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (activeTileLayerRef.current) {
            map.removeLayer(activeTileLayerRef.current);
        }

        let tileUrl = 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&apistyle=s.t:2|p.v:off'; // Streets (No POI)
        if (mapStyle === 'satellite') {
            tileUrl = 'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}&apistyle=s.t:2|p.v:off'; // Hybrid Satellite (No POI)
        } else if (mapStyle === 'terrain') {
            tileUrl = 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&apistyle=s.t:2|p.v:off'; // Terrain (No POI)
        }

        const newTileLayer = L.tileLayer(tileUrl, {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        });

        newTileLayer.addTo(map);
        activeTileLayerRef.current = newTileLayer;
    }, [mapStyle]);

    // 3. Render Stations Markers (Only rebuilds when stations array changes)
    useEffect(() => {
        const map = mapInstanceRef.current;
        const markersLayer = markersLayerRef.current;
        if (!map || !markersLayer) return;

        markersLayer.clearLayers();
        markersMapRef.current.clear();

        stations.forEach((station) => {
            const isSelected = selectedStation?.id === station.id;
            const markerData = createMarkerHtml(station.facility_type_id, station.status_id, isSelected);

            const customIcon = L.divIcon({
                html: markerData.html,
                className: 'custom-station-pin',
                iconSize: [markerData.width, markerData.height],
                iconAnchor: [markerData.width / 2, markerData.height / 2],
            });

            const marker = L.marker([station.latitude, station.longitude], {
                icon: customIcon,
                zIndexOffset: isSelected ? 1000 : 10,
            });

            // Hover Tooltip with Sinao Styling and Flat Icons
            const facilityBadge = station.facility_type_id === 'EVCS'
                ? `<span class="flex items-center gap-1 text-blue-300">${getCarSvg(11)} Mobil Listrik</span>`
                : station.facility_type_id === 'BSS'
                ? `<span class="flex items-center gap-1 text-emerald-300">${getMotorbikeSvg(11)} Motor Listrik (BSS)</span>`
                : `<span class="flex items-center gap-1 text-indigo-300">${getCarSvg(11)} + ${getMotorbikeSvg(11)} Dual Hub</span>`;

            const tooltipContent = `
                <div class="px-3 py-2 bg-slate-900 text-white rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-[170px]">
                    <div class="flex items-center justify-between gap-2">
                        <span class="font-extrabold text-blue-400 tracking-wider">${station.code}</span>
                        <span class="text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                            station.status_id === 'OPERATIONAL' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        }">
                            ${station.status?.name || station.status_id}
                        </span>
                    </div>
                    <div class="font-bold text-white leading-tight">${station.name}</div>
                    <div class="text-[11px] text-slate-400">${station.city}, ${station.province}</div>
                    <div class="text-[10px] text-slate-300 pt-1.5 border-t border-slate-800 flex items-center justify-between">
                        ${facilityBadge}
                        <span class="font-bold text-emerald-400">${station.power_capacity_kw ? station.power_capacity_kw + ' kW' : ''}</span>
                    </div>
                </div>
            `;

            marker.bindTooltip(tooltipContent, {
                direction: 'top',
                offset: [0, -(markerData.height / 2)],
                opacity: 1,
                className: 'leaflet-custom-tooltip',
            });

            marker.on('click', () => {
                onSelectStation(station);
            });

            marker.addTo(markersLayer);
            markersMapRef.current.set(station.id, { marker, station });
        });

        prevSelectedIdRef.current = selectedStation?.id ?? null;
    }, [stations]);

    // 4. Selective Marker Highlight Update (0ms lag, no clearing or recreating 479 DOM nodes!)
    useEffect(() => {
        const markersMap = markersMapRef.current;
        const prevId = prevSelectedIdRef.current;
        const currentId = selectedStation?.id ?? null;

        if (prevId === currentId) return;

        // Restore previous marker to normal state
        if (prevId && markersMap.has(prevId)) {
            const prevEntry = markersMap.get(prevId)!;
            const normalData = createMarkerHtml(prevEntry.station.facility_type_id, prevEntry.station.status_id, false);
            prevEntry.marker.setIcon(L.divIcon({
                html: normalData.html,
                className: 'custom-station-pin',
                iconSize: [normalData.width, normalData.height],
                iconAnchor: [normalData.width / 2, normalData.height / 2],
            }));
            prevEntry.marker.setZIndexOffset(10);
        }

        // Apply active highlight to selected marker
        if (currentId && markersMap.has(currentId)) {
            const currentEntry = markersMap.get(currentId)!;
            const activeData = createMarkerHtml(currentEntry.station.facility_type_id, currentEntry.station.status_id, true);
            currentEntry.marker.setIcon(L.divIcon({
                html: activeData.html,
                className: 'custom-station-pin',
                iconSize: [activeData.width, activeData.height],
                iconAnchor: [activeData.width / 2, activeData.height / 2],
            }));
            currentEntry.marker.setZIndexOffset(1000);
        }

        prevSelectedIdRef.current = currentId;
    }, [selectedStation]);

    // 4. Pan to Selected Station with Smart Camera Offset (leaves space for right-side drawer)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !selectedStation) return;

        const targetZoom = Math.max(map.getZoom(), 13);
        const point = map.project([selectedStation.latitude, selectedStation.longitude], targetZoom);
        
        // Offset center to the right so the marker lands centered in the remaining visible map area
        const drawerWidth = window.innerWidth >= 1024 ? 580 : (window.innerWidth >= 640 ? 520 : 0);
        const offsetPoint = point.add([drawerWidth / 2, 0]);
        const targetLatLng = map.unproject(offsetPoint, targetZoom);

        map.setView(targetLatLng, targetZoom, {
            animate: true,
        });
    }, [selectedStation]);

    // 5. Auto Fit Bounds ONLY when Filtered Stations change (e.g. Province / City selected)
    // NEVER zoom out or reset camera when drawer is closed (selectedStation becomes null)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || stations.length === 0) return;

        // Skip on initial mount
        if (isFirstFilterRef.current) {
            isFirstFilterRef.current = false;
            prevStationsCountRef.current = stations.length;
            return;
        }

        // Only run when stations array changed due to filtering
        if (prevStationsCountRef.current === stations.length) {
            return;
        }
        prevStationsCountRef.current = stations.length;

        // If a station is currently selected, do not interrupt camera
        if (selectedStation) return;

        // If filtered to a specific subset of stations (e.g. province or city)
        if (stations.length < 400) {
            const latLngs = stations.map((s) => [s.latitude, s.longitude] as [number, number]);
            const bounds = L.latLngBounds(latLngs);
            map.fitBounds(bounds, {
                padding: [80, 80],
                maxZoom: 13,
                animate: true,
            });
        }
    }, [stations]);

    return (
        <div className="relative w-full h-full select-none overflow-hidden">
            {/* FULLSCREEN MAP CANVAS */}
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* FLOATING MAP CONTROLS (TOP RIGHT, BELOW NAVBAR) */}
            <div className="absolute top-4 right-6 z-20 flex flex-col items-end gap-2">
                {/* Layer Selector Button */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
                        className="p-2.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-md hover:bg-slate-50 text-slate-700 transition flex items-center gap-1.5"
                        title="Ubah Tipe Tampilan Peta Google Maps"
                    >
                        <Layers className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold hidden sm:inline capitalize">
                            {mapStyle === 'streets' ? 'Peta Jalan' : mapStyle === 'satellite' ? 'Satelit' : 'Medan'}
                        </span>
                    </button>

                    {/* Layer Options Popup */}
                    {isLayerMenuOpen && (
                        <div className="absolute right-0 mt-2 w-44 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xl p-2 z-30 space-y-1 text-xs">
                            <button
                                type="button"
                                onClick={() => {
                                    setMapStyle('streets');
                                    setIsLayerMenuOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 transition ${
                                    mapStyle === 'streets' ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-100 text-slate-700'
                                }`}
                            >
                                <MapIcon className="w-4 h-4 text-blue-600" />
                                <span>Peta Jalan (Default)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMapStyle('satellite');
                                    setIsLayerMenuOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 transition ${
                                    mapStyle === 'satellite' ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-100 text-slate-700'
                                }`}
                            >
                                <Globe className="w-4 h-4 text-emerald-600" />
                                <span>Satelit Google</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMapStyle('terrain');
                                    setIsLayerMenuOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 transition ${
                                    mapStyle === 'terrain' ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-100 text-slate-700'
                                }`}
                            >
                                <Navigation className="w-4 h-4 text-amber-600" />
                                <span>Medan &amp; Kontur</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Custom Zoom Controls */}
                <div className="bg-white/95 backdrop-blur-md rounded-full border border-slate-200/80 shadow-md flex flex-col overflow-hidden">
                    <button
                        type="button"
                        onClick={() => mapInstanceRef.current?.zoomIn()}
                        className="p-2.5 hover:bg-slate-100 text-slate-700 transition border-b border-slate-100"
                        title="Perbesar Peta"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => mapInstanceRef.current?.zoomOut()}
                        className="p-2.5 hover:bg-slate-100 text-slate-700 transition"
                        title="Perkecil Peta"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* GOOGLE MAPS BRANDING BADGE (BOTTOM RIGHT) */}
            <div className="absolute bottom-2 right-4 z-20 pointer-events-none">
                <span className="text-[10px] font-bold text-slate-500 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded shadow-xs">
                    Peta Resmi Google Maps &copy; {new Date().getFullYear()}
                </span>
            </div>
        </div>
    );
}
