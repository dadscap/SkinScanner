/* Background Script for SkinScanner Extension
 * Handles extension updates, badge management, and version tracking
 */

if (typeof browser === "undefined") {
    var browser = chrome;
}

const STORAGE_KEYS = {
    LAST_VERSION: 'skinscanner_last_version',
    SHOW_WHATS_NEW: 'skinscanner_show_whats_new',
    BADGE_SHOWN: 'skinscanner_badge_shown',
    WELCOME_SEEN: 'skinscanner_has_seen_welcome'
};

const RS = {
  key: (tabId) => `rs-${tabId}`,
  isRapidSkinsUrl: (url) => {
    try {
      const u = new URL(url);
      const hostOk = u.hostname === 'rapidskins.com' || u.hostname === 'www.rapidskins.com';
      const notAffiliate = !u.pathname.startsWith('/a/');
      return hostOk && notAffiliate;
    } catch { return false; }
  }
};

async function rsMaybeRedirect(details) {
  try {
    if (!details || !details.url || !RS.isRapidSkinsUrl(details.url)) return;

    const key = RS.key(details.tabId);
    const got = await browser.storage.local.get(key);
    const finalUrl = got[key];
    if (!finalUrl) return;

    await browser.storage.local.remove(key);
    try {
      await browser.tabs.update(details.tabId, { url: finalUrl });
    } catch (e) {
    }
  } catch (e) {
    console.warn('RapidSkins redirect failed:', e);
  }
}

browser.webNavigation.onCommitted.addListener(rsMaybeRedirect, {
  url: [{ hostSuffix: 'rapidskins.com' }]
});
browser.webNavigation.onCompleted.addListener(rsMaybeRedirect, {
  url: [{ hostSuffix: 'rapidskins.com' }]
});

browser.tabs.onRemoved.addListener(async (tabId) => {
  try { await browser.storage.local.remove(RS.key(tabId)); } catch {}
});

const getCurrentVersion = () => {
    return browser.runtime.getManifest().version;
};

const setBadge = (text = '', color = '#FF0000') => {
    try {
        browser.action.setBadgeText({ text: text });
        browser.action.setBadgeBackgroundColor({ color: color });
    } catch (error) {
        console.warn('Failed to set badge:', error);
    }
};

const clearBadge = () => {
    setBadge('');
};

const showNewBadge = () => {
    setBadge('NEW', '#FF4444');
};

const handleInstallOrUpdate = async (details) => {
    const currentVersion = getCurrentVersion();
    
    try {
        const storage = await browser.storage.local.get([
            STORAGE_KEYS.LAST_VERSION,
            STORAGE_KEYS.SHOW_WHATS_NEW,
            STORAGE_KEYS.BADGE_SHOWN
        ]);

        if (details.reason === 'install') {
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
                await browser.storage.local.set({
                    [STORAGE_KEYS.LAST_VERSION]: currentVersion,
                    [STORAGE_KEYS.SHOW_WHATS_NEW]: true,
                    [STORAGE_KEYS.BADGE_SHOWN]: true
                });
                
                showNewBadge();
                console.log(`SkinScanner updated from ${lastVersion} to ${currentVersion}`);
            }
        }
    } catch (error) {
        console.error('Error handling install/update:', error);
    }
};

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

const handlePopupOpened = async () => {
    try {
        const storage = await browser.storage.local.get([STORAGE_KEYS.SHOW_WHATS_NEW]);
        
        if (storage[STORAGE_KEYS.SHOW_WHATS_NEW]) {
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

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'popupOpened') {
        handlePopupOpened();
        sendResponse({ success: true });
    } else if (message.action === 'whatsNewViewed') {
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
        return true;
    } else if (message.action === 'getBadgeStatus') {
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
        return true;
    }
});

browser.runtime.onInstalled.addListener(handleInstallOrUpdate);
browser.runtime.onStartup.addListener(checkBadgeOnStartup);

checkBadgeOnStartup();

console.log('SkinScanner background script initialized');