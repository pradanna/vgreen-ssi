import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, MapPin, Layers, Check, Search, ZoomIn, ZoomOut, Compass, LoaderCircle } from 'lucide-react';
import Select2, { Select2Option } from '@/Components/Common/Select2';
import { 
    getAllProvinces, 
    getCitiesByProvince, 
    getProvinceCoordinates, 
    getCityCoordinates,
    normalizeProvinceName,
    normalizeCityName
} from '@/utils/indonesiaRegions';

interface MapPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialLatitude?: number;
    initialLongitude?: number;
    initialProvince?: string;
    initialCity?: string;
    initialAddress?: string;
    initialPostalCode?: string;
    onConfirm: (coords: { 
        latitude: number; 
        longitude: number; 
        province?: string; 
        city?: string;
        address?: string;
        postal_code?: string;
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
    initialAddress = '',
    initialPostalCode = '',
    onConfirm,
}: MapPickerModalProps) {
    if (!isOpen) return null;

    const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number }>({
        latitude: initialLatitude && !isNaN(initialLatitude) ? initialLatitude : -6.2088,
        longitude: initialLongitude && !isNaN(initialLongitude) ? initialLongitude : 106.8456,
    });

    const provinceList = useMemo(() => {
        return [...getAllProvinces()].sort((a, b) => a.localeCompare('id'));
    }, []);

    const [selectedProvince, setSelectedProvince] = useState<string>(() => {
        if (!initialProvince) return '';
        const found = getAllProvinces().find(p => p.toLowerCase() === initialProvince.trim().toLowerCase());
        return found || initialProvince;
    });
    const [selectedCity, setSelectedCity] = useState<string>(initialCity || '');
    const [selectedAddress, setSelectedAddress] = useState<string>(initialAddress || '');
    const [selectedPostalCode, setSelectedPostalCode] = useState<string>(initialPostalCode || '');
    const [isReverseLoading, setIsReverseLoading] = useState<boolean>(false);
    const reverseDebounceRef = useRef<NodeJS.Timeout | null>(null);

    // Reverse Geocoding: resolves lat/lon to full address, postal code, city, and province
    const fetchReverseGeocode = useCallback((lat: number, lng: number) => {
        if (reverseDebounceRef.current) {
            clearTimeout(reverseDebounceRef.current);
        }

        setIsReverseLoading(true);

        reverseDebounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/geo/reverse?lat=${lat}&lon=${lng}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.province) {
                        const normProv = normalizeProvinceName(data.province);
                        setSelectedProvince(normProv);
                        if (data.city) {
                            const normCity = normalizeCityName(data.city, normProv);
                            setSelectedCity(normCity);
                        }
                    }
                    if (data.address) {
                        setSelectedAddress(data.address);
                    }
                    if (data.postal_code) {
                        setSelectedPostalCode(data.postal_code);
                    }
                }
            } catch (err) {
                console.error('Reverse geocode error:', err);
            } finally {
                setIsReverseLoading(false);
            }
        }, 300);
    }, []);

    // Synchronize initial state when modal opens
    useEffect(() => {
        if (isOpen) {
            const foundProv = provinceList.find(p => p.toLowerCase() === (initialProvince || '').trim().toLowerCase()) || initialProvince || '';
            setSelectedProvince(foundProv);
            setSelectedCity(initialCity || '');
            setSelectedAddress(initialAddress || '');
            setSelectedPostalCode(initialPostalCode || '');

            const validLat = initialLatitude && !isNaN(initialLatitude) ? initialLatitude : -6.2088;
            const validLng = initialLongitude && !isNaN(initialLongitude) ? initialLongitude : 106.8456;

            setSelectedCoords({
                latitude: validLat,
                longitude: validLng,
            });

            // If initial address is empty, reverse geocode the starting location
            if (!initialAddress && validLat && validLng) {
                fetchReverseGeocode(validLat, validLng);
            }
        }
    }, [isOpen, initialProvince, initialCity, initialAddress, initialPostalCode, initialLatitude, initialLongitude, provinceList, fetchReverseGeocode]);

    const availableCities = useMemo(() => {
        if (!selectedProvince) return [];
        const cities = getCitiesByProvince(selectedProvince);
        if (selectedCity && !cities.includes(selectedCity)) {
            return [selectedCity, ...cities];
        }
        return cities;
    }, [selectedProvince, selectedCity]);

    const provinceOptions = useMemo<Select2Option<string>[]>(() => {
        return provinceList.map((prov) => ({
            value: prov,
            label: prov,
        }));
    }, [provinceList]);

    const cityOptions = useMemo<Select2Option<string>[]>(() => {
        return availableCities.map((city) => ({
            value: city,
            label: city,
        }));
    }, [availableCities]);

    // Specific POI / Landmark / Street Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{
        place_id: number | string;
        name: string;
        display_name: string;
        lat: number;
        lon: number;
        type: string;
        class?: string;
        city?: string;
        province?: string;
    }>>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const searchDropdownRef = useRef<HTMLDivElement>(null);
    const [searchCoords, setSearchCoords] = useState<{ top: number; left: number; width: number } | null>(null);

    const updateSearchPosition = useCallback(() => {
        if (!searchContainerRef.current) return;
        const rect = searchContainerRef.current.getBoundingClientRect();
        setSearchCoords({
            top: rect.bottom + 6,
            left: rect.left,
            width: Math.max(340, rect.width),
        });
    }, []);

    // Live search debounce effect
    useEffect(() => {
        if (!searchQuery || searchQuery.trim().length < 2) {
            setSearchResults([]);
            setIsSearchOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const params = new URLSearchParams({
                    q: searchQuery.trim(),
                    city: selectedCity || '',
                    province: selectedProvince || '',
                    lat: selectedCoords.latitude ? selectedCoords.latitude.toString() : '',
                    lon: selectedCoords.longitude ? selectedCoords.longitude.toString() : '',
                });
                const res = await fetch(`/geo/search?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data);
                    setIsSearchOpen(true);
                    updateSearchPosition();
                }
            } catch (err) {
                console.error('Geo search error:', err);
            } finally {
                setIsSearching(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedCity, selectedProvince, updateSearchPosition]);

    // Handle place selection
    const handleSelectPlace = (place: {
        lat: number;
        lon: number;
        name: string;
        display_name: string;
        province?: string;
        city?: string;
        postcode?: string;
    }) => {
        const lat = Number(place.lat.toFixed(7));
        const lng = Number(place.lon.toFixed(7));

        setSelectedCoords({ latitude: lat, longitude: lng });

        if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
            markerRef.current.setLatLng([lat, lng]);
        }

        // Auto-sync province and city if available
        if (place.province) {
            const normProv = normalizeProvinceName(place.province);
            setSelectedProvince(normProv);
            if (place.city) {
                const normCity = normalizeCityName(place.city, normProv);
                setSelectedCity(normCity);
            }
        }

        if (place.display_name) {
            setSelectedAddress(place.display_name);
        }
        if (place.postcode) {
            setSelectedPostalCode(place.postcode);
        }

        // Fetch reverse geocode to guarantee complete administrative breakdown
        fetchReverseGeocode(lat, lng);

        setSearchQuery(place.name);
        setIsSearchOpen(false);
    };

    // Outside click & Escape dismiss listeners for search dropdown
    useEffect(() => {
        if (!isSearchOpen) return;

        const handleMouseDown = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                searchContainerRef.current && !searchContainerRef.current.contains(target) &&
                searchDropdownRef.current && !searchDropdownRef.current.contains(target)
            ) {
                setIsSearchOpen(false);
            }
        };

        const handleScroll = (e: Event) => {
            if (searchDropdownRef.current && searchDropdownRef.current.contains(e.target as Node)) {
                return;
            }
            updateSearchPosition();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsSearchOpen(false);
            }
        };

        document.addEventListener('mousedown', handleMouseDown, true);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', updateSearchPosition);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleMouseDown, true);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', updateSearchPosition);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isSearchOpen, updateSearchPosition]);

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

            // Click event on map: klik di mana saja memindahkan pin seketika & reverse geocode
            map.on('click', (e: L.LeafletMouseEvent) => {
                const newCoords = {
                    latitude: Number(e.latlng.lat.toFixed(7)),
                    longitude: Number(e.latlng.lng.toFixed(7)),
                };
                marker.setLatLng([newCoords.latitude, newCoords.longitude]);
                setSelectedCoords(newCoords);
                fetchReverseGeocode(newCoords.latitude, newCoords.longitude);
            });

            map.invalidateSize();
            setTimeout(() => {
                map.invalidateSize();
            }, 250);
        }, 120);

        return () => {
            clearTimeout(timer);
        };
    }, [isOpen, fetchReverseGeocode]);

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
        if (!province) {
            setSelectedProvince('');
            setSelectedCity('');
            return;
        }
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
            fetchReverseGeocode(lat, lng);
        }
    };

    const handleCitySelect = (city: string) => {
        if (!city) return;
        setSelectedCity(city);
        const targetCoords = getCityCoordinates(city, selectedProvince) || getProvinceCoordinates(selectedProvince);
        if (targetCoords && mapInstanceRef.current && markerRef.current) {
            const lat = Number(targetCoords.lat.toFixed(7));
            const lng = Number(targetCoords.lng.toFixed(7));
            mapInstanceRef.current.flyTo([lat, lng], 14, { duration: 1.2 });
            markerRef.current.setLatLng([lat, lng]);
            setSelectedCoords({ latitude: lat, longitude: lng });
            fetchReverseGeocode(lat, lng);
        }
    };

    const handleConfirm = () => {
        onConfirm({
            latitude: selectedCoords.latitude,
            longitude: selectedCoords.longitude,
            province: selectedProvince,
            city: selectedCity,
            address: selectedAddress,
            postal_code: selectedPostalCode,
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
            className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-5 lg:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
            <div 
                className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1440px] flex flex-col overflow-hidden h-[90vh] max-h-[94vh]"
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

                {/* Sub-Header: Search & Regional Selectors & Controls */}
                <div className="px-6 py-2.5 bg-slate-50/90 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-3 text-xs shrink-0 relative z-30">
                    <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
                        {/* 1. Direct Location / Landmark / POI Search Input */}
                        <div ref={searchContainerRef} className="relative w-full sm:w-80 md:w-96 shrink-0">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        if (!isSearchOpen && e.target.value.trim().length >= 2) {
                                            setIsSearchOpen(true);
                                        }
                                    }}
                                    onFocus={() => {
                                        if (searchResults.length > 0) {
                                            setIsSearchOpen(true);
                                            updateSearchPosition();
                                        }
                                    }}
                                    placeholder="Cari lokasi, toko, RS, mall, jalan di seluruh Indonesia..."
                                    className="w-full h-8 pl-8.5 pr-8 text-xs font-semibold bg-white border border-[#E8ECF2] hover:border-slate-300 rounded-xl text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition shadow-subtle"
                                />
                                {isSearching ? (
                                    <LoaderCircle className="w-3.5 h-3.5 text-blue-600 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                                ) : searchQuery ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSearchResults([]);
                                            setIsSearchOpen(false);
                                        }}
                                        className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition absolute right-2.5 top-1/2 -translate-y-1/2"
                                        title="Hapus pencarian"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="hidden sm:block w-px h-5 bg-slate-200" />

                        {/* 2. Regional Jumps: Provinsi & Kota / Kab */}
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 shrink-0">
                                <Compass className="w-3.5 h-3.5 text-blue-600" />
                                <span>Wilayah:</span>
                            </span>

                            {/* Select2 Provinsi */}
                            <div className="w-40 sm:w-44 shrink-0">
                                <Select2
                                    value={selectedProvince}
                                    onChange={(val) => handleProvinceSelect(String(val))}
                                    options={provinceOptions}
                                    placeholder="-- Pilih Provinsi --"
                                    searchPlaceholder="Cari provinsi..."
                                    isSearchable={true}
                                    variant="default"
                                    size="sm"
                                    className="w-full"
                                    dropdownClassName="w-60"
                                />
                            </div>

                            {/* Select2 Kota / Kabupaten */}
                            <div className="w-40 sm:w-44 shrink-0">
                                <Select2
                                    value={selectedCity}
                                    onChange={(val) => handleCitySelect(String(val))}
                                    options={cityOptions}
                                    disabled={!selectedProvince || availableCities.length === 0}
                                    placeholder={selectedProvince ? '-- Pilih Kota / Kab --' : '-- Pilih Provinsi Dulu --'}
                                    searchPlaceholder="Cari kota / kab..."
                                    isSearchable={true}
                                    variant="default"
                                    size="sm"
                                    className="w-full"
                                    dropdownClassName="w-60"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Layer Switcher */}
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200/90 shadow-2xs shrink-0 self-start xl:self-auto">
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
                <div className="relative flex-1 min-h-[420px] sm:min-h-[500px] lg:min-h-[580px] w-full bg-slate-100 overflow-hidden">
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
                    <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                        <span className="text-xs font-semibold text-slate-500 shrink-0">Koordinat Dipilih:</span>
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/80 shrink-0">
                            <span>Lat: {selectedCoords.latitude.toFixed(6)}</span>
                            <span className="text-slate-300">•</span>
                            <span>Lng: {selectedCoords.longitude.toFixed(6)}</span>
                        </div>
                        {isReverseLoading ? (
                            <span className="text-[11px] font-medium text-blue-600 flex items-center gap-1.5 animate-pulse bg-blue-50/80 px-2.5 py-1 rounded-md border border-blue-100">
                                <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                                <span>Mendeteksi alamat & wilayah...</span>
                            </span>
                        ) : selectedAddress ? (
                            <span 
                                className="text-[11px] font-semibold text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-md border border-slate-200/90 max-w-sm xl:max-w-md truncate" 
                                title={selectedAddress}
                            >
                                📍 {selectedAddress}
                            </span>
                        ) : selectedCity ? (
                            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                                📍 {selectedCity}{selectedProvince ? `, ${selectedProvince}` : ''}
                            </span>
                        ) : null}
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

            {/* SEARCH RESULTS PORTAL POPOVER */}
            {isSearchOpen && typeof document !== 'undefined' && searchCoords && createPortal(
                <div
                    ref={searchDropdownRef}
                    style={{
                        position: 'fixed',
                        top: `${searchCoords.top}px`,
                        left: `${searchCoords.left}px`,
                        width: `${searchCoords.width}px`,
                        maxWidth: '460px',
                        zIndex: 99999,
                    }}
                    className="bg-white border border-[#EDF1F7] rounded-2xl shadow-[0_16px_36px_rgba(15,23,42,0.18)] p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100 font-sans"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center justify-between">
                        <span>Hasil Pencarian Lokasi & Landmark</span>
                        {searchResults.length > 0 && (
                            <span className="text-blue-600 font-extrabold">{searchResults.length} lokasi</span>
                        )}
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-1 py-0.5 scrollbar-thin scrollbar-thumb-slate-200">
                        {searchResults.length === 0 ? (
                            <div className="py-6 px-3 text-center text-xs text-slate-400 font-medium">
                                {isSearching ? (
                                    <div className="flex items-center justify-center gap-2 text-blue-600">
                                        <LoaderCircle className="w-4 h-4 animate-spin" />
                                        <span>Mencari koordinat lokasi...</span>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-semibold text-slate-600">Tidak ada lokasi ditemukan</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Coba gunakan nama gedung, rumah sakit, mall, atau jalan lainnya.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            searchResults.map((place) => (
                                <button
                                    key={place.place_id}
                                    type="button"
                                    onClick={() => handleSelectPlace(place)}
                                    className="w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-blue-50/70 transition group"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition">
                                        <MapPin className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 truncate">
                                                {place.name}
                                            </span>
                                            {place.type && (
                                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                                                    {place.type}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                            {place.display_name}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
