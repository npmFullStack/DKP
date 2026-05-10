// src/services/locationService.ts

export interface LocationOption {
    value: string;
    label: string;
}

export interface PhilippineLocation {
    province: LocationOption | null;
    municipality: LocationOption | null;
    barangay: LocationOption | null;
    coordinates?: { lat: number; lng: number };
}

const PSGC = "https://psgc.cloud/api";
const cache = new Map<string, any>();

const fetchJSON = async (url: string) => {
    if (cache.has(url)) return cache.get(url);
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`PSGC fetch failed: ${url} → ${res.status}`);
    const data = await res.json();
    cache.set(url, data);
    return data;
};

// ─── Provinces ────────────────────────────────────────────────────────────────

export const getProvinces = async (): Promise<LocationOption[]> => {
    const data: { code: string; name: string }[] = await fetchJSON(
        `${PSGC}/provinces`
    );
    return data
        .map(p => ({ value: p.code, label: p.name }))
        .sort((a, b) => a.label.localeCompare(b.label));
};

// ─── Cities + Municipalities ──────────────────────────────────────────────────

export const getMunicipalitiesByProvince = async (
    provinceCode: string
): Promise<LocationOption[]> => {
    const data: { code: string; name: string }[] = await fetchJSON(
        `${PSGC}/provinces/${provinceCode}/cities-municipalities`
    );
    return data
        .map(m => ({ value: m.code, label: m.name }))
        .sort((a, b) => a.label.localeCompare(b.label));
};

// ─── Barangays ────────────────────────────────────────────────────────────────

export const getBarangaysByMunicipality = async (
    cityMunCode: string
): Promise<LocationOption[]> => {
    const data: { code: string; name: string }[] = await fetchJSON(
        `${PSGC}/cities-municipalities/${cityMunCode}/barangays`
    );
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
            { headers: { "User-Agent": "CheckpointReporter/1.0" } }
        );
        const data = await res.json();
        if (data.length > 0) {
            const result = {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
            cache.set(key, result);
            return result;
        }
        return null;
    } catch {
        return null;
    }
};

export const reverseGeocode = async (
    lat: number,
    lon: number
): Promise<any> => {
    const key = `reverse_${lat}_${lon}`;
    if (cache.has(key)) return cache.get(key);
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
            { headers: { "User-Agent": "CheckpointReporter/1.0" } }
        );
        const data = await res.json();
        cache.set(key, data);
        return data;
    } catch {
        return null;
    }
};

// ─── Area info: centre + bounding box from Nominatim ─────────────────────────
// Nominatim returns a boundingbox: [minLat, maxLat, minLon, maxLon].
// We store this and use it to hard-filter Photon results to the barangay area.

interface AreaInfo {
    lat: number;
    lon: number;
    // Bounding box. For a small barangay this is tight; we expand it slightly.
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
}

