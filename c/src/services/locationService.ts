// src/services/locationService.ts
export interface LocationOption {
    value: string;
    label: string;
    osmId?: string;
    osmType?: string;
}

export interface PhilippineLocation {
    province: LocationOption | null;
    municipality: LocationOption | null;
    barangay: LocationOption | null;
    coordinates?: {
        lat: number;
        lng: number;
    };
}

// Cache for API responses
const cache = new Map<string, any>();

// Function to search locations from OpenStreetMap
export const searchLocations = async (query: string, countryCode: string = 'PH'): Promise<LocationOption[]> => {
    if (!query || query.length < 2) return [];
    
    const cacheKey = `search_${query}_${countryCode}`;
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)},+${countryCode}&format=json&limit=10&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'CheckpointReporter/1.0'
                }
            }
        );
        
        const data = await response.json();
        
        const results = data.map((item: any) => ({
            value: item.place_id.toString(),
            label: item.display_name.split(',')[0],
            osmId: item.osm_id,
            osmType: item.osm_type,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            address: item.address
        }));
        
        cache.set(cacheKey, results);
        return results;
    } catch (error) {
        console.error('Error searching locations:', error);
        return [];
    }
};

// Function to get provinces in the Philippines
export const getProvinces = async (): Promise<LocationOption[]> => {
    const cacheKey = 'provinces_ph';
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    try {
        const response = await fetch(
            'https://nominatim.openstreetmap.org/search?q=province+philippines&format=json&limit=100&addressdetails=1',
            {
                headers: {
                    'User-Agent': 'CheckpointReporter/1.0'
                }
            }
        );
        
        const data = await response.json();
        
        const provinces = data
            .filter((item: any) => 
                item.address && 
                (item.address.province || 
                 (item.display_name.toLowerCase().includes('province'))) &&
                item.address.country === 'Philippines'
            )
            .map((item: any) => ({
                value: item.place_id.toString(),
                label: item.address.province || item.display_name.split(',')[0],
                osmId: item.osm_id,
                osmType: item.osm_type
            }));
        
        cache.set(cacheKey, provinces);
        return provinces;
    } catch (error) {
        console.error('Error fetching provinces:', error);
        return [];
    }
};

// Function to get municipalities/cities by province
export const getMunicipalitiesByProvince = async (provinceName: string): Promise<LocationOption[]> => {
    const cacheKey = `municipalities_${provinceName}`;
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(provinceName)}+philippines&format=json&limit=1&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'CheckpointReporter/1.0'
                }
            }
        );
        
        const provinceData = await response.json();
        
        if (provinceData.length === 0) return [];
        
        const provinceId = provinceData[0].place_id;
        
        // Get municipalities within this province
        const municipalityResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?q=municipality+in+${encodeURIComponent(provinceName)}+philippines&format=json&limit=50&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'CheckpointReporter/1.0'
                }
            }
        );
        
        const municipalities = await municipalityResponse.json();
        
        const results = municipalities
            .filter((item: any) => 
                item.address && 
                (item.address.city || item.address.town || item.address.municipality)
            )
            .map((item: any) => ({
                value: item.place_id.toString(),
                label: item.address.city || item.address.town || item.address.municipality,
                osmId: item.osm_id,
                osmType: item.osm_type
            }));
        
        cache.set(cacheKey, results);
        return results;
    } catch (error) {
        console.error('Error fetching municipalities:', error);
        return [];
    }
};

// Function to get barangays by municipality
export const getBarangaysByMunicipality = async (municipalityName: string): Promise<LocationOption[]> => {
    const cacheKey = `barangays_${municipalityName}`;
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=barangay+${encodeURIComponent(municipalityName)}+philippines&format=json&limit=50&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'CheckpointReporter/1.0'
                }
            }
        );
        
        const data = await response.json();
        
        const results = data
            .filter((item: any) => 
                item.address && 
                (item.address.suburb || item.address.village || item.address.neighbourhood)
            )
            .map((item: any) => ({
                value: item.place_id.toString(),
                label: item.address.suburb || item.address.village || item.address.neighbourhood,
                osmId: item.osm_id,
                osmType: item.osm_type,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon)
            }));
        
        cache.set(cacheKey, results);
        return results;
    } catch (error) {
        console.error('Error fetching barangays:', error);
        return [];
    }
};

// Function to get coordinates for an address
export const getCoordinatesFromAddress = async (address: string): Promise<{ lat: number; lon: number } | null> => {
    const cacheKey = `geocode_${address}`;
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)},+Philippines&format=json&limit=1`,
            {
                headers: {
                    'User-Agent': 'CheckpointReporter/1.0'
                }
            }
        );
        
        const data = await response.json();
        
        if (data.length > 0) {
            const result = {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
            cache.set(cacheKey, result);
            return result;
        }
        return null;
    } catch (error) {
        console.error('Error getting coordinates:', error);
        return null;
    }
};

// Function to reverse geocode (get address from coordinates)
export const reverseGeocode = async (lat: number, lon: number): Promise<any> => {
    const cacheKey = `reverse_${lat}_${lon}`;
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'CheckpointReporter/1.0'
                }
            }
        );
        
        const data = await response.json();
        cache.set(cacheKey, data);
        return data;
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return null;
    }
};