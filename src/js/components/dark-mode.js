/* Dark Mode Manager
 * Handles dark mode toggling and persistence using local storage.
 */
import { StorageManager } from '../utils/storage.js';

/**
 * Manages dark mode state, UI updates, and persistence across sessions
 */
export class DarkModeManager {
    /**
     * Initialize the dark mode manager with toggle button and body element
     * @param {HTMLElement} toggleElement - The button/element that toggles dark mode
     * @param {HTMLElement} bodyElement - The body element where dark mode class is applied
     */
    constructor(toggleElement, bodyElement) {
        this.toggleElement = toggleElement;
        this.bodyElement = bodyElement;
        // Initialize to false, will be updated when preference is loaded
        this.isDark = false;

        // Set up click handler for the toggle button if it exists
        if (this.toggleElement) {
            this.toggleElement.addEventListener('click', () => this.toggle());
        }
    }

    /**
     * Applies dark mode state to the UI by updating classes and button appearance
     * @param {boolean} isDark - Whether dark mode should be enabled
     */
    apply(isDark) {
        // Update internal state
        this.isDark = isDark;
        
        // Toggle the 'dark-mode' class on body element
        // Second parameter ensures class is added when isDark is true, removed when false
        this.bodyElement.classList.toggle('dark-mode', this.isDark);
        
        // Update toggle button appearance if it exists
        if (this.toggleElement) {
            // Show sun emoji in dark mode (to switch to light), moon in light mode (to switch to dark)
            this.toggleElement.textContent = this.isDark ? '☀️' : '🌙';
            // Update tooltip to indicate what clicking will do
            this.toggleElement.title = this.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
        }
    }

    /**
     * Toggles dark mode on/off and saves the preference
     * Reads current state from DOM to ensure consistency
     */
    async toggle() {
        // Determine new state by checking if dark-mode class is currently applied
        // This ensures we're toggling based on actual DOM state, not just internal state
        const newIsDark = !this.bodyElement.classList.contains('dark-mode');
        
        // Apply the new state to UI
        this.apply(newIsDark);
        
        // Persist the preference for future sessions
        await StorageManager.saveDarkMode(newIsDark);
    }

    /**
     * Loads the user's dark mode preference from storage and applies it
     * Falls back to system preference if no saved preference exists
     */
    async loadPreference() {
        // Load preference from storage (with system preference fallback)
        const prefersDark = await StorageManager.loadDarkMode();
        
        // Apply the loaded preference to UI
        this.apply(prefersDark);
    }
}