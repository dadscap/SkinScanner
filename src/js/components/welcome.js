/* Welcome Component for SkinScanner Extension
 * Displays welcome guide for new users
 */

// Cross-browser compatibility
if (typeof browser === "undefined") {
    var browser = chrome;
}

import { StorageManager } from '../utils/storage.js';

export class WelcomeManager {
    constructor() {
        this.overlay = null;
        this.isShown = false;
    }

    // Create the Welcome overlay HTML
    createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'welcomeOverlay';
        overlay.className = 'welcome-overlay';
        
        overlay.innerHTML = `
            <div class="welcome-backdrop"></div>
            <div class="welcome-modal">
                <div class="welcome-header">
                    <h3>🎯 Welcome to SkinScanner!</h3>
                    <button class="welcome-close" aria-label="Close">×</button>
                </div>
                <div class="welcome-content">
                    <div class="welcome-intro">
                        <p>Hello! This guide will walk you through everything you need to know to find the perfect CS2 skin across dozens of marketplaces in seconds.</p>
                        <p>First things first, for the best experience, we recommend <strong>pinning the extension</strong> to your browser's toolbar. Just right-click the SkinScanner icon and select "Pin".</p>
                    </div>

                    <div class="welcome-section">
                        <div class="welcome-section-header">
                            <div class="welcome-section-icon">🔍</div>
                            <h4>Your First Search: The Basics</h4>
                        </div>
                        <p>Follow these simple steps to get started:</p>
                        
                        <div class="welcome-step">
                            <div class="welcome-step-number">1</div>
                            <div class="welcome-step-content">
                                <h5>Find Your Item</h5>
                                <ul>
                                    <li>Begin typing the name of any CS2 item (e.g., "AK-47 Redline") into the <strong>Item Name</strong> search bar.</li>
                                    <li>An autocomplete window will appear with suggestions. For the most accurate results across all websites, <strong>always select your desired item from this dropdown list.</strong></li>
                                </ul>
                            </div>
                        </div>

                        <div class="welcome-step">
                            <div class="welcome-step-number">2</div>
                            <div class="welcome-step-content">
                                <h5>Choose Your Marketplaces</h5>
                                <ul>
                                    <li>In the <strong>Marketplaces</strong> grid, select the sites you want to search on. You can click them individually or use the <strong>"All"</strong> button to select every supported market.</li>
                                    <li>You can also filter marketplaces by type:
                                        <ul class="welcome-sublist">
                                            <li><strong>Buy/Sell:</strong> Standard marketplaces with buying/selling functionalities.</li>
                                            <li><strong>Trade:</strong> Marketplaces focused on item-for-item trading</li>
                                            <li><strong>Red Flag:</strong> China-based marketplaces (useful for price-checking)</li>
                                        </ul>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div class="welcome-step">
                            <div class="welcome-step-number">3</div>
                            <div class="welcome-step-content">
                                <h5>Launch the Search!</h5>
                                <ul>
                                    <li>Click the <strong>"Find Listings..."</strong> button at the bottom. The button will update to show you exactly how many markets you're about to search (e.g., "Find Listings On 33 Markets").</li>
                                    <li>SkinScanner will now open a new tab for each selected marketplace, pre-filled with your search criteria. <strong>Please do not click out of the extension until all tabs finish opening.</strong></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="welcome-section">
                        <div class="welcome-section-header">
                            <div class="welcome-section-icon">⚙️</div>
                            <h4>Fine-Tuning: Advanced Filters</h4>
                        </div>
                        <p>Need something specific? Use these powerful filters to narrow your search.</p>

                        <div class="welcome-filter-group">
                            <h5>StatTrak™ / Tradable</h5>
                            <ul>
                                <li>Click <strong>"StatTrak™"</strong> to filter for <em>only</em> the StatTrak™ version of an item.</li>
                                <li>Click <strong>"Tradable"</strong> to find <em>only</em> listings that are instantly tradable and have no trade hold.</li>
                            </ul>
                        </div>

                        <div class="welcome-filter-group">
                            <h5>Wear / Float Range</h5>
                            <ul>
                                <li>Use the <strong>dropdown menu</strong> to select a standard wear condition (e.g., Factory New, Field-Tested). This will automatically set the float range.</li>
                                <li>For ultimate precision, you can <strong>drag the slider</strong> or <strong>type exact float values</strong> into the boxes below it to search for a specific float (up to 3 decimal points).</li>
                            </ul>
                        </div>

                        <div class="welcome-filter-group">
                            <h5>Paint Seed / Pattern</h5>
                            <ul>
                                <li>If you're hunting for a specific pattern like a <strong>Blue Gem</strong> or a certain <strong>Fade percentage</strong>, enter the corresponding Paint Seed number (0-1000) into this field.</li>
                            </ul>
                        </div>

                        <div class="welcome-reset-tip">
                            <strong>Need to start over?</strong> Just click the <strong>"Reset Filters"</strong> button to clear all your selections.
                        </div>
                    </div>

                    <div class="welcome-section">
                        <div class="welcome-section-header">
                            <div class="welcome-section-icon">💡</div>
                            <h4>Settings & Pro-Tips</h4>
                        </div>

                        <div class="welcome-tip">
                            <strong>Tab Opening Speed:</strong> Is your browser struggling to keep up? Click the <strong>gear icon (⚙️)</strong> in the bottom-left corner to open the General Settings. Here, you can adjust the speed at which new tabs are opened, from "VERY Slow" to "VERY Fast".
                        </div>

                        <div class="welcome-tip">
                            <strong>Light / Dark Mode:</strong> Prefer a different look? Click the <strong>moon/sun icon (🌙/☀️)</strong> in the bottom-right to toggle between light and dark themes.
                        </div>
                    </div>

                    <div class="welcome-closing">
                        <p>We hope you enjoy using SkinScanner! Happy hunting!</p>
                    </div>
                </div>
                <div class="welcome-footer">
                    <button class="welcome-get-started">Get Started</button>
                </div>
            </div>
        `;

