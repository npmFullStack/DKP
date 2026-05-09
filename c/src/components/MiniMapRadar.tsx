// src/components/MiniMapRadar.tsx (UPDATED)
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader } from 'lucide-react';
import { getCoordinatesFromAddress } from '@/services/locationService';

// Fix for default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: icon,
    iconRetinaUrl: iconRetina,
    shadowUrl: iconShadow
});

interface MiniMapRadarProps {
    location: {
        province: string;
        municipality: string;
        barangay: string;
        street: string;
        fullAddress: string;
    } | null;
    coordinates?: {
        lat: number;
        lng: number;
    } | null;
}

const MiniMapRadar = ({ location, coordinates: initialCoordinates }: MiniMapRadarProps) => {
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const [loading, setLoading] = useState(false);
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(initialCoordinates || null);

    // Fetch coordinates from address if not provided
    useEffect(() => {
        const fetchCoordinates = async () => {
            if (!location || !location.fullAddress) {
                setCoordinates(null);
                return;
            }

            if (initialCoordinates) {
                setCoordinates(initialCoordinates);
                return;
            }

            setLoading(true);
            const coords = await getCoordinatesFromAddress(location.fullAddress);
            if (coords) {
                setCoordinates({ lat: coords.lat, lng: coords.lon });
            }
            setLoading(false);
        };

        fetchCoordinates();
    }, [location, initialCoordinates]);

    useEffect(() => {
        // Initialize map if not exists
        if (!mapRef.current && document.getElementById('mini-map')) {
            const map = L.map('mini-map').setView([12.8797, 121.774], 6);
            mapRef.current = map;

            // Add tile layer
            L.tileLayer(
                "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
                {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors',
                    subdomains: "abcd",
                    minZoom: 0,
                    maxZoom: 20
                }
            ).addTo(map);
        }

        // Cleanup
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Update marker when coordinates change
    useEffect(() => {
        if (!mapRef.current || !coordinates) return;

        // Remove existing marker
        if (markerRef.current) {
            mapRef.current.removeLayer(markerRef.current);
        }

        // Create custom radar marker
        const radarIcon = L.divIcon({
            className: "radar-marker",
            html: `<div style="position: relative;">
                <div style="
                    background-color: #FF3333;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 0 0 0 rgba(255, 51, 51, 0.7);
                    animation: radar-pulse 2s infinite;
                "></div>
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 40px;
                    height: 40px;
                    margin-left: -20px;
                    margin-top: -20px;
                    border-radius: 50%;
                    background: rgba(255, 51, 51, 0.2);
                    animation: radar-ring 2s infinite;
                "></div>
            </div>
            <style>
                @keyframes radar-pulse {
                    0% {
                        box-shadow: 0 0 0 0 rgba(255, 51, 51, 0.7);
                    }
                    70% {
                        box-shadow: 0 0 0 10px rgba(255, 51, 51, 0);
                    }
                    100% {
                        box-shadow: 0 0 0 0 rgba(255, 51, 51, 0);
                    }
                }
                @keyframes radar-ring {
                    0% {
                        transform: scale(0.5);
                        opacity: 0.8;
                    }
                    100% {
                        transform: scale(1.5);
                        opacity: 0;
                    }
                }
            </style>`,
            iconSize: [40, 40],
            popupAnchor: [0, -20]
        });

        markerRef.current = L.marker([coordinates.lat, coordinates.lng], { icon: radarIcon }).addTo(mapRef.current);
        mapRef.current.setView([coordinates.lat, coordinates.lng], 15);
        
        // Add popup with address
        if (location && location.fullAddress) {
            markerRef.current.bindPopup(`
                <div style="background: #1A1A1A; color: white; padding: 8px 12px; border-radius: 8px; border-left: 3px solid #FF3333;">
                    <strong>📍 Reported Location</strong><br/>
                    <small>${location.fullAddress}</small>
                </div>
            `).openPopup();
        }

    }, [coordinates, location]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-secondary/50 rounded-xl border border-white/10">
                <Loader className="w-8 h-8 text-primary animate-spin mb-3" />
                <p className="text-gray-400 text-sm">Loading map preview...</p>
            </div>
        );
    }

    if (!location || !location.fullAddress) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-secondary/50 rounded-xl border border-white/10">
                <MapPin className="w-12 h-12 text-gray-500 mb-3" />
                <p className="text-gray-400 text-sm text-center px-4">
                    Fill in the location details above<br/>to see the radar preview
                </p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-white/10">
            <div id="mini-map" className="w-full h-full" />
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-white border border-white/10 z-[1000] flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span>Radar Preview</span>
            </div>
        </div>
    );
};

export default MiniMapRadar;