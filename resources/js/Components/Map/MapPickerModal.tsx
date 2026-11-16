import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, MapPin, Layers, Check, Search, ZoomIn, ZoomOut, Compass } from 'lucide-react';
import { 
    getAllProvinces, 
    getCitiesByProvince, 
    getProvinceCoordinates, 
    getCityCoordinates 
} from '@/utils/indonesiaRegions';

interface MapPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialLatitude?: number;
    initialLongitude?: number;
    initialProvince?: string;
    initialCity?: string;
    onConfirm: (coords: { 
        latitude: number; 
        longitude: number; 
        province?: string; 
        city?: string;
    }) => void;
}

// Clean Modern SVG Pin for Marker
const createPinIcon = () => {
    return L.divIcon({
        className: 'custom-map-picker-pin',
        html: `
            <div style="transform: translate(-50%, -100%); pointer-events: none; user-select: none;">
                <div style="position: relative; display: flex; flex-direction: column; align-items: center; transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);">
                    <div style="width: 38px; height: 38px; background: #2563EB; border: 3px solid #FFFFFF; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 6px 16px rgba(37,99,235,0.45); display: flex; align-items: center; justify-content: center;">
                        <div style="width: 14px; height: 14px; background: #FFFFFF; border-radius: 50%; transform: rotate(45deg);"></div>
                    </div>
                    <div style="width: 12px; height: 5px; background: rgba(15,23,42,0.3); border-radius: 50%; filter: blur(1.5px); margin-top: 3px;"></div>
                </div>
            </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
    });
};

export default function MapPickerModal({
    isOpen,
    onClose,
    initialLatitude = -6.2088,
    initialLongitude = 106.8456,
    initialProvince = '',
    initialCity = '',
    onConfirm,
}: MapPickerModalProps) {
    if (!isOpen) return null;

    const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number }>({
        latitude: initialLatitude && !isNaN(initialLatitude) ? initialLatitude : -6.2088,
        longitude: initialLongitude && !isNaN(initialLongitude) ? initialLongitude : 106.8456,
    });

    const [selectedProvince, setSelectedProvince] = useState<string>(initialProvince || '');
    const [selectedCity, setSelectedCity] = useState<string>(initialCity || '');

    const provinceList = useMemo(() => {
        return [...getAllProvinces()].sort((a, b) => a.localeCompare('id'));
    }, []);

    const availableCities = useMemo(() => {
        if (!selectedProvince) return [];
        const cities = getCitiesByProvince(selectedProvince);
        if (selectedCity && !cities.includes(selectedCity)) {
            return [selectedCity, ...cities];
        }
        return cities;
    }, [selectedProvince, selectedCity]);

    const [mapLayer, setMapLayer] = useState<'streets' | 'satellite'>('streets');
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);

    // Initialize or update Leaflet Map
    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            if (!mapContainerRef.current) return;

            const startLat = selectedCoords.latitude;
            const startLng = selectedCoords.longitude;

            // If map already initialized, just pan and set marker
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
                mapInstanceRef.current.setView([startLat, startLng], 15);
                if (markerRef.current) {
                    markerRef.current.setLatLng([startLat, startLng]);
                }
                return;
            }

            // Create Leaflet Map Instance
            const map = L.map(mapContainerRef.current, {
                center: [startLat, startLng],
                zoom: 15,
                zoomControl: false,
                attributionControl: false,
            });

            // Tile Layer (Google Streets)
            const tileLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            }).addTo(map);

            tileLayerRef.current = tileLayer;
            mapInstanceRef.current = map;

            // Add Pin Marker (tidak draggable, klik diteruskan langsung ke peta)
            const marker = L.marker([startLat, startLng], {
                icon: createPinIcon(),
                draggable: false,
                interactive: false,
            }).addTo(map);

            markerRef.current = marker;

            // Click event on map: klik di mana saja memindahkan pin seketika
            map.on('click', (e: L.LeafletMouseEvent) => {
                const newCoords = {
                    latitude: Number(e.latlng.lat.toFixed(7)),
                    longitude: Number(e.latlng.lng.toFixed(7)),
                };
                marker.setLatLng([newCoords.latitude, newCoords.longitude]);
                setSelectedCoords(newCoords);
            });

            map.invalidateSize();
        }, 120);

        return () => {
            clearTimeout(timer);
        };
    }, [isOpen]);

    // Handle Map Layer Toggle (Google Streets vs Google Hybrid Satellite)
    const handleToggleLayer = (layer: 'streets' | 'satellite') => {
        if (!mapInstanceRef.current) return;
        setMapLayer(layer);

        if (tileLayerRef.current) {
            mapInstanceRef.current.removeLayer(tileLayerRef.current);
        }

        const url = layer === 'satellite'
            ? 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
            : 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

        const newTileLayer = L.tileLayer(url, {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        }).addTo(mapInstanceRef.current);

        tileLayerRef.current = newTileLayer;
    };

    const handleProvinceSelect = (province: string) => {
        setSelectedProvince(province);
        const cities = getCitiesByProvince(province);
        const firstCity = cities.length > 0 ? cities[0] : '';
        setSelectedCity(firstCity);

        const targetCoords = (firstCity && getCityCoordinates(firstCity, province)) || getProvinceCoordinates(province);
        if (targetCoords && mapInstanceRef.current && markerRef.current) {
            const lat = Number(targetCoords.lat.toFixed(7));
            const lng = Number(targetCoords.lng.toFixed(7));
            mapInstanceRef.current.flyTo([lat, lng], 13, { duration: 1.2 });
            markerRef.current.setLatLng([lat, lng]);
            setSelectedCoords({ latitude: lat, longitude: lng });
        }
    };

    const handleCitySelect = (city: string) => {
        setSelectedCity(city);
        const targetCoords = getCityCoordinates(city, selectedProvince) || getProvinceCoordinates(selectedProvince);
        if (targetCoords && mapInstanceRef.current && markerRef.current) {
            const lat = Number(targetCoords.lat.toFixed(7));
            const lng = Number(targetCoords.lng.toFixed(7));
            mapInstanceRef.current.flyTo([lat, lng], 14, { duration: 1.2 });
            markerRef.current.setLatLng([lat, lng]);
            setSelectedCoords({ latitude: lat, longitude: lng });
        }
    };

    const handleConfirm = () => {
        onConfirm({
            latitude: selectedCoords.latitude,
            longitude: selectedCoords.longitude,
            province: selectedProvince,
            city: selectedCity,
        });
        onClose();
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
                tileLayerRef.current = null;
            }
        };
    }, []);

    return (
        <div 
            className="fixed inset-0 z-70 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-4xl flex flex-col overflow-hidden max-h-[92vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                Plotting Koordinat Titik Stasiun
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Klik di mana saja pada peta untuk memindahkan pin. Geser (drag) peta untuk menjelajah area.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                        title="Tutup Peta"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Sub-Header: Presets & Controls */}
                <div className="px-6 py-2.5 bg-slate-50/90 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
                    <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 shrink-0">
                            <Compass className="w-3.5 h-3.5 text-blue-600" />
                            <span>Lompat ke Wilayah:</span>
                        </span>

                        {/* Dropdown Provinsi */}
                        <select
                            value={selectedProvince}
                            onChange={(e) => handleProvinceSelect(e.target.value)}
                            className="h-8 px-2.5 text-xs font-semibold bg-white border border-slate-200/90 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs cursor-pointer min-w-[150px] max-w-[200px]"
                        >
                            <option value="">-- Pilih Provinsi --</option>
                            {provinceList.map((prov) => (
                                <option key={prov} value={prov}>{prov}</option>
                            ))}
                        </select>

                        {/* Dropdown Kota / Kabupaten */}
                        <select
                            value={selectedCity}
                            onChange={(e) => handleCitySelect(e.target.value)}
                            disabled={!selectedProvince}
                            className="h-8 px-2.5 text-xs font-semibold bg-white border border-slate-200/90 rounded-lg text-slate-800 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed min-w-[150px] max-w-[200px]"
                        >
                            <option value="">{selectedProvince ? '-- Pilih Kota / Kab --' : '-- Pilih Provinsi Dulu --'}</option>
                            {availableCities.map((city) => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    </div>

                    {/* Layer Switcher */}
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200/90 shadow-2xs self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={() => handleToggleLayer('streets')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1.5 ${
                                mapLayer === 'streets'
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <span>Peta Jalan</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleToggleLayer('satellite')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1.5 ${
                                mapLayer === 'satellite'
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Layers className="w-3 h-3" />
                            <span>Satelit</span>
                        </button>
                    </div>
                </div>

                {/* Map Viewport */}
                <div className="relative flex-1 min-h-[380px] sm:min-h-[460px] w-full bg-slate-100 overflow-hidden">
                    <style>{`
                        .custom-map-picker-canvas.leaflet-container,
                        .custom-map-picker-canvas .leaflet-grab {
                            cursor: crosshair !important;
                        }
                        .custom-map-picker-canvas.leaflet-drag-target,
                        .custom-map-picker-canvas .leaflet-grab:active {
                            cursor: grabbing !important;
                        }
                    `}</style>
                    <div ref={mapContainerRef} className="absolute inset-0 w-full h-full custom-map-picker-canvas" />

                    {/* Floating Zoom Controls */}
                    <div className="absolute top-4 right-4 z-400 flex flex-col gap-1.5">
                        <button
                            type="button"
                            onClick={() => mapInstanceRef.current?.zoomIn()}
                            className="w-8 h-8 rounded-lg bg-white/95 text-slate-700 hover:text-slate-900 hover:bg-white shadow-md border border-slate-200/80 flex items-center justify-center transition"
                            title="Perbesar Peta"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => mapInstanceRef.current?.zoomOut()}
                            className="w-8 h-8 rounded-lg bg-white/95 text-slate-700 hover:text-slate-900 hover:bg-white shadow-md border border-slate-200/80 flex items-center justify-center transition"
                            title="Perkecil Peta"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Floating Instruction Badge */}
                    <div className="absolute bottom-4 left-4 z-400 bg-slate-900/85 backdrop-blur-xs text-white px-3 py-1.5 rounded-lg text-[11px] font-medium shadow-lg border border-white/10 hidden sm:flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                        <span>Klik di peta untuk menempatkan pin • Geser (drag) untuk menggeser peta</span>
                    </div>
                </div>

                {/* Footer Controls & Live Coordinates */}
                <div className="px-6 py-3.5 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                    {/* Live Coordinates Readout */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-500">Koordinat Dipilih:</span>
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/80">
                            <span>Lat: {selectedCoords.latitude.toFixed(6)}</span>
                            <span className="text-slate-300">•</span>
                            <span>Lng: {selectedCoords.longitude.toFixed(6)}</span>
                        </div>
                        {selectedCity && (
                            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                                📍 {selectedCity}{selectedProvince ? `, ${selectedProvince}` : ''}
                            </span>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 px-4 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs transition"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="h-9 px-4.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1.5"
                        >
                            <Check className="w-3.5 h-3.5 stroke-3" />
                            <span>Gunakan Titik Ini</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
