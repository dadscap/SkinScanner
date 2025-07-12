/* StorageManager
 * Handles saving and loading state and preferences using the browser's local storage API.
 */
import { STORAGE_KEY, DARK_MODE_KEY } from '../config/constants.js';

// --- Browser API Compatibility ---
// Ensure browser API compatibility across different browsers (Chrome, Firefox, etc.)
if (typeof browser === "undefined") {
    var browser = chrome;
}

// Storage keys for different preferences
const SKIP_RESET_CONFIRMATION_KEY = 'skipResetConfirmation';
const SKIP_MARKET_WARNING_KEY = 'skipMarketWarning';

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
                // Use computed property name to set the state with the storage key
                browser.storage.local.set({ [STORAGE_KEY]: state }, () => {
                    if (browser.runtime.lastError) {
                        console.error("Error saving state:", browser.runtime.lastError.message);
                        reject(browser.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            } else {
                // Fallback for environments where browser storage isn't available
                console.warn("browser.storage.local not available for saving state.");
                reject(new Error("Browser storage API not available."));
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
                        // Resolve with undefined on error (graceful degradation)
                        resolve(undefined);
                    } else {
                        // Return the stored state or undefined if not present
                        resolve(result[STORAGE_KEY]);
                    }
                });
            } else {
                console.warn("browser.storage.local not available for loading state.");
                // Resolve with undefined when storage is unavailable
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
            } else {
                console.warn("browser.storage.local not available for saving dark mode preference.");
                reject(new Error("Browser storage API not available."));
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
                        // Fall back to system preference on error
                        resolve(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
                    } else {
                        // Validate that the stored value is actually a boolean
                        if (typeof result[DARK_MODE_KEY] === 'boolean') {
                            resolve(result[DARK_MODE_KEY]);
                        } else {
                            // Fall back to system preference if no valid preference stored
                            resolve(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
                        }
                    }
                });
            } else {
                console.warn("browser.storage.local not available for loading dark mode preference.");
                // Fall back to system preference when storage is unavailable
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
                        // Default to false (show confirmation) on error
                        resolve(false);
                    } else {
                        // Return stored preference or false if not set
                        resolve(result[SKIP_RESET_CONFIRMATION_KEY] || false);
                    }
                });
            } else {
                console.warn("browser.storage.local not available for loading skip reset confirmation preference.");
                // Default to false (show confirmation) when storage unavailable
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
            } else {
                console.warn("browser.storage.local not available for saving skip reset confirmation preference.");
                reject(new Error("Browser storage API not available."));
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
            } else {
                console.warn("browser.storage.local not available for loading skip market warning preference.");
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
            } else {
                console.warn("browser.storage.local not available for saving skip market warning preference.");
                reject(new Error("Browser storage API not available."));
            }
        });
    }
}