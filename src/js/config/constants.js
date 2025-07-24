// URL Presets
export const exteriorPresets = {fn: [0.00, 0.07], mw: [0.07, 0.15], ft: [0.15, 0.38], ww: [0.38, 0.45], bs: [0.45, 1.00]};

// Exterior mappings organized by marketplace
export const exteriorMappings = {
    // Labels - common across all marketplaces
    labels: {fn: "Factory New", mw: "Minimal Wear", ft: "Field-Tested", ww: "Well-Worn", bs: "Battle-Scarred"},
    
    // Default/generic exterior IDs
    default: {fn: 1, mw: 2, ft: 3, ww: 4, bs: 5},
    
    // Marketplace-specific exterior mappings
    skinport: {fn: 2, mw: 4, ft: 3, ww: 5, bs: 1},
    lisskins: {fn: 2, mw: 4, ft: 3, ww: 6, bs: 1},
    buffmarket: {fn: "WearCategory0", mw: "WearCategory1", ft: "WearCategory2", ww: "WearCategory3", bs: "WearCategory4"},
    skinbid: {fn: "FactoryNew", mw: "MinimalWear", ft: "FieldTested", ww: "WellWorn", bs: "BattleScarred"},
    whitemarket: {fn: 'e0', mw: 'e1', ft: 'e2', ww: 'e3', bs: 'e4'},
    cs7market: {fn: 'FN', mw: 'MW', ft: 'FT', ww: 'WW', bs: 'BS'},

    // URL-formatted exterior mappings (lowercase with dashes)
    urlFormatted: {fn: 'factory-new', mw: 'minimal-wear', ft: 'field-tested', ww: 'well-worn', bs: 'battle-scarred'},
    
    // URL-formatted exterior mappings (with plus signs)
    urlFormattedPlus: {fn: 'Factory+New', mw: 'Minimal+Wear', ft: 'Field-Tested', ww: 'Well-Worn', bs: 'Battle-Scarred'},
    };

