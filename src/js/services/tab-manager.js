import { TAB_OPEN_DELAY } from '../config/constants.js';

if (typeof browser === "undefined") {
    var browser = chrome;
}

export class TabManager {
    static async openTabs(urlsToOpen) { 
        let openedCount = 0;
        const markets = Object.keys(urlsToOpen);

        for (const market of markets) {
            const url = urlsToOpen[market];
            if (!url) continue;

            console.log(`Opening [${market}]: ${url}`);
            try {
                await new Promise((resolve, _reject) => {
                    if (browser && browser.tabs) {
                        browser.tabs.create({ url: url, active: false }, (tab) => {
                            if (browser.runtime.lastError) {
                                console.error(`Error opening tab for ${market}: ${browser.runtime.lastError.message}`);
                                resolve();
                            } else if (!tab) {
                                console.error(`Error opening tab for ${market}: Tab creation callback received no tab object.`);
                                resolve();
                            } else {
                                openedCount++;
                                resolve(tab);
                            }
                        });
                    } else {
                        console.warn("browser.tabs API not available. Opening in current window (simulated).");
                        window.open(url, '_blank');
                        openedCount++;
                        resolve();
                    }
                });
                if (openedCount < markets.length) { 
                    await new Promise(resolve => setTimeout(resolve, TAB_OPEN_DELAY));
                }
            } catch (error) {
                console.error(`Unexpected error processing tab creation for ${market}:`, error);
                await new Promise(resolve => setTimeout(resolve, TAB_OPEN_DELAY / 2));
            }
        }
        return openedCount;
    }
}