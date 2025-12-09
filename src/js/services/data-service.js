let cachedData = null;

/**
 * Fetches and parses the individual map JSON files
 * and returns a combined mappings object.
 * Caches the result so they're only loaded once per session.
 * @returns {Promise<Object|null>} A promise that resolves to the combined maps, or null on error.
 */
export async function getMappings() {
  if (cachedData) {
    return cachedData;
  }

  // Helper to resolve URL for extension vs regular web page
  const resolveUrl = (relPath) => {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) {
      return chrome.runtime.getURL(relPath);
    }
    return relPath; // regular web page
  };

  const files = {
    skinMap: "data/skinMap.json",
    buffMap: "data/buffMap.json",
    bMarketMap: "data/bMarketMap.json",
    c5Map: "data/c5Map.json",
    uuMap: "data/uuMap.json",
    ecoMap: "data/ecoMap.json",
    pirateMap: "data/pirateMap.json",
  };

  try {
    const entries = await Promise.all(
      Object.entries(files).map(async ([key, relPath]) => {
        const url = resolveUrl(relPath);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${relPath}: ${response.status} ${response.statusText}`);
        }
        const json = await response.json();
        return [key, json];
      })
    );

    const combined = Object.fromEntries(entries);
    cachedData = combined;
    return cachedData;
  } catch (error) {
    console.error("Fatal Error: Could not load mapping data.", error);
    return null;
  }
}
