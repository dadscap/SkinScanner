import { StorageManager } from '../utils/storage.js';

export class DarkModeManager {
    constructor(toggleElement, bodyElement) {
        this.toggleElement = toggleElement;
        this.bodyElement = bodyElement;
        this.isDark = false;

        if (this.toggleElement) {
            this.toggleElement.addEventListener('click', () => this.toggle());
        }
    }

    apply(isDark) {
        this.isDark = isDark;
        this.bodyElement.classList.toggle('dark-mode', this.isDark);
        if (this.toggleElement) {
            this.toggleElement.textContent = this.isDark ? '☀️' : '🌙';
            this.toggleElement.title = this.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
        }
    }

    async toggle() {
        const newIsDark = !this.bodyElement.classList.contains('dark-mode');
        this.apply(newIsDark);
        await StorageManager.saveDarkMode(newIsDark);
    }

    async loadPreference() {
        const prefersDark = await StorageManager.loadDarkMode();
        this.apply(prefersDark);
    }
}