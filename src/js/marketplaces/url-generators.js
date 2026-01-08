/* MarketplaceURLs 
 * Generates marketplace URLs based on user input and selected parameters.
 */
import {
    phaseMappings, exteriorMappings, getItemCategory, ITEM_CATEGORIES
} from '../config/constants.js';
import { addUtmParams, ShadowPayUtmParams } from '../utils/url-helpers.js';

export class MarketplaceURLs {

    // Avanmarket
    static generateAvanmarket(params, _mappings) {
        const { encodedBaseSearchName, minFloat, maxFloat, isStatTrak, phaseName, isVanillaSearch, fullInput } = params;
        let url = `https://avan.market/en/market/cs?name=${encodedBaseSearchName}&r=dadscap&sort=1`;
        // Special handling for special items like stickers, patches, charms, etc.
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            // Special items bypass all float/wear/phase logic entirely
            return addUtmParams(url);
        }
        // Vanilla knives don't have float values, so float params are only added for non-vanilla items
        if (!isVanillaSearch) {
            url += `&float_min=${minFloat}&float_max=${maxFloat}`;
        }
        // If the exterior is defined, we can use the exteriorIdMap to get the correct ID
        url += (isStatTrak ? '&special=StatTrak™' : '');
        if (!isVanillaSearch && phaseName && phaseMappings.avanmarket?.[phaseName]) {
            // If the phaseName is defined and exists in phaseMappings for Avanmarket, we can add it to the URL
            url += `&phase=${phaseMappings.avanmarket[phaseName]}`;
        }
        return addUtmParams(url);
    }

    // Bitskins
    static generateBitskins(params, _mappings) {
        const { finalSearchName, minFloat, maxFloat, isVanillaSearch, exterior, noTradeHold, paintSeed, phaseName, fullInput } = params;
        // For special items like stickers, patches, charms, etc., we just use the finalSearchName directly
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            const baseUrl = `https://bitskins.com/market/cs2?search=${encodeURIComponent(JSON.stringify({
                order: [{ field: "price", order: "ASC" }],
                where: { skin_name: finalSearchName }
            }))}&ref_alias=dadscap`;
            return addUtmParams(baseUrl);
        }
        const currentExteriorId = exteriorMappings.default[exterior];
        // Bitskins uses JSON search queries with complex where clauses
        let whereClause = {
            skin_name: finalSearchName,
            // Vanilla items have a special exterior_id of 6
            ...(isVanillaSearch ? { "exterior_id": [6] } : {
                float_value_from: minFloat,
                float_value_to: maxFloat,
                ...(exterior ? { exterior_id: [currentExteriorId] } : {})
            }),
            // Trade hold filtering uses tradehold_to: 0 for instant trades
            ...(noTradeHold ? { tradehold_to: 0 } : {}),
            // Paint seed (pattern) is passed as an array
            ...(paintSeed !== null ? { "paint_seed": [paintSeed] } : {})
        };
        // If the phaseName is defined and exists in phaseMappings for Bitskins, we can add it to the whereClause
        if (!isVanillaSearch && phaseName && phaseMappings.bitskins?.[phaseName]) {
            whereClause["phase_id"] = [phaseMappings.bitskins[phaseName]];
        }
        // Construct the base URL with the search parameters
        const baseUrl = `https://bitskins.com/market/cs2?search=${encodeURIComponent(JSON.stringify({
            order: [{ field: "price", order: "ASC" }],
            where: whereClause
        }))}&ref_alias=dadscap`;
        return addUtmParams(baseUrl);
    }

    // Buff163
    static generateBuff(params, mappings) {
        const {isVanillaSearch, encodedBaseSearchName, isStatTrak, exterior, phaseName, baseSearchName, fullInput, paintSeed, minFloat, maxFloat} = params;
        const { buffMap } = mappings || {};
        // For special items (agents, stickers, etc.), try mapping first, then fallback to search
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            // Try to find a direct mapping for the item
            let itemData = buffMap ? buffMap[fullInput] : null;
            // If direct lookup fails, try fuzzy matching by normalizing keys
            if (!itemData && buffMap) {
                // Normalize the input key for comparison
                const normalizedInput = fullInput
                    .replace(/^★\s*/, '')     // Remove star prefix
                    .replace(/['"]/g, "'")  // Standardize quote characters
                    .replace(/\s+/g, ' ')   // Normalize whitespace
                    .trim();
                // Find a key in buffMap that matches when normalized
                for (const [key, value] of Object.entries(buffMap)) {
                    const normalizedKey = key
                        .replace(/^★\s*/, '')     // Remove star prefix
                        .replace(/['"]/g, "'")  // Standardize quote characters
                        .replace(/\s+/g, ' ')   // Normalize whitespace
                        .trim();
                    if (normalizedInput === normalizedKey) {
                        itemData = value;
                        break;
                    }
                }
                // Additional fallback: try exact match with original input
                if (!itemData) {
                    itemData = buffMap[fullInput];
                }
                // Debug logging to help diagnose mapping issues
                if (!itemData) {
                    console.log(`Buff163: Could not find mapping for "${fullInput}". Available keys:`, Object.keys(buffMap).slice(0, 10) + '...');
                }
            }
            // Determine goods ID from various possible fields in mapping:
            // 1) goods_id (direct mapping for specials)
            // 2) vanilla / st_vanilla (re-using vanilla style mappings for specials)
            let goodsId = null;
            if (itemData) {
                if (itemData.goods_id) {
                    goodsId = itemData.goods_id;
                } else if (isStatTrak && itemData.st_vanilla) {
                    goodsId = itemData.st_vanilla;
                } else if (!isStatTrak && itemData.vanilla) {
                    goodsId = itemData.vanilla;
                }
            }
            if (goodsId !== null) {
                const url = `https://buff.163.com/goods/${goodsId}?from=market`;
                return addUtmParams(url);
            }
            // Fallback to search URL
            let searchUrl = `https://buff.163.com/market/csgo#game=csgo&page_num=1&search=${encodedBaseSearchName}`;
            searchUrl += (isStatTrak ? `&category=tag_weapon_stat` : '');
            return addUtmParams(searchUrl);
        }
        // If it's a vanilla knife search, we need to handle it differently
        if (isVanillaSearch) {
            // BUFF163 uses direct goods IDs for efficiency when available
            let buffGoodId = null;
            if (fullInput.includes(' | Vanilla')) {
                const knifeName = fullInput.replace(' | Vanilla', '');
                if (buffMap) {
                    const buffItemData = buffMap[knifeName];
                    if (buffItemData) {
                        // Separate goods IDs for StatTrak vs non-StatTrak vanilla items
                        if (isStatTrak && buffItemData['st_vanilla']) {
                            buffGoodId = buffItemData['st_vanilla'];
                        } else if (!isStatTrak && buffItemData['vanilla']) {
                            buffGoodId = buffItemData['vanilla'];
                        }
                    }
                }
            }
            if (buffGoodId !== null) {
                // Direct goods URL is much more efficient than search
                let baseUrl = `https://buff.163.com/goods/${buffGoodId}?from=market`;
                return addUtmParams(baseUrl);
            } else {
                // Fallback uses 'wearcategoryna' for vanilla (Not Applicable wear)
                let vanillaUrl = `https://buff.163.com/market/csgo#game=csgo&page_num=1&category_group=knife&search=${encodedBaseSearchName}&exterior=wearcategoryna`;
                if (isStatTrak) {
                    vanillaUrl += `&category=tag_weapon_stat`;
                }
                vanillaUrl += '&tab=selling';
                return addUtmParams(vanillaUrl);
            }
        }
        // For non-vanilla searches, we need to find the buffGoodId based on exterior and phase (if Doppler)
        let buffGoodId = null;
        let phaseTagId = null;
        if (exterior && buffMap) {
            // Different lookup key for phase items (uses base name) vs regular items (uses full name)
            const buffMapLookupKey = phaseName ? `★ ${baseSearchName}` : fullInput;
            const buffItemData = buffMap[buffMapLookupKey];
            if (buffItemData) {
                // Key format includes 'st_' prefix for StatTrak items
                const buffIdKey = isStatTrak ? `st_${exterior}` : exterior;
                const exteriorData = buffItemData[buffIdKey];
                if (exteriorData) {
                    // Complex nested structure - exteriorData can be either:
                    // 1. A number (direct goods ID for non-phase items)
                    // 2. An object containing phase-specific IDs and a buff163_goods_id
                    if (phaseName && typeof exteriorData === 'object' && !Array.isArray(exteriorData) && exteriorData !== null) {
                        if (exteriorData[phaseName]) {
                            // Phase tag ID is separate from goods ID
                            phaseTagId = exteriorData[phaseName];
                        }
                        if (exteriorData["buff163_goods_id"]) {
                            buffGoodId = exteriorData["buff163_goods_id"];
                        } else {
                            console.warn(`Buff163: Missing 'buff163_goods_id' for ${baseSearchName} - ${buffIdKey} (Phase: ${phaseName})`);
                        }
                    } else if (!phaseName && typeof exteriorData === 'number') {
                        // Direct number means it's the goods ID itself
                        buffGoodId = exteriorData;
                    } else if (!phaseName && typeof exteriorData === 'object' && exteriorData["buff163_goods_id"]) {
                        buffGoodId = exteriorData["buff163_goods_id"];
                    }
                } else {
                     console.warn(`Buff163: No exteriorData found for key '${buffIdKey}' in item '${buffMapLookupKey}'`);
                }
            } else {
                console.log(`Buff163: Item key "${buffMapLookupKey}" not found in buffMap.`);
            }
        }
        // If we found buffGoodId, construct the URL with filters
        if (buffGoodId !== null) {
            let baseUrl = `https://buff.163.com/goods/${buffGoodId}?from=market#`;
            let fragmentParams = [];
            // BUFF163 uses URL fragment (#) for search params, not query params
            if (phaseTagId !== null) {
                fragmentParams.push(`tag_ids=${phaseTagId}`);
            }
            if (paintSeed !== null) {
                fragmentParams.push(`paintseed=${paintSeed}`);
            }
            // BUFF163 calls float values 'paintwear' instead of 'float'
            fragmentParams.push(`min_paintwear=${minFloat}`);
            fragmentParams.push(`max_paintwear=${maxFloat}`);
            baseUrl += fragmentParams.join('&');
            return addUtmParams(baseUrl);
        } else {
            // If we didn't find buffGoodId, fallback to the general search URL
            console.log("Buff163: Falling back to general search URL (non-vanilla).");
            let searchUrl = `https://buff.163.com/market/csgo#game=csgo&page_num=1&search=${encodedBaseSearchName}`;
            searchUrl += (isStatTrak ? `&category=tag_weapon_stat` : '');
            // Add exterior filter if specified
            const searchExteriorFilter = exteriorMappings.wearCategory[exterior];
            searchUrl += (searchExteriorFilter ? `&exterior=${searchExteriorFilter}` : "");
            if (paintSeed !== null) {
                searchUrl += `&paintseed=${paintSeed}`;
            }
            return addUtmParams(searchUrl);
        }
    }

    // Buff.Market
    static generateBuffmarket(params, mappings) {
        const {isVanillaSearch, encodedBaseSearchName, isStatTrak, exterior, phaseName, baseSearchName, fullInput, paintSeed, minFloat, maxFloat} = params;
        const { bMarketMap } = mappings || {};
        // For special items (agents, stickers, etc.), try mapping first, then fallback to search
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            // Try to find a direct mapping for the item
            let itemData = bMarketMap ? bMarketMap[fullInput] : null;
            // If direct lookup fails, try fuzzy matching by normalizing keys
            if (!itemData && bMarketMap) {
                // Normalize the input key for comparison
                const normalizedInput = fullInput
                    .replace(/^★\s*/, '')     // Remove star prefix
                    .replace(/['"]/g, "'")  // Standardize quote characters
                    .replace(/\s+/g, ' ')   // Normalize whitespace
                    .trim();
                // Find a key in bMarketMap that matches when normalized
                for (const [key, value] of Object.entries(bMarketMap)) {
                    const normalizedKey = key
                        .replace(/^★\s*/, '')     // Remove star prefix
                        .replace(/['"]/g, "'")  // Standardize quote characters
                        .replace(/\s+/g, ' ')   // Normalize whitespace
                        .trim();
                    if (normalizedInput === normalizedKey) {
                        itemData = value;
                        break;
                    }
                }
                // Additional fallback: try exact match with original input
                if (!itemData) {
                    itemData = bMarketMap[fullInput];
                }
                // Debug logging to help diagnose mapping issues
                if (!itemData) {
                    console.log(`Buff.Market: Could not find mapping for "${fullInput}". Available keys:`, Object.keys(bMarketMap).slice(0, 10) + '...');
                }
            }
            if (itemData && itemData.goods_id) {
                const url = `https://buff.market/market/goods/${itemData.goods_id}`;
                return addUtmParams(url);
            }
            // Fallback to search URL
            let searchUrl = `https://buff.market/market/all?search=${encodedBaseSearchName}`;
            searchUrl += (isStatTrak ? `&category=tag_weapon_stat` : '');
            return addUtmParams(searchUrl);
        }
        if (isVanillaSearch) {
            // Special handling for vanilla knives - try to find bMarketGoodId first
            let bMarketGoodId = null;
            if (bMarketMap) {
                // If the fullInput includes ' | Vanilla', we can use it directly
                const itemData = bMarketMap[baseSearchName];
                // If itemData exists, check for StatTrak or vanilla ID
                if (itemData) {
                    // If it's a StatTrak search, use the StatTrak ID
                    bMarketGoodId = isStatTrak ? itemData["st_vanilla"] : itemData["vanilla"];
                } else {
                    // If itemData doesn't exist, log a warning
                    console.warn(`Buff.Market: Item "${baseSearchName}" not found in bMarketMap for vanilla search.`);
                }
            }
            // If we found bMarketGoodId for vanilla knife, use it
            if (bMarketGoodId) {
                const url = `https://buff.market/market/goods/${bMarketGoodId}`;
                return addUtmParams(url);
            } else {
                // Fallback to original vanilla search, i.e. return the URL for the general knife search
                let vanillaUrl = `https://buff.market/market/all?search=${encodedBaseSearchName}`;
                if (isStatTrak) {
                    vanillaUrl += `&category=tag_weapon_stat`;
                }
                vanillaUrl += '&tab=selling';
                return addUtmParams(vanillaUrl);
            }
        }
        // For non-vanilla searches, we need to find the bMarketGoodId in bMarketMap (defined in constants.js) based on exterior and phase (if Doppler)
        let bMarketGoodId = null;
        let phaseTagId = null;
        // Check if exterior is defined and bMarketMap exists
        if (exterior && bMarketMap) {
            const bMarketMapLookupKey = phaseName ? `★ ${baseSearchName}` : fullInput;
            const bMarketItemData = bMarketMap[bMarketMapLookupKey];
            // Check if bMarketItemData exists for the given key
            if (bMarketItemData) {
                const bMarketIdKey = isStatTrak ? `st_${exterior}` : exterior;
                const exteriorData = bMarketItemData[bMarketIdKey];
                // Check if exteriorData exists for the given bMarketIdKey
                if (exteriorData) {
                    // If exteriorData is an object, it may contain phase-specific IDs
                    if (phaseName && typeof exteriorData === 'object' && !Array.isArray(exteriorData) && exteriorData !== null) {
                        // If phaseName exists, check if it has a specific ID
                        if (exteriorData[phaseName]) {
                            phaseTagId = exteriorData[phaseName];
                        }
                        // Check if bMarketGoodId exists in the exteriorData
                        if (exteriorData["bmarket_goods_id"]) {
                            bMarketGoodId = exteriorData["bmarket_goods_id"];
                        } else {
                            // If bMarketGoodId is missing, log a warning
                            console.warn(`Buff.Market: Missing 'bmarket_goods_id' for ${baseSearchName} - ${bMarketIdKey} (Phase: ${phaseName})`);
                        }
                    } else if (!phaseName && typeof exteriorData === 'number') {
                        bMarketGoodId = exteriorData;
                    } else if (!phaseName && typeof exteriorData === 'object' && exteriorData["bmarket_goods_id"]) {
                        bMarketGoodId = exteriorData["bmarket_goods_id"];
                    }
                } else {
                     console.warn(`Buff.Market: No exteriorData found for key '${bMarketIdKey}' in item '${bMarketMapLookupKey}'`);
                }
            } else {
                console.log(`Buff.Market: Item key "${bMarketMapLookupKey}" not found in bMarketMap.`);
            }
        }
        // If we found bMarketGoodId, construct the URL with filters
        if (bMarketGoodId !== null) {
            let baseUrl = `https://buff.market/market/goods/${bMarketGoodId}?tab=Sell&`;
            let fragmentParams = [];
            // Add phase tag ID based on the phase name selected by the user
            if (phaseTagId !== null) {
                fragmentParams.push(`tag_ids=${phaseTagId}`);
            }
            // Add paint seed if specified
            if (paintSeed !== null) {
                fragmentParams.push(`paintseed=${paintSeed}`);
            }
            // Add float wear parameters
            fragmentParams.push(`min_paintwear=${minFloat}`);
            fragmentParams.push(`max_paintwear=${maxFloat}`);
            baseUrl += fragmentParams.join('&');
            return addUtmParams(baseUrl);
        } else {
            // If we didn't find bMarketGoodId, fallback to the general search URL
            console.log("Buff.Market: Falling back to general search URL (non-vanilla).");
            let searchUrl = `https://buff.market/market/all?search=${encodedBaseSearchName}`;
            searchUrl += (isStatTrak ? `&category=tag_weapon_stat` : '');
            const searchExteriorFilter = exteriorMappings.wearCategory[exterior];
            searchUrl += (searchExteriorFilter ? `&exterior=${searchExteriorFilter}` : "");
            if (paintSeed !== null) {
                searchUrl += `&paintseed=${paintSeed}`;
            }
            return addUtmParams(searchUrl);
        }
    }

    // C5Game (chinese marketplace)
    static generateC5(params, mappings) {
        const { baseSearchName, fullInput, finalSearchName, encodedBaseSearchName, isStatTrak, exterior, isVanillaSearch, minFloat, maxFloat, paintSeed, phaseName } = params;
        const { c5Map } = mappings || {};
        // For special items (agents, stickers, etc.), try mapping first, then fallback to search
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            // Try to find a direct mapping for the item
            let id = c5Map ? c5Map[fullInput] : null;
            // If direct lookup fails, try fuzzy matching by normalizing keys
            if (!id && c5Map) {
                // Normalize the input key for comparison
                const normalizedInput = fullInput
                    .replace(/['"]/g, "'")  // Standardize quote characters
                    .replace(/\s+/g, ' ')   // Normalize whitespace
                    .trim();
                // Find a key in c5Map that matches when normalized
                for (const [key, value] of Object.entries(c5Map)) {
                    const normalizedKey = key
                        .replace(/['"]/g, "'")  // Standardize quote characters
                        .replace(/\s+/g, ' ')   // Normalize whitespace
                        .trim();
                    if (normalizedInput === normalizedKey) {
                        id = value;
                        break;
                    }
                }
            }
            if (id) {
                const encodedItemName = encodeURIComponent(fullInput);
                const url = `https://c5game.com/csgo/${id}/${encodedItemName}/sell`;
                return addUtmParams(url);
            }
            // Fallback to search URL
            let url = `https://c5game.com/csgo?keyword=${encodedBaseSearchName}`;
            url += (isStatTrak ? `&statTrak=1` : "");
            return addUtmParams(url);
        }
        const currentWearCategory = exteriorMappings.wearCategory[exterior];
        if (isVanillaSearch || exterior) {
            let key;
            let secondaryKey;
            if (isVanillaSearch) {
                // Special handling for vanilla knives - keep " | Vanilla" in the key
                if (fullInput.includes(' | Vanilla')) {
                    if (isStatTrak) {
                        // fullInput already contains ★, so we only need to add StatTrak™
                        key = fullInput.replace('★', '★ StatTrak™');
                    } else {
                        // Use fullInput directly (includes " | Vanilla")
                        key = fullInput;
                    }
                } else {
                    if (isStatTrak) {
                        key = finalSearchName;
                    } else {
                        key = fullInput;
                        secondaryKey = baseSearchName;
                    }
                }
            } else {
                // Special handling for Dopplers and Gamma Dopplers - ignore phase and use basic doppler ID
                const isKnife = fullInput.startsWith('★');
                const isDoppler = finalSearchName.includes('Doppler') && !finalSearchName.includes('Gamma');
                const isGammaDoppler = finalSearchName.includes('Gamma Doppler');
                const label = exteriorMappings.labels[exterior];
                if (isDoppler || isGammaDoppler) {
                    // Use base doppler name with exterior
                    key = `${isKnife ? '★ ' : ''}${isStatTrak ? 'StatTrak™ ' : ''}${baseSearchName}${label ? ` (${label})` : ''}`;
                } else {
                    key = `${isKnife ? '★ ' : ''}${isStatTrak ? 'StatTrak™ ' : ''}${baseSearchName}${label ? ` (${label})` : ''}`;
                }
            }
                // Look up the goodsId from c5Map
                let id = c5Map ? c5Map[key] : null;
                if (!id && secondaryKey && c5Map) {
                    id = c5Map[secondaryKey];
                }
            if (id) {
                // URL format: https://c5game.com/en/csgo/{id}/{encodedItemName}/sell
                const encodedItemName = encodeURIComponent(key);
                let url = `https://c5game.com/csgo/${id}/${encodedItemName}/sell?`;
                // Add float parameters
                if (!isVanillaSearch) {
                    url += `&minWear=${minFloat}&maxWear=${maxFloat}`;
                }
                // Add paint seed parameter
                if (paintSeed !== null && paintSeed !== undefined) {
                    url += `&paintSeed=${paintSeed}`;
                }
                // Handle Gamma/Doppler phases using the processed phaseName
                if (phaseName && phaseMappings.c5game?.[phaseName]) {
                    url += `&levelIds=${phaseMappings.c5game[phaseName]}`;
                }
                return addUtmParams(url);
            }
        }
        let url = `https://c5game.com/csgo?keyword=${encodedBaseSearchName}`;
        url += (isStatTrak ? `&statTrak=1` : "");
        url += (currentWearCategory ? `&exterior=${currentWearCategory}` : "");
        url += `&min_float=${minFloat}&max_float=${maxFloat}`;
        return addUtmParams(url);
    }

    // CS.Deals
    static generateCsdeals(params, _mappings) {
        const { phaseName, encodedFullInput, encodedBaseSearchName, isStatTrak, exterior, isVanillaSearch } = params;
        const currentExteriorLabel = exteriorMappings.wearCategory[exterior];
        let baseName;
        if (phaseName) {
            baseName = decodeURIComponent(encodedFullInput).replace(/\s*\(Phase\s*\d+\)/i, '');
        } else {
            baseName = decodeURIComponent(encodedBaseSearchName);
        }
        if (isStatTrak) {
            baseName = "StatTrak™ " + baseName;
        }
        const searchNameParam = encodeURIComponent(baseName);
        let url = `https://cs.deals/new/p2p?sort=price&sort_desc=0&name=${searchNameParam}&exact_match=1&ref=dadscap`;
        if (isVanillaSearch) {
            url += `&exterior=WearCategoryNA`;
        } else {
            url += (currentExteriorLabel ? `&exterior=${encodeURIComponent(currentExteriorLabel)}` : "");
        }
        return addUtmParams(url);
    }

    // CSFloat
    static generateCsfloat(params, mappings) {
        const { fullInput, baseSearchName, minFloat, maxFloat, noTradeHold, paintSeed, isStatTrak, isVanillaSearch } = params;
        const { skinMap } = mappings || {};
        let csfloatEntry = skinMap ? skinMap[fullInput] : null;
        if (!csfloatEntry && skinMap) {
            // Fuzzy matching fallback - normalizes and compares without phases/formatting
            const baseMatchKey = Object.keys(skinMap).find(k => {
                const normalizedKey = k.toLowerCase().replace(/[|\s]+/g, ' ').trim();
                const normalizedInput = baseSearchName.replace(/^StatTrak™\s*/i, '').toLowerCase().replace(/[|\s]+/g, ' ').trim();
                return normalizedKey === normalizedInput;
            });
            if (baseMatchKey) { csfloatEntry = skinMap[baseMatchKey]; }
        }
        if (!csfloatEntry) {
            // CSFloat requires exact mapping - returns null if item not found
            return null;
        }
        // CSFloat uses numeric categories (1=normal, 2=StatTrak)
        const category = isStatTrak ? 2 : 1;
        let urlParams = '';
        const itemName = fullInput;
        if (getItemCategory(itemName) === ITEM_CATEGORIES.SPECIAL) {
            // CSFloat uses different index types for different special items
            if (itemName.startsWith("Sticker |")) {
                urlParams = `sticker_index=${csfloatEntry.sticker_index}`;
            } else if (itemName.startsWith("Patch |")) {
                // Patches use sticker_index, not a separate patch_index
                urlParams = `sticker_index=${csfloatEntry.sticker_index}`;
            } else if (itemName.startsWith("Charm |")) {
                // Charms have their own keychain_index
                urlParams = `keychain_index=${csfloatEntry.keychain_index}`;
            } else if (itemName.startsWith("Music Kit |")) {
                urlParams = `music_kit_index=${csfloatEntry.music_kit_index}`;
            } else {
                urlParams = `def_index=${csfloatEntry.def_index}`;
            }
        } else if (csfloatEntry.paint_index === undefined || csfloatEntry.paint_index === null) {
            // Items without paint (like vanilla knives) only use def_index
            urlParams = `def_index=${csfloatEntry.def_index}`;
        } else {
            // Regular skins use both def_index (weapon type) and paint_index (skin)
            urlParams = `def_index=${csfloatEntry.def_index}&paint_index=${csfloatEntry.paint_index}`;
        }
        let url = `https://csfloat.com/search?${urlParams}`;
        // Filter params only apply to paintable items (identified by paint_index presence)
        if (urlParams.includes('paint_index')) {
            url += `&category=${category}`;
            if (!isVanillaSearch) {
                url += `&min_float=${minFloat}&max_float=${maxFloat}`;
            }
            // 'instant_sale_only' filters to P2P listings without trade hold
            url += (noTradeHold ? `&type=buy_now` : "");
            url += (paintSeed !== null ? `&paint_seed=${paintSeed}` : "");
        }
        return addUtmParams(url);
    }

    // CS.Money
    static generateCsmoney(params, _mappings) {
        const { phaseName, encodedFullInput, encodedBaseSearchName, baseSearchName, isVanillaSearch, minFloat, maxFloat, exterior, isStatTrak, paintSeed, fullInput } = params;
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            const searchNameParam = encodedBaseSearchName;
            let url = `https://cs.money/market/buy/?limit=60&offset=0&name=${searchNameParam}&order=asc&sort=price`;
            url += (isStatTrak ? `&isStatTrak=true` : "");
            return addUtmParams(url);
        }
        let searchNameParam;
        if (isVanillaSearch) {
            // CS.money requires ★ prefix for knife searches
            const knifeName = baseSearchName.startsWith('★') ? baseSearchName : `★ ${baseSearchName}`;
            searchNameParam = encodeURIComponent(knifeName);
        } else {
            // Phase items use full input name, others use base search name
            searchNameParam = phaseName ? encodedFullInput : encodedBaseSearchName;
        }
        let url = `https://cs.money/market/buy/?limit=60&offset=0&name=${searchNameParam}&order=asc&sort=price`;
        if (!isVanillaSearch) {
            url += `&minFloat=${minFloat}&maxFloat=${maxFloat}`;
            url += (exterior ? `&quality=${exterior}` : "");
        }
        url += (isStatTrak ? `&isStatTrak=true` : "");
        url += (paintSeed !== null ? `&pattern=${paintSeed}` : "");
        return addUtmParams(url);
    }

    // DMarket
    static generateDmarket(params, _mappings) {
        const { encodedBaseSearchName, minFloat, maxFloat, isVanillaSearch, isStatTrak, exterior, noTradeHold, paintSeed, phaseName, fullInput } = params;
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            let url = `https://dmarket.com/ingame-items/item-list/csgo-skins?title=${encodedBaseSearchName}`;
            if (isStatTrak) url += `&category_0=stattrak_tm`;
            url += `&ref=4iYenTCg2m&orderBy=price&orderDir=asc`;
            return addUtmParams(url);
        }
        const currentExteriorLabel = exteriorMappings.labels[exterior];
        let url = `https://dmarket.com/ingame-items/item-list/csgo-skins?title=${encodedBaseSearchName}`;
        if (isVanillaSearch) {
            // DMarket uses 'family=vanilla' for vanilla items
            url += `&family=vanilla`;
            if (isStatTrak) url += `&category_0=stattrak_tm`;
        } else {
            url += `&floatValueFrom=${minFloat}&floatValueTo=${maxFloat}`;
            // DMarket uses numbered category params (category_0, category_1, etc.)
            if (isStatTrak) url += `&category_0=stattrak_tm`;
            // Exterior labels must be lowercase for DMarket
            if (currentExteriorLabel) url += `&exterior=${encodeURIComponent(currentExteriorLabel.toLowerCase())}`;
        }
        url += (noTradeHold ? `&tradeLockTo=0` : "");
        url += (paintSeed !== null ? `&paintSeed=${paintSeed}` : "");
        if (!isVanillaSearch && phaseName && phaseMappings.dmarket?.[phaseName]) {
            url += `&phase=${phaseMappings.dmarket[phaseName]}`;
        }
        url += `&ref=4iYenTCg2m&orderBy=price&orderDir=asc`;
        return addUtmParams(url);
    }

    // Ecosteam
    static generateEcosteam(params, mappings) {
        const { fullInput, baseSearchName, isStatTrak, exterior, isVanillaSearch } = params;
        const { ecoMap } = mappings || {};
        // For special items (agents, stickers, etc.), try mapping first, then fallback to search
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            // Try to find a direct mapping for the item
            const goodsId = ecoMap ? ecoMap[fullInput] : null;
            if (goodsId) {
                const url = `https://www.ecosteam.cn/goods/730-${goodsId}-1-laypagesale-0-1.html`;
                return addUtmParams(url);
            }
            // Fallback to search URL
            let url = `https://www.ecosteam.cn/market/730-1.html?k=${encodeURIComponent(baseSearchName)}`;
            url += (isStatTrak ? `&isStatTrak=true` : "");
            return addUtmParams(url);
        }
        let key;
        let secondaryKey;
        if (isVanillaSearch) {
            if (isStatTrak) {
                key = fullInput.replace('★', '★ StatTrak™');
            } else {
                key = fullInput;
            }
        } else {
            const isKnife = fullInput.startsWith('★');
            const label = exteriorMappings.labels[exterior];
            key = `${isKnife ? '★ ' : ''}${isStatTrak ? 'StatTrak™ ' : ''}${baseSearchName}${label ? ` (${label})` : ''}`;
            secondaryKey = baseSearchName;
        }
        // Look up the goodsId from ecoMap
        let goodsId = ecoMap ? ecoMap[key] : null;
        if (!goodsId && secondaryKey && ecoMap) {
            goodsId = ecoMap[secondaryKey];
        }
        if (goodsId) {
            // Direct goods URL
            const url = `https://www.ecosteam.cn/goods/730-${goodsId}-1-laypagesale-0-1.html`;
            return addUtmParams(url);
        }
        // Fallback to search URL
        let url = `https://www.ecosteam.cn/market/730-1.html?k=${encodeURIComponent(baseSearchName)}`;
        url += (isStatTrak ? `&isStatTrak=true` : "");
        return addUtmParams(url);
    }

    // Gamerpay
    static generateGamerpay(params, _mappings) {
        const { encodedBaseSearchName, baseSearchName, isVanillaSearch, minFloat, maxFloat, isStatTrak, noTradeHold, exterior, paintSeed, phaseName, fullInput } = params;
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            let url = `https://gamerpay.gg/?query=${encodedBaseSearchName}&sortBy=price&ascending=true&page=1`;
            url += (isStatTrak ? `&statTrak=True` : "");
            return addUtmParams(url);
        }
        const currentExteriorLabel = exteriorMappings.labels[exterior];
        // Gamerpay expects "| Vanilla" suffix for vanilla searches in the query
        const queryName = isVanillaSearch ? encodeURIComponent(`${baseSearchName} | Vanilla`) : encodedBaseSearchName;
        let url = `https://gamerpay.gg/?query=${queryName}&sortBy=price&ascending=true&page=1`;
        if (!isVanillaSearch) {
            url += `&floatMin=${minFloat}&floatMax=${maxFloat}`;
            // Uses 'wear' parameter instead of 'exterior'
            url += (currentExteriorLabel ? `&wear=${currentExteriorLabel}` : "");
        }
        url += (isStatTrak ? `&statTrak=True` : "");
        url += (noTradeHold ? `&tradeLockedDays=0` : "");
        url += (paintSeed !== null ? `&pattern=${paintSeed}` : "");
        if (phaseName && phaseMappings.gamerpay?.[phaseName]) {
            url += `&phases=${phaseMappings.gamerpay[phaseName]}`;
        }
        return addUtmParams(url);
    }

    // Haloskins
    static generateHaloskins(params, mappings) {
        const { baseSearchName, fullInput, finalSearchName, encodedBaseSearchName, isStatTrak, exterior, isVanillaSearch, minFloat, maxFloat } = params;
        const { c5Map } = mappings || {};
        // For special items (agents, stickers, etc.), try mapping first, then fallback to search
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            // Try to find a direct mapping for the item
            let id = c5Map ? c5Map[fullInput] : null;
            // If direct lookup fails, try fuzzy matching by normalizing keys
            if (!id && c5Map) {
                // Normalize the input key for comparison
                const normalizedInput = fullInput
                    .replace(/^★\s*/, '')     // Remove star prefix
                    .replace(/['"]/g, "'")  // Standardize quote characters
                    .replace(/\s+(Phase\s*\d+|Ruby|Sapphire|Black Pearl|Emerald)$/i, '')  // Remove phase at end
                    .replace(/\s+/g, ' ')   // Normalize whitespace
                    .trim();
                // Find a key in c5Map that matches when normalized
                for (const [key, value] of Object.entries(c5Map)) {
                    const normalizedKey = key
                        .replace(/^★\s*/, '')     // Remove star prefix
                        .replace(/['"]/g, "'")  // Standardize quote characters
                        .replace(/\s+(Phase\s*\d+|Ruby|Sapphire|Black Pearl|Emerald)$/i, '')  // Remove phase at end
                        .replace(/\s+/g, ' ')   // Normalize whitespace
                        .trim();
                    if (normalizedInput === normalizedKey) {
                        id = value;
                        break;
                    }
                }
            }
            if (id) {
                const url = `https://haloskins.com/market/${id}`;
                return addUtmParams(url);
            }
            // Fallback to search URL
            let url = `https://haloskins.com/market?keyword=${encodedBaseSearchName}&sort=1`;
            url += (isStatTrak ? `&statTrak=1` : "");
            return addUtmParams(url);
        }
        const currentWearCategory = exteriorMappings.wearCategory[exterior];
        if (isVanillaSearch || (exterior && exterior !== 'Any')) {
            let key;
            let secondaryKey;
            if (isVanillaSearch) {
                // Special handling for vanilla knives - keep " | Vanilla" in the key
                if (fullInput.includes(' | Vanilla')) {
                    if (isStatTrak) {
                        // fullInput already contains ★, so we only need to add StatTrak™
                        key = fullInput.replace('★', '★ StatTrak™');
                    } else {
                        // Use fullInput directly (includes " | Vanilla")
                        key = fullInput;
                    }
                } else {
                    if (isStatTrak) {
                        key = finalSearchName;
                    } else {
                        key = fullInput;
                        // Secondary key fallback for flexible matching
                        secondaryKey = baseSearchName;
                    }
                }
            } else {
                const isKnife = fullInput.startsWith('★');
                const label = exteriorMappings.labels[exterior];
                key = `${isKnife ? '★ ' : ''}${isStatTrak ? 'StatTrak™ ' : ''}${baseSearchName}${label ? ` (${label})` : ''}`;
            }
            // Haloskins/C5 share the same ID mapping (c5Map)
            let id = c5Map ? c5Map[key] : null;
            if (!id && secondaryKey && c5Map) {
                id = c5Map[secondaryKey];
            }
            if (id) {
                // Direct market ID URL instead of search

                const url = `https://haloskins.com/market/${id}`;
                return addUtmParams(url);
            }
        }
        let url = `https://haloskins.com/market?keyword=${encodedBaseSearchName}&sort=1`;
        url += (isStatTrak ? `&statTrak=1` : "");
        url += (currentWearCategory ? `&exterior=${currentWearCategory}` : "");
        url += `&min_float=${minFloat}&max_float=${maxFloat}`;
        return addUtmParams(url);
    }

    // itrade.gg
    static generateItradegg(params, _mappings) {
        const { baseSearchName, finalSearchName, exterior, isVanillaSearch, isStatTrak, phaseName, fullInput } = params;
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            const formattedName = `${finalSearchName}`.replace(/\s+/g, '+').replace(/\+\|\+/g, '+|+');
            return addUtmParams(`https://itrade.gg/trade/csgo?search=${formattedName}&ref=dadscap`);
        }
        let searchName = finalSearchName.replace(/★\s*/g, '').replace(/StatTrak™\s*/g, '');
        if (isVanillaSearch) {
            let vanillaName = baseSearchName.replace(/★\s*/g, '').replace(/StatTrak™\s*/g, '');
            if (isStatTrak) {
                vanillaName = `StatTrak™ ★ ${vanillaName}`;
            } else {
                vanillaName = `★ ${vanillaName}`;
            }
            const formattedName = `${vanillaName}`.replace(/\s+/g, '+');
            return addUtmParams(`https://itrade.gg/trade/csgo?search=${formattedName}&ref=dadscap`);
        }
        const isKnifeOrGlove = searchName.includes('Knife') || searchName.includes('Gloves') || searchName.includes('Wraps');
        if (isKnifeOrGlove) {
            searchName = `★ ${searchName}`;
        }
        if (isStatTrak) {
            searchName = `StatTrak™ ${searchName}`;
        }
        if (phaseName) {
            if (phaseName.includes('Phase')) {
                searchName = searchName.replace(/\(Phase\s*\d+\)/i, phaseName);
            } else {
                // Non-Phase doppler types (Ruby, Sapphire) replace the phase pattern
                searchName = searchName.replace(/\(Phase\s*\d+\)/i, `(${phaseName})`);
            }
        }
        // Add exterior if specified
        if (exterior && exterior !== 'Any') {
            if (exteriorMappings.labels[exterior]) {
                searchName += ` (${exteriorMappings.labels[exterior]})`;
            }
        }
        // spaces become '+' but '|' becomes '+|+'
        const formattedName = `${searchName}`.replace(/\s+/g, '+').replace(/\+\|\+/g, '+|+');
        return addUtmParams(`https://itrade.gg/trade/csgo?search=${formattedName}&ref=dadscap`);
    }    

    // LisSkins
    static generateLisskins(params, _mappings) {
        const { encodedBaseSearchName, isStatTrak, minFloat, maxFloat, isVanillaSearch, exterior, noTradeHold, phaseName, fullInput } = params;
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            let url = `https://lis-skins.com/market/csgo/?sort_by=price_asc&query=${encodedBaseSearchName}`;
            url += (isStatTrak ? `&extras=is_stattrak` : "");
            url += `&rf=1878725`;
            return addUtmParams(url);
        }
        const currentLisSkinsExteriorId = exteriorMappings.lisskins[exterior];
        let url = `https://lis-skins.com/market/csgo/?sort_by=price_asc&query=${encodedBaseSearchName}`;
        url += (isStatTrak ? `&extras=is_stattrak` : "");
        if (isVanillaSearch) {
            // LisSkins uses exterior=5 specifically for vanilla items
            url += `&exterior=5`;
        } else {
            url += `&float_from=${minFloat}&float_to=${maxFloat}`;
            if (currentLisSkinsExteriorId) {
                url += `&exterior=${currentLisSkinsExteriorId}`;
            }
        }
        // hold=-1 means "no trade hold" (negative value for instant trades)
        url += (noTradeHold ? `&hold=-1` : "");
        if (!isVanillaSearch && phaseName && phaseMappings.lisskins?.[phaseName]) {
            url += `&phase=${phaseMappings.lisskins[phaseName]}`;
        }
        url += `&rf=1878725`;
        return addUtmParams(url);
    }

    // Mannco.store
    static generateMannco(params, _mappings) {
        const { baseSearchName, exterior, isStatTrak, encodedBaseSearchName, phaseName, isVanillaSearch, fullInput } = params;
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            let url = `https://mannco.store/cs2?&search=${encodedBaseSearchName}&page=1&price=ASC&ref=dadscap`;
            if (isStatTrak) url += `&stattrak=stattrak`;
            return addUtmParams(url);
        }
        const currentExteriorLabel = exteriorMappings.labels[exterior];
        if (!isVanillaSearch && exterior && exterior !== 'Any') {
            // Mannco uses URL slugs instead of search parameters
            let slug = baseSearchName
                .replace(/^★\s*/, '')
                .replace(/StatTrak™\s*/i, '')
                .replace(/\s*\|\s*/g, '-')
                .replace(/[()]/g, '')
                .replace(/\s+/g, '-')
                .toLowerCase();
            if (isStatTrak) slug = `stattrak-${slug}`;
            slug += `-${currentExteriorLabel.toLowerCase().replace(/\s+/g, '-')}`;
            if (phaseName) slug += `-${phaseName.replace(/\s+/g, '-')}`;
            // Uses game ID prefix (730 = CS:GO/CS2)
            const url = `https://mannco.store/item/730-${slug}/?ref=dadscap`;
            return addUtmParams(url);
        }
        let url = `https://mannco.store/cs2?&search=${encodedBaseSearchName}&page=1&price=ASC&ref=dadscap`;
        if (isStatTrak) url += `&stattrak=stattrak`;
        return addUtmParams(url);
    }

    // Market.CSGO
    static generateCsgo(params, _mappings) {
        const { encodedBaseSearchName, isStatTrak, isVanillaSearch, exterior, minFloat, maxFloat, phaseName, fullInput } = params;
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            let url = `https://market.csgo.com/en/?search=${encodedBaseSearchName}`;
            url += (isStatTrak ? `&categories=StatTrak™` : '');
            url += '&sort=price&order=asc';
            // Market.csgo includes extensive UTM tracking parameters
            return url + '&utm_campaign=newcampaign&utm_source=SkinScanner&cpid=28e643b6-8c56-4212-b09c-ba3cabec7d7a&oid=4c69d079-ad2a-44b0-a9ac-d0afc2167ee7';
        }
        const currentExteriorLabel = exteriorMappings.labels[exterior];
        let url = `https://market.csgo.com/en/?search=${encodedBaseSearchName}`;
        url += (isStatTrak ? `&categories=StatTrak™` : '');
        if (isVanillaSearch) {
            // Vanilla items use 'Not Painted' quality designation
            url += `&quality=Not%20Painted`;
        } else if (currentExteriorLabel) {
            url += `&quality=${encodeURIComponent(currentExteriorLabel)}`;
        }
        if (!isVanillaSearch) {
            url += (parseFloat(minFloat) > 0 || parseFloat(maxFloat) < 1 ? `&floatMin=${minFloat}&floatMax=${maxFloat}` : '');
        }
        if (!isVanillaSearch && phaseName && phaseMappings.csgo?.[phaseName]) {
            url += `&phase=${phaseMappings.csgo[phaseName]}`;
        }
        url += '&sort=price&order=asc';
        return url + '&utm_campaign=newcampaign&utm_source=SkinScanner&cpid=28e643b6-8c56-4212-b09c-ba3cabec7d7a&oid=4c69d079-ad2a-44b0-a9ac-d0afc2167ee7';
    }

    // Pirateswap
    static generatePirateswap(params, mappings) {
        const { fullInput, baseSearchName, exterior, phaseName, isStatTrak, isVanillaSearch } = params;
        const { pirateMap } = mappings || {};
        // Build full market hash name with exterior (e.g., "AK-47 | Searing Rage (Factory New)")
        const exteriorLabel = exteriorMappings.labels[exterior];
        let marketHashName = baseSearchName;
        if (!isVanillaSearch && exteriorLabel) {
            marketHashName = `${baseSearchName} (${exteriorLabel})`;
        }
        const encodedMarketHashName = encodeURIComponent(marketHashName);

        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            let url = `https://pirateswap.com/?ref=dadscap&mhn=${encodedMarketHashName}`;
            return addUtmParams(url);
        }
        const key = baseSearchName;
        const pirateEntry = pirateMap?.[key];
        if (!pirateEntry) {
            console.log(`Pirateswap: No pirateEntry found for key: ${key}`);
            let url = `https://pirateswap.com/?ref=dadscap&mhn=${encodedMarketHashName}`;
            return addUtmParams(url);
        }
        // pirateMap uses keys like fn, mw, ft, ww, bs for regular items
        // and st_fn, st_mw, st_ft, st_ww, st_bs for StatTrak items
        const wearKey = isStatTrak ? `st_${exterior}` : exterior;
        let mhnc = pirateEntry[wearKey];
        // For Doppler items, mhnc is an object with phase names as keys
        if (phaseName && typeof mhnc === 'object') {
            mhnc = mhnc[phaseName];
        }
        if (!mhnc) {
            console.log(`Pirateswap: No mhnc found for key: ${key} with wearKey: ${wearKey} and phaseName: ${phaseName}`);
            let url = `https://pirateswap.com/?ref=dadscap&mhn=${encodedMarketHashName}`;
            return addUtmParams(url);
        }
        let url = `https://pirateswap.com/?ref=dadscap&mhn=${encodedMarketHashName}&mhnc=${mhnc}`;
        return addUtmParams(url);
    }

    // RapidSkins
    static generateRapidskins(params, _mappings) {
        const { fullInput, baseSearchName, exterior, isStatTrak, isVanillaSearch, noTradeHold, phaseName } = params;
        const category = getItemCategory(fullInput);
        const exteriorLabel = exteriorMappings.labels[exterior];
        // Convert spaces to '+' (RapidSkins expects literal '+' separators)
        const plus = (s) => (s || '').trim().replace(/\s+/g, '+');
        // Wrap final target in affiliate hash (tab-manager will decode and navigate)
        const wrap = (query) => `https://rapidskins.com/a/dadscap#rsredir=${encodeURIComponent(`https://www.rapidskins.com/buy?${query}`)}`;
        // Specials: use broad search
        if (category === ITEM_CATEGORIES.SPECIAL) {
            let query = `search=${plus(baseSearchName)}`;
            if (noTradeHold) query += `&maximumUnlockDays=0`;
            return wrap(query);
        }
        // Vanilla knives: exact name with proper prefix, ignore exterior
        const isVanillaByName = /\|\s*Vanilla/i.test(baseSearchName) || /\|\s*Vanilla/i.test(fullInput || '');
        // Also treat bare knife names (no "|") as vanilla even if category detection misclassifies
        const isVanillaKnifeNoSkin = !/\|/.test(baseSearchName) && /\b(knife|bayonet|karambit|butterfly|flip|gut|huntsman|bowie|falchion|stiletto|kukri|navaja|talon|ursus|paracord|survival|nomad|skeleton|classic|shadow\s*daggers|m9)\b/i.test(baseSearchName);
        if (isVanillaSearch || isVanillaByName || isVanillaKnifeNoSkin) {
            // Normalize: strip "| Vanilla" and any existing leading star to avoid duplicates
            const knifeName = baseSearchName.replace(/\s*\|\s*Vanilla/i, '').replace(/^★\s*/, '');
            const proper = isStatTrak ? `★ StatTrak™ ${knifeName}` : `★ ${knifeName}`;
            let query = `marketHashNames=${plus(proper)}`;
            if (noTradeHold) query += `&maximumUnlockDays=0`;
            return wrap(query);
        }
        // Name-based knife detection fallback ensures star prefix even if category lookup fails
        const knifeNameRegex = /\b(knife|bayonet|karambit|butterfly|flip|gut|huntsman|bowie|falchion|stiletto|kukri|navaja|talon|ursus|paracord|survival|nomad|skeleton|classic|shadow\s*daggers|m9)\b/i;
        const isKnife = (category === ITEM_CATEGORIES.KNIFE) || knifeNameRegex.test(baseSearchName);
        const isGlove = category === ITEM_CATEGORIES.GLOVE;
        const isWeapon = category === ITEM_CATEGORIES.WEAPON;
        // Broad search when no exterior selected (and not vanilla)
        const useSearch = (isKnife || isGlove || isWeapon) && !exteriorLabel && !isVanillaSearch && !(/\|\s*Vanilla/i.test(baseSearchName) || /\|\s*Vanilla/i.test(fullInput || ''));
        if (useSearch) {
            let query = `search=${plus(baseSearchName)}`;
            if (noTradeHold) query += `&maximumUnlockDays=0`;
            return wrap(query);
        }
        // Precise marketHashNames (prefix + exterior + phase)
        const star = (isKnife || isGlove) ? '★ ' : '';
        let prefix;
        if (isStatTrak) {
            prefix = isKnife ? '★ StatTrak™ ' : `StatTrak™ ${star}`;
        } else {
            prefix = star;
        }
        let properName = `${prefix}${baseSearchName}`;
        const isDopplerLike = /\bDoppler\b/i.test(baseSearchName);
        if (exteriorLabel) {
            properName += ` (${exteriorLabel})`;
            if (isDopplerLike && phaseName) {
                properName += ` - ${phaseName}`;
            }
        }
        let query = `marketHashNames=${plus(properName)}`;
        if (noTradeHold) query += `&maximumUnlockDays=0`;
        return wrap(query);
    }
    
    // ShadowPay
    static generateShadowpay(params, _mappings) {
        const { exterior, minFloat, maxFloat, encodedBaseSearchName, isVanillaSearch, phaseName, isStatTrak, fullInput } = params;
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            let url = `https://shadowpay.com/csgo-items?search=${encodedBaseSearchName}&sort_column=price&sort_dir=asc`;
            if (isStatTrak) url += `&is_stattrak=1`;
            url += `&utm_campaign=KzvAR2XJATjoT8y`;
            return ShadowPayUtmParams(url, 'shadowpay');
        }
        // Exterior labels are used for ShadowPay, not IDs
        const currentExteriorLabel = exteriorMappings.labels[exterior];
        // ShadowPay expects JSON array format for exteriors
        const wearLabelParam = currentExteriorLabel ? encodeURIComponent(`["${currentExteriorLabel}"]`) : "[]";
        // Float range as JSON object
        const floatRangeParam = encodeURIComponent(JSON.stringify({ from: minFloat, to: maxFloat }));
        let searchString = encodedBaseSearchName;
        if (!isVanillaSearch && phaseName && phaseMappings.shadowpay?.[phaseName]) {
            // Phase names are appended to search string, not as separate param
            searchString += phaseMappings.shadowpay[phaseName];
        }
        let url = `https://shadowpay.com/csgo-items?search=${searchString}&sort_column=price&sort_dir=asc`;
        if (isVanillaSearch) {
            url += `&vanilla_only=1`;
        } else {
            url += `&float=${floatRangeParam}`;
            if (exterior) url += `&exteriors=${wearLabelParam}`; // exterior is 'fn', 'mw'
        }
        if (isStatTrak) url += `&is_stattrak=1`;
        url += `&utm_campaign=KzvAR2XJATjoT8y`;
        return ShadowPayUtmParams(url, 'shadowpay');
    }

    // Skinbaron
    static generateSkinbaron(params, _mappings) {
        const { encodedBaseSearchName, isStatTrak, exterior, noTradeHold, isVanillaSearch, fullInput } = params;
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            let url = `https://skinbaron.de/en/csgo?str=${encodedBaseSearchName}&sort=PA&affiliateId=854`;
            url += (isStatTrak ? `&statTrak=true` : "");
            return addUtmParams(url);
        }
        const { wearGt, wearLt } = params;
        const currentExteriorId = exteriorMappings.default[exterior];
        let url = `https://skinbaron.de/en/csgo?str=${encodedBaseSearchName}&sort=PA&affiliateId=854`;
        if (!isVanillaSearch) {
            url += `&wlb=${wearGt}&wub=${wearLt}`;
            url += (currentExteriorId ? `&exterior=${currentExteriorId}` : "");
        } else {
            // Add unpainted parameter for vanilla searches
            url += `&unpainted=true`;
        }
        url += (isStatTrak ? `&statTrak=true` : "");
        url += (noTradeHold ? `&tli=0&` : "");
        return addUtmParams(url);
    }

    // Skinflow
    static generateSkinflow(params, _mappings) {
        const { finalSearchName, exterior, fullInput } = params;
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            const encodedSearch = finalSearchName.replace(/ /g, '+');
            return addUtmParams(`https://skinflow.gg/buy?referral=DADSCAP&search=${encodedSearch}`);
        }
        const currentExteriorLabel = exteriorMappings.labels[exterior];
        let searchString = finalSearchName;
        if (!params.isVanillaSearch && currentExteriorLabel) {
            // Skinflow expects exterior in parentheses as part of search string
            searchString = `${searchString} (${currentExteriorLabel})`;
        }
        // Uses '+' for spaces instead of %20 (turns out it makes no difference whatsoever but fuck it im keeping it)
        const encodedSearch = searchString.replace(/ /g, '+');
        return addUtmParams(`https://skinflow.gg/buy?referral=DADSCAP&search=${encodedSearch}`);
    }

    // Skinout
    static generateSkinout(params, _mappings) {
        const { baseSearchName, minFloat, maxFloat, isStatTrak, noTradeHold, exterior, phaseName, isVanillaSearch, fullInput } = params;
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            let skinoutSearchTerm = baseSearchName;
            // Skinout requires StatTrak™ prefix in search term
            if (isStatTrak) {
                skinoutSearchTerm = `StatTrak™ ${baseSearchName}`;
            }
            const encodedSkinoutSearchTerm = encodeURIComponent(skinoutSearchTerm);
            let url = `https://skinout.gg/en/market?search=${encodedSkinoutSearchTerm}&sort=price_asc`;
            return addUtmParams(url);
        }
        // Handle vanilla searches with special URL format
        if (isVanillaSearch) {
            // Convert knife name to slug format (lowercase, spaces to hyphens, remove ★)
            let knifeName = baseSearchName.replace(/^★\s*/, '').toLowerCase().replace(/\s+/g, '-');
            let url;
            if (isStatTrak) {
                url = `https://skinout.gg/en/market/★-stattrak-${knifeName}`;
            } else {
                url = `https://skinout.gg/en/market/★-${knifeName}`;
            }
            url += (noTradeHold ? `?selected_hold=0` : "");
            return addUtmParams(url);
        }
        let skinoutSearchTerm = baseSearchName;
        if (isStatTrak) {
            skinoutSearchTerm = `StatTrak™ ${baseSearchName}`;
        }
        const encodedSkinoutSearchTerm = encodeURIComponent(skinoutSearchTerm);
        let url = `https://skinout.gg/en/market?search=${encodedSkinoutSearchTerm}&sort=price_asc`;
        url += `&float_min=${minFloat}&float_max=${maxFloat}`;
        url += (exterior ? `&exterior=${exterior}` : "");
        url += (noTradeHold ? `&selected_hold=0` : "");
        if (phaseName && phaseMappings.skinout?.[phaseName]) {
            url += `&selected_phase=${phaseMappings.skinout[phaseName]}`;
        }
        return addUtmParams(url);
    }

    // Skinplace
    static generateSkinplace(params, _mappings) {
        const { finalSearchName, exterior, isVanillaSearch, isStatTrak, minFloat, maxFloat, phaseName, noTradeHold, fullInput } = params;
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            let url = `https://skin.place/buy-cs2-skins?search=${encodeURIComponent(finalSearchName)}&sort_column=price&sort_dir=asc&utm_campaign=US5shYfSgvPfQCV`;
            if (isStatTrak) {
                url += '&is_stattrak=1';
            }
            return addUtmParams(url);
        }
        // Handle vanilla searches with special URL format
        if (isVanillaSearch) {
            // Convert knife name to slug format (lowercase, spaces to hyphens, remove ★)
            let knifeName = finalSearchName.replace(/^★\s*/, '').replace(/StatTrak™\s*/i, '').toLowerCase().replace(/\s+/g, '-');
            let url;
            if (isStatTrak) {
                url = `https://skin.place/buy-cs2-skins/stattrak-${knifeName}`;
            } else {
                url = `https://skin.place/buy-cs2-skins/${knifeName}`;
            }
            const queryParams = [];
            if (noTradeHold) {
                queryParams.push('is_hold=0');
            }
            if (queryParams.length > 0) {
                url += '?' + queryParams.join('&');
            }
            return addUtmParams(url);
        }
        // For "Any" exterior searches (non-vanilla)
        if (!exterior || exterior === 'Any') {
            let url = `https://skin.place/buy-cs2-skins?search=${encodeURIComponent(finalSearchName.replace(/^★\s*/, ''))}&sort_column=price&sort_dir=asc&utm_campaign=US5shYfSgvPfQCV`;
            if (isStatTrak) {
                url += '&is_stattrak=1';
            }
            if (phaseName) {
                const phaseFormatted = phaseName.replace(' ', '+');
                // Phases parameter as JSON array string
                url += `&phases=["${phaseFormatted}"]`;
            }
            if (noTradeHold) {
                url += '&is_hold=0';
            }
            return addUtmParams(url);
            
        }
        // Creates SEO-friendly URL slugs from item names
        let normalizedName = finalSearchName
            .replace(/^★\s*/, '')
            .replace(/StatTrak™\s*/i, '')
            .replace(/\s*\|\s*/g, '-')
            .replace(/[()]/g, '')
            .toLowerCase()
            .replace(/\s+/g, '-');
        if (phaseName) {
            normalizedName += `-${phaseName.toLowerCase().replace(/\s+/g, '-')}`;
        }
        // Direct item page URL instead of search
        let url = `https://skin.place/buy-cs2-skins/${normalizedName}`;
        const queryParams = [];
        queryParams.push('utm_campaign=US5shYfSgvPfQCV');
        if (isStatTrak) {
            queryParams.push('is_stattrak=1');
        }
        if (exteriorMappings.urlFormattedPlus[exterior]) {
            queryParams.push(`exterior=${exteriorMappings.urlFormattedPlus[exterior]}`);
        }
        if (minFloat > 0 || maxFloat < 1) {
            queryParams.push(`float_from=${minFloat}&float_to=${maxFloat}`);
        }
        if (queryParams.length > 0) {
            url += '?' + queryParams.join('&');
        }
        return addUtmParams(url);
    }    

    // Skinport
    static generateSkinport(params, _mappings) {
        const { encodedBaseSearchName, isVanillaSearch, exterior, isStatTrak, noTradeHold, paintSeed, phaseName, fullInput } = params;
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            const skinportSearchParam = encodedBaseSearchName;
            let url = `https://skinport.com/market?search=${skinportSearchParam}&order=asc&sort=price`;
            if (isStatTrak) url += `&stattrak=1`;
            url += `&r=dadscap`;
            return addUtmParams(url);
        }
        const { wearGt, wearLt } = params;
        const currentSpExteriorId = exteriorMappings.skinport[exterior];
        const skinportSearchParam = encodedBaseSearchName.replace(/%20/g, '+');
        let url = `https://skinport.com/market?search=${skinportSearchParam}&order=asc&sort=price`;
        if (isVanillaSearch) {
            // Simple vanilla=1 flag for vanilla items
            url += `&vanilla=1`;
        } else {
            // Uses weargt/wearlt (greater than/less than) instead of min/max, similar to Skinbaron
            url += `&weargt=${wearGt}&wearlt=${wearLt}`;
            if (currentSpExteriorId) url += `&exterior=${currentSpExteriorId}`;
        }
        if (isStatTrak) url += `&stattrak=1`;
        url += (noTradeHold ? `&lock=0` : "");
        url += (paintSeed !== null ? `&pattern=${paintSeed}` : "");
        if (!isVanillaSearch && phaseName && phaseMappings.skinport?.[phaseName]) {
            url += `&phase=${phaseMappings.skinport[phaseName]}`;
        }
        url += `&r=dadscap`;
        return addUtmParams(url);
    }

    // Skins.com
    static generateSkinscom(params, _mappings) {
        const { baseSearchName, exterior, isVanillaSearch, isStatTrak, phaseName, fullInput } = params;
        // Build the slug: remove star, StatTrak, pipe -> dash, spaces -> dash, lowercase, alphanumeric only
        const slug = baseSearchName
            .replace(/★\s*/g, '')              // Remove star
            .replace(/StatTrak™\s*/gi, '')     // Remove StatTrak (will be query param)
            .replace(/\s*\|\s*/g, '-')         // Replace pipe with dash
            .replace(/\s+/g, '-')              // Replace spaces with dashes
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '')        // Remove non-alphanumeric (keep dashes)
            .replace(/-+/g, '-')               // Collapse multiple dashes into one
            .replace(/^-|-$/g, '');            // Remove leading/trailing dashes
        // For special items, just return the slug URL with no query params
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            return addUtmParams(`https://skins.com/item/${slug}`);
        }
        // Build query parameters
        const queryParams = [];
        // Add exterior if specified (vanilla items don't have exterior)
        if (!isVanillaSearch && exterior && exterior !== 'Any') {
            queryParams.push(`exterior=${exterior}`);
        }
        // Add StatTrak
        if (isStatTrak) {
            queryParams.push('st=true');
        }
        // Add phase
        if (phaseName) {
            queryParams.push(`phase=${encodeURIComponent(phaseName)}`);
        }
        let url = `https://skins.com/item/${slug}`;
        if (queryParams.length > 0) {
            url += '?' + queryParams.join('&');
        }
        return addUtmParams(url);
    }

    // SkinsMonkey
    static generateSkinsmonkey(params, _mappings) {
        const { finalSearchName, exterior, isVanillaSearch, isStatTrak, phaseName, fullInput } = params;
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            const formattedName = `${finalSearchName}`.replace(/\s+/g, '+').replace(/\+\|\+/g, '+|+');
            return addUtmParams(`https://skinsmonkey.com/trade?q=${formattedName}&r=DADSCAP&appId=730&sort=relevance`);
        }
        let searchName = finalSearchName.replace(/★\s*/g, '').replace(/StatTrak™\s*/g, '');
        if (isVanillaSearch) {
            // For skinsmonkey, use fullInput which contains " | Vanilla" instead of stripped baseSearchName
            let vanillaName = fullInput.replace(/★\s*/g, '').replace(/StatTrak™\s*/g, '');
            if (isStatTrak) {
                vanillaName = `StatTrak™ ★ ${vanillaName}`;
            } else {
                vanillaName = `★ ${vanillaName}`;
            }
            const formattedName = `${vanillaName}`.replace(/\s+/g, '+').replace(/\+\|\+/g, '+|+');
            return addUtmParams(`https://skinsmonkey.com/trade?q=${formattedName}&r=DADSCAP&appId=730&sort=relevance`);
        }
        const isKnifeOrGlove = searchName.includes('Knife') || searchName.includes('Gloves') || searchName.includes('Wraps');
        if (isKnifeOrGlove) {
            searchName = `★ ${searchName}`;
        }
        if (isStatTrak) {
            searchName = `StatTrak™ ${searchName}`;
        }
        if (phaseName) {
            if (phaseName.includes('Phase')) {
                searchName = searchName.replace(/\(Phase\s*\d+\)/i, phaseName);
            } else {
                searchName = searchName.replace(/\(Phase\s*\d+\)/i, `(${phaseName})`);
            }
        }
        if (exterior && exterior !== 'Any') {
            if (exteriorMappings.labels[exterior]) {
                searchName += ` (${exteriorMappings.labels[exterior]})`;
            }
        }
        const formattedName = `${searchName}`.replace(/\s+/g, '+').replace(/\+\|\+/g, '+|+');
        return addUtmParams(`https://skinsmonkey.com/trade?q=${formattedName}&r=DADSCAP&appId=730&sort=relevance`);
    }

    // SkinSwap
    static generateSkinswap(params, _mappings) {
        const { baseSearchName, finalSearchName, exterior, isVanillaSearch, isStatTrak, phaseName, fullInput } = params;
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            const formattedName = `${finalSearchName}`.replace(/\s+/g, '+').replace(/\+\|\+/g, '+|+');
            return addUtmParams(`https://skinswap.com/r/dadscap?search=${formattedName}`);
        }
        let searchName = finalSearchName.replace(/★\s*/g, '').replace(/StatTrak™\s*/g, '');
        if (isVanillaSearch) {
            let vanillaName = baseSearchName.replace(/★\s*/g, '').replace(/StatTrak™\s*/g, '');
            if (isStatTrak) {
                vanillaName = `StatTrak™ ★ ${vanillaName}`;
            } else {
                vanillaName = `★ ${vanillaName}`;
            }
            const formattedName = `${vanillaName}`.replace(/\s+/g, '+');
            return addUtmParams(`https://skinswap.com/r/dadscap?search=${formattedName}`);
        }
        const isKnifeOrGlove = searchName.includes('Knife') || searchName.includes('Gloves') || searchName.includes('Wraps');
        if (isKnifeOrGlove) {
            searchName = `★ ${searchName}`;
        }
        if (isStatTrak) {
            searchName = `StatTrak™ ${searchName}`;
        }
        if (phaseName) {
            if (phaseName.includes('Phase')) {
                searchName = searchName.replace(/\(Phase\s*\d+\)/i, phaseName);
            } else {
                searchName = searchName.replace(/\(Phase\s*\d+\)/i, `(${phaseName})`);
            }
        }
        if (exterior && exterior !== 'Any') {
            if (exteriorMappings.labels[exterior]) {
                searchName += ` (${exteriorMappings.labels[exterior]})`;
            }
        }
        const formattedName = `${searchName}`.replace(/\s+/g, '+').replace(/\+\|\+/g, '+|+');
        return addUtmParams(`https://skinswap.com/r/dadscap?search=${formattedName}`);
    }    

    // Steam
    static generateSteam(params, _mappings) {
        const { baseSearchName, finalSearchName, exterior, isVanillaSearch, isStatTrak, fullInput } = params;
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            const steamSearchName = finalSearchName;
            const baseUrl = `https://steamcommunity.com/market/search?q=${encodeURIComponent(steamSearchName)}&appid=730`;
            return addUtmParams(baseUrl);
        }
        const currentExteriorLabel = exteriorMappings.labels[exterior];
        if (isVanillaSearch) {
            let name = baseSearchName.startsWith('★') ? baseSearchName : `★ ${baseSearchName}`;
            if (isStatTrak) {
                // Steam requires specific name format for StatTrak vanilla knives
                const nameWithoutStar = name.startsWith('★ ') ? name.substring(2) : name;
                name = `★ StatTrak™ ${nameWithoutStar}`;
            }
            const encoded = encodeURIComponent(name);
            // Direct market listing URL for exact items
            const url = `https://steamcommunity.com/market/listings/730/${encoded}`;
            return addUtmParams(url);
        }
        if (exterior && exterior !== 'Any') {
            // Specific identifiers to detect knives and gloves
            const knifeAndGloveIdentifiers = ["Knife |", "Bayonet |", "Daggers |", "Karambit |", "Gloves |", "Wraps |"];
            const isKnifeOrGlove = knifeAndGloveIdentifiers.some(identifier => finalSearchName.includes(identifier));
            let searchName = finalSearchName;
            if (isKnifeOrGlove && !finalSearchName.startsWith('★')) {
                // Auto-adds ★ prefix for knives/gloves if missing
                searchName = `★ ${finalSearchName}`;
            }
            const itemName = `${searchName}${currentExteriorLabel ? ` (${currentExteriorLabel})` : ''}`;
            const encoded = encodeURIComponent(itemName);
            // 730 is the Steam app ID for CS:GO/CS2
            const url = `https://steamcommunity.com/market/listings/730/${encoded}`;
            return addUtmParams(url);
        }
        const steamSearchName = finalSearchName + (currentExteriorLabel && !isVanillaSearch ? ` (${currentExteriorLabel})` : "");
        const baseUrl = `https://steamcommunity.com/market/search?q=${encodeURIComponent(steamSearchName)}&appid=730`;
        return addUtmParams(baseUrl);
    }
    
    // Swap.gg
    static generateSwapgg(params, _mappings) {
        let { baseSearchName, finalSearchName, exterior, isVanillaSearch, isStatTrak, phaseName, fullInput } = params;
        baseSearchName = baseSearchName.replace(/StatTrak™/g, 'StatTrak');
        finalSearchName = finalSearchName.replace(/StatTrak™/g, 'StatTrak');
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            const formattedName = `${finalSearchName}`.replace(/\s+/g, '+').replace(/\+\|\+/g, '+|+');
            return addUtmParams(`https://swap.gg/trade?search=${formattedName}`);
        }
        let searchName = finalSearchName;
        if (isVanillaSearch) {
            let vanillaName = baseSearchName.startsWith('★') ? baseSearchName : `${baseSearchName}`;
            if (isStatTrak) {
                vanillaName = `StatTrak ★ ${baseSearchName.replace(/^★\s*/, '')}`;
            }
            const formattedName = `${vanillaName}`.replace(/\s+/g, '+');
            return addUtmParams(`https://swap.gg/trade?search=${formattedName}`);
        }
        const isKnifeOrGlove = searchName.includes('Knife') || searchName.includes('Gloves') || searchName.includes('Wraps');
        if (isKnifeOrGlove) {
            searchName = searchName.replace(/★/g, '').trim();
        }
        if (isStatTrak && !searchName.includes('StatTrak')) {
            searchName = `StatTrak ${searchName.replace(/★/g, '').trim()}`;
        } else {
            searchName = searchName.replace(/★/g, '').trim();
        }
        if (phaseName) {
            if (phaseName.includes('Phase')) {
                searchName = searchName.replace(/\(Phase\s*\d+\)/i, phaseName);
            } else {
                searchName = searchName.replace(/\(Phase\s*\d+\)/i, `(${phaseName})`);
            }
        }
        if (exterior && exterior !== 'Any') {
            if (exteriorMappings.labels[exterior]) {
                searchName += ` (${exteriorMappings.labels[exterior]})`;
            }
        }
        const formattedName = `${searchName}`.replace(/\s+/g, '+').replace(/\+\|\+/g, '+|+');
        return addUtmParams(`https://swap.gg/trade?search=${formattedName}`);
    }
    
    // Tradeit
    static generateTradeit(params, _mappings) {
        const { phaseName, isStatTrak, fullInput, finalSearchName, exterior, isVanillaSearch } = params;
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            const encodedSearch = finalSearchName.replace(/ /g, '+');
            const baseUrl = `https://tradeit.gg/csgo/store?aff=Dadscap&search=${encodedSearch}`;
            return addUtmParams(baseUrl);
        }
        const currentExteriorLabel = exteriorMappings.labels[exterior];
        let searchString;
        if (phaseName) {
            searchString = isStatTrak ? `StatTrak™ ${fullInput}` : fullInput;
        } else {
            searchString = finalSearchName;
            if (!isVanillaSearch && currentExteriorLabel) {
                searchString = `${searchString} (${currentExteriorLabel})`;
            }
        }
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.KNIFE || getItemCategory(fullInput) === ITEM_CATEGORIES.GLOVE) {
            searchString = "★ " + searchString;
        }
        const encodedSearch = searchString.replace(/ /g, '+');
        const baseUrl = `https://tradeit.gg/csgo/store?aff=Dadscap&search=${encodedSearch}`;
        return addUtmParams(baseUrl);
    }

    // Waxpeer
    static generateWaxpeer(params, _mappings) {
        const { encodedBaseSearchName, isStatTrak, exterior, minFloat, maxFloat, phaseName, isVanillaSearch, fullInput } = params;
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            let url = `https://waxpeer.com/r/dadscap?all=0&search=${encodedBaseSearchName}`;
            url += (isStatTrak ? `&stat_trak=1` : "");
            return addUtmParams(url);
        }
        // Waxpeer adds a '★ ' prefix for vanilla knife searches (filling the space with '%20' to make sure it registers)
        const searchQuery = isVanillaSearch ? `${encodedBaseSearchName}&exact=1` : encodedBaseSearchName;
        let url = `https://waxpeer.com/r/dadscap?all=0&search=${searchQuery}`;
        url += (isStatTrak ? `&stat_trak=1` : "");
        if (!isVanillaSearch) {
            // Exterior codes must be uppercase (FN, MW, etc.)
            url += (exterior ? `&exterior=${exterior.toUpperCase()}` : "");
            url += `&min_float=${minFloat}&max_float=${maxFloat}`;
        }
        if (!isVanillaSearch && phaseName && phaseMappings.waxpeer?.[phaseName]) {
            url += `&phase=${phaseMappings.waxpeer[phaseName]}`;
        }
        return addUtmParams(url);
    }

    // Whitemarket
    static generateWhitemarket(params, _mappings) {
        const { encodedBaseSearchName, isVanillaSearch, minFloat, maxFloat, exterior, isStatTrak, paintSeed, phaseName, fullInput } = params;
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            let url = `https://white.market/market?name=${encodedBaseSearchName}&sort=pr_a&unique=false&ref=SkinScanner`;
            url += (isStatTrak ? `&stattrak=true` : "");
            return addUtmParams(url);
        }
        const currentWhitemarketExteriorCode = exteriorMappings.whitemarket[exterior];
        let url = `https://white.market/market?name=${encodedBaseSearchName}&sort=pr_a&unique=false&ref=SkinScanner`;
        if (isVanillaSearch) {
            // e5 is Whitemarket's code for vanilla/not painted
            url += `&exterior=e5`;
        } else {
            url += `&float-from=${minFloat}&float-to=${maxFloat}`;
            if (exterior && currentWhitemarketExteriorCode) url += `&exterior=${currentWhitemarketExteriorCode}`;
            // Default to all exteriors (e0-e4) when none specified
            else url += '&exterior=e0%2Ce1%2Ce2%2Ce3%2Ce4';
        }
        url += (isStatTrak ? `&stattrak=true` : "");
        url += (paintSeed !== null ? `&pattern=${paintSeed}` : "");
        if (!isVanillaSearch && phaseName && phaseMappings.whitemarket?.[phaseName]) {
            url += `&phase=${phaseMappings.whitemarket[phaseName]}`;
        }
        return addUtmParams(url);
    }

    // YouPin898 (chinese marketplace)
    static generateYoupin(params, mappings) {
        const { baseSearchName, fullInput, finalSearchName, encodedBaseSearchName, isStatTrak, exterior, isVanillaSearch } = params;
        const { uuMap } = mappings || {};
        // YouPin handles special items the same way as regular items with IDs
        // For vanilla items, exterior is completely ignored
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL || isVanillaSearch || (!isVanillaSearch && exterior && exterior !== 'Any')) {
            let key;
            let secondaryKey;
            if (isVanillaSearch) {
                // Special handling for vanilla knives - keep " | Vanilla" in the key
                if (fullInput.includes(' | Vanilla')) {
                    if (isStatTrak) {
                        // fullInput already contains ★, so we only need to add StatTrak™
                        key = fullInput.replace('★', '★ StatTrak™');
                    } else {
                        // Use fullInput directly (includes " | Vanilla")
                        key = fullInput;
                    }
                } else {
                    if (isStatTrak) {
                        key = finalSearchName;
                    } else {
                        key = fullInput;
                        secondaryKey = baseSearchName;
                    }
                }
            } else {
                // Special handling for Dopplers and Gamma Dopplers - ignore phase and use basic doppler ID
                const isDoppler = finalSearchName.includes('Doppler') && !finalSearchName.includes('Gamma');
                const isGammaDoppler = finalSearchName.includes('Gamma Doppler');
                const isKnife = fullInput.startsWith('★');
                const label = exteriorMappings.labels[exterior];
                if (isDoppler || isGammaDoppler) {
                    // Use base doppler name with exterior condition
                    key = `${isKnife ? '★ ' : ''}${isStatTrak ? 'StatTrak™ ' : ''}${baseSearchName}${label ? ` (${label})` : ''}`;
                } else {
                    key = `${isKnife ? '★ ' : ''}${isStatTrak ? 'StatTrak™ ' : ''}${baseSearchName}${label ? ` (${label})` : ''}`;
                }
            }
            // YouPin uses uuMap for templateId lookups
            let id = uuMap ? uuMap[key] : null;
            if (!id && secondaryKey && uuMap) {
                id = uuMap[secondaryKey];
            }
            if (id) {
                // Uses templateId and gameId=730 (CS:GO) parameters
                const url = `https://youpin898.com/market/goods-list?listType=10&templateId=${id}&gameId=730`;
                return addUtmParams(url);
            }
        }
        // Fallback to basic keyword search without exterior or float parameters
        let url = `https://youpin898.com/market/goods-list?listType=10&gameId=730&keyword=${encodedBaseSearchName}`;
        url += (isStatTrak ? `&statTrak=1` : "");
        return addUtmParams(url);
    }

    // --- Master URL Generation Method ---
    static generateAll(params, selectedMarkets, mappings) {
        const urls = {};
        for (const market of selectedMarkets) {
            const methodName = `generate${market.charAt(0).toUpperCase() + market.slice(1)}`;
            if (typeof this[methodName] === 'function') {
                try {
                    urls[market] = this[methodName](params, mappings);
                } catch (error) {
                    console.error(`Error generating URL for ${market}:`, error, "Params:", params);
                    urls[market] = null;
                }
            } else {
                console.warn(`URL generator for market "${market}" not found.`);
                urls[market] = null;
            }
        }
        return urls;
    }
}