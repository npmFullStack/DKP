// src/components/MiniMapRadar.tsx
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader } from 'lucide-react';
import { getCoordinatesFromAddress } from '@/services/locationService';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: icon, iconRetinaUrl: iconRetina, shadowUrl: iconShadow });

interface MiniMapRadarProps {
    location: {
        province: string;
        municipality: string;
        barangay: string;
        street: string;
        fullAddress: string;
    } | null;
    coordinates?: { lat: number; lng: number } | null;
}

const radarStyles = `
    @keyframes radar-pulse {
        0%   { box-shadow: 0 0 0 0 rgba(255,51,51,0.7); }
        70%  { box-shadow: 0 0 0 10px rgba(255,51,51,0); }
        100% { box-shadow: 0 0 0 0 rgba(255,51,51,0); }
    }
    @keyframes radar-ring {
        0%   { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; }
        100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
    }
`;

if (typeof document !== 'undefined' && !document.querySelector('#radar-styles')) {
    const styleTag = document.createElement('style');
    styleTag.id = 'radar-styles';
    styleTag.textContent = radarStyles;
    document.head.appendChild(styleTag);
}

const radarIcon = L.divIcon({
    className: 'radar-marker',
    html: `<div style="position:relative;width:40px;height:40px;">
        <div style="
            position:absolute;top:50%;left:50%;
            transform:translate(-50%,-50%);
            background:#FF3333;width:14px;height:14px;
            border-radius:50%;border:2px solid white;
            box-shadow:0 0 6px rgba(255,51,51,0.8);
            animation:radar-pulse 2s infinite;z-index:2;
        "></div>
        <div style="
            position:absolute;top:50%;left:50%;
            width:40px;height:40px;
            margin-left:-20px;margin-top:-20px;
            border-radius:50%;
            background:rgba(255,51,51,0.15);
            border:1px solid rgba(255,51,51,0.3);
            animation:radar-ring 2s infinite;
        "></div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

const buildGeoQuery = (location: MiniMapRadarProps['location']): string | null => {
    if (!location) return null;
    const parts = [
        location.street,
        location.barangay,
        location.municipality,
        location.province,
        'Philippines'
    ].filter(Boolean);
    return parts.length > 1 ? parts.join(', ') : null;
};

const getZoomLevel = (location: MiniMapRadarProps['location']): number => {
    if (!location) return 6;
    if (location.street) return 17;
    if (location.barangay) return 14;
    if (location.municipality) return 12;
    if (location.province) return 10;
    return 6;
};

const MiniMapRadar = ({ location, coordinates: coordProp }: MiniMapRadarProps) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const [loading, setLoading] = useState(false);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(coordProp ?? null);
    const [hasLocation, setHasLocation] = useState(false);

    // ── 1. Initialize map once ───────────────────────────────────────────────
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const initMap = () => {
            if (!mapContainerRef.current || mapRef.current) return;
            try {
                const map = L.map(mapContainerRef.current, {
                    zoomControl: false,
                    attributionControl: false,
                }).setView([12.8797, 121.7740], 6);

                L.tileLayer(
                    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                    { subdomains: 'abcd', minZoom: 0, maxZoom: 20, attribution: '' }
                ).addTo(map);

                mapRef.current = map;
                setTimeout(() => map.invalidateSize(), 100);
                setTimeout(() => map.invalidateSize(), 300);
            } catch (err) {
                console.error('Map init error:', err);
            }
        };

        const timer = setTimeout(initMap, 50);

        const resizeObserver = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(() => mapRef.current?.invalidateSize())
            : null;

        if (resizeObserver && mapContainerRef.current) {
            resizeObserver.observe(mapContainerRef.current);
        }

        return () => {
            clearTimeout(timer);
            resizeObserver?.disconnect();
            mapRef.current?.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, []);

    // ── 2. Resolve coordinates progressively ────────────────────────────────
    useEffect(() => {
        if (coordProp) {
            setCoords(coordProp);
            setHasLocation(true);
            return;
        }

        const query = buildGeoQuery(location);

        if (!query) {
            setCoords(null);
            setHasLocation(false);
            return;
        }

        setHasLocation(true);
        let cancelled = false;

        const resolve = async () => {
            setLoading(true);
            try {
                const result = await getCoordinatesFromAddress(query);
                if (!cancelled) {
                    setCoords(result ? { lat: result.lat, lng: result.lon } : null);
                }
            } catch {
                if (!cancelled) setCoords(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        resolve();
        return () => { cancelled = true; };
    }, [
        coordProp,
        location?.province,
        location?.municipality,
        location?.barangay,
        location?.street,
    ]);

    // ── 3. Update marker + pan ───────────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        map.invalidateSize();

        if (markerRef.current) {
            map.removeLayer(markerRef.current);
            markerRef.current = null;
        }

        if (!coords) return;

        const zoom = getZoomLevel(location);
        map.setView([coords.lat, coords.lng], zoom, { animate: true });

        // Marker only — no popup
        const marker = L.marker([coords.lat, coords.lng], { icon: radarIcon }).addTo(map);
        markerRef.current = marker;
    }, [coords]);

    return (
        <div className="relative w-full" style={{ height: '280px' }}>
            {/* Map — always mounted so Leaflet stays alive */}
            <div
                ref={mapContainerRef}
                className="absolute inset-0 w-full h-full"
                style={{ visibility: hasLocation ? 'visible' : 'hidden' }}
            />

            {/* Placeholder when no location */}
            {!hasLocation && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-secondary/40">
                    <div className="p-4 rounded-full bg-white/5 border border-white/10">
                        <MapPin className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-500 text-sm">Select a location to preview on map</p>
                </div>
            )}

            {/* Loading overlay */}
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-[1001]">
                    <Loader className="w-6 h-6 text-primary animate-spin mb-2" />
                    <p className="text-white text-xs">Locating on map...</p>
                </div>
            )}

            {/* Live preview badge */}
            {hasLocation && !loading && (
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs text-white border border-white/10 z-[1000] flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    Live Preview
                </div>
            )}
        </div>
    );
};

export default MiniMapRadar;