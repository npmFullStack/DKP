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

// Radar animation styles — injected once
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

// Defined once outside component — no need to recreate per render
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
    popupAnchor: [0, -24]
});

const MiniMapRadar = ({ location, coordinates: coordProp }: MiniMapRadarProps) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    // Map + marker live in refs — never recreated on re-render
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const [loading, setLoading] = useState(false);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
        coordProp ?? null
    );

    // ── 1. Resolve coordinates ──────────────────────────────────────────────
    useEffect(() => {
        // GPS / parent-provided coords always win
        if (coordProp) {
            setCoords(coordProp);
            return;
        }
        if (!location?.fullAddress) {
            setCoords(null);
            return;
        }
        let cancelled = false;
        const resolve = async () => {
            setLoading(true);
            try {
                const result = await getCoordinatesFromAddress(location.fullAddress);
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
    }, [location?.fullAddress, coordProp]);

    // ── 2. Initialize map ONCE when the container div mounts ───────────────
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false,
        }).setView([12.8797, 121.7740], 6); // Default: centre of PH

        L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            { subdomains: 'abcd', minZoom: 0, maxZoom: 20 }
        ).addTo(map);

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, []); // ← empty: run once only

    // ── 3. Update marker + pan whenever coords change ───────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        // Remove old marker
        if (markerRef.current) {
            map.removeLayer(markerRef.current);
            markerRef.current = null;
        }

        if (!coords) return;

        // Smooth pan to new pin
        map.setView([coords.lat, coords.lng], 15, { animate: true });

        // Drop the radar marker
        const marker = L.marker([coords.lat, coords.lng], { icon: radarIcon }).addTo(map);

        if (location?.fullAddress) {
            marker.bindPopup(`
                <div style="background:#1A1A1A;color:white;padding:8px 12px;border-radius:8px;border-left:3px solid #FF3333;min-width:160px;">
                    <strong>📍 Reported Location</strong><br/>
                    <small style="color:#ccc;">${location.fullAddress}</small>
                </div>
            `);
        }

        markerRef.current = marker;
    }, [coords, location?.fullAddress]);

    // ── Placeholder helper ──────────────────────────────────────────────────
    const Placeholder = ({ children }: { children: React.ReactNode }) => (
        <div
            className="flex flex-col items-center justify-center bg-secondary/50 border border-white/10"
            style={{ width: 280, height: 280, borderRadius: '50%', margin: '0 auto' }}
        >
            {children}
        </div>
    );

    if (loading) return (
        <Placeholder>
            <Loader className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-gray-400 text-sm">Loading map...</p>
        </Placeholder>
    );

    if (!location?.fullAddress) return (
        <Placeholder>
            <MapPin className="w-12 h-12 text-gray-500 mb-3" />
            <p className="text-gray-400 text-sm text-center px-8">
                Fill in the location to see the radar preview
            </p>
        </Placeholder>
    );

    if (!coords && !loading) return (
        <Placeholder>
            <MapPin className="w-12 h-12 text-yellow-500 mb-3" />
            <p className="text-gray-400 text-sm text-center px-8">
                Locating address on map...
            </p>
        </Placeholder>
    );

    return (
        <div className="relative mx-auto" style={{ width: 280, height: 280 }}>
            {/* Circular clip wrapper */}
            <div
                className="w-full h-full overflow-hidden border-2 border-primary/30"
                style={{ borderRadius: '50%' }}
            >
                <div ref={mapContainerRef} className="w-full h-full" />
            </div>

            {/* Radar label */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white border border-white/10 z-[1000] flex items-center gap-1.5 whitespace-nowrap">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                Radar Preview
            </div>
        </div>
    );
};

export default MiniMapRadar;