// Legacy exports for backward compatibility (get rid of these when possible)
export const exteriorLabelMap = exteriorMappings.labels;
export const exteriorIdMap = exteriorMappings.default;
export const spExteriorIdMap = exteriorMappings.skinport;
export const lisSkinsExteriorIdMap = exteriorMappings.lisskins;
export const wearCategoryMap = exteriorMappings.buffmarket;
export const skinbidWearMap = exteriorMappings.skinbid;
export const whitemarketExteriorMap = exteriorMappings.whitemarket;
export const phaseMappings = {
    skinport: { "Phase 1": 2, "Phase 2": 3, "Phase 3": 4, "Phase 4": 5, "Sapphire": 6, "Ruby": 7, "Black Pearl": 8, "Emerald": 9 },
    bitskins: { "Phase 1": 1, "Phase 2": 2, "Phase 3": 3, "Phase 4": 4, "Sapphire": 6, "Ruby": 5, "Black Pearl": 7, "Emerald": 8 },
    whitemarket: { "Phase 1": "PHASE1", "Phase 2": "PHASE2", "Phase 3": "PHASE3", "Phase 4": "PHASE4", "Sapphire": "SAPPHIRE", "Ruby": "RUBY", "Black Pearl": "BLACK_PEARL", "Emerald": "EMERALD" },
    waxpeer: { "Phase 1": "p1", "Phase 2": "p2", "Phase 3": "p3", "Phase 4": "p4", "Sapphire": "sh", "Ruby": "rb", "Black Pearl": "bp", "Emerald": "em" },
    dmarket: { "Phase 1": "phase-1", "Phase 2": "phase-2", "Phase 3": "phase-3", "Phase 4": "phase-4", "Sapphire": "sapphire", "Ruby": "ruby", "Black Pearl": "black-pearl", "Emerald": "emerald" },
    shadowpay: { "Phase 1": "+(Phase+1)", "Phase 2": "+(Phase+2)", "Phase 3": "+(Phase+3)", "Phase 4": "+(Phase+4)", "Sapphire": "+(Sapphire)", "Ruby": "+(Ruby)", "Black Pearl": "+(Black+Pearl)", "Emerald": "+(Emerald)" },
    gamerpay: { "Phase 1": "Phase+1", "Phase 2": "Phase+2", "Phase 3": "Phase+3", "Phase 4": "Phase+4", "Sapphire": "Sapphire", "Ruby": "Ruby", "Black Pearl": "Black+Pearl", "Emerald": "Emerald" },
    skinbid: {
        "Doppler": { "Phase 1": "Doppler,Phase%201", "Phase 2": "Doppler,Phase%202", "Phase 3": "Doppler,Phase%203", "Phase 4": "Doppler,Phase%204", "Sapphire": "Doppler,Sapphire", "Ruby": "Doppler,Ruby", "Black Pearl": "Doppler,Black%20Pearl" },
        "Gamma Doppler": { "Phase 1": "Gamma,Phase%201", "Phase 2": "Gamma,Phase%202", "Phase 3": "Gamma,Phase%203", "Phase 4": "Gamma,Phase%204", "Emerald": "Gamma,Emerald" }
    },
    csgo: { "Phase 1": "phase1", "Phase 2": "phase2", "Phase 3": "phase3", "Phase 4": "phase4", "Sapphire": "sapphire", "Ruby": "ruby", "Black Pearl": "blackpearl", "Emerald": "emerald" },
    lisskins: { "Phase 1": 1, "Phase 2": 2, "Phase 3": 3, "Phase 4": 4, "Sapphire": 6, "Ruby": 7, "Black Pearl": 8, "Emerald": 5 },
    skinout: { "Phase 1": "Phase+1", "Phase 2": "Phase+2", "Phase 3": "Phase+3", "Phase 4": "Phase+4", "Sapphire": "Sapphire", "Ruby": "Ruby", "Black Pearl": "Black+Pearl", "Emerald": "Emerald" },
    avanmarket: { "Phase 1": "Phase+1", "Phase 2": "Phase+2", "Phase 3": "Phase+3", "Phase 4": "Phase+4", "Sapphire": "Sapphire", "Ruby": "Ruby", "Black Pearl": "Black+Pearl", "Emerald": "Emerald" },
    cs7market: { "Phase 1": "phase+1", "Phase 2": "phase+2", "Phase 3": "phase+3", "Phase 4": "phase+4", "Ruby": "ruby", "Sapphire": "sapphire", "Black Pearl": "black+pearl", "Emerald": "emerald" }
};

// Persistence Keys
export const STORAGE_KEY = 'skinScannerState';
export const DARK_MODE_KEY = 'darkModePreference';
export const RECENT_SEARCHES_KEY = 'recentSearches';
export const TAB_DELAY_KEY = 'tabDelayPreference';

// UTM
export const UTM_SOURCE = 'skinscanner';
export const UTM_MEDIUM = 'extension';
export const UTM_CAMPAIGN = 'search';

// Tab Delay
export const TAB_OPEN_DELAY = 250;

// Special Item Type Identification
export const SPECIAL_ITEM_PREFIXES = [
    "Sticker |",
    "Patch |",
    "Charm |",
    "Music Kit |"
];

export const SPECIAL_ITEM_SUFFIXES = [
    " Pin",
    " Case",
    " Capsule",
    " Package",
    " Patch Pack",
    " Music Kit Box"
];

export const SPECIAL_ITEM_INCLUSIONS = [
    " Sticker Capsule ",
    " Graffiti Box",
    "Autograph Capsule",
    " Challengers",
    " Contenders",
    " Legends"
];

export function isSpecialItemType(itemName) {
    if (!itemName || typeof itemName !== 'string') {
        return false;
    }
    // Check prefixes
    for (const prefix of SPECIAL_ITEM_PREFIXES) {
        if (itemName.startsWith(prefix)) {
            return true;
        }
    }
    // Check suffixes
    for (const suffix of SPECIAL_ITEM_SUFFIXES) {
        if (itemName.endsWith(suffix)) {
            return true;
        }
    }
    // Check inclusions
    for (const inclusion of SPECIAL_ITEM_INCLUSIONS) {
        if (itemName.includes(inclusion)) {
            return true;
        }
    }
    return false;
}