        return overlay;
    }

    // CSS styles are now included in src/styles.css with .welcome-* prefixes

    // Show the Welcome overlay
    async show() {
        if (this.isShown) return;

        this.overlay = this.createOverlay();
        document.body.appendChild(this.overlay);
        this.isShown = true;

        // Add event listeners
        const closeBtn = this.overlay.querySelector('.welcome-close');
        const getStartedBtn = this.overlay.querySelector('.welcome-get-started');
        const backdrop = this.overlay.querySelector('.welcome-backdrop');

        const closeHandler = () => this.hide();

        closeBtn.addEventListener('click', closeHandler);
        getStartedBtn.addEventListener('click', closeHandler);
        backdrop.addEventListener('click', closeHandler);

        // Prevent scrolling on the main body while overlay is shown
        document.body.style.overflow = 'hidden';

        // Focus management for accessibility
        setTimeout(() => {
            this.overlay.querySelector('.welcome-close').focus();
        }, 100);
    }

    // Hide the Welcome overlay
    async hide() {
        if (!this.isShown || !this.overlay) return;

        // Mark welcome as seen when user dismisses it
        try {
            await StorageManager.setHasSeenWelcome(true);
        } catch (error) {
            console.error('Failed to mark welcome as seen:', error);
        }

        // Restore body scrolling
        document.body.style.overflow = '';

        // Remove overlay with animation
        this.overlay.style.animation = 'welcomeFadeIn 0.2s ease-in reverse';
        setTimeout(() => {
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }
            this.overlay = null;
            this.isShown = false;
        }, 200);
    }

    // Show welcome modal for new users (to be called when needed)
    async showWelcome() {
        // Small delay to ensure popup is fully loaded
        setTimeout(() => {
            this.show();
        }, 300);
    }
}