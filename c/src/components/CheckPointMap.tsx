// src/components/CheckPointMap.tsx
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons
import icon from "leaflet/dist/images/marker-icon.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Configure default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: icon,
    iconRetinaUrl: iconRetina,
    shadowUrl: iconShadow
});

export interface MapCheckpointData {
    id?: string;
    lat: number;
    lng: number;
    title: string;
    status: "active" | "reported";
    image: string;
    address: string;
    timeReported: string;
    uploader: { name: string; avatar: string };
    likes: number;
    dislikes: number;
    comments: Array<{
        id: number;
        user: string;
        text: string;
        timestamp: string;
        avatar: string;
    }>;
}

interface CheckPointMapProps {
    checkpoints?: MapCheckpointData[];
    onCheckpointSelect?: (checkpoint: MapCheckpointData) => void;
    searchQuery?: string;
}

const CheckPointMap = ({
    checkpoints = [],
    onCheckpointSelect,
    searchQuery = ""
}: CheckPointMapProps) => {
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);

    useEffect(() => {
        if (mapRef.current) return;

        // Center map on Philippines (approx center near Visayas)
        const map = L.map("map").setView([12.8797, 121.774], 6.5);
        mapRef.current = map;

        // Add tile layer
        L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            {
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors',
                subdomains: "abcd",
                minZoom: 0,
                maxZoom: 20
            }
        ).addTo(map);

        // Add bounds to restrict panning to Philippines area
        const philippinesBounds = L.latLngBounds(
            L.latLng(4.5, 116.5), // Southwest corner (Palawan area)
            L.latLng(21.5, 127.0) // Northeast corner (Batanes area)
        );
        map.setMaxBounds(philippinesBounds);
        map.on("drag", function () {
            map.panInsideBounds(philippinesBounds, { animate: true });
        });

        // Cleanup
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            markersRef.current = [];
        };
    }, []);

    // Add markers to map
    useEffect(() => {
        if (!mapRef.current) return;

        // Clear existing markers
        markersRef.current.forEach(marker => {
            marker.remove();
        });
        markersRef.current = [];

        // Create custom marker icon for active checkpoints
        const activeMarkerIcon = L.divIcon({
            className: "custom-marker",
            html: `<div style="
                background-color: #FF3333; 
                width: 14px; 
                height: 14px; 
                border-radius: 50%; 
                border: 2px solid white; 
                box-shadow: 0 0 0 2px rgba(0,0,0,0.3);
                cursor: pointer;
                transition: transform 0.2s;
            "></div>
            <style>
                @keyframes pulse {
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
                .custom-marker div {
                    animation: pulse 1.5s infinite;
                }
                .custom-marker div:hover {
                    transform: scale(1.2);
                }
            </style>`,
            iconSize: [14, 14],
            popupAnchor: [0, -7]
        });

        // Add markers for each checkpoint
        checkpoints.forEach(checkpoint => {
            const marker = L.marker([checkpoint.lat, checkpoint.lng], {
                icon: activeMarkerIcon
            });

            // Add popup with title
            marker.bindPopup(`
                <div class="checkpoint-popup">
                    <strong>${escapeHtml(checkpoint.title)}</strong>
                    <br/>
                    <small>${escapeHtml(checkpoint.address.substring(0, 60))}${checkpoint.address.length > 60 ? '...' : ''}</small>
                    <br/>
                    <span style="color: #ff3333;">● Active Checkpoint</span>
                </div>
            `, { minWidth: 200 });

            marker.addTo(mapRef.current!);

            // Add click handler to marker
            marker.on("click", () => {
                if (onCheckpointSelect) {
                    onCheckpointSelect(checkpoint);
                }
            });

            markersRef.current.push(marker);
        });

        // If search query exists and we have results, fit bounds to show all filtered markers
        if (searchQuery && checkpoints.length > 0) {
            const bounds = L.latLngBounds(
                checkpoints.map(cp => [cp.lat, cp.lng])
            );
            mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        } else if (searchQuery && checkpoints.length === 0) {
            // No results found - keep current view
            console.log("No checkpoints found for:", searchQuery);
        }
    }, [checkpoints, onCheckpointSelect, searchQuery]);

    return (
        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10">
            <div id="map" className="w-full h-full min-h-[500px]" />
            <div className="absolute bottom-3 left-3 bg-secondary/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white border border-white/10 z-[1000]">
                {checkpoints.length} Active Checkpoints • Philippines
            </div>
        </div>
    );
};

// Helper function to escape HTML
const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

export default CheckPointMap;