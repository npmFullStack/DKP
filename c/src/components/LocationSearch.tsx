// src/components/LocationSearch.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import Select from "./Select";
import type { OptionType } from "./Select";
import { MapPin, Crosshair, Loader, Tag, ChevronDown } from "lucide-react";
import {
    getProvinces,
    getMunicipalitiesByProvince,
    getBarangaysByMunicipality,
    searchStreets,
    reverseGeocode,
    type StreetSuggestion
} from "@/services/locationService";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationData {
    title: string;
    province: OptionType | null;
    municipality: OptionType | null;
    barangay: OptionType | null;
    street: string;
    coordinates?: { lat: number; lng: number };
}

interface LocationSearchProps {
    onChange: (data: LocationData & { fullAddress: string }) => void;
    initialData?: Partial<LocationData>;
}

// ─── Street autocomplete hook ─────────────────────────────────────────────────

const useStreetSearch = (query: string, context: string) => {
    const [suggestions, setSuggestions] = useState<StreetSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!query || query.length < 3) { setSuggestions([]); return; }
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            setLoading(true);
            const results = await searchStreets(query, context);
            setSuggestions(results);
            setLoading(false);
        }, 400);
        return () => { if (timer.current) clearTimeout(timer.current); };
    }, [query, context]);

    return { suggestions, loading, clear: () => setSuggestions([]) };
};

// ─── Component ────────────────────────────────────────────────────────────────

