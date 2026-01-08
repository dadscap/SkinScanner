// URL Presets
export const exteriorPresets = {
    fn: [0.00, 0.07], mw: [0.07, 0.15], ft: [0.15, 0.38], ww: [0.38, 0.45], bs: [0.45, 1.00]
};

// Exterior mappings organized by marketplace
export const exteriorMappings = {
    labels: {fn: "Factory New", mw: "Minimal Wear", ft: "Field-Tested", ww: "Well-Worn", bs: "Battle-Scarred"},
    default: {fn: 1, mw: 2, ft: 3, ww: 4, bs: 5},
    wearCategory: {fn: "WearCategory0", mw: "WearCategory1", ft: "WearCategory2", ww: "WearCategory3", bs: "WearCategory4"},
    skinport: {fn: 2, mw: 4, ft: 3, ww: 5, bs: 1},
    lisskins: {fn: 2, mw: 4, ft: 3, ww: 6, bs: 1},
    whitemarket: {fn: 'e0', mw: 'e1', ft: 'e2', ww: 'e3', bs: 'e4'},
    urlFormatted: {fn: 'factory-new', mw: 'minimal-wear', ft: 'field-tested', ww: 'well-worn', bs: 'battle-scarred'},
    urlFormattedPlus: {fn: 'Factory+New', mw: 'Minimal+Wear', ft: 'Field-Tested', ww: 'Well-Worn', bs: 'Battle-Scarred'},
};

export const phaseMappings = {
    avanmarket: { "Phase 1": "Phase+1", "Phase 2": "Phase+2", "Phase 3": "Phase+3", "Phase 4": "Phase+4", "Sapphire": "Sapphire", "Ruby": "Ruby", "Black Pearl": "Black+Pearl", "Emerald": "Emerald" },
    bitskins: { "Phase 1": 1, "Phase 2": 2, "Phase 3": 3, "Phase 4": 4, "Sapphire": 6, "Ruby": 5, "Black Pearl": 7, "Emerald": 8 },
    c5game: { "Phase 1": 11, "Phase 2": 12, "Phase 3": 13, "Phase 4": 14, "Sapphire": 33, "Ruby": 31, "Black Pearl": 34, "Emerald": 32 },
    csgo: { "Phase 1": "phase1", "Phase 2": "phase2", "Phase 3": "phase3", "Phase 4": "phase4", "Sapphire": "sapphire", "Ruby": "ruby", "Black Pearl": "blackpearl", "Emerald": "emerald" },    
    dmarket: { "Phase 1": "phase-1", "Phase 2": "phase-2", "Phase 3": "phase-3", "Phase 4": "phase-4", "Sapphire": "sapphire", "Ruby": "ruby", "Black Pearl": "black-pearl", "Emerald": "emerald" },    
    gamerpay: { "Phase 1": "Phase+1", "Phase 2": "Phase+2", "Phase 3": "Phase+3", "Phase 4": "Phase+4", "Sapphire": "Sapphire", "Ruby": "Ruby", "Black Pearl": "Black+Pearl", "Emerald": "Emerald" },
    lisskins: { "Phase 1": 1, "Phase 2": 2, "Phase 3": 3, "Phase 4": 4, "Sapphire": 6, "Ruby": 7, "Black Pearl": 8, "Emerald": 5 },
    shadowpay: { "Phase 1": "+(Phase+1)", "Phase 2": "+(Phase+2)", "Phase 3": "+(Phase+3)", "Phase 4": "+(Phase+4)", "Sapphire": "+(Sapphire)", "Ruby": "+(Ruby)", "Black Pearl": "+(Black+Pearl)", "Emerald": "+(Emerald)" },    
    skinout: { "Phase 1": "Phase+1", "Phase 2": "Phase+2", "Phase 3": "Phase+3", "Phase 4": "Phase+4", "Sapphire": "Sapphire", "Ruby": "Ruby", "Black Pearl": "Black+Pearl", "Emerald": "Emerald" },
    skinport: { "Phase 1": 2, "Phase 2": 3, "Phase 3": 4, "Phase 4": 5, "Sapphire": 6, "Ruby": 7, "Black Pearl": 8, "Emerald": 9 },    
    waxpeer: { "Phase 1": "p1", "Phase 2": "p2", "Phase 3": "p3", "Phase 4": "p4", "Sapphire": "sh", "Ruby": "rb", "Black Pearl": "bp", "Emerald": "em" },    
    whitemarket: { "Phase 1": "PHASE1", "Phase 2": "PHASE2", "Phase 3": "PHASE3", "Phase 4": "PHASE4", "Sapphire": "SAPPHIRE", "Ruby": "RUBY", "Black Pearl": "BLACK_PEARL", "Emerald": "EMERALD" }
};

