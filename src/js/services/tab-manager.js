/* TabManager
 * Manages opening tabs for different marketplaces based on generated URLs.
 */
import { StorageManager } from '../utils/storage.js';

// Cross-browser shim
if (typeof browser === 'undefined') {
  var browser = chrome;
}

export class TabManager {
  /**
   * Opens tabs for multiple marketplace URLs with a delay between each tab
   * @param {Object} urlsToOpen - { [market: string]: string }
   * @returns {Promise<number>} Number of successfully opened tabs
   */
  static async openTabs(urlsToOpen) {
    if (!urlsToOpen || typeof urlsToOpen !== 'object') return 0;

    const markets = Object.keys(urlsToOpen);
    if (!markets.length) return 0;

    const tabDelay = await StorageManager.getTabDelay();
    let openedCount = 0;

    for (const market of markets) {
      let url = urlsToOpen[market];
      if (!url || typeof url !== 'string') continue;

      console.log(`Opening [${market}]: ${url}`);

      try {
        await new Promise((resolve) => {
          // Fallback for non-extension environments (dev/preview)
          if (!browser || !browser.tabs) {
            try { window.open(url, '_blank'); } catch {}
            openedCount++;
            return resolve();
          }

          // --- RapidSkins: affiliate -> (Steam OAuth?) -> RS homepage -> final search ---
          let rsFinal = null;
          if (market === 'rapidskins' && url.includes('#rsredir=')) {
            try {
              const u = new URL(url);
              const m = (u.hash || '').match(/#rsredir=([^&]+)/);
              if (m) {
                rsFinal = decodeURIComponent(m[1]);
                // Strip the hash so first load is the affiliate/homepage step
                url = u.origin + u.pathname + (u.search || '');
                console.log('RapidSkins final target:', rsFinal);
              } else {
                console.warn('RapidSkins: #rsredir not found in hash:', u.hash);
              }
            } catch (e) {
              console.warn('RapidSkins: failed to parse #rsredir hash:', e);
            }
          }

          browser.tabs.create({ url, active: false }, async (tab) => {
            if (browser.runtime.lastError || !tab) {
              console.error(
                `Error opening tab for ${market}: ${browser.runtime.lastError?.message || 'No tab object returned'}`
              );
              return resolve();
            }

            openedCount++;

            // Persist the redirect intent for the background service worker
            if (market === 'rapidskins' && rsFinal) {
              try {
                await browser.storage.local.set({ ['rs-' + tab.id]: rsFinal });
              } catch (e) {
                console.warn('RapidSkins: failed to persist final URL:', e);
              }
            }

            resolve(tab);
          });
        });

        // Delay between tabs to avoid burst throttling
        if (openedCount < markets.length && tabDelay > 0) {
          await new Promise((r) => setTimeout(r, tabDelay));
        }
      } catch (error) {
        console.error(`Unexpected error creating tab for ${market}:`, error);
        if (tabDelay > 0) {
          await new Promise((r) => setTimeout(r, Math.floor(tabDelay / 2)));
        }
      }
    }

    return openedCount;
  }
}
