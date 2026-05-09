// src/components/LocationSearch.tsx (UPDATED import)
import { useState, useEffect, useCallback } from "react";
import Select from "./Select"; // Remove OptionType from import
import type { OptionType } from "./Select"; // Import type separatelyimport { MapPin, Crosshair, Search, Loader } from "lucide-react";
import {
    getProvinces,
    getMunicipalitiesByProvince,
    getBarangaysByMunicipality,
    reverseGeocode,
    searchLocations
} from "@/services/locationService";
import { Search, Loader, Crosshair, MapPin } from "lucide-react";

interface LocationData {
    province: OptionType | null;
    municipality: OptionType | null;
    barangay: OptionType | null;
    street: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}

interface LocationSearchProps {
    onChange: (data: LocationData & { fullAddress: string }) => void;
    initialData?: Partial<LocationData>;
}

const LocationSearch = ({
    onChange,
    initialData = {}
}: LocationSearchProps) => {
    const [province, setProvince] = useState<OptionType | null>(
        initialData.province || null
    );
    const [municipality, setMunicipality] = useState<OptionType | null>(
        initialData.municipality || null
    );
    const [barangay, setBarangay] = useState<OptionType | null>(
        initialData.barangay || null
    );
    const [street, setStreet] = useState(initialData.street || "");
    const [coordinates, setCoordinates] = useState(
        initialData.coordinates || undefined
    );
    const [searchingLocation, setSearchingLocation] = useState(false);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
    const [loadingBarangays, setLoadingBarangays] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<OptionType[]>([]);
    const [showSearch, setShowSearch] = useState(false);

    const [availableProvinces, setAvailableProvinces] = useState<OptionType[]>(
        []
    );
    const [availableMunicipalities, setAvailableMunicipalities] = useState<
        OptionType[]
    >([]);
    const [availableBarangays, setAvailableBarangays] = useState<OptionType[]>(
        []
    );

    // Load provinces on mount
    useEffect(() => {
        const loadProvinces = async () => {
            setLoadingProvinces(true);
            const provinces = await getProvinces();
            setAvailableProvinces(provinces);
            setLoadingProvinces(false);
        };
        loadProvinces();
    }, []);

    // Search locations
    const handleSearch = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        const results = await searchLocations(query);
        setSearchResults(results);
    };

    // Handle search selection
    const handleSearchSelect = (result: any) => {
        // Parse the address components from the result
        const address = result.address;

        if (address.province) {
            const provinceOption = availableProvinces.find(
                p => p.label === address.province
            );
            if (provinceOption) setProvince(provinceOption);
        }

        if (address.city || address.town || address.municipality) {
            const cityName =
                address.city || address.town || address.municipality;
            setMunicipality({ value: result.value, label: cityName });
        }

        if (address.suburb || address.village || address.neighbourhood) {
            const barangayName =
                address.suburb || address.village || address.neighbourhood;
            setBarangay({ value: result.value, label: barangayName });
        }

        setCoordinates({ lat: result.lat, lng: result.lon });
        setShowSearch(false);
        setSearchQuery("");
    };

    // Update municipalities when province changes
    useEffect(() => {
        const loadMunicipalities = async () => {
            if (province) {
                setLoadingMunicipalities(true);
                const municipalities = await getMunicipalitiesByProvince(
                    province.label
                );
                setAvailableMunicipalities(municipalities);
                setMunicipality(null);
                setBarangay(null);
                setLoadingMunicipalities(false);
            } else {
                setAvailableMunicipalities([]);
                setMunicipality(null);
                setBarangay(null);
            }
        };
        loadMunicipalities();
    }, [province]);

    // Update barangays when municipality changes
    useEffect(() => {
        const loadBarangays = async () => {
            if (municipality) {
                setLoadingBarangays(true);
                const barangays = await getBarangaysByMunicipality(
                    municipality.label
                );
                setAvailableBarangays(barangays);
                setBarangay(null);
                setLoadingBarangays(false);
            } else {
                setAvailableBarangays([]);
                setBarangay(null);
            }
        };
        loadBarangays();
    }, [municipality]);

    // Generate full address and notify parent
    useEffect(() => {
        const addressParts = [];
        if (street) addressParts.push(street);
        if (barangay) addressParts.push(barangay.label);
        if (municipality) addressParts.push(municipality.label);
        if (province) addressParts.push(province.label);

        const fullAddress = addressParts.join(", ");

        onChange({
            province,
            municipality,
            barangay,
            street,
            coordinates,
            fullAddress
        });
    }, [province, municipality, barangay, street, coordinates, onChange]);

    // Get current location using browser geolocation + reverse geocoding
    const getCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setSearchingLocation(true);

        navigator.geolocation.getCurrentPosition(
            async position => {
                const { latitude, longitude } = position.coords;

                try {
                    const addressData = await reverseGeocode(
                        latitude,
                        longitude
                    );

                    if (addressData && addressData.address) {
                        const addr = addressData.address;

                        // Set province
                        if (addr.province || addr.state) {
                            const provinceName = addr.province || addr.state;
                            const provinceOption = availableProvinces.find(
                                p => p.label === provinceName
                            );
                            if (provinceOption) setProvince(provinceOption);
                        }

                        // Set municipality/city
                        if (addr.city || addr.town || addr.municipality) {
                            const cityName =
                                addr.city || addr.town || addr.municipality;
                            setMunicipality({
                                value: cityName,
                                label: cityName
                            });
                        }

                        // Set barangay
                        if (addr.suburb || addr.village || addr.neighbourhood) {
                            const barangayName =
                                addr.suburb ||
                                addr.village ||
                                addr.neighbourhood;
                            setBarangay({
                                value: barangayName,
                                label: barangayName
                            });
                        }

                        // Set street/road
                        if (addr.road) {
                            setStreet(addr.road);
                        }

                        setCoordinates({ lat: latitude, lng: longitude });
                    }

                    setSearchingLocation(false);
                } catch (error) {
                    console.error("Reverse geocoding error:", error);
                    setSearchingLocation(false);
                    alert(
                        "Unable to get address from location. Please enter manually."
                    );
                }
            },
            error => {
                setSearchingLocation(false);
                let errorMessage = "Unable to get your location. ";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += "Please allow location access.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage += "Location request timed out.";
                        break;
                    default:
                        errorMessage += "An unknown error occurred.";
                }
                alert(errorMessage);
            }
        );
    }, [availableProvinces]);

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => {
                            setSearchQuery(e.target.value);
                            handleSearch(e.target.value);
                            setShowSearch(true);
                        }}
                        onFocus={() => setShowSearch(true)}
                        placeholder="Search for a location (e.g., Quezon City, Manila)..."
                        className="w-full pl-10 pr-4 py-3 bg-secondary/80 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                </div>

                {/* Search Results Dropdown */}
                {showSearch && searchResults.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-secondary border border-white/10 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((result: any) => (
                            <button
                                key={result.value}
                                onClick={() => handleSearchSelect(result)}
                                className="w-full text-left px-4 py-2 hover:bg-white/10 transition-colors text-white text-sm"
                            >
                                <div className="font-medium">
                                    {result.label}
                                </div>
                                <div className="text-gray-400 text-xs">
                                    {result.address?.country}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="relative flex items-center gap-4">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-gray-500 text-xs">OR</span>
                <div className="flex-1 h-px bg-white/10"></div>
            </div>

            {/* Get Location Button */}
            <button
                type="button"
                onClick={getCurrentLocation}
                disabled={searchingLocation}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl text-primary transition-all duration-200"
            >
                {searchingLocation ? (
                    <Loader className="w-4 h-4 animate-spin" />
                ) : (
                    <Crosshair className="w-4 h-4" />
                )}
                <span className="font-medium">
                    {searchingLocation
                        ? "Getting your location..."
                        : "Use My Current Location"}
                </span>
            </button>

            {/* Province Select */}
            <Select
                label="Province"
                placeholder={
                    loadingProvinces
                        ? "Loading provinces..."
                        : "Select province..."
                }
                options={availableProvinces}
                value={province}
                onChange={option => setProvince(option)}
                isLoading={loadingProvinces}
                required
            />

            {/* Municipality/City Select */}
            <Select
                label="Municipality/City"
                placeholder={
                    province
                        ? loadingMunicipalities
                            ? "Loading municipalities..."
                            : "Select municipality/city..."
                        : "Select province first"
                }
                options={availableMunicipalities}
                value={municipality}
                onChange={option => setMunicipality(option)}
                isDisabled={!province || loadingMunicipalities}
                isLoading={loadingMunicipalities}
                required
            />

            {/* Barangay Select */}
            <Select
                label="Barangay/District"
                placeholder={
                    municipality
                        ? loadingBarangays
                            ? "Loading barangays..."
                            : "Select barangay/district..."
                        : "Select municipality/city first"
                }
                options={availableBarangays}
                value={barangay}
                onChange={option => setBarangay(option)}
                isDisabled={!municipality || loadingBarangays}
                isLoading={loadingBarangays}
                required
            />

            {/* Street/Subdivision/Landmark */}
            <div>
                <label className="block text-white font-medium mb-2">
                    Street/Subdivision/Landmark{" "}
                    <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={street}
                        onChange={e => setStreet(e.target.value)}
                        placeholder="e.g., National Highway, Purok 5, Near Bridge"
                        className="w-full pl-10 pr-4 py-3 bg-secondary/80 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        required
                    />
                </div>
                <p className="text-gray-500 text-xs mt-1">
                    Specific location details like street name, subdivision, or
                    landmark
                </p>
            </div>

            {/* Coordinates Display (if available) */}
            {coordinates && (
                <div className="p-2 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-xs text-gray-400">
                        📍 Coordinates: {coordinates.lat.toFixed(6)},{" "}
                        {coordinates.lng.toFixed(6)}
                    </p>
                </div>
            )}
        </div>
    );
};

export default LocationSearch;
