/* MarketplaceURLs 
 * Generates marketplace URLs based on user input and selected parameters.
 */
import {
    phaseMappings, exteriorIdMap, exteriorLabelMap, spExteriorIdMap,
    lisSkinsExteriorIdMap, wearCategoryMap, whitemarketExteriorMap, skinbidWearMap, isSpecialItemType, exteriorMappings
} from '../config/constants.js';
import { addUtmParams, ShadowPayUtmParams } from '../utils/url-helpers.js';

// Regex to extract phase information from doppler skins (e.g., "Phase 1", "Ruby", etc.)
const phaseRegex = /\s*\((Phase\s*\d+|Ruby|Sapphire|Black Pearl|Emerald)\)/i;

export class MarketplaceURLs {
    // Avanmarket
    static generateAvanmarket(params, _mappings) {
        const { encodedBaseSearchName, minFloat, maxFloat, isStatTrak, phaseName, isVanillaSearch, fullInput } = params;
        let url = `https://avan.market/en/market/cs?name=${encodedBaseSearchName}&r=dadscap&sort=1`;
        // Special handling for special items like stickers, patches, charms, etc.
        if (isSpecialItemType(fullInput)) {
            // Special items bypass all float/wear/phase logic entirely
            return addUtmParams(url, 'avanmarket');
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
        return addUtmParams(url, 'avanmarket');
    }

    // Bitskins
    static generateBitskins(params, _mappings) {
        const { finalSearchName, minFloat, maxFloat, isVanillaSearch, exterior, noTradeHold, paintSeed, phaseName, fullInput } = params;
        // For special items like stickers, patches, charms, etc., we just use the finalSearchName directly
        if (isSpecialItemType(fullInput)) {
            const baseUrl = `https://bitskins.com/market/cs2?search=${encodeURIComponent(JSON.stringify({
                order: [{ field: "price", order: "ASC" }],
                where: { skin_name: finalSearchName }
            }))}&ref_alias=dadscap`;
            return addUtmParams(baseUrl, 'bitskins');
        }
        const currentExteriorId = exteriorIdMap[exterior];
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
        return addUtmParams(baseUrl, 'bitskins');
    }

    // Buff163
    static generateBuff(params, mappings) {
        const {isVanillaSearch, encodedBaseSearchName, isStatTrak, exterior, phaseName, baseSearchName, fullInput, paintSeed, minFloat, maxFloat} = params;
        const { buffMap } = mappings || {};
        if (isSpecialItemType(fullInput)) {
            let searchUrl = `https://buff.163.com/market/csgo#game=csgo&page_num=1&search=${encodedBaseSearchName}`;
            searchUrl += (isStatTrak ? `&category=tag_weapon_stat` : '');
            searchUrl += '&sort_by=price.asc';
            return addUtmParams(searchUrl, 'buff');
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
                let baseUrl = `https://buff.163.com/goods/${buffGoodId}?from=market#sort_by=price.asc`;
                return addUtmParams(baseUrl, 'buff');
            } else {
                // Fallback uses 'wearcategoryna' for vanilla (Not Applicable wear)
                let vanillaUrl = `https://buff.163.com/market/csgo#game=csgo&page_num=1&category_group=knife&search=${encodedBaseSearchName}&exterior=wearcategoryna`;
                if (isStatTrak) {
                    vanillaUrl += `&category=tag_weapon_stat`;
                }
                vanillaUrl += '&tab=selling';
                return addUtmParams(vanillaUrl, 'buff');
            }
        }
        // For non-vanilla searches, we need to find the buffGoodId based on exterior and phase (if Doppler)
        let buffGoodId = null;
        let phaseTagId = null;
        if (exterior && buffMap) {
            // Different lookup key for phase items (uses base name) vs regular items (uses full name)
            const buffMapLookupKey = phaseName ? baseSearchName : fullInput;
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
            fragmentParams.push('sort_by=price.asc');
            baseUrl += fragmentParams.join('&');
            return addUtmParams(baseUrl, 'buff');
        } else {
            // If we didn't find buffGoodId, fallback to the general search URL
            console.log("Buff163: Falling back to general search URL (non-vanilla).");
            let searchUrl = `https://buff.163.com/market/csgo#game=csgo&page_num=1&search=${encodedBaseSearchName}`;
            searchUrl += (isStatTrak ? `&category=tag_weapon_stat` : '');
            // Add exterior filter if specified
            const searchExteriorFilter = wearCategoryMap[exterior];
            searchUrl += (searchExteriorFilter ? `&exterior=${searchExteriorFilter}` : "");
            if (paintSeed !== null) {
                searchUrl += `&paintseed=${paintSeed}`;
            }
            searchUrl += '&sort_by=price.asc';
            return addUtmParams(searchUrl, 'buff');
        }
    }