const LocationSearch = ({ onChange, initialData = {} }: LocationSearchProps) => {
    const [title, setTitle] = useState(initialData.title || "");
    const [province, setProvince] = useState<OptionType | null>(initialData.province || null);
    const [municipality, setMunicipality] = useState<OptionType | null>(initialData.municipality || null);
    const [barangay, setBarangay] = useState<OptionType | null>(initialData.barangay || null);
    const [street, setStreet] = useState(initialData.street || "");
    const [streetInput, setStreetInput] = useState(initialData.street || "");
    const [showStreetDrop, setShowStreetDrop] = useState(false);
    const [coordinates, setCoordinates] = useState(initialData.coordinates || undefined);
    const [searchingLocation, setSearchingLocation] = useState(false);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
    const [loadingBarangays, setLoadingBarangays] = useState(false);
    const [error, setError] = useState("");

    const [availableProvinces, setAvailableProvinces] = useState<OptionType[]>([]);
    const [availableMunicipalities, setAvailableMunicipalities] = useState<OptionType[]>([]);
    const [availableBarangays, setAvailableBarangays] = useState<OptionType[]>([]);

    const streetWrapRef = useRef<HTMLDivElement>(null);

    // Build context string to bias Nominatim suggestions
    const locationContext = [barangay?.label, municipality?.label, province?.label]
        .filter(Boolean).join(', ');

    const { suggestions, loading: loadingStreets, clear: clearStreets } =
        useStreetSearch(streetInput, locationContext);

    // Close street dropdown on outside click
    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            if (streetWrapRef.current && !streetWrapRef.current.contains(e.target as Node)) {
                setShowStreetDrop(false);
            }
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, []);

    // ── Data loaders ──────────────────────────────────────────────────────────

    useEffect(() => {
        const load = async () => {
            setLoadingProvinces(true);
            setError("");
            try {
                const list = await getProvinces();
                if (!list.length) setError("Unable to load provinces. Please try again.");
                else setAvailableProvinces(list);
            } catch {
                setError("Failed to load provinces. Please refresh.");
            } finally {
                setLoadingProvinces(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (!province) {
            setAvailableMunicipalities([]);
            setMunicipality(null);
            setBarangay(null);
            return;
        }
        const load = async () => {
            setLoadingMunicipalities(true);
            setError("");
            setMunicipality(null);
            setBarangay(null);
            try {
                // Pass the PSGC province CODE (value), not the label
                const list = await getMunicipalitiesByProvince(province.value);
                setAvailableMunicipalities(list);
                if (!list.length) setError(`No cities/municipalities found for ${province.label}`);
            } catch {
                setError("Failed to load cities/municipalities. Please try again.");
            } finally {
                setLoadingMunicipalities(false);
            }
        };
        load();
    }, [province]);

    useEffect(() => {
        if (!municipality) {
            setAvailableBarangays([]);
            setBarangay(null);
            return;
        }
        const load = async () => {
            setLoadingBarangays(true);
            setError("");
            setBarangay(null);
            try {
                // Pass the PSGC city/municipality CODE (value), not the label
                const list = await getBarangaysByMunicipality(municipality.value);
                setAvailableBarangays(list);
                if (!list.length) setError(`No barangays found for ${municipality.label}`);
            } catch {
                setError("Failed to load barangays. Please try again.");
            } finally {
                setLoadingBarangays(false);
            }
        };
        load();
    }, [municipality]);

    // Notify parent
    useEffect(() => {
        const parts = [];
        if (street) parts.push(street);
        if (barangay) parts.push(barangay.label);
        if (municipality) parts.push(municipality.label);
        if (province) parts.push(province.label);

        onChange({
            title,
            province,
            municipality,
            barangay,
            street,
            coordinates,
            fullAddress: parts.join(", ")
        });
    }, [title, province, municipality, barangay, street, coordinates, onChange]);

    // ── GPS ───────────────────────────────────────────────────────────────────

    const getCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }
        setSearchingLocation(true);
        setError("");

        navigator.geolocation.getCurrentPosition(
            async ({ coords: { latitude, longitude } }) => {
                try {
                    const geo = await reverseGeocode(latitude, longitude);
                    if (geo?.address) {
                        const addr = geo.address;
                        if (addr.province || addr.state) {
                            const name = addr.province || addr.state;
                            const match = availableProvinces.find(
                                p => p.label.toLowerCase() === name.toLowerCase()
                            );
                            if (match) setProvince(match);
                        }
                        if (addr.city || addr.town || addr.municipality) {
                            const name = addr.city || addr.town || addr.municipality;
                            // We don't have a PSGC code from Nominatim, but the
                            // dropdown will load after province is set
                            setMunicipality({ value: '', label: name });
                        }
                        if (addr.suburb || addr.village || addr.neighbourhood) {
                            const name = addr.suburb || addr.village || addr.neighbourhood;
                            setBarangay({ value: '', label: name });
                        }
                        if (addr.road) {
                            setStreet(addr.road);
                            setStreetInput(addr.road);
                        }
                        setCoordinates({ lat: latitude, lng: longitude });
                    } else {
                        setError("Could not determine address from your location.");
                    }
                } catch {
                    setError("Unable to get address. Please select manually.");
                } finally {
                    setSearchingLocation(false);
                }
            },
            err => {
                setSearchingLocation(false);
                const msgs: Record<number, string> = {
                    1: "Please allow location access.",
                    2: "Location information is unavailable.",
                    3: "Location request timed out."
                };
                setError("Unable to get your location. " + (msgs[err.code] || "Unknown error."));
            }
        );
    }, [availableProvinces]);

    // ── Street selection ──────────────────────────────────────────────────────

    const handleStreetSelect = (s: StreetSuggestion) => {
        setStreet(s.label);
        setStreetInput(s.label);
        setCoordinates({ lat: s.lat, lng: s.lon });
        clearStreets();
        setShowStreetDrop(false);
    };

    const handleStreetInputChange = (val: string) => {
        setStreetInput(val);
        setStreet(val);          // keep free-text value too
        setShowStreetDrop(true);
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-4">
            {/* Error */}
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Title */}
            <div>
                <label className="block text-white font-medium mb-2">
                    Checkpoint Title <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g., Police checkpoint near EDSA flyover"
                        className="w-full pl-10 pr-4 py-3 bg-secondary/80 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        required
                    />
                </div>
                <p className="text-gray-500 text-xs mt-1">Brief description of the checkpoint</p>
            </div>

            <div className="h-px bg-white/10" />

            {/* GPS Button */}
            <button
                type="button"
                onClick={getCurrentLocation}
                disabled={searchingLocation}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl text-primary transition-all duration-200 disabled:opacity-50"
            >
                {searchingLocation
                    ? <Loader className="w-4 h-4 animate-spin" />
                    : <Crosshair className="w-4 h-4" />
                }
                <span className="font-medium">
                    {searchingLocation ? "Detecting location..." : "Use My Current Location"}
                </span>
            </button>

            <div className="relative flex items-center gap-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-gray-500 text-xs">OR SELECT MANUALLY</span>
                <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Province */}
            <Select
                label="Province"
                placeholder={loadingProvinces ? "Loading provinces..." : "Select province..."}
                options={availableProvinces}
                value={province}
                onChange={opt => setProvince(opt)}
                isLoading={loadingProvinces}
                required
            />

            {/* Municipality / City */}
            <Select
                label="Municipality / City"
                placeholder={
                    !province ? "Select province first" :
                    loadingMunicipalities ? "Loading cities/municipalities..." :
                    "Select municipality/city..."
                }
                options={availableMunicipalities}
                value={municipality}
                onChange={opt => setMunicipality(opt)}
                isDisabled={!province || loadingMunicipalities}
                isLoading={loadingMunicipalities}
                required
            />

            {/* Barangay */}
            <Select
                label="Barangay"
                placeholder={
                    !municipality ? "Select municipality/city first" :
                    loadingBarangays ? "Loading barangays..." :
                    "Select barangay..."
                }
                options={availableBarangays}
                value={barangay}
                onChange={opt => setBarangay(opt)}
                isDisabled={!municipality || loadingBarangays}
                isLoading={loadingBarangays}
                required
            />

            {/* Street / Landmark — autocomplete dropdown */}
            <div ref={streetWrapRef}>
                <label className="block text-white font-medium mb-2">
                    Street / Landmark <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10 pointer-events-none" />
                    <input
                        type="text"
                        value={streetInput}
                        onChange={e => handleStreetInputChange(e.target.value)}
                        onFocus={() => streetInput.length >= 3 && setShowStreetDrop(true)}
                        placeholder="Type a road, landmark, or purok..."
                        className="w-full pl-10 pr-10 py-3 bg-secondary/80 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        required
                        autoComplete="off"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center z-10">
                        {loadingStreets
                            ? <Loader className="w-4 h-4 text-gray-400 animate-spin" />
                            : <ChevronDown className="w-4 h-4 text-gray-500" />
                        }
                    </div>

                    {/* Dropdown */}
                    {showStreetDrop && suggestions.length > 0 && (
                        <ul className="absolute left-0 right-0 top-full mt-1 bg-[#1e1e1e] border border-white/15 rounded-xl overflow-hidden shadow-2xl z-50 max-h-60 overflow-y-auto">
                            {suggestions.map((s, i) => (
                                <li key={i}>
                                    <button
                                        type="button"
                                        onMouseDown={() => handleStreetSelect(s)}
                                        className="w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors border-b border-white/5 last:border-0 flex items-start gap-3"
                                    >
                                        <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-white text-sm font-medium truncate">{s.label}</p>
                                            <p className="text-gray-500 text-xs truncate mt-0.5">{s.fullName}</p>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* No results hint */}
                    {showStreetDrop && !loadingStreets && streetInput.length >= 3 && suggestions.length === 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-[#1e1e1e] border border-white/15 rounded-xl p-3 z-50">
                            <p className="text-gray-500 text-xs text-center">No results — you can still type a custom landmark</p>
                        </div>
                    )}
                </div>
                <p className="text-gray-500 text-xs mt-1">Search or type a road name, landmark, or purok</p>
            </div>

            {/* Coordinates badge */}
            {coordinates && (
                <div className="p-2 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-xs text-gray-400">
                        📍 {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                    </p>
                </div>
            )}
        </div>
    );
};

export default LocationSearch;