// Persistence Keys
export const STORAGE_KEY = 'skinScannerState';
export const DARK_MODE_KEY = 'darkModePreference';
export const RECENT_SEARCHES_KEY = 'recentSearches';
export const TAB_DELAY_KEY = 'tabDelayPreference';
export const WELCOME_SEEN_KEY = 'skinscanner_has_seen_welcome';

// UTM
export const UTM_SOURCE = 'skinscanner-ext';

// Tab Delay
export const TAB_OPEN_DELAY = 250;

// Enhanced Item Type Categorization System
export const ITEM_CATEGORIES = {
    WEAPON: 'weapon',
    KNIFE: 'knife',
    GLOVE: 'glove',
    MUSIC_KIT: 'music_kit',
    SPECIAL: 'special'
};

// Weapon type identifiers (guns)
export const WEAPON_IDENTIFIERS = [
    // Rifles
    'AK-47', 'M4A4', 'M4A1-S', 'AWP', 'AUG', 'FAMAS', 'Galil AR', 'SG 553', 'SCAR-20', 'G3SG1',
    // SMGs
    'P90', 'MP7', 'MP9', 'MP5-SD', 'UMP-45', 'PP-Bizon', 'MAC-10',
    // Pistols
    'Glock-18', 'USP-S', 'P2000', 'Desert Eagle', 'Five-SeveN', 'Tec-9', 'CZ75-Auto', 'P250', 'Dual Berettas', 'R8 Revolver',
    // Shotguns
    'Nova', 'XM1014', 'Sawed-Off', 'MAG-7',
    // Machine Guns
    'M249', 'Negev'
];

// Knife identifiers
export const KNIFE_IDENTIFIERS = [
    'Bayonet', 'M9 Bayonet', 'Karambit', 'Huntsman Knife', 'Flip Knife', 'Gut Knife', 'Falchion Knife',
    'Bowie Knife', 'Shadow Daggers', 'Butterfly Knife', 'Navaja Knife', 'Stiletto Knife', 'Talon Knife',
    'Ursus Knife', 'Classic Knife', 'Paracord Knife', 'Survival Knife', 'Nomad Knife', 'Skeleton Knife'
];

// Glove identifiers
export const GLOVE_IDENTIFIERS = [
    'Hand Wraps', 'Moto Gloves', 'Specialist Gloves', 'Sport Gloves', 'Driver Gloves',
    'Bloodhound Gloves', 'Hydra Gloves', 'Broken Fang Gloves'
];

// Music Kit identifiers
export const MUSIC_KIT_PREFIXES = [
    "Music Kit |"
];

// Agent identifiers
export const AGENT_IDENTIFIERS = [
    "| Elite Crew",
    "| Guerrilla Warfare",
    "| Phoenix",
    "| Sabre",
    "| SWAT",
    "| The Professionals",
    "| SAS",
    "| FBI",
    "| NZSAS",
    "| KSK",
    "| Brazilian 1st Battalion",
    "| Gendarmerie Nationale",
    " TACP",
    " SEAL"
];

