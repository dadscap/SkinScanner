import { STORAGE_KEY, DARK_MODE_KEY } from '../config/constants.js';

// --- Browser ID ---
if (typeof browser === "undefined") {
    var browser = chrome;
}

export class StorageManager {
    static async saveState(state) {
        return new Promise((resolve, reject) => {
            if (browser.storage && browser.storage.local) {
                browser.storage.local.set({ [STORAGE_KEY]: state }, () => {
                    if (browser.runtime.lastError) {
                        console.error("Error saving state:", browser.runtime.lastError.message);
                        reject(browser.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            } else {
                console.warn("browser.storage.local not available for saving state.");
                reject(new Error("Browser storage API not available."));
            }
        });
    }

    static async loadState() {
        return new Promise((resolve) => {
            if (browser.storage && browser.storage.local) {
                browser.storage.local.get(STORAGE_KEY, (result) => {
                    if (browser.runtime.lastError) {
                        console.error("Error loading state:", browser.runtime.lastError.message);
                        resolve(undefined);
                    } else {
                        resolve(result[STORAGE_KEY]);
                    }
                });
            } else {
                console.warn("browser.storage.local not available for loading state.");
                resolve(undefined);
            }
        });
    }

    static async saveDarkMode(isDark) {
        return new Promise((resolve, reject) => {
            if (browser.storage && browser.storage.local) {
                browser.storage.local.set({ [DARK_MODE_KEY]: isDark }, () => {
                    if (browser.runtime.lastError) {
                        console.error("Error saving dark mode preference:", browser.runtime.lastError.message);
                        reject(browser.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            } else {
                console.warn("browser.storage.local not available for saving dark mode preference.");
                reject(new Error("Browser storage API not available."));
            }
        });
    }

    static async loadDarkMode() {
        return new Promise((resolve) => {
            if (browser.storage && browser.storage.local) {
                browser.storage.local.get(DARK_MODE_KEY, (result) => {
                    if (browser.runtime.lastError) {
                        console.error("Error loading dark mode preference:", browser.runtime.lastError.message);
                        resolve(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
                    } else {

                        if (typeof result[DARK_MODE_KEY] === 'boolean') {
                            resolve(result[DARK_MODE_KEY]);
                        } else {
                            resolve(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
                        }
                    }
                });
            } else {
                console.warn("browser.storage.local not available for loading dark mode preference.");
                resolve(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
            }
        });
    }
}