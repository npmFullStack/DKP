// src/components/CheckPointMap.tsx
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Import images from src/assets/images/
import report1 from "@/assets/images/report1.png";
import report2 from "@/assets/images/report2.png";

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

// Philippines checkpoint data - ACTIVE CHECKPOINTS ONLY
const defaultCheckpoints = [
    // Metro Manila
    {
        lat: 14.5995,
        lng: 120.9842,
        title: "Quezon City Checkpoint",
        status: "active" as const,
        image: report1,
        address: "Commonwealth Ave, Quezon City, Metro Manila",
        timeReported: "2024-01-15T14:30:00",
        uploader: {
            name: "Juan Dela Cruz",
            avatar: "https://i.pravatar.cc/150?img=1"
        },
        likes: 234,
        dislikes: 12,
        comments: [
            {
                id: 1,
                user: "Maria Santos",
                text: "Strict vehicle inspection ongoing",
                timestamp: "2024-01-15T15:00:00",
                avatar: "https://i.pravatar.cc/150?img=2"
            },
            {
                id: 2,
                user: "Ricardo Gomez",
                text: "Police are checking all vehicles",
                timestamp: "2024-01-15T15:30:00",
                avatar: "https://i.pravatar.cc/150?img=3"
            }
        ]
    },
    {
        lat: 14.5547,
        lng: 120.9984,
        title: "Manila City Hall Checkpoint",
        status: "active" as const,
        image: report2,
        address: "Padre Burgos Ave, Ermita, Manila",
        timeReported: "2024-01-15T09:15:00",
        uploader: {
            name: "Anna Reyes",
            avatar: "https://i.pravatar.cc/150?img=4"
        },
        likes: 156,
        dislikes: 8,
        comments: [
            {
                id: 1,
                user: "Ben Torres",
                text: "Random checkpoint for trucks only",
                timestamp: "2024-01-15T10:00:00",
                avatar: "https://i.pravatar.cc/150?img=5"
            }
        ]
    },
    {
        lat: 14.5176,
        lng: 121.0501,
        title: "Makati Checkpoint",
        status: "active" as const,
        image: report1,
        address: "Ayala Ave, Makati, Metro Manila",
        timeReported: "2024-01-15T11:45:00",
        uploader: {
            name: "Carlos Mendoza",
            avatar: "https://i.pravatar.cc/150?img=6"
        },
        likes: 89,
        dislikes: 3,
        comments: []
    },

    // North Luzon
    {
        lat: 16.4023,
        lng: 120.596,
        title: "Baguio City Checkpoint",
        status: "active" as const,
        image: report2,
        address: "Kennon Rd, Baguio City, Benguet",
        timeReported: "2024-01-15T08:00:00",
        uploader: {
            name: "Hannah Cruz",
            avatar: "https://i.pravatar.cc/150?img=11"
        },
        likes: 445,
        dislikes: 18,
        comments: [
            {
                id: 1,
                user: "Ian Villanueva",
                text: "Police visibility is high",
                timestamp: "2024-01-15T09:00:00",
                avatar: "https://i.pravatar.cc/150?img=12"
            }
        ]
    },
    {
        lat: 15.145,
        lng: 120.5906,
        title: "Clark Freeport Checkpoint",
        status: "active" as const,
        image: report1,
        address: "Clark Freeport Zone, Pampanga",
        timeReported: "2024-01-15T10:15:00",
        uploader: {
            name: "Lisa Tan",
            avatar: "https://i.pravatar.cc/150?img=15"
        },
        likes: 201,
        dislikes: 10,
        comments: [
            {
                id: 1,
                user: "Mark Rivera",
                text: "K9 units are present",
                timestamp: "2024-01-15T11:00:00",
                avatar: "https://i.pravatar.cc/150?img=16"
            }
        ]
    },

    // Visayas
    {
        lat: 11.2545,
        lng: 125.0017,
        title: "Tacloban Checkpoint",
        status: "active" as const,
        image: report2,
        address: "Real St, Tacloban City, Leyte",
        timeReported: "2024-01-14T22:15:00",
        uploader: {
            name: "Ramon Flores",
            avatar: "https://i.pravatar.cc/150?img=21"
        },
        likes: 234,
        dislikes: 14,
        comments: []
    },
    {
        lat: 10.3157,
        lng: 123.8854,
        title: "Cebu City Checkpoint",
        status: "active" as const,
        image: report1,
        address: "Osmeña Blvd, Cebu City",
        timeReported: "2024-01-15T08:30:00",
        uploader: {
            name: "Sofia Alcantara",
            avatar: "https://i.pravatar.cc/150?img=22"
        },
        likes: 567,
        dislikes: 23,
        comments: [
            {
                id: 1,
                user: "Tomas Cruz",
                text: "All vehicles are being inspected",
                timestamp: "2024-01-15T09:15:00",
                avatar: "https://i.pravatar.cc/150?img=23"
            }
        ]
    },
    {
        lat: 11.0057,
        lng: 122.533,
        title: "Iloilo City Checkpoint",
        status: "active" as const,
        image: report2,
        address: "General Luna St, Iloilo City",
        timeReported: "2024-01-15T09:00:00",
        uploader: {
            name: "Wendy Mercado",
            avatar: "https://i.pravatar.cc/150?img=26"
        },
        likes: 289,
        dislikes: 15,
        comments: [
            {
                id: 1,
                user: "Xander Lee",
                text: "Police checkpoint with K9 units",
                timestamp: "2024-01-15T09:45:00",
                avatar: "https://i.pravatar.cc/150?img=27"
            }
        ]
    },

    // Mindanao
    {
        lat: 7.1907,
        lng: 125.4553,
        title: "Davao City Checkpoint",
        status: "active" as const,
        image: report1,
        address: "J.P. Laurel Ave, Davao City",
        timeReported: "2024-01-15T07:00:00",
        uploader: {
            name: "Zachary Fernandez",
            avatar: "https://i.pravatar.cc/150?img=29"
        },
        likes: 678,
        dislikes: 31,
        comments: [
            {
                id: 1,
                user: "Andrei Santos",
                text: "Strict checkpoint implementation",
                timestamp: "2024-01-15T07:45:00",
                avatar: "https://i.pravatar.cc/150?img=30"
            },
            {
                id: 2,
                user: "Bella Dimagiba",
                text: "All vehicles entering city are checked",
                timestamp: "2024-01-15T08:30:00",
                avatar: "https://i.pravatar.cc/150?img=31"
            }
        ]
    },
    {
        lat: 8.4822,
        lng: 124.6472,
        title: "Cagayan de Oro Checkpoint",
        status: "active" as const,
        image: report2,
        address: "Don Apolinario Velez St, Cagayan de Oro",
        timeReported: "2024-01-15T10:30:00",
        uploader: {
            name: "Danica Mercado",
            avatar: "https://i.pravatar.cc/150?img=33"
        },
        likes: 345,
        dislikes: 17,
        comments: []
    }
];

