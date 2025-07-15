let cachedData = null;

/**
 * Fetches and parses the mappings.json file.
 * Caches the result so the 4MB file is only loaded once per session.
 * @returns {Promise<Object|null>} A promise that resolves to the parsed JSON data, or null on error.
 */
export async function getMappings() {
  // If the data is already in our cache, return it instantly.
  if (cachedData) {
    return cachedData;
  }

  try {
    // Check if we're in a Chrome extension context or regular web page
    let url;
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      // Extension context
      url = chrome.runtime.getURL('data/mappings.json');
    } else {
      // Regular web page context
      url = 'data/mappings.json';
    }
    
    // Fetch the file.
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch mappings.json: ${response.statusText}`);
    }

    // Parse the response as JSON.
    const data = await response.json();
    
    // Store the data in our cache for next time.
    cachedData = data;
    
    return cachedData;
  } catch (error) {
    console.error("Fatal Error: Could not load mapping data.", error);
    // Return null to indicate failure, so other parts of the app can handle it.
    return null;
  }
}