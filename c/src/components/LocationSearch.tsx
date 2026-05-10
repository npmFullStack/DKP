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
    prewarmLocationCache,
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

// ─── Street autocomplete hook - FIXED: No retrigger after selection ─────────────────────────────────

const useStreetSearch = (query: string, context: string, isSelectingRef: React.MutableRefObject<boolean>) => {
    const [suggestions, setSuggestions] = useState<StreetSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastQueryRef = useRef<string>('');

    // Pre-warm coords cache only when barangay is selected (full context available)
    const lastPrewarmed = useRef('');
    useEffect(() => {
        if (context && context !== lastPrewarmed.current) {
            lastPrewarmed.current = context;
            prewarmLocationCache(context);
        }
    }, [context]);

    useEffect(() => {
        const trimmedQuery = query?.trim() || '';
        
        // Don't search if we're in the middle of selecting a suggestion
        if (isSelectingRef.current) {
            return;
        }
        
        // Don't search if query is empty or same as last search
        if (trimmedQuery.length === 0) {
            setSuggestions([]);
            return;
        }
        
        if (trimmedQuery === lastQueryRef.current && suggestions.length > 0) {
            return;
        }
        
        // Don't search if no context (barangay not selected yet)
        if (!context) {
            setSuggestions([]);
            return;
        }
        
        lastQueryRef.current = trimmedQuery;
        
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            setLoading(true);
            try {
                const results = await searchStreets(trimmedQuery, context);
                setSuggestions(results);
            } catch (err) {
                console.error("Street search error:", err);
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        }, 300);
        
        return () => { 
            if (timer.current) clearTimeout(timer.current); 
        };
    }, [query, context, isSelectingRef]);

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
    const inputRef = useRef<HTMLInputElement>(null);
    const isSelectingRef = useRef<boolean>(false);
    const previousBarangayRef = useRef<OptionType | null>(null);

    // Only pass context once barangay is selected — ensures bbox is tight enough
    const locationContext = (barangay && municipality && province)
        ? [barangay.label, municipality.label, province.label].join(', ')
        : '';

    const { suggestions, loading: loadingStreets, clear: clearStreets } =
        useStreetSearch(streetInput, locationContext, isSelectingRef);

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

    // Show dropdown when suggestions arrive while input is focused
    useEffect(() => {
        if (suggestions.length > 0 && document.activeElement === inputRef.current && !isSelectingRef.current) {
            setShowStreetDrop(true);
        }
    }, [suggestions]);

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

        const fullAddress = parts.join(", ");
        
        onChange({
            title,
            province,
            municipality,
            barangay,
            street,
            coordinates,
            fullAddress
        });
    }, [title, province, municipality, barangay, street, coordinates, onChange]);

    // ── GPS - FIXED: Better coordinate handling ───────────────────────────────────────────────────

    const getCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }
        setSearchingLocation(true);
        setError("");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                // Immediately set coordinates
                setCoordinates({ lat: latitude, lng: longitude });
                
                try {
                    const geo = await reverseGeocode(latitude, longitude);
                    if (geo?.address) {
                        const addr = geo.address;
                        // Match province
                        if (addr.province || addr.state) {
                            const name = addr.province || addr.state;
                            const match = availableProvinces.find(
                                p => p.label.toLowerCase() === name.toLowerCase()
                            );
                            if (match) setProvince(match);
                        }
                        // Match municipality/city
                        if (addr.city || addr.town || addr.municipality) {
                            const name = addr.city || addr.town || addr.municipality;
                            setMunicipality({ value: '', label: name });
                        }
                        // Match barangay
                        if (addr.suburb || addr.village || addr.neighbourhood) {
                            const name = addr.suburb || addr.village || addr.neighbourhood;
                            setBarangay({ value: '', label: name });
                        }
                        // Match street
                        if (addr.road) {
                            setStreet(addr.road);
                            setStreetInput(addr.road);
                        }
                    } else {
                        setError("Could not determine address from your location.");
                    }
                } catch (err) {
                    console.error("Reverse geocoding error:", err);
                    setError("Unable to get address. Using coordinates only.");
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

    // ── Street selection - FIXED: No retrigger and proper focus handling ──────────────────────────────────────

    const handleStreetSelect = (s: StreetSuggestion) => {
        // Prevent any search triggers during selection
        isSelectingRef.current = true;
        
        // Close dropdown immediately
        setShowStreetDrop(false);
        
        // Clear existing suggestions
        clearStreets();
        
        // Set the values
        setStreet(s.label);
        setStreetInput(s.label);
        setCoordinates({ lat: s.lat, lng: s.lon });
        
        // Reset the selecting flag after a delay to prevent rapid refetch
        setTimeout(() => {
            isSelectingRef.current = false;
        }, 500);
        
        // Don't refocus to prevent retrigger
        if (inputRef.current) {
            inputRef.current.blur();
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 100);
        }
    };

    const handleStreetInputChange = (val: string) => {
        // Reset selecting flag when user starts typing manually
        if (isSelectingRef.current) {
            isSelectingRef.current = false;
        }
        
        setStreetInput(val);
        setStreet(val);
        
        // Show dropdown only if there's input context
        if (val.trim().length >= 1 && locationContext) {
            setShowStreetDrop(true);
        } else {
            setShowStreetDrop(false);
        }
        
        // Clear coordinates when user modifies street manually
        if (coordinates) {
            setCoordinates(undefined);
        }
    };

    const handleInputFocus = () => {
        // Don't auto-open dropdown on focus to prevent flicker
        if (streetInput.trim().length >= 1 && locationContext && suggestions.length > 0 && !isSelectingRef.current) {
            setShowStreetDrop(true);
        }
    };

    // FIXED: Only clear street input when barangay actually changes to a DIFFERENT value
    // and only if it's an initial load or user explicitly changed it
    useEffect(() => {
        // Skip if this is the initial render
        if (previousBarangayRef.current === null) {
            previousBarangayRef.current = barangay;
            return;
        }
        
        // Only clear if barangay changed to a different value
        const barangayChanged = previousBarangayRef.current?.value !== barangay?.value;
        
        if (barangayChanged && barangay) {
            // Only clear if the user is not currently typing
            if (!isSelectingRef.current && streetInput === street) {
                setStreetInput("");
                setStreet("");
                setCoordinates(undefined);
                clearStreets();
                setShowStreetDrop(false);
            }
        }
        
        previousBarangayRef.current = barangay;
    }, [barangay, clearStreets, street, streetInput]);

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
                        ref={inputRef}
                        type="text"
                        value={streetInput}
                        onChange={e => handleStreetInputChange(e.target.value)}
                        onFocus={handleInputFocus}
                        onKeyDown={(e) => {
                            // Close dropdown on Escape
                            if (e.key === 'Escape') {
                                setShowStreetDrop(false);
                                inputRef.current?.blur();
                            }
                        }}
                        placeholder={!locationContext ? "Select barangay first..." : "Type a road, landmark, or purok..."}
                        className={`w-full pl-10 pr-10 py-3 bg-secondary/80 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                            showStreetDrop && suggestions.length > 0
                                ? 'border-primary rounded-b-none'
                                : 'border-white/10 focus:border-primary focus:ring-primary'
                        }`}
                        required
                        autoComplete="off"
                        disabled={!locationContext}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center z-10">
                        {loadingStreets
                            ? <Loader className="w-4 h-4 text-gray-400 animate-spin" />
                            : streetInput.length > 0 && locationContext && (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            )
                        }
                    </div>

                    {/* Dropdown */}
                    {showStreetDrop && locationContext && !isSelectingRef.current && (
                        <div className="absolute left-0 right-0 top-full mt-0 bg-[#1e1e1e] border border-t-0 border-primary/30 rounded-b-xl overflow-hidden shadow-2xl z-50">
                            {loadingStreets ? (
                                <div className="p-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader className="w-4 h-4 text-primary animate-spin" />
                                        <p className="text-gray-400 text-sm">Searching for places...</p>
                                    </div>
                                </div>
                            ) : suggestions.length > 0 ? (
                                <ul className="max-h-60 overflow-y-auto">
                                    {suggestions.map((s, i) => (
                                        <li key={i}>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleStreetSelect(s);
                                                }}
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
                            ) : streetInput.length >= 2 && (
                                <div className="p-3">
                                    <p className="text-gray-500 text-xs text-center">
                                        No streets/landmarks found for "{streetInput}". You can still type a custom landmark.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <p className="text-gray-500 text-xs mt-1">
                    {!locationContext 
                        ? "Please select a barangay first to search for streets" 
                        : "Type at least 1 character to search for streets, landmarks, or bridges in this barangay"}
                </p>
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