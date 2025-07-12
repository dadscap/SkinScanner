/* TabManager
 * Manages opening tabs for different marketplaces based on generated URLs.
 */
import { TAB_OPEN_DELAY } from '../config/constants.js';

// Ensure browser API compatibility across different browsers (Chrome, Firefox, etc.)
if (typeof browser === "undefined") {
    var browser = chrome;
}

export class TabManager {
    /**
     * Opens tabs for multiple marketplace URLs with a delay between each tab to prevent browser throttling
     * @param {Object} urlsToOpen - Object with marketplace names as keys and URLs as values
     * @returns {Promise<number>} The number of successfully opened tabs
     */
    static async openTabs(urlsToOpen) {
        let openedCount = 0;
        const markets = Object.keys(urlsToOpen);
        
        // Process each marketplace URL sequentially
        for (const market of markets) {
            const url = urlsToOpen[market];
            // Skip if URL is empty or undefined
            if (!url) continue;
            
            console.log(`Opening [${market}]: ${url}`);
            try {
                // Wrap tab creation in a Promise to handle async browser API
                await new Promise((resolve, _reject) => {
                    // Check if browser extension APIs are available
                    if (browser && browser.tabs) {
                        // Create a new tab in the background (active: false)
                        browser.tabs.create({ url: url, active: false }, (tab) => {
                            // Handle browser runtime errors (e.g., permissions, invalid URLs)
                            if (browser.runtime.lastError) {
                                console.error(`Error opening tab for ${market}: ${browser.runtime.lastError.message}`);
                                resolve(); // Continue with next tab even if this one fails
                            } else if (!tab) {
                                // Edge case: tab creation succeeded but no tab object returned
                                console.error(`Error opening tab for ${market}: Tab creation callback received no tab object.`);
                                resolve();
                            } else {
                                // Tab successfully created
                                openedCount++;
                                resolve(tab);
                            }
                        });
                    } else {
                        // Fallback for non-extension environment (e.g., regular webpage)
                        console.warn("browser.tabs API not available. Opening in current window (simulated).");
                        window.open(url, '_blank');
                        openedCount++;
                        resolve();
                    }
                });
                
                // Add delay between tab openings to prevent browser rate limiting
                // Only delay if there are more tabs to open
                if (openedCount < markets.length) {
                    await new Promise(resolve => setTimeout(resolve, TAB_OPEN_DELAY));
                }
            } catch (error) {
                // Catch any unexpected errors during tab creation
                console.error(`Unexpected error processing tab creation for ${market}:`, error);
                // Use shorter delay for errors to minimize total wait time
                await new Promise(resolve => setTimeout(resolve, TAB_OPEN_DELAY / 2));
            }
        }
        
        return openedCount;
    }
}