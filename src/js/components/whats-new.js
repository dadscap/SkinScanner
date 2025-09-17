/* What's New Component for SkinScanner Extension
 * Displays update notifications and manages the "What's New" overlay
 */

// Cross-browser compatibility
if (typeof browser === "undefined") {
    var browser = chrome;
}

export class WhatsNewManager {
    constructor() {
        this.overlay = null;
        this.isShown = false;
    }

    // Create the What's New overlay HTML
    createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'whatsNewOverlay';
        overlay.className = 'whats-new-overlay';
        
        overlay.innerHTML = `
            <div class="whats-new-backdrop"></div>
            <div class="whats-new-modal">
                <div class="whats-new-header">
                    <h3>🎉 What's New in SkinScanner</h3>
                    <button class="whats-new-close" aria-label="Close">×</button>
                </div>
                <div class="whats-new-content">
                    <div class="whats-new-version">Version ${browser.runtime.getManifest().version}</div>
                    <div class="whats-new-features">
                        <div class="feature-item">
                            <div class="feature-icon">🎨</div>
                            <div class="feature-text">
                                <strong>New Genesis Collection Items Added</strong>
                                <p>Added mappings for items from the <a href="https://steamcommunity.com/games/CSGO/announcements/detail/514095143786120352" target="_blank">NEW Genesis Collection</a> and the "Sealed Genesis Terminal", including various weapon skins such as the "M4A4 | Full Throttle", "AK-47 | The Oligarch", and others! <b>Start searching on 8/24/2025!</b></p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="whats-new-footer">
                    <button class="whats-new-got-it">Got it!</button>
                </div>
            </div>
        `;

        return overlay;
    }

    // Add CSS styles for the What's New overlay
    injectStyles() {
        if (document.getElementById('whatsNewStyles')) return;

        const style = document.createElement('style');
        style.id = 'whatsNewStyles';
        style.textContent = `
            .whats-new-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: whatsNewFadeIn 0.3s ease-out;
            }

            .whats-new-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(2px);
            }

            .whats-new-modal {
                position: relative;
                background: var(--bg-primary, #ffffff);
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow: hidden;
                border: 1px solid var(--border-color, #e1e5e9);
                animation: whatsNewSlideIn 0.3s ease-out;
            }

            .whats-new-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px 16px;
                border-bottom: 1px solid var(--border-color, #e1e5e9);
                background: var(--bg-primary, #ffffff);
            }

            .whats-new-header h3 {
                margin: 0;
                font-size: 20px;
                font-weight: 600;
                color: var(--text-primary, #2c3e50);
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .whats-new-close {
                background: none;
                border: none;
                font-size: 24px;
                color: var(--text-secondary, #6c757d);
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                line-height: 1;
                transition: background-color 0.2s ease;
            }

            .whats-new-close:hover {
                background: var(--bg-hover, #f8f9fa);
                color: var(--text-primary, #2c3e50);
            }

            .whats-new-content {
                padding: 20px 24px;
                max-height: 400px;
                overflow-y: auto;
            }

            .whats-new-version {
                display: inline-block;
                background: var(--primary-color, #007bff);
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
                margin-bottom: 20px;
            }

            .whats-new-features {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .feature-item {
                display: flex;
                gap: 12px;
                align-items: flex-start;
            }

            .feature-icon {
                font-size: 20px;
                min-width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--bg-secondary, #f8f9fa);
                border-radius: 8px;
                flex-shrink: 0;
            }

            .feature-text {
                flex: 1;
            }

            .feature-text strong {
                display: block;
                font-weight: 600;
                color: var(--text-primary, #2c3e50);
                margin-bottom: 4px;
                font-size: 14px;
            }

            .feature-text p {
                margin: 0;
                color: var(--text-secondary, #6c757d);
                font-size: 13px;
                line-height: 1.4;
            }

            .whats-new-footer {
                padding: 16px 24px 20px;
                border-top: 1px solid var(--border-color, #e1e5e9);
                background: var(--bg-primary, #ffffff);
                display: flex;
                justify-content: flex-end;
            }

            .whats-new-got-it {
                background: var(--primary-color, #007bff);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                font-weight: 500;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.2s ease;
            }

            .whats-new-got-it:hover {
                background: var(--primary-color-hover, #0056b3);
            }

            .whats-new-got-it:active {
                transform: translateY(1px);
            }

            /* Dark mode styles */
            body.dark-mode .whats-new-modal {
                background: var(--bg-primary-dark, #2c3e50);
                border-color: var(--border-color-dark, #34495e);
            }

            body.dark-mode .whats-new-header {
                background: var(--bg-primary-dark, #2c3e50);
                border-bottom-color: var(--border-color-dark, #34495e);
            }

            body.dark-mode .whats-new-header h3 {
                color: var(--text-primary-dark, #ecf0f1);
            }

            body.dark-mode .whats-new-close {
                color: var(--text-secondary-dark, #bdc3c7);
            }

            body.dark-mode .whats-new-close:hover {
                background: var(--bg-hover-dark, #34495e);
                color: var(--text-primary-dark, #ecf0f1);
            }

            body.dark-mode .whats-new-footer {
                background: var(--bg-primary-dark, #2c3e50);
                border-top-color: var(--border-color-dark, #34495e);
            }

            body.dark-mode .feature-icon {
                background: var(--bg-secondary-dark, #34495e);
            }

            body.dark-mode .feature-text strong {
                color: var(--text-primary-dark, #ecf0f1);
            }

            body.dark-mode .feature-text p {
                color: var(--text-secondary-dark, #bdc3c7);
            }

            @keyframes whatsNewFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes whatsNewSlideIn {
                from { 
                    opacity: 0;
                    transform: translateY(-20px) scale(0.95);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
        `;

        document.head.appendChild(style);
    }

    // Show the What's New overlay
    async show() {
        if (this.isShown) return;

        this.injectStyles();
        this.overlay = this.createOverlay();
        document.body.appendChild(this.overlay);
        this.isShown = true;

        // Add event listeners
        const closeBtn = this.overlay.querySelector('.whats-new-close');
        const gotItBtn = this.overlay.querySelector('.whats-new-got-it');
        const backdrop = this.overlay.querySelector('.whats-new-backdrop');

        const closeHandler = () => this.hide();

        closeBtn.addEventListener('click', closeHandler);
        gotItBtn.addEventListener('click', closeHandler);
        backdrop.addEventListener('click', closeHandler);

        // Prevent scrolling on the main body while overlay is shown
        document.body.style.overflow = 'hidden';
    }

    // Hide the What's New overlay
    async hide() {
        if (!this.isShown || !this.overlay) return;

        // Notify background script that user has viewed the what's new message
        try {
            await browser.runtime.sendMessage({ action: 'whatsNewViewed' });
        } catch (error) {
            console.warn('Failed to notify background script:', error);
        }

        // Restore body scrolling
        document.body.style.overflow = '';

        // Remove overlay with animation
        this.overlay.style.animation = 'whatsNewFadeIn 0.2s ease-in reverse';
        setTimeout(() => {
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }
            this.overlay = null;
            this.isShown = false;
        }, 200);
    }

    // Check if we should show the What's New overlay
    async checkAndShow() {
        try {
            const response = await browser.runtime.sendMessage({ action: 'getBadgeStatus' });
            
            if (response && response.showWhatsNew) {
                // Small delay to ensure popup is fully loaded
                setTimeout(() => {
                    this.show();
                }, 300);
                
                // Notify background script that popup was opened
                browser.runtime.sendMessage({ action: 'popupOpened' });
            }
        } catch (error) {
            console.warn('Failed to check what\'s new status:', error);
        }
    }
}