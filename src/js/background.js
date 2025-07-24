/* Background Script for SkinScanner Extension
 * Handles extension updates, badge management, and version tracking
 */

// Cross-browser compatibility
if (typeof browser === "undefined") {
    var browser = chrome;
}

// Constants for storage keys
const STORAGE_KEYS = {
    LAST_VERSION: 'skinscanner_last_version',
    SHOW_WHATS_NEW: 'skinscanner_show_whats_new',
    BADGE_SHOWN: 'skinscanner_badge_shown',
    WELCOME_SEEN: 'skinscanner_has_seen_welcome'
};

// Get current extension version from manifest
const getCurrentVersion = () => {
    return browser.runtime.getManifest().version;
};

// Set badge text and background color
const setBadge = (text = '', color = '#FF0000') => {
    try {
        if (browser.action) {
            // Manifest V3
            browser.action.setBadgeText({ text: text });
            browser.action.setBadgeBackgroundColor({ color: color });
        } else if (browser.browserAction) {
            // Manifest V2 fallback
            browser.browserAction.setBadgeText({ text: text });
            browser.browserAction.setBadgeBackgroundColor({ color: color });
        }
    } catch (error) {
        console.warn('Failed to set badge:', error);
    }
};

// Clear the badge
const clearBadge = () => {
    setBadge('');
};

// Show the "NEW" badge
const showNewBadge = () => {
    setBadge('NEW', '#FF4444');
};

// Check if this is a fresh install or update
const handleInstallOrUpdate = async (details) => {
    const currentVersion = getCurrentVersion();
    
    try {
        const storage = await browser.storage.local.get([
            STORAGE_KEYS.LAST_VERSION,
            STORAGE_KEYS.SHOW_WHATS_NEW,
            STORAGE_KEYS.BADGE_SHOWN
        ]);

        if (details.reason === 'install') {
            // Fresh installation - show welcome message, no update notification
            await browser.storage.local.set({
                [STORAGE_KEYS.LAST_VERSION]: currentVersion,
                [STORAGE_KEYS.SHOW_WHATS_NEW]: false,
                [STORAGE_KEYS.BADGE_SHOWN]: false,
                [STORAGE_KEYS.WELCOME_SEEN]: false
            });
            console.log('SkinScanner installed, version:', currentVersion);
            
        } else if (details.reason === 'update') {
            const lastVersion = storage[STORAGE_KEYS.LAST_VERSION];
            
            if (lastVersion && lastVersion !== currentVersion) {
                // Extension was updated to a new version
                await browser.storage.local.set({
                    [STORAGE_KEYS.LAST_VERSION]: currentVersion,
                    [STORAGE_KEYS.SHOW_WHATS_NEW]: true,
                    [STORAGE_KEYS.BADGE_SHOWN]: true
                });
                
                // Show the "NEW" badge
                showNewBadge();
                console.log(`SkinScanner updated from ${lastVersion} to ${currentVersion}`);
            }
        }
    } catch (error) {
        console.error('Error handling install/update:', error);
    }
};

// Check if we should show the badge on startup
const checkBadgeOnStartup = async () => {
    try {
        const storage = await browser.storage.local.get([
            STORAGE_KEYS.SHOW_WHATS_NEW,
            STORAGE_KEYS.BADGE_SHOWN
        ]);

        if (storage[STORAGE_KEYS.SHOW_WHATS_NEW] && storage[STORAGE_KEYS.BADGE_SHOWN]) {
            showNewBadge();
        } else {
            clearBadge();
        }
    } catch (error) {
        console.error('Error checking badge on startup:', error);
    }
};

// Handle popup opened - this will be called from the popup script
const handlePopupOpened = async () => {
    try {
        const storage = await browser.storage.local.get([STORAGE_KEYS.SHOW_WHATS_NEW]);
        
        if (storage[STORAGE_KEYS.SHOW_WHATS_NEW]) {
            // User opened popup with pending "What's New" - clear badge after a delay
            // This gives the popup time to show the what's new message
            setTimeout(async () => {
                await browser.storage.local.set({
                    [STORAGE_KEYS.BADGE_SHOWN]: false
                });
                clearBadge();
            }, 1000);
        }
    } catch (error) {
        console.error('Error handling popup opened:', error);
    }
};

// Message listener for communication with popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'popupOpened') {
        handlePopupOpened();
        sendResponse({ success: true });
    } else if (message.action === 'whatsNewViewed') {
        // User has viewed the what's new message
        browser.storage.local.set({
            [STORAGE_KEYS.SHOW_WHATS_NEW]: false,
            [STORAGE_KEYS.BADGE_SHOWN]: false
        }).then(() => {
            clearBadge();
            sendResponse({ success: true });
        }).catch(error => {
            console.error('Error marking what\'s new as viewed:', error);
            sendResponse({ success: false, error: error.message });
        });
        return true; // Keep message channel open for async response
    } else if (message.action === 'getBadgeStatus') {
        // Get current badge/update status
        browser.storage.local.get([
            STORAGE_KEYS.SHOW_WHATS_NEW,
            STORAGE_KEYS.BADGE_SHOWN,
            STORAGE_KEYS.LAST_VERSION
        ]).then(storage => {
            sendResponse({
                showWhatsNew: storage[STORAGE_KEYS.SHOW_WHATS_NEW] || false,
                badgeShown: storage[STORAGE_KEYS.BADGE_SHOWN] || false,
                lastVersion: storage[STORAGE_KEYS.LAST_VERSION] || getCurrentVersion(),
                currentVersion: getCurrentVersion()
            });
        }).catch(error => {
            console.error('Error getting badge status:', error);
            sendResponse({ error: error.message });
        });
        return true; // Keep message channel open for async response
    }
});

// Event listeners
browser.runtime.onInstalled.addListener(handleInstallOrUpdate);
browser.runtime.onStartup.addListener(checkBadgeOnStartup);

// Initialize on script load
checkBadgeOnStartup();

console.log('SkinScanner background script initialized');