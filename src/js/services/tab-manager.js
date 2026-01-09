/* TabManager
 * Manages opening tabs for different marketplaces based on generated URLs.
 */

import { StorageManager } from '../utils/storage.js';

if (typeof browser === 'undefined') {
  var browser = chrome;
}

export class TabManager {

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
          if (!browser || !browser.tabs) {
            try { window.open(url, '_blank'); } catch {}
            openedCount++;
            return resolve();
          }

          let rsFinal = null;
          if (market === 'rapidskins' && url.includes('#rsredir=')) {
            try {
              const u = new URL(url);
              const m = (u.hash || '').match(/#rsredir=([^&]+)/);
              if (m) {
                rsFinal = decodeURIComponent(m[1]);
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