const resolveAreaInfo = async (context: string): Promise<AreaInfo | null> => {
    const key = `areainfo_${context}`;
    if (cache.has(key)) return cache.get(key);

    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(context + ", Philippines")}&countrycodes=PH&format=json&limit=1`,
            { headers: { "User-Agent": "CheckpointReporter/1.0" } }
        );
        const data = await res.json();
        if (data.length === 0) return null;

        const hit = data[0];
        const lat = parseFloat(hit.lat);
        const lon = parseFloat(hit.lon);

        // boundingbox = [minLat, maxLat, minLon, maxLon]
        const bb = hit.boundingbox ?? [];
        let minLat = bb[0] ? parseFloat(bb[0]) : lat - 0.02;
        let maxLat = bb[1] ? parseFloat(bb[1]) : lat + 0.02;
        let minLon = bb[2] ? parseFloat(bb[2]) : lon - 0.02;
        let maxLon = bb[3] ? parseFloat(bb[3]) : lon + 0.02;

        // Ensure a minimum bbox size of ~3 km so small barangays still get results
        const minSpan = 0.03; // ~3 km
        if (maxLat - minLat < minSpan) {
            const midLat = (minLat + maxLat) / 2;
            minLat = midLat - minSpan / 2;
            maxLat = midLat + minSpan / 2;
        }
        if (maxLon - minLon < minSpan) {
            const midLon = (minLon + maxLon) / 2;
            minLon = midLon - minSpan / 2;
            maxLon = midLon + minSpan / 2;
        }
        // Add a small buffer (~500 m) around the edges
        const pad = 0.005;
        minLat -= pad;
        maxLat += pad;
        minLon -= pad;
        maxLon += pad;

        const info: AreaInfo = { lat, lon, minLat, maxLat, minLon, maxLon };
        cache.set(key, info);
        return info;
    } catch {
        return null;
    }
};

// ─── Street / Landmark autocomplete ──────────────────────────────────────────

export interface StreetSuggestion {
    label: string;
    fullName: string;
    lat: number;
    lon: number;
}

export const searchStreets = async (
    query: string,
    context: string // e.g. "Barangay 2, City of Calamba, Laguna"
): Promise<StreetSuggestion[]> => {
    // Allow single character searches
    if (!query || query.trim().length === 0 || !context) return [];

    const cacheKey = `photon_${query.toLowerCase()}_${context}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    // Resolve area info (cached after first call per barangay)
    const area = await resolveAreaInfo(context);
    if (!area) return [];

    try {
        // FIXED: Don't use 'zoom' parameter which can limit results
        // Use a more permissive search for short queries
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${area.lat}&lon=${area.lon}&limit=50&lang=en`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Photon ${res.status}`);
        const data = await res.json();

        const seen = new Set<string>();
        const results: StreetSuggestion[] = [];

        for (const feat of data.features ?? []) {
            const props = feat.properties ?? {};
            const [fLon, fLat] = feat.geometry?.coordinates ?? [null, null];
            if (fLat == null || fLon == null) continue;

            if (
                fLat < area.minLat ||
                fLat > area.maxLat ||
                fLon < area.minLon ||
                fLon > area.maxLon
            )
                continue;

            // FIXED: Better name extraction for different OSM tag types
            let name: string = "";
            if (props.name) name = props.name;
            else if (props.street) name = props.street;
            else if (props.highway) name = props.highway;

            if (!name) continue;

            // Normalize for duplicate detection
            const labelKey = name.toLowerCase();
            if (seen.has(labelKey)) continue;
            seen.add(labelKey);

            // Build a better description
            const locationParts = [
                props.street !== name ? props.street : null,
                props.city || props.town || props.village || props.suburb,
                props.state || props.province
            ].filter(Boolean);

            // For short queries, also include the object type if available
            const typeInfo = props.osm_value ? ` (${props.osm_value})` : "";

            const fullName =
                locationParts.length > 0
                    ? `${name} — ${locationParts.join(", ")}${typeInfo}`
                    : `${name}${typeInfo}`;

            results.push({ label: name, fullName, lat: fLat, lon: fLon });
        }

        // Sort results - prioritize exact prefix matches for short queries
        if (query.length <= 2) {
            results.sort((a, b) => {
                const aStarts = a.label
                    .toLowerCase()
                    .startsWith(query.toLowerCase())
                    ? 0
                    : 1;
                const bStarts = b.label
                    .toLowerCase()
                    .startsWith(query.toLowerCase())
                    ? 0
                    : 1;
                return aStarts - bStarts;
            });
        }

        cache.set(cacheKey, results);
        return results;
    } catch (err) {
        console.error("[searchStreets]", err);
        return [];
    }
};

// ─── Cache pre-warmer ─────────────────────────────────────────────────────────
// Call when barangay is selected so coords + bbox are ready before first keystroke.
export const prewarmLocationCache = (context: string): void => {
    if (!context) return;
    resolveAreaInfo(context).catch(() => {});
};