// Special item identifiers
export const SPECIAL_ITEM_PREFIXES = [
    "Sticker |",
    "Patch |",
    "Charm |"
];
export const SPECIAL_ITEM_SUFFIXES = [
    " Pin",
    " Case",
    " Capsule",
    " Package",
    " Patch Pack",
    " Music Kit Box",
    " Graffiti"
];
export const SPECIAL_ITEM_INCLUSIONS = [
    " Sticker Capsule ",
    " Graffiti Box",
    "Autograph Capsule",
    " Challengers",
    " Contenders",
    " Legends",
    "Operation "
];

/**
 * Determines the category of an item based on its name
 * @param {string} itemName - The name of the item
 * @returns {string} The item category (WEAPON, GLOVE, MUSIC_KIT, or SPECIAL)
 */
export function getItemCategory(itemName) {
    if (!itemName || typeof itemName !== 'string') {
        return ITEM_CATEGORIES.SPECIAL;
    }

    const cleanName = itemName.replace(/StatTrak™\s+/, ''); // Remove StatTrak prefix for analysis

    // Check for Music Kits first
    for (const prefix of MUSIC_KIT_PREFIXES) {
        if (cleanName.startsWith(prefix)) {
            return ITEM_CATEGORIES.MUSIC_KIT;
        }
    }

    // Check for Special items
    for (const prefix of SPECIAL_ITEM_PREFIXES) {
        if (cleanName.startsWith(prefix)) {
            return ITEM_CATEGORIES.SPECIAL;
        }
    }

    for (const suffix of SPECIAL_ITEM_SUFFIXES) {
        if (cleanName.endsWith(suffix)) {
            return ITEM_CATEGORIES.SPECIAL;
        }
    }

    for (const inclusion of SPECIAL_ITEM_INCLUSIONS) {
        if (cleanName.includes(inclusion)) {
            return ITEM_CATEGORIES.SPECIAL;
        }
    }

    // Check for Agents (exact string matches anywhere in the name)
    for (const agentIdentifier of AGENT_IDENTIFIERS) {
        if (cleanName.includes(agentIdentifier)) {
            return ITEM_CATEGORIES.SPECIAL;
        }
    }

    /*  
     Idj why but uncommenting this breaks everything. to figure out one day in the future 
    for (const knifeType of KNIFE_IDENTIFIERS) {
        if (cleanName.includes(knifeType)) {
            return ITEM_CATEGORIES.KNIFE;
        }
    }
    */

    // Check for Gloves
    for (const gloveType of GLOVE_IDENTIFIERS) {
        if (cleanName.includes(gloveType)) {
            return ITEM_CATEGORIES.GLOVE;
        }
    }

    // Check for Weapons
    for (const weaponType of WEAPON_IDENTIFIERS) {
        if (cleanName.includes(weaponType)) {
            return ITEM_CATEGORIES.WEAPON;
        }
    }

    // Default to weapon if no other category matches
    return ITEM_CATEGORIES.WEAPON;
}

/**
 * Determines if an item can have StatTrak
 * @param {string} itemName - The name of the item
 * @returns {boolean} True if the item can have StatTrak
 */
export function canHaveStatTrak(itemName) {
    const category = getItemCategory(itemName);
    return category === ITEM_CATEGORIES.WEAPON || category === ITEM_CATEGORIES.MUSIC_KIT;
}

/**
 * Determines if an item can have float/exterior values
 * @param {string} itemName - The name of the item
 * @returns {boolean} True if the item can have float/exterior values
 */
export function canHaveFloat(itemName) {
    const category = getItemCategory(itemName);
    return category === ITEM_CATEGORIES.WEAPON || category === ITEM_CATEGORIES.GLOVE;
}

/**
 * Determines if an item can have paint seed/pattern values
 * @param {string} itemName - The name of the item
 * @returns {boolean} True if the item can have paint seed/pattern values
 */
export function canHavePaintSeed(itemName) {
    const category = getItemCategory(itemName);
    return category === ITEM_CATEGORIES.WEAPON || category === ITEM_CATEGORIES.GLOVE;
}