    // Buff.Market
    static generateBuffmarket(params, mappings) {
        const {isVanillaSearch, encodedBaseSearchName, isStatTrak, exterior, phaseName, baseSearchName, fullInput, paintSeed, minFloat, maxFloat} = params;
        const { bMarketMap } = mappings || {};
        if (isSpecialItemType(fullInput)) {
            let searchUrl = `https://buff.market/market/all?search=${encodedBaseSearchName}`;
            searchUrl += (isStatTrak ? `&category=tag_weapon_stat` : '');
            searchUrl += '&sort_by=price.asc';
            return addUtmParams(searchUrl, 'buffmarket');
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
                return addUtmParams(url, 'buffmarket');
            } else {
                // Fallback to original vanilla search, i.e. return the URL for the general knife search
                let vanillaUrl = `https://buff.163.com/market/csgo#game=csgo&page_num=1&category_group=knife&search=${encodedBaseSearchName}&exterior=wearcategoryna`;
                if (isStatTrak) {
                    vanillaUrl += `&category=tag_weapon_stat`;
                }
                vanillaUrl += '&tab=selling';
                return addUtmParams(vanillaUrl, 'buffmarket');
            }
        }
        // For non-vanilla searches, we need to find the bMarketGoodId in bMarketMap (defined in constants.js) based on exterior and phase (if Doppler)
        let bMarketGoodId = null;
        let phaseTagId = null;
        // Check if exterior is defined and bMarketMap exists
        if (exterior && bMarketMap) {
            const bMarketMapLookupKey = phaseName ? baseSearchName : fullInput;
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
            fragmentParams.push('sort_by=price.asc');
            baseUrl += fragmentParams.join('&');
            return addUtmParams(baseUrl, 'buffmarket');
        } else {
            // If we didn't find bMarketGoodId, fallback to the general search URL
            console.log("Buff.Market: Falling back to general search URL (non-vanilla).");
            let searchUrl = `https://buff.market/market/all?search=${encodedBaseSearchName}`;
            searchUrl += (isStatTrak ? `&category=tag_weapon_stat` : '');
            const searchExteriorFilter = wearCategoryMap[exterior];
            searchUrl += (searchExteriorFilter ? `&exterior=${searchExteriorFilter}` : "");
            if (paintSeed !== null) {
                searchUrl += `&paintseed=${paintSeed}`;
            }
            searchUrl += '&sort_by=price.asc';
            return addUtmParams(searchUrl, 'buffmarket');
        }
    }

    // CS.Money
    static generateCsmoney(params, _mappings) {
        const { phaseName, encodedFullInput, encodedBaseSearchName, baseSearchName, isVanillaSearch, minFloat, maxFloat, exterior, isStatTrak, paintSeed, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            const searchNameParam = encodedBaseSearchName;
            let url = `https://cs.money/market/buy/?limit=60&offset=0&name=${searchNameParam}&order=asc&sort=price`;
            url += (isStatTrak ? `&isStatTrak=true` : "");
            return addUtmParams(url, 'csmoney');
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
        return addUtmParams(url, 'csmoney');
    }

    // CS.Deals
    static generateCsdeals(params, _mappings) {
        const { phaseName, encodedFullInput, encodedBaseSearchName, isStatTrak, noTradeHold, exterior, maxFloat, minFloat, isVanillaSearch, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            let url = `https://cs.deals/new?game=csgo&sort=price&sort_desc=0&name=${encodedBaseSearchName}`;
            url += (isStatTrak ? `&cs_stattrak=1` : '');
            return addUtmParams(url, 'csdeals');
        }
        const currentExteriorLabel = exteriorLabelMap[exterior];
        const searchNameParam = phaseName ? encodedFullInput : encodedBaseSearchName;
        let url = `https://cs.deals/new?game=csgo&sort=price&sort_desc=0&name=${searchNameParam}`;
        url += (isStatTrak ? `&cs_stattrak=1` : '');
        // CS.deals inverts the trade hold logic - adds param when trades ARE locked
        url += (noTradeHold ? "" : `&tradable_after_seconds=1`);
        if (!isVanillaSearch) {
            // Uses human-readable exterior labels instead of IDs
            url += (currentExteriorLabel ? `&cs_exterior=${encodeURIComponent(currentExteriorLabel)}` : "");
            url += `&cs_max_paintwear=${maxFloat}&cs_min_paintwear=${minFloat}`;
        }
        return addUtmParams(url, 'csdeals');
    }
    
    // CSFloat
    static generateCsfloat(params, mappings) {
        const { fullInput, baseSearchName, minFloat, maxFloat, noTradeHold, paintSeed, isStatTrak, isVanillaSearch } = params;
        const { skinMap } = mappings || {};
        let csfloatEntry = skinMap ? skinMap[fullInput] : null;
        if (!csfloatEntry && skinMap) {
            // Fuzzy matching fallback - normalizes and compares without phases/formatting
            const baseMatchKey = Object.keys(skinMap).find(k => {
                const normalizedKey = k.toLowerCase().replace(phaseRegex, '').replace(/[|\s]+/g, ' ').trim();
                const normalizedInput = baseSearchName.toLowerCase().replace(/[|\s]+/g, ' ').trim();
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
        if (isSpecialItemType(itemName)) {
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
            url += (noTradeHold ? `&instant_sale_only=true` : "");
            url += (paintSeed !== null ? `&paint_seed=${paintSeed}` : "");
        }
        url += `&sort_by=lowest_price`;
        return addUtmParams(url, 'csfloat');
    }

    // Market.CSGO
    static generateCsgo(params, _mappings) {
        const { encodedBaseSearchName, isStatTrak, isVanillaSearch, exterior, minFloat, maxFloat, phaseName, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            let url = `https://market.csgo.com/en/?search=${encodedBaseSearchName}`;
            url += (isStatTrak ? `&categories=StatTrak™` : '');
            url += '&sort=price&order=asc';
            // Market.csgo includes extensive UTM tracking parameters
            return url + '&utm_campaign=newcampaign&utm_source=SkinScanner&cpid=28e643b6-8c56-4212-b09c-ba3cabec7d7a&oid=4c69d079-ad2a-44b0-a9ac-d0afc2167ee7';
        }
        const currentExteriorLabel = exteriorLabelMap[exterior];
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

    // DMarket
    static generateDmarket(params, _mappings) {
        const { encodedBaseSearchName, minFloat, maxFloat, isVanillaSearch, isStatTrak, exterior, noTradeHold, paintSeed, phaseName, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            let url = `https://dmarket.com/ingame-items/item-list/csgo-skins?title=${encodedBaseSearchName}`;
            if (isStatTrak) url += `&category_0=stattrak_tm`;
            url += `&ref=4iYenTCg2m&orderBy=price&orderDir=asc`;
            return addUtmParams(url, 'dmarket');
        }
        const currentExteriorLabel = exteriorLabelMap[exterior];
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
        return addUtmParams(url, 'dmarket');
    }

    // Gamerpay
    static generateGamerpay(params, _mappings) {
        const { encodedBaseSearchName, baseSearchName, isVanillaSearch, minFloat, maxFloat, isStatTrak, noTradeHold, exterior, paintSeed, phaseName, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            let url = `https://gamerpay.gg/?query=${encodedBaseSearchName}&sortBy=price&ascending=true&page=1`;
            url += (isStatTrak ? `&statTrak=True` : "");
            url += `&ref=764d43667d`;
            return addUtmParams(url, 'gamerpay');
        }
        const currentExteriorLabel = exteriorLabelMap[exterior];
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
        url += `&ref=764d43667d`;
        return addUtmParams(url, 'gamerpay');
    }

    // Haloskins
    static generateHaloskins(params, mappings) {
        const { baseSearchName, fullInput, finalSearchName, encodedBaseSearchName, isStatTrak, exterior, isVanillaSearch, minFloat, maxFloat } = params;
        const { c5Map } = mappings || {};
        if (isSpecialItemType(fullInput)) {
            let url = `https://www.haloskins.io/market?keyword=${encodedBaseSearchName}&sort=1`;
            url += (isStatTrak ? `&statTrak=1` : "");
            return addUtmParams(url, 'haloskins');
        }
        const currentWearCategory = wearCategoryMap[exterior];
        if (isVanillaSearch || (exterior && exterior !== 'Any')) {
            let key;
            let secondaryKey;
            if (isVanillaSearch) {
                if (fullInput.includes(' | Vanilla')) {
                    const knifeName = fullInput.replace(' | Vanilla', '');
                    if (isStatTrak) {
                        key = `★ StatTrak™ ${knifeName}`;
                    } else {
                        key = `★ ${knifeName}`;
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
                const label = exteriorLabelMap[exterior];
                key = `${finalSearchName}${label ? ` (${label})` : ''}`;
            }
            // Haloskins/C5 share the same ID mapping (c5Map)
            let id = c5Map ? c5Map[key] : null;
            if (!id && secondaryKey && c5Map) {
                id = c5Map[secondaryKey];
            }
            if (id) {
                console.log(`Haloskins: Found ID: ${id} for key: ${key}`);
                // Direct market ID URL instead of search
                const url = `https://www.haloskins.io/market/${id}`;
                return addUtmParams(url, 'haloskins');
            }
        }
        let url = `https://www.haloskins.io/market?keyword=${encodedBaseSearchName}&sort=1`;
        url += (isStatTrak ? `&statTrak=1` : "");
        url += (currentWearCategory ? `&exterior=${currentWearCategory}` : "");
        url += `&min_float=${minFloat}&max_float=${maxFloat}`;
        return addUtmParams(url, 'haloskins');
    }

    // C5Game (chinese marketplace)
    static generateC5(params, mappings) {
        const { baseSearchName, fullInput, finalSearchName, encodedBaseSearchName, isStatTrak, exterior, isVanillaSearch, minFloat, maxFloat } = params;
        const { c5Map } = mappings || {};
        
        if (isSpecialItemType(fullInput)) {
            let url = `https://www.c5game.com/en/csgo?keyword=${encodedBaseSearchName}&sort=1`;
            url += (isStatTrak ? `&statTrak=1` : "");
            return addUtmParams(url, 'c5');
        }
        const currentWearCategory = wearCategoryMap[exterior];
        if (isVanillaSearch || (exterior && exterior !== 'Any')) {
            let key;
            let secondaryKey;
            if (isVanillaSearch) {
                // Special handling for vanilla knives
                if (fullInput.includes(' | Vanilla')) {
                    const knifeName = fullInput.replace(' | Vanilla', '');
                    if (isStatTrak) {
                        key = `★ StatTrak™ ${knifeName}`;
                    } else {
                        key = `★ ${knifeName}`;
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
                
                if (isDoppler || isGammaDoppler) {
                    // Strip phase information and use base doppler name
                    let baseDopplerName = finalSearchName.replace(phaseRegex, '').trim();
                    // Only consider StatTrak status for key construction
                    key = baseDopplerName;
                } else {
                    const label = exteriorLabelMap[exterior];
                    key = `${finalSearchName}${label ? ` (${label})` : ''}`;
                }
            }
            let id = c5Map ? c5Map[key] : null;
            if (!id && secondaryKey && c5Map) {
                id = c5Map[secondaryKey];
            }
            if (id) {
                console.log(`C5Game: Found ID: ${id} for key: ${key}`);
                const url = `https://www.c5game.com/en/csgo/${id}/1/sell`;
                return addUtmParams(url, 'c5');
            }
        }
        let url = `https://www.c5game.com/en/csgo?keyword=${encodedBaseSearchName}&sort=1`;
        url += (isStatTrak ? `&statTrak=1` : "");
        url += (currentWearCategory ? `&exterior=${currentWearCategory}` : "");
        url += `&min_float=${minFloat}&max_float=${maxFloat}`;
        return addUtmParams(url, 'c5');
    }

    // YouPin898 (chinese marketplace)
    static generateYoupin(params, mappings) {
        const { baseSearchName, fullInput, finalSearchName, encodedBaseSearchName, isStatTrak, exterior, isVanillaSearch, minFloat, maxFloat } = params;
        const { uuMap } = mappings || {};
        const currentWearCategory = wearCategoryMap[exterior];
        // YouPin handles special items the same way as regular items with IDs
        if (isSpecialItemType(fullInput) || isVanillaSearch || (exterior && exterior !== 'Any')) {
            let key;
            let secondaryKey;
            if (isVanillaSearch) {
                if (fullInput.includes(' | Vanilla')) {
                    const knifeName = fullInput.replace(' | Vanilla', '');
                    if (isStatTrak) {
                        key = `★ StatTrak™ ${knifeName}`;
                    } else {
                        key = `★ ${knifeName}`;
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
                
                if (isDoppler || isGammaDoppler) {
                    // Strip phase information and use base doppler name
                    let baseDopplerName = finalSearchName.replace(phaseRegex, '').trim();
                    // Only consider StatTrak status for key construction
                    key = baseDopplerName;
                } else {
                    const label = exteriorLabelMap[exterior];
                    key = `${finalSearchName}${label ? ` (${label})` : ''}`;
                }
            }
            // YouPin uses uuMap for templateId lookups
            let id = uuMap ? uuMap[key] : null;
            if (!id && secondaryKey && uuMap) {
                id = uuMap[secondaryKey];
            }
            if (id) {
                console.log(`YouPin898: Found ID: ${id} for key: ${key}`);
                // Uses templateId and gameId=730 (CS:GO) parameters
                const url = `https://www.youpin898.com/market/goods-list?listType=10&templateId=${id}&gameId=730`;
                return addUtmParams(url, 'youpin');
            }
        }
        let url = `https://www.youpin898.com/market/goods-list?listType=10&gameId=730&keyword=${encodedBaseSearchName}`;
        url += (isStatTrak ? `&statTrak=1` : "");
        url += (currentWearCategory ? `&exterior=${currentWearCategory}` : "");
        url += `&min_float=${minFloat}&max_float=${maxFloat}`;
        return addUtmParams(url, 'youpin');
    }

    // LisSkins
    static generateLisskins(params, _mappings) {
        const { encodedBaseSearchName, isStatTrak, minFloat, maxFloat, isVanillaSearch, exterior, noTradeHold, phaseName, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            let url = `https://lis-skins.com/market/csgo/?sort_by=price_asc&query=${encodedBaseSearchName}`;
            url += (isStatTrak ? `&is_stattrak=1` : "");
            url += `&rf=1878725`;
            return addUtmParams(url, 'lisskins');
        }
        const currentLisSkinsExteriorId = lisSkinsExteriorIdMap[exterior];
        let url = `https://lis-skins.com/market/csgo/?sort_by=price_asc&query=${encodedBaseSearchName}`;
        url += (isStatTrak ? `&is_stattrak=1` : "");
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
        return addUtmParams(url, 'lisskins');
    }

    // Mannco.store
    static generateMannco(params, _mappings) {
        const { baseSearchName, exterior, isStatTrak, encodedBaseSearchName, phaseName, isVanillaSearch, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            let url = `https://mannco.store/cs2?&search=${encodedBaseSearchName}&page=1&price=ASC`;
            if (isStatTrak) url += `&stattrak=stattrak`;
            return addUtmParams(url, 'mannco');
        }
        const currentExteriorLabel = exteriorLabelMap[exterior];
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
            const url = `https://mannco.store/item/730-${slug}`;
            return addUtmParams(url, 'mannco');
        }
        let url = `https://mannco.store/cs2?&search=${encodedBaseSearchName}&page=1&price=ASC`;
        if (isStatTrak) url += `&stattrak=stattrak`;
        return addUtmParams(url, 'mannco');
    }

    // ShadowPay
    static generateShadowpay(params, _mappings) {
        const { exterior, minFloat, maxFloat, encodedBaseSearchName, isVanillaSearch, phaseName, isStatTrak, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            let url = `https://shadowpay.com/csgo-items?search=${encodedBaseSearchName}&sort_column=discount&sort_dir=desc`;
            if (isStatTrak) url += `&is_stattrak=1`;
            url += `&utm_campaign=KzvAR2XJATjoT8y`;
            return ShadowPayUtmParams(url, 'shadowpay');
        }
        // Exterior labels are used for ShadowPay, not IDs
        const currentExteriorLabel = exteriorLabelMap[exterior];
        // ShadowPay expects JSON array format for exteriors
        const wearLabelParam = currentExteriorLabel ? encodeURIComponent(`["${currentExteriorLabel}"]`) : "[]";
        // Float range as JSON object
        const floatRangeParam = encodeURIComponent(JSON.stringify({ from: minFloat, to: maxFloat }));
        let searchString = encodedBaseSearchName;
        if (!isVanillaSearch && phaseName && phaseMappings.shadowpay?.[phaseName]) {
            // Phase names are appended to search string, not as separate param
            searchString += phaseMappings.shadowpay[phaseName];
        }
        let url = `https://shadowpay.com/csgo-items?search=${searchString}&sort_column=discount&sort_dir=desc`;
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
        if (isSpecialItemType(fullInput)) {
            let url = `https://skinbaron.de/en/csgo?str=${encodedBaseSearchName}&sort=CF`;
            url += (isStatTrak ? `&statTrak=true` : "");
            return addUtmParams(url, 'skinbaron');
        }
        const { wearGt, wearLt } = params;
        const currentExteriorId = exteriorIdMap[exterior];
        let url = `https://skinbaron.de/en/csgo?str=${encodedBaseSearchName}&sort=CF`;
        if (!isVanillaSearch) {
            url += `&wlb=${wearGt}&wub=${wearLt}`;
            url += (currentExteriorId ? `&exterior=${currentExteriorId}` : "");
        }
        url += (isStatTrak ? `&statTrak=true` : "");
        url += (noTradeHold ? `&tli=0&otherCurrency=USD` : "");
        return addUtmParams(url, 'skinbaron');
    }

    // Skinbid
    // Note: Skinbid has unique float handling and phase mappings
    static generateSkinbid(params, _mappings) {
        const { encodedBaseSearchName, isStatTrak, exterior, minFloat, maxFloat, noTradeHold, paintSeed, dopplerType, phaseName, isVanillaSearch, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            let url = `https://skinbid.com/market?sort=popular%23desc&sellType=fixed_price&search=${encodedBaseSearchName}&take=60&skip=0`;
            url += isStatTrak ? `&Category=StatTrak%23true` : '';
            return addUtmParams(url, 'skinbid');
        }
        let url = `https://skinbid.com/market?sort=popular%23desc&sellType=fixed_price&search=${encodedBaseSearchName}&take=60&skip=0`;
        url += isStatTrak ? `&Category=StatTrak%23true` : '';
        if (!isVanillaSearch) {
            // Special handling for FN with custom float ranges
            if (exterior === "fn" && (minFloat > 0 || maxFloat < 0.07)) {
                // Uses float range format with 3 decimal precision
                url += `&wear=${minFloat.toFixed(3)}-${maxFloat.toFixed(3)}`;
            } else if (skinbidWearMap && skinbidWearMap[exterior]) {
                // Uses capitalized 'Wear' param for standard exteriors
                url += `&Wear=${skinbidWearMap[exterior]}`;
            }
        }
        url += (noTradeHold ? '&instasell=1' : '');
        url += (paintSeed !== null ? `&PatternID=${paintSeed}` : "");
        if (!isVanillaSearch) {
            // Skinbid has nested phase mappings by doppler type
            if (dopplerType && phaseName && phaseMappings.skinbid?.[dopplerType]?.[phaseName]) {
                url += `&Phase=${phaseMappings.skinbid[dopplerType][phaseName]}`;
            } else if (phaseName && phaseMappings.skinbid?.[phaseName] && !dopplerType) {
                url += `&Phase=${phaseMappings.skinbid[phaseName]}`;
            }
        }
        return addUtmParams(url, 'skinbid');
    }

    // Skinflow
    static generateSkinflow(params, _mappings) {
        const { finalSearchName, exterior, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            const encodedSearch = finalSearchName.replace(/ /g, '+');
            return addUtmParams(`https://skinflow.gg/buy?search=${encodedSearch}`, 'skinflow');
        }
        const currentExteriorLabel = exteriorLabelMap[exterior];
        let searchString = finalSearchName;
        if (!params.isVanillaSearch && currentExteriorLabel) {
            // Skinflow expects exterior in parentheses as part of search string
            searchString = `${searchString} (${currentExteriorLabel})`;
        }
        // Uses '+' for spaces instead of %20 (turns out it makes no difference whatsoever but fuck it im keeping it)
        const encodedSearch = searchString.replace(/ /g, '+');
        return addUtmParams(`https://skinflow.gg/buy?search=${encodedSearch}`, 'skinflow');
    }

    // Skinout
    static generateSkinout(params, _mappings) {
        const { baseSearchName, minFloat, maxFloat, isStatTrak, noTradeHold, exterior, phaseName, isVanillaSearch, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            let skinoutSearchTerm = baseSearchName;
            // Skinout requires StatTrak™ prefix in search term
            if (isStatTrak) {
                skinoutSearchTerm = `StatTrak™ ${baseSearchName}`;
            }
            const encodedSkinoutSearchTerm = encodeURIComponent(skinoutSearchTerm);
            let url = `https://skinout.gg/en/market?search=${encodedSkinoutSearchTerm}&sort=price_asc`;
            return addUtmParams(url, 'skinout');
        }
        let skinoutSearchTerm = baseSearchName;
        if (isStatTrak) {
            skinoutSearchTerm = `StatTrak™ ${baseSearchName}`;
        }
        const encodedSkinoutSearchTerm = encodeURIComponent(skinoutSearchTerm);
        let url = `https://skinout.gg/en/market?search=${encodedSkinoutSearchTerm}&sort=price_asc`;
        if (!isVanillaSearch) {
            url += `&float_min=${minFloat}&float_max=${maxFloat}`;
            url += (exterior ? `&exterior=${exterior}` : "");
        }
        url += (noTradeHold ? `&selected_hold=0` : "");
        if (!isVanillaSearch && phaseName && phaseMappings.skinout?.[phaseName]) {
            url += `&selected_phase=${phaseMappings.skinout[phaseName]}`;
        }
        return addUtmParams(url, 'skinout');
    }

    // Skinport
    static generateSkinport(params, _mappings) {
        const { encodedBaseSearchName, isVanillaSearch, exterior, isStatTrak, noTradeHold, paintSeed, phaseName, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            const skinportSearchParam = encodedBaseSearchName.replace(/%20/g, '+');
            let url = `https://skinport.com/market?search=${skinportSearchParam}&order=asc&sort=price`;
            if (isStatTrak) url += `&stattrak=1`;
            url += `&r=dadscap`;
            return addUtmParams(url, 'skinport');
        }
        const { wearGt, wearLt } = params;
        const currentSpExteriorId = spExteriorIdMap[exterior];
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
        return addUtmParams(url, 'skinport');
    }

    // Skinplace
    static generateSkinplace(params, _mappings) {
        const { finalSearchName, exterior, isVanillaSearch, isStatTrak, minFloat, maxFloat, phaseName, noTradeHold, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            let url = `https://skin.place/buy-cs2-skins?search=${encodeURIComponent(finalSearchName)}&sort_column=price&sort_dir=asc`;
            if (isStatTrak) {
                url += '&is_stattrak=1';
            }
            let finalUrl = addUtmParams(url, 'skinplace');
            return finalUrl.replace('&utm_campaign=search', '&utm_campaign=US5shYfSgvPfQCV');
        }
        // For "Any" exterior or vanilla searches
        if (isVanillaSearch || !exterior || exterior === 'Any') {
            let url = `https://skin.place/buy-cs2-skins?search=${encodeURIComponent(finalSearchName)}&sort_column=price&sort_dir=asc`;
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
            let finalUrl = addUtmParams(url, 'skinplace');
            return finalUrl.replace('&utm_campaign=search', '&utm_campaign=US5shYfSgvPfQCV');
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
        let url = `https://skin.place/buy-cs2-skins/${normalizedName}/`;
        const queryParams = [];
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
        let finalUrl = addUtmParams(url, 'skinplace');
        return finalUrl.replace('&utm_campaign=search', '&utm_campaign=US5shYfSgvPfQCV');
    }

    // Steam
    static generateSteam(params, _mappings) {
        const { baseSearchName, finalSearchName, exterior, isVanillaSearch, isStatTrak, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            const steamSearchName = finalSearchName;
            const baseUrl = `https://steamcommunity.com/market/search?q=${encodeURIComponent(steamSearchName)}&appid=730`;
            return addUtmParams(baseUrl, 'steam');
        }
        const currentExteriorLabel = exteriorLabelMap[exterior];
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
            return addUtmParams(url, 'steam');
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
            return addUtmParams(url, 'steam');
        }
        const steamSearchName = finalSearchName + (currentExteriorLabel && !isVanillaSearch ? ` (${currentExteriorLabel})` : "");
        const baseUrl = `https://steamcommunity.com/market/search?q=${encodeURIComponent(steamSearchName)}&appid=730`;
        return addUtmParams(baseUrl, 'steam');
    }

    // Tradeit
    static generateTradeit(params, _mappings) {
        const { phaseName, isStatTrak, fullInput, finalSearchName, exterior, isVanillaSearch } = params;
        if (isSpecialItemType(fullInput)) {
            const encodedSearch = finalSearchName.replace(/ /g, '+');
            const baseUrl = `https://tradeit.gg/csgo/store?aff=Dadscap&search=${encodedSearch}`;
            return addUtmParams(baseUrl, 'tradeit');
        }
        const currentExteriorLabel = exteriorLabelMap[exterior];
        let searchString;
        if (phaseName) {
            searchString = isStatTrak ? `StatTrak™ ${fullInput}` : fullInput;
        } else {
            searchString = finalSearchName;
            if (!isVanillaSearch && currentExteriorLabel) {
                searchString = `${searchString} (${currentExteriorLabel})`;
            }
        }
        const encodedSearch = searchString.replace(/ /g, '+');
        const baseUrl = `https://tradeit.gg/csgo/store?aff=Dadscap&search=${encodedSearch}`;
        return addUtmParams(baseUrl, 'tradeit');
    }

    // Waxpeer
    static generateWaxpeer(params, _mappings) {
        const { encodedBaseSearchName, isStatTrak, exterior, minFloat, maxFloat, noTradeHold, phaseName, isVanillaSearch, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            let url = `https://waxpeer.com/en/r/dadscap?sort=ASC&order=price&all=0&search=${encodedBaseSearchName}`;
            url += (isStatTrak ? `&stat_trak=1` : "");
            return addUtmParams(url, 'waxpeer');
        }
        // Waxpeer adds a '★ ' prefix for vanilla knife searches (filling the space with '%20' to make sure it registers)
        const searchQuery = isVanillaSearch ? `★%20${encodedBaseSearchName}` : encodedBaseSearchName;
        let url = `https://waxpeer.com/en/r/dadscap?sort=ASC&order=price&all=0&search=${searchQuery}`;
        url += (isStatTrak ? `&stat_trak=1` : "");
        if (!isVanillaSearch) {
            // Exterior codes must be uppercase (FN, MW, etc.)
            url += (exterior ? `&exterior=${exterior.toUpperCase()}` : "");
            url += `&min_float=${minFloat}&max_float=${maxFloat}`;
        }
        url += (noTradeHold ? `&instant=1` : "");
        if (!isVanillaSearch && phaseName && phaseMappings.waxpeer?.[phaseName]) {
            url += `&phase=${phaseMappings.waxpeer[phaseName]}`;
        }
        if (isVanillaSearch) {
            // exact=1 for exact match on vanilla items
            url += `&exact=1`;
        }
        return addUtmParams(url, 'waxpeer');
    }

    // Whitemarket
    static generateWhitemarket(params, _mappings) {
        const { encodedBaseSearchName, isVanillaSearch, minFloat, maxFloat, exterior, isStatTrak, paintSeed, phaseName, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            let url = `https://white.market/market?name=${encodedBaseSearchName}&sort=pr_a&unique=false&ref=SkinScanner`;
            url += (isStatTrak ? `&stattrak=true` : "");
            return addUtmParams(url, 'whitemarket');
        }
        const currentWhitemarketExteriorCode = whitemarketExteriorMap[exterior];
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
        return addUtmParams(url, 'whitemarket');
    }

    // Skinland
    static generateSkinland(params, _mappings) {
        const { baseSearchName, finalSearchName, exterior, isVanillaSearch, isStatTrak, noTradeHold, minFloat, maxFloat, phaseName, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            let searchTerm = encodeURIComponent(finalSearchName);
            let url = `https://skin.land/market/csgo/?query=${searchTerm}&sort_by=price_asc`;
            if (isStatTrak) url += '&extras=is_stattrak';
            return addUtmParams(url, 'skinland');
        }
        // Handle vanilla knives separately - they don't follow the normal rules
        if (isVanillaSearch) {
            // Skinland uses dashes in URL paths, similar to skinplace and others im pretty sure
            let vanillaName = baseSearchName.replace(/^★\s*/, '').toLowerCase().replace(/\s+/g, '-');
            let url = `https://skin.land/market/csgo/★-${isStatTrak ? 'stattrak-' : ''}${vanillaName}/`;
            url += '?sort_by=price_asc';
            if (noTradeHold) url += '&hold=-1';
            return addUtmParams(url, 'skinland');
        }
        // For specific exterior searches
        if (exterior && exterior !== 'Any') {
            let searchName = finalSearchName;
            let url = 'https://skin.land/market/csgo/';
            // Check if it's a knife or gloves
            const isKnifeOrGlove = searchName.includes('Knife') || searchName.includes('Bayonet') || searchName.includes('Karambit') || searchName.includes('Shadow Daggers') ||
            searchName.includes('Gloves') || searchName.includes('Hand Wraps');
            if (isKnifeOrGlove) {
                // ★ becomes part of the URL path structure
                url += '★-';
            }
            if (isStatTrak) {
                // StatTrak prefix is identical regardless of item type
                if (isKnifeOrGlove) {
                    url += 'stattrak-';
                } else {
                    url += 'stattrak-';
                }
            }
            // Normalize the name
            let normalizedName = searchName
                .replace(/^★\s*/, '')
                .replace(/StatTrak™\s*/i, '')
                .replace(/\s*\|\s*/g, '-')
                .replace(/[()]/g, '')
                .toLowerCase()
                .replace(/\s+/g, '-');
            // Add phase for doppler
            if (phaseName) {
                normalizedName += `-${phaseName.toLowerCase().replace(/\s+/g, '-')}`;
            }
            // Add exterior
            if (exteriorMappings.urlFormatted[exterior]) {
                normalizedName += `-${exteriorMappings.urlFormatted[exterior]}`;
            }
            url += normalizedName + '/';
            url += '?sort_by=price_asc';
            if (noTradeHold) url += '&hold=-1';
            if (minFloat > 0 || maxFloat < 1) {
                url += `&float_from=${minFloat}&float_to=${maxFloat}`;
            }
            return addUtmParams(url, 'skinland');
        }
        // For "Any" exterior searches
        let searchTerm = encodeURIComponent(finalSearchName);
        let url = `https://skin.land/market/csgo/?query=${searchTerm}&sort_by=price_asc`;
        if (isStatTrak) url += '&extras=is_stattrak';
        if (phaseName) url += `&phase=${encodeURIComponent(phaseName)}`;
        if (noTradeHold) url += '&hold=-1';
        if (minFloat > 0 || maxFloat < 1) {
            url += `&float_from=${minFloat}&float_to=${maxFloat}`;
        }
        return addUtmParams(url, 'skinland');
    }

    // CS.trade
    static generateCstrade(params, _mappings) {
        const { baseSearchName, finalSearchName, exterior, isVanillaSearch, isStatTrak, phaseName, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            const encodedName = encodeURIComponent(finalSearchName);
            return addUtmParams(`https://cs.trade/store?market_name=${encodedName}`, 'cstrade');
        }
        let searchName = finalSearchName;
        // Handle vanilla knives
        if (isVanillaSearch) {
            let vanillaName = baseSearchName.startsWith('★') ? baseSearchName : `★ ${baseSearchName}`;
            if (isStatTrak) {
                vanillaName = `★ StatTrak™ ${baseSearchName.replace(/^★\s*/, '')}`;
            }
            const encodedName = encodeURIComponent(vanillaName);
            return addUtmParams(`https://cs.trade/store?market_name=${encodedName}`, 'cstrade');
        }
        // Handle knives and gloves
        const isKnifeOrGlove = searchName.includes('Knife') || searchName.includes('Gloves') || searchName.includes('Wraps');
        if (isKnifeOrGlove && !searchName.startsWith('★')) {
            searchName = `★ ${searchName}`;
        }
        // Handle StatTrak
        if (isStatTrak && !searchName.includes('StatTrak™')) {
            if (searchName.startsWith('★')) {
                searchName = `★ StatTrak™ ${searchName.substring(2)}`;
            } else {
                searchName = `StatTrak™ ${searchName}`;
            }
        }
        // Handle phases for doppler
        if (phaseName) {
            searchName = searchName.replace(/\(Phase\s*\d+\)/i, phaseName);
        }
        // Add exterior if specified
        if (exterior && exterior !== 'Any') {
            if (exteriorMappings.labels[exterior]) {
                searchName += ` (${exteriorMappings.labels[exterior]})`;
            }
        }
        const encodedName = encodeURIComponent(searchName);
        return addUtmParams(`https://cs.trade/store?market_name=${encodedName}`, 'cstrade');
    }

    // itrade.gg
    static generateItradegg(params, _mappings) {
        const { baseSearchName, finalSearchName, exterior, isVanillaSearch, isStatTrak, phaseName, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            const formattedName = `${finalSearchName}`.replace(/\s+/g, '+').replace(/\+\|\+/g, '+|+');
            return addUtmParams(`https://itrade.gg/trade/csgo?search=${formattedName}&ref=dadscap`, 'itradegg');
        }
        let searchName = finalSearchName;
        if (isVanillaSearch) {
            let vanillaName = baseSearchName.startsWith('★') ? baseSearchName : `★ ${baseSearchName}`;
            if (isStatTrak) {
                vanillaName = `StatTrak™ ★ ${baseSearchName.replace(/^★\s*/, '')}`;
            }
            const formattedName = `${vanillaName}`.replace(/\s+/g, '+');
            return addUtmParams(`https://itrade.gg/trade/csgo?ref=dadscap&search=${formattedName}`, 'itradegg');
        }
        const isKnifeOrGlove = searchName.includes('Knife') || searchName.includes('Gloves') || searchName.includes('Wraps');
        if (isKnifeOrGlove && !searchName.startsWith('★')) {
            searchName = `★ ${searchName}`;
        }
        if (isStatTrak && !searchName.includes('StatTrak™')) {
            if (searchName.startsWith('★')) {
                searchName = `StatTrak™ ${searchName}`;
            } else {
                searchName = `StatTrak™ ${searchName}`;
            }
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
        return addUtmParams(`https://itrade.gg/trade/csgo?search=${formattedName}&ref=dadscap`, 'itradegg');
    }

    // Swap.gg
    static generateSwapgg(params, _mappings) {
        const { baseSearchName, finalSearchName, exterior, isVanillaSearch, isStatTrak, phaseName, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            const formattedName = `${finalSearchName}`.replace(/\s+/g, '+').replace(/\+\|\+/g, '+|+');
            return addUtmParams(`https://swap.gg/trade?search=${formattedName}&r=NZ5SmDRJfT`, 'swapgg');
        }
        let searchName = finalSearchName;
        if (isVanillaSearch) {
            let vanillaName = baseSearchName.startsWith('★') ? baseSearchName : `★ ${baseSearchName}`;
            if (isStatTrak) {
                vanillaName = `StatTrak™ ★ ${baseSearchName.replace(/^★\s*/, '')}`;
            }
            const formattedName = `${vanillaName}`.replace(/\s+/g, '+');
            return addUtmParams(`https://swap.gg/trade?search=${formattedName}&r=NZ5SmDRJfT`, 'swapgg');
        }
        const isKnifeOrGlove = searchName.includes('Knife') || searchName.includes('Gloves') || searchName.includes('Wraps');
        if (isKnifeOrGlove && !searchName.startsWith('★')) {
            searchName = `★ ${searchName}`;
        }
        if (isStatTrak && !searchName.includes('StatTrak™')) {
            if (searchName.startsWith('★')) {
                searchName = `StatTrak™ ${searchName}`;
            } else {
                searchName = `StatTrak™ ${searchName}`;
            }
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
        return addUtmParams(`https://swap.gg/trade?search=${formattedName}&r=NZ5SmDRJfT`, 'swapgg');
    }

    // SkinSwap
    static generateSkinswap(params, _mappings) {
        const { baseSearchName, finalSearchName, exterior, isVanillaSearch, isStatTrak, phaseName, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            const formattedName = `${finalSearchName}`.replace(/\s+/g, '+').replace(/\+\|\+/g, '+|+');
            return addUtmParams(`https://skinswap.com/r/dadscap?search=${formattedName}`, 'skinswap');
        }
        let searchName = finalSearchName;
        if (isVanillaSearch) {
            let vanillaName = baseSearchName.startsWith('★') ? baseSearchName : `★ ${baseSearchName}`;
            if (isStatTrak) {
                vanillaName = `StatTrak™ ★ ${baseSearchName.replace(/^★\s*/, '')}`;
            }
            const formattedName = `${vanillaName}`.replace(/\s+/g, '+');
            return addUtmParams(`https://skinswap.com/r/dadscap?search=${formattedName}`, 'skinswap');
        }
        const isKnifeOrGlove = searchName.includes('Knife') || searchName.includes('Gloves') || searchName.includes('Wraps');
        if (isKnifeOrGlove && !searchName.startsWith('★')) {
            searchName = `★ ${searchName}`;
        }
        if (isStatTrak && !searchName.includes('StatTrak™')) {
            if (searchName.startsWith('★')) {
                searchName = `StatTrak™ ${searchName}`;
            } else {
                searchName = `StatTrak™ ${searchName}`;
            }
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
        return addUtmParams(`https://skinswap.com/r/dadscap?search=${formattedName}`, 'skinswap');
    }

    // SkinsMonkey
    static generateSkinsmonkey(params, _mappings) {
        const { baseSearchName, finalSearchName, exterior, isVanillaSearch, isStatTrak, phaseName, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            const formattedName = `${finalSearchName}`.replace(/\s+/g, '+').replace(/\+\|\+/g, '+|+');
            return addUtmParams(`https://skinsmonkey.com/trade?q=${formattedName}`, 'skinsmonkey');
        }
        let searchName = finalSearchName;
        if (isVanillaSearch) {
            let vanillaName = baseSearchName.startsWith('★') ? baseSearchName : `★ ${baseSearchName}`;
            if (isStatTrak) {
                vanillaName = `StatTrak™ ★ ${baseSearchName.replace(/^★\s*/, '')}`;
            }
            const formattedName = `${vanillaName}`.replace(/\s+/g, '+');
            return addUtmParams(`https://skinsmonkey.com/trade?q=${formattedName}`, 'skinsmonkey');
        }
        const isKnifeOrGlove = searchName.includes('Knife') || searchName.includes('Gloves') || searchName.includes('Wraps');
        if (isKnifeOrGlove && !searchName.startsWith('★')) {
            searchName = `★ ${searchName}`;
        }
        if (isStatTrak && !searchName.includes('StatTrak™')) {
            if (searchName.startsWith('★')) {
                searchName = `StatTrak™ ${searchName}`;
            } else {
                searchName = `StatTrak™ ${searchName}`;
            }
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
        return addUtmParams(`https://skinsmonkey.com/trade?q=${formattedName}`, 'skinsmonkey');
    }

    // CS7.market
    static generateCs7market(params, _mappings) {
        const { finalSearchName, exterior, isVanillaSearch, isStatTrak, phaseName, fullInput } = params;
        if (isSpecialItemType(fullInput)) {
            return addUtmParams(`https://cs7.market/en/catalog?r=64af74&page=1&o=price&f_s=${encodeURIComponent(finalSearchName)}`, 'cs7market');
        }
        let searchName = finalSearchName;
        // CS7.market doesn't want special symbols in search
        searchName = searchName.replace(/^★\s*/, '').replace(/StatTrak™\s*/i, '');
        let url = `https://cs7.market/en/catalog?r=64af74&page=1&o=price&f_s=${encodeURIComponent(searchName)}`;
        if (isVanillaSearch) {
            // NP = "Not Painted" for vanilla items
            url += '&f_a_qal=NP';
        } else if (exterior && exterior !== 'Any') {
            // CS7 uses specific codes for exteriors
            if (exteriorMappings.cs7market[exterior]) {
                url += `&f_a_qal=${exteriorMappings.cs7market[exterior]}`;
            }
        }
        if (isStatTrak) {
            // CS7 uses binary flag (1) for StatTrak
            url += '&f_a_st=1';
        }
        if (phaseName && phaseMappings.cs7market?.[phaseName]) {
            url += `&f_a_phase=${phaseMappings.cs7market[phaseName]}`;
        }
        return addUtmParams(url, 'cs7market');
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