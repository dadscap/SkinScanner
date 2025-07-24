/* StorageManager
 * Handles saving and loading state and preferences using the browser's local storage API.
 */
import { STORAGE_KEY, DARK_MODE_KEY, RECENT_SEARCHES_KEY, WELCOME_SEEN_KEY } from '../config/constants.js';

// --- Browser API Compatibility ---
// Ensure browser API compatibility across different browsers (Chrome, Firefox, etc.)
if (typeof browser === "undefined") {
    var browser = chrome;
}

// Storage keys for different preferences
const SKIP_RESET_CONFIRMATION_KEY = 'skipResetConfirmation';
const SKIP_MARKET_WARNING_KEY = 'skipMarketWarning';
const MAX_RECENT_SEARCHES = 10; // Limit the number of recent searches

/**
 * Manages persistent storage for extension state and user preferences
 * Uses browser.storage.local API for cross-session data persistence
 */
export class StorageManager {
    /**
     * Saves the application state to browser local storage
     * @param {Object} state - The application state object to persist
     * @returns {Promise<void>} Resolves when save is complete, rejects on error
     */
    static async saveState(state) {
        return new Promise((resolve, reject) => {
            // Check if browser storage API is available
            if (browser.storage && browser.storage.local) {
                browser.storage.local.set({ [STORAGE_KEY]: state }, () => {
                    if (browser.runtime.lastError) {
                        console.error("Error saving state:", browser.runtime.lastError.message);
                        reject(browser.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            } else if (window.localStorage) {
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                    resolve();
                } catch (e) {
                    console.error("Error saving state to localStorage:", e);
                    reject(e);
                }
            } else {
                console.warn("No storage API available for saving state.");
                reject(new Error("No storage API available."));
            }
        });
    }

    /**
     * Loads the application state from browser local storage
     * @returns {Promise<Object|undefined>} The saved state object, or undefined if not found/error
     */
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
            } else if (window.localStorage) {
                try {
                    const storedState = localStorage.getItem(STORAGE_KEY);
                    resolve(storedState ? JSON.parse(storedState) : undefined);
                } catch (e) {
                    console.error("Error loading state from localStorage:", e);
                    resolve(undefined);
                }
            } else {
                console.warn("No storage API available for loading state.");
                resolve(undefined);
            }
        });
    }

    /**
     * Saves the user's dark mode preference
     * @param {boolean} isDark - True if dark mode is enabled, false otherwise
     * @returns {Promise<void>} Resolves when save is complete, rejects on error
     */
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
            } else if (window.localStorage) {
                try {
                    localStorage.setItem(DARK_MODE_KEY, JSON.stringify(isDark));
                    resolve();
                } catch (e) {
                    console.error("Error saving dark mode preference to localStorage:", e);
                    reject(e);
                }
            } else {
                console.warn("No storage API available for saving dark mode preference.");
                reject(new Error("No storage API available."));
            }
        });
    }

    /**
     * Loads the user's dark mode preference, with system preference fallback
     * @returns {Promise<boolean>} True if dark mode should be enabled, false otherwise
     */
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
            } else if (window.localStorage) {
                try {
                    const storedDarkMode = localStorage.getItem(DARK_MODE_KEY);
                    if (typeof storedDarkMode === 'string') {
                        resolve(JSON.parse(storedDarkMode));
                    } else {
                        resolve(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
                    }
                } catch (e) {
                    console.error("Error loading dark mode preference from localStorage:", e);
                    resolve(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
                }
            } else {
                console.warn("No storage API available for loading dark mode preference.");
                resolve(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
            }
        });
    }

    /**
     * Gets the user's preference for skipping reset confirmation dialogs
     * @returns {Promise<boolean>} True if confirmation should be skipped, false otherwise
     */
    static async getSkipResetConfirmation() {
        return new Promise((resolve) => {
            if (browser.storage && browser.storage.local) {
                browser.storage.local.get(SKIP_RESET_CONFIRMATION_KEY, (result) => {
                    if (browser.runtime.lastError) {
                        console.error("Error loading skip reset confirmation preference:", browser.runtime.lastError.message);
                        resolve(false);
                    } else {
                        resolve(result[SKIP_RESET_CONFIRMATION_KEY] || false);
                    }
                });
            } else if (window.localStorage) {
                try {
                    const storedValue = localStorage.getItem(SKIP_RESET_CONFIRMATION_KEY);
                    resolve(storedValue ? JSON.parse(storedValue) : false);
                } catch (e) {
                    console.error("Error loading skip reset confirmation preference from localStorage:", e);
                    resolve(false);
                }
            } else {
                console.warn("No storage API available for loading skip reset confirmation preference.");
                resolve(false);
            }
        });
    }

    /**
     * Sets the user's preference for skipping reset confirmation dialogs
     * @param {boolean} skipConfirmation - True to skip confirmations, false to show them
     * @returns {Promise<void>} Resolves when save is complete, rejects on error
     */
    static async setSkipResetConfirmation(skipConfirmation) {
        return new Promise((resolve, reject) => {
            if (browser.storage && browser.storage.local) {
                browser.storage.local.set({ [SKIP_RESET_CONFIRMATION_KEY]: skipConfirmation }, () => {
                    if (browser.runtime.lastError) {
                        console.error("Error saving skip reset confirmation preference:", browser.runtime.lastError.message);
                        reject(browser.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            } else if (window.localStorage) {
                try {
                    localStorage.setItem(SKIP_RESET_CONFIRMATION_KEY, JSON.stringify(skipConfirmation));
                    resolve();
                } catch (e) {
                    console.error("Error saving skip reset confirmation preference to localStorage:", e);
                    reject(e);
                }
            } else {
                console.warn("No storage API available for saving skip reset confirmation preference.");
                reject(new Error("No storage API available."));
            }
        });
    }

    /**
     * Gets the user's preference for skipping the market selection warning
     * @returns {Promise<boolean>} True if the warning should be skipped, false otherwise
     */
    static async getSkipMarketWarning() {
        return new Promise((resolve) => {
            if (browser.storage && browser.storage.local) {
                browser.storage.local.get(SKIP_MARKET_WARNING_KEY, (result) => {
                    if (browser.runtime.lastError) {
                        console.error("Error loading skip market warning preference:", browser.runtime.lastError.message);
                        resolve(false);
                    } else {
                        resolve(result[SKIP_MARKET_WARNING_KEY] || false);
                    }
                });
            } else if (window.localStorage) {
                try {
                    const storedValue = localStorage.getItem(SKIP_MARKET_WARNING_KEY);
                    resolve(storedValue ? JSON.parse(storedValue) : false);
                } catch (e) {
                    console.error("Error loading skip market warning preference from localStorage:", e);
                    resolve(false);
                }
            } else {
                console.warn("No storage API available for loading skip market warning preference.");
                resolve(false);
            }
        });
    }

    /**
     * Sets the user's preference for skipping the market selection warning
     * @param {boolean} skipWarning - True to skip the warning, false to show it
     * @returns {Promise<void>} Resolves when save is complete, rejects on error
     */
    static async setSkipMarketWarning(skipWarning) {
        return new Promise((resolve, reject) => {
            if (browser.storage && browser.storage.local) {
                browser.storage.local.set({ [SKIP_MARKET_WARNING_KEY]: skipWarning }, () => {
                    if (browser.runtime.lastError) {
                        console.error("Error saving skip market warning preference:", browser.runtime.lastError.message);
                        reject(browser.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            } else if (window.localStorage) {
                try {
                    localStorage.setItem(SKIP_MARKET_WARNING_KEY, JSON.stringify(skipWarning));
                    resolve();
                } catch (e) {
                    console.error("Error saving skip market warning preference to localStorage:", e);
                    reject(e);
                }
            } else {
                console.warn("No storage API available for saving skip market warning preference.");
                reject(new Error("No storage API available."));
            }
        });
    }

    /**
     * Adds a search query to the list of recent searches.
     * @param {string} query - The search query to add.
     * @returns {Promise<void>}
     */
    static async addRecentSearch(query) {
        if (!query || typeof query !== 'string') {
            return;
        }
        let recentSearches = await StorageManager.loadRecentSearches();
        // Remove duplicates and add to the front
        recentSearches = recentSearches.filter(search => search !== query);
        recentSearches.unshift(query);
        // Trim to max size
        if (recentSearches.length > MAX_RECENT_SEARCHES) {
            recentSearches = recentSearches.slice(0, MAX_RECENT_SEARCHES);
        }
        return new Promise((resolve, reject) => {
            if (browser.storage && browser.storage.local) {
                browser.storage.local.set({ [RECENT_SEARCHES_KEY]: recentSearches }, () => {
                    if (browser.runtime.lastError) {
                        console.error("Error saving recent searches:", browser.runtime.lastError.message);
                        reject(browser.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            } else if (window.localStorage) {
                try {
                    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches));
                    resolve();
                } catch (e) {
                    console.error("Error saving recent searches to localStorage:", e);
                    reject(e);
                }
            } else {
                console.warn("No storage API available for saving recent searches.");
                reject(new Error("No storage API available."));
            }
        });
    }

    /**
     * Loads the list of recent searches.
     * @returns {Promise<string[]>} An array of recent search queries.
     */
    static async loadRecentSearches() {
        return new Promise((resolve) => {
            if (browser.storage && browser.storage.local) {
                browser.storage.local.get(RECENT_SEARCHES_KEY, (result) => {
                    if (browser.runtime.lastError) {
                        console.error("Error loading recent searches:", browser.runtime.lastError.message);
                        resolve([]);
                    } else {
                        resolve(Array.isArray(result[RECENT_SEARCHES_KEY]) ? result[RECENT_SEARCHES_KEY] : []);
                    }
                });
            } else if (window.localStorage) {
                try {
                    const storedSearches = localStorage.getItem(RECENT_SEARCHES_KEY);
                    resolve(storedSearches ? JSON.parse(storedSearches) : []);
                } catch (e) {
                    console.error("Error loading recent searches from localStorage:", e);
                    resolve([]);
                }
            } else {
                console.warn("No storage API available for loading recent searches.");
                resolve([]);
            }
        });
    }

    /**
     * Clears all recent searches.
     * @returns {Promise<void>}
     */
    static async clearRecentSearches() {
        return new Promise((resolve, reject) => {
            if (browser.storage && browser.storage.local) {
                browser.storage.local.remove(RECENT_SEARCHES_KEY, () => {
                    if (browser.runtime.lastError) {
                        console.error("Error clearing recent searches:", browser.runtime.lastError.message);
                        reject(browser.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            } else if (window.localStorage) {
                try {
                    localStorage.removeItem(RECENT_SEARCHES_KEY);
                    resolve();
                } catch (e) {
                    console.error("Error clearing recent searches from localStorage:", e);
                    reject(e);
                }
            } else {
                console.warn("No storage API available for clearing recent searches.");
                reject(new Error("No storage API available."));
            }
        });
    }

    /**
     * Gets the user's tab delay preference
     * @returns {Promise<number>} The tab delay in milliseconds (defaults to 250ms)
     */
    static async getTabDelay() {
        return new Promise((resolve) => {
            if (browser.storage && browser.storage.local) {
                browser.storage.local.get('tabDelayPreference', (result) => {
                    if (browser.runtime.lastError) {
                        console.error("Error loading tab delay preference:", browser.runtime.lastError.message);
                        resolve(250); // Default to 250ms
                    } else {
                        resolve(result.tabDelayPreference || 250);
                    }
                });
            } else if (window.localStorage) {
                try {
                    const storedDelay = localStorage.getItem('tabDelayPreference');
                    resolve(storedDelay ? parseInt(storedDelay, 10) : 250);
                } catch (e) {
                    console.error("Error loading tab delay preference from localStorage:", e);
                    resolve(250);
                }
            } else {
                console.warn("No storage API available for loading tab delay preference.");
                resolve(250);
            }
        });
    }

    /**
     * Sets the user's tab delay preference
     * @param {number} delay - The tab delay in milliseconds
     * @returns {Promise<void>} Resolves when save is complete, rejects on error
     */
    static async setTabDelay(delay) {
        return new Promise((resolve, reject) => {
            if (browser.storage && browser.storage.local) {
                browser.storage.local.set({ tabDelayPreference: delay }, () => {
                    if (browser.runtime.lastError) {
                        console.error("Error saving tab delay preference:", browser.runtime.lastError.message);
                        reject(browser.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            } else if (window.localStorage) {
                try {
                    localStorage.setItem('tabDelayPreference', delay.toString());
                    resolve();
                } catch (e) {
                    console.error("Error saving tab delay preference to localStorage:", e);
                    reject(e);
                }
            } else {
                console.warn("No storage API available for saving tab delay preference.");
                reject(new Error("No storage API available."));
            }
        });
    }

    /**
     * Gets whether the user has seen the welcome message
     * @returns {Promise<boolean>} True if welcome has been seen, false otherwise (defaults to false)
     */
    static async getHasSeenWelcome() {
        return new Promise((resolve) => {
            if (browser.storage && browser.storage.local) {
                browser.storage.local.get(WELCOME_SEEN_KEY, (result) => {
                    if (browser.runtime.lastError) {
                        console.error("Error loading welcome seen preference:", browser.runtime.lastError.message);
                        resolve(false);
                    } else {
                        resolve(result[WELCOME_SEEN_KEY] || false);
                    }
                });
            } else if (window.localStorage) {
                try {
                    const storedValue = localStorage.getItem(WELCOME_SEEN_KEY);
                    resolve(storedValue ? JSON.parse(storedValue) : false);
                } catch (e) {
                    console.error("Error loading welcome seen preference from localStorage:", e);
                    resolve(false);
                }
            } else {
                console.warn("No storage API available for loading welcome seen preference.");
                resolve(false);
            }
        });
    }

    /**
     * Sets whether the user has seen the welcome message
     * @param {boolean} hasSeen - True if welcome has been seen, false otherwise
     * @returns {Promise<void>} Resolves when save is complete, rejects on error
     */
    static async setHasSeenWelcome(hasSeen) {
        return new Promise((resolve, reject) => {
            if (browser.storage && browser.storage.local) {
                browser.storage.local.set({ [WELCOME_SEEN_KEY]: hasSeen }, () => {
                    if (browser.runtime.lastError) {
                        console.error("Error saving welcome seen preference:", browser.runtime.lastError.message);
                        reject(browser.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            } else if (window.localStorage) {
                try {
                    localStorage.setItem(WELCOME_SEEN_KEY, JSON.stringify(hasSeen));
                    resolve();
                } catch (e) {
                    console.error("Error saving welcome seen preference to localStorage:", e);
                    reject(e);
                }
            } else {
                console.warn("No storage API available for saving welcome seen preference.");
                reject(new Error("No storage API available."));
            }
        });
    }
}