interface CheckpointData {
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
    checkpoints?: CheckpointData[];
    onCheckpointSelect?: (checkpoint: CheckpointData) => void;
    searchQuery?: string;
}

const CheckPointMap = ({
    checkpoints = defaultCheckpoints,
    onCheckpointSelect,
    searchQuery = ""
}: CheckPointMapProps) => {
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);

    useEffect(() => {
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
            map.remove();
            markersRef.current = [];
        };
    }, []);

    // Filter checkpoints based on search query
    const filteredCheckpoints = searchQuery
        ? checkpoints.filter(
              cp =>
                  cp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  cp.address.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : checkpoints;

    // Add markers to map
    useEffect(() => {
        if (!mapRef.current) return;

        // Clear existing markers
        markersRef.current.forEach(marker => {
            mapRef.current?.removeLayer(marker);
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
                animation: pulse 1.5s infinite;
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
            </style>`,
            iconSize: [14, 14],
            popupAnchor: [0, -7]
        });

        // Add markers for each filtered checkpoint
        filteredCheckpoints.forEach(checkpoint => {
            const marker = L.marker([checkpoint.lat, checkpoint.lng], {
                icon: activeMarkerIcon
            });

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
        if (searchQuery && filteredCheckpoints.length > 0) {
            const bounds = L.latLngBounds(
                filteredCheckpoints.map(cp => [cp.lat, cp.lng])
            );
            mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        } else if (searchQuery && filteredCheckpoints.length === 0) {
            // Show no results message could be handled here
            console.log("No checkpoints found for:", searchQuery);
        }
    }, [filteredCheckpoints, onCheckpointSelect]);

    return (
        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10">
            <div id="map" className="w-full h-full min-h-[500px]" />
            <div className="absolute bottom-3 left-3 bg-secondary/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white border border-white/10 z-[1000]">
                 {filteredCheckpoints.length} Active Checkpoints • Philippines
            </div>
        </div>
    );
};

export default CheckPointMap;
