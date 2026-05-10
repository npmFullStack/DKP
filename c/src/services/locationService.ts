// src/services/locationService.ts
// Uses psgc.cloud for complete, official PH geographic data.
// Key fix: always use /cities-municipalities/{code}/barangays — works for both
// cities and municipalities without needing to know the type.

export interface LocationOption {
    value: string;   // PSGC code (used to fetch children)
    label: string;   // Display name
}

export interface PhilippineLocation {
    province: LocationOption | null;
    municipality: LocationOption | null;
    barangay: LocationOption | null;
    coordinates?: { lat: number; lng: number };
}

const PSGC = 'https://psgc.cloud/api';
const cache = new Map<string, any>();

const fetchJSON = async (url: string) => {
    if (cache.has(url)) return cache.get(url);
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`PSGC fetch failed: ${url} → ${res.status}`);
    const data = await res.json();
    cache.set(url, data);
    return data;
};

// ─── Provinces ────────────────────────────────────────────────────────────────

export const getProvinces = async (): Promise<LocationOption[]> => {
    const data: { code: string; name: string }[] = await fetchJSON(`${PSGC}/provinces`);
    return data
        .map(p => ({ value: p.code, label: p.name }))
        .sort((a, b) => a.label.localeCompare(b.label));
};

// ─── Cities + Municipalities (unified, one call) ──────────────────────────────

export const getMunicipalitiesByProvince = async (
    provinceCode: string   // PSGC province code, e.g. "0434100000"
): Promise<LocationOption[]> => {
    // /provinces/{code}/cities-municipalities returns both in one shot
    const data: { code: string; name: string }[] =
        await fetchJSON(`${PSGC}/provinces/${provinceCode}/cities-municipalities`);

    return data
        .map(m => ({ value: m.code, label: m.name }))
        .sort((a, b) => a.label.localeCompare(b.label));
};

// ─── Barangays ────────────────────────────────────────────────────────────────
// Uses /cities-municipalities/{code}/barangays — works for BOTH cities and
// municipalities, so no type-guessing needed.

export const getBarangaysByMunicipality = async (
    cityMunCode: string   // PSGC city/municipality code, e.g. "0434108000"
): Promise<LocationOption[]> => {
    const data: { code: string; name: string }[] =
        await fetchJSON(`${PSGC}/cities-municipalities/${cityMunCode}/barangays`);

    return data
        .map(b => ({ value: b.code, label: b.name }))
        .sort((a, b) => a.label.localeCompare(b.label));
};

// ─── Nominatim: geocoding ─────────────────────────────────────────────────────

export const getCoordinatesFromAddress = async (
    address: string
): Promise<{ lat: number; lon: number } | null> => {
    const key = `geocode_${address}`;
    if (cache.has(key)) return cache.get(key);
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&countrycodes=PH&format=json&limit=1`,
            { headers: { 'User-Agent': 'CheckpointReporter/1.0' } }
        );
        const data = await res.json();
        if (data.length > 0) {
            const result = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
            cache.set(key, result);
            return result;
        }
        return null;
    } catch {
        return null;
    }
};

export const reverseGeocode = async (lat: number, lon: number): Promise<any> => {
    const key = `reverse_${lat}_${lon}`;
    if (cache.has(key)) return cache.get(key);
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
            { headers: { 'User-Agent': 'CheckpointReporter/1.0' } }
        );
        const data = await res.json();
        cache.set(key, data);
        return data;
    } catch {
        return null;
    }
};

// ─── Nominatim: street/landmark autocomplete ──────────────────────────────────

export interface StreetSuggestion {
    label: string;     // Short name (road/suburb/village)
    fullName: string;  // Full display_name for disambiguation
    lat: number;
    lon: number;
}

export const searchStreets = async (
    query: string,
    context: string   // e.g. "Barangay X, Calamba, Laguna"
): Promise<StreetSuggestion[]> => {
    if (!query || query.length < 3) return [];
    const q = context ? `${query}, ${context}` : `${query}, Philippines`;
    const key = `street_${q}`;
    if (cache.has(key)) return cache.get(key);

    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=PH&format=json&limit=6&addressdetails=1`,
            { headers: { 'User-Agent': 'CheckpointReporter/1.0' } }
        );
        const data = await res.json();

        const results: StreetSuggestion[] = data.map((item: any) => {
            const addr = item.address;
            const short = addr.road || addr.suburb || addr.village ||
                          addr.neighbourhood || item.display_name.split(',')[0];
            return {
                label: short,
                fullName: item.display_name,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon)
            };
        });

        // Dedupe by lowercase label
        const seen = new Set<string>();
        const unique = results.filter(r => {
            const k = r.label.toLowerCase();
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
        });

        cache.set(key, unique);
        return unique;
    } catch {
        return [];
    }
};