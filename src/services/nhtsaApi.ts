/**
 * NHTSA vPIC API Integration Service
 * Fetches real-world vehicle makes and models dynamically with caching & GCC fallback.
 */

const NHTSA_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';

interface NhtsaMakeResult {
  Make_ID: number;
  Make_Name: string;
}

interface NhtsaModelResult {
  Make_ID: number;
  Make_Name: string;
  Model_ID: number;
  Model_Name: string;
}

// Memory caches to prevent repeated requests
let cachedMakes: { id: string; labelEn: string }[] | null = null;
const cachedModelsByMake: Record<string, string[]> = {};

/**
 * Fetches vehicle makes from NHTSA API or returns null on network/CORS error
 */
export async function fetchNhtsaMakes(): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const response = await fetch(`${NHTSA_BASE_URL}/GetMakesForVehicleType/car?format=json`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    if (data.Results && Array.isArray(data.Results)) {
      return data.Results.map((r: NhtsaMakeResult) => r.Make_Name.trim()).filter(Boolean);
    }
    return [];
  } catch (err) {
    // Graceful fallback to built-in GCC seed list
    return [];
  }
}

/**
 * Fetches models for a specific vehicle make from NHTSA API
 */
export async function fetchNhtsaModels(makeName: string): Promise<string[]> {
  const normalizedMake = makeName.trim().toLowerCase();
  if (cachedModelsByMake[normalizedMake]) {
    return cachedModelsByMake[normalizedMake];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(
      `${NHTSA_BASE_URL}/GetModelsForMake/${encodeURIComponent(makeName)}?format=json`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    if (data.Results && Array.isArray(data.Results)) {
      const models: string[] = Array.from(
        new Set(
          data.Results.map((r: NhtsaModelResult) => r.Model_Name.trim()).filter((m: string) => m.length > 0)
        )
      );
      cachedModelsByMake[normalizedMake] = models;
      return models;
    }
    return [];
  } catch {
    return [];
  }
}
