/* MarketplaceURLs
 * Generates marketplace URLs based on user input and selected parameters.
 */

import { phaseMappings, exteriorMappings, exteriorPresets, getItemCategory, ITEM_CATEGORIES } from '../config/constants.js';
import { addUtmParams, ShadowPayUtmParams } from '../utils/url-helpers.js';

function isDefaultFloatRange(exterior, minFloat, maxFloat) {
    if (!exterior || !exteriorPresets[exterior]) return false;
    const [defaultMin, defaultMax] = exteriorPresets[exterior];
    return parseFloat(minFloat) === defaultMin && parseFloat(maxFloat) === defaultMax;
}

export class MarketplaceURLs {

    // Avanmarket
    static generateAvanmarket(params, _mappings) {
        const { encodedBaseSearchName, minFloat, maxFloat, isStatTrak, phaseName, isVanillaSearch, fullInput } = params;
        let url = `https://avan.market/en/market/cs?name=${encodedBaseSearchName}&r=dadscap&sort=1`;
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            return addUtmParams(url);
        }
        if (!isVanillaSearch && !isDefaultFloatRange(exterior, minFloat, maxFloat)) {
            url += `&float_min=${minFloat}&float_max=${maxFloat}`;
        }
        url += (isStatTrak ? '&special=StatTrak™' : '');
        if (!isVanillaSearch && phaseName && phaseMappings.avanmarket?.[phaseName]) {
            url += `&phase=${phaseMappings.avanmarket[phaseName]}`;
        }
        return addUtmParams(url);
    }

    // Bitskins
    static generateBitskins(params, _mappings) {
        const { finalSearchName, minFloat, maxFloat, isVanillaSearch, exterior, noTradeHold, paintSeed, phaseName, fullInput } = params;
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            const baseUrl = `https://bitskins.com/market/cs2?search=${encodeURIComponent(JSON.stringify({
                order: [{ field: "price", order: "ASC" }],
                where: { skin_name: finalSearchName }
            }))}&ref_alias=dadscap`;
            return addUtmParams(baseUrl);
        }
        const currentExteriorId = exteriorMappings.default[exterior];
        const includeFloatRange = !isDefaultFloatRange(exterior, minFloat, maxFloat);
        let whereClause = {
            skin_name: finalSearchName,
            ...(isVanillaSearch ? { "exterior_id": [6] } : {
                ...(includeFloatRange ? { float_value_from: minFloat, float_value_to: maxFloat } : {}),
                ...(exterior ? { exterior_id: [currentExteriorId] } : {})
            }),
            ...(noTradeHold ? { tradehold_to: 0 } : {}),
            ...(paintSeed !== null ? { "paint_seed": [paintSeed] } : {})
        };
        if (!isVanillaSearch && phaseName && phaseMappings.bitskins?.[phaseName]) {
            whereClause["phase_id"] = [phaseMappings.bitskins[phaseName]];
        }
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
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            let itemData = buffMap ? buffMap[fullInput] : null;
            if (!itemData && buffMap) {
                const normalizedInput = fullInput
                    .replace(/^★\s*/, '')
                    .replace(/['"]/g, "'")
                    .replace(/\s+/g, ' ')
                    .trim();
                for (const [key, value] of Object.entries(buffMap)) {
                    const normalizedKey = key
                        .replace(/^★\s*/, '')
                        .replace(/['"]/g, "'")
                        .replace(/\s+/g, ' ')
                        .trim();
                    if (normalizedInput === normalizedKey) {
                        itemData = value;
                        break;
                    }
                }
                if (!itemData) {
                    itemData = buffMap[fullInput];
                }
            }
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
            let searchUrl = `https://buff.163.com/market/csgo#game=csgo&page_num=1&search=${encodedBaseSearchName}`;
            searchUrl += (isStatTrak ? `&category=tag_weapon_stat` : '');
            return addUtmParams(searchUrl);
        }
        if (isVanillaSearch) {
            let buffGoodId = null;
            if (fullInput.includes(' | Vanilla')) {
                const knifeName = fullInput.replace(' | Vanilla', '');
                if (buffMap) {
                    const buffItemData = buffMap[knifeName];
                    if (buffItemData) {
                        if (isStatTrak && buffItemData['st_vanilla']) {
                            buffGoodId = buffItemData['st_vanilla'];
                        } else if (!isStatTrak && buffItemData['vanilla']) {
                            buffGoodId = buffItemData['vanilla'];
                        }
                    }
                }
            }
            if (buffGoodId !== null) {
                let baseUrl = `https://buff.163.com/goods/${buffGoodId}?from=market`;
                return addUtmParams(baseUrl);
            } else {
                let vanillaUrl = `https://buff.163.com/market/csgo#game=csgo&page_num=1&category_group=knife&search=${encodedBaseSearchName}&exterior=wearcategoryna`;
                if (isStatTrak) {
                    vanillaUrl += `&category=tag_weapon_stat`;
                }
                vanillaUrl += '&tab=selling';
                return addUtmParams(vanillaUrl);
            }
        }
        let buffGoodId = null;
        let phaseTagId = null;
        if (exterior && buffMap) {
            const buffMapLookupKey = phaseName ? `★ ${baseSearchName}` : fullInput;
            const buffItemData = buffMap[buffMapLookupKey];
            if (buffItemData) {
                const buffIdKey = isStatTrak ? `st_${exterior}` : exterior;
                const exteriorData = buffItemData[buffIdKey];
                if (exteriorData) {
                    if (phaseName && typeof exteriorData === 'object' && !Array.isArray(exteriorData) && exteriorData !== null) {
                        if (exteriorData[phaseName]) {
                            phaseTagId = exteriorData[phaseName];
                        }
                        if (exteriorData["buff163_goods_id"]) {
                            buffGoodId = exteriorData["buff163_goods_id"];
                        } else {
                            console.warn(`Buff163: Missing 'buff163_goods_id' for ${baseSearchName} - ${buffIdKey} (Phase: ${phaseName})`);
                        }
                    } else if (!phaseName && typeof exteriorData === 'number') {
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
        if (buffGoodId !== null) {
            let baseUrl = `https://buff.163.com/goods/${buffGoodId}?from=market#`;
            let fragmentParams = [];
            if (phaseTagId !== null) {
                fragmentParams.push(`tag_ids=${phaseTagId}`);
            }
            if (paintSeed !== null) {
                fragmentParams.push(`paintseed=${paintSeed}`);
            }
            if (!isDefaultFloatRange(exterior, minFloat, maxFloat)) {
                fragmentParams.push(`min_paintwear=${minFloat}`);
                fragmentParams.push(`max_paintwear=${maxFloat}`);
            }
            baseUrl += fragmentParams.join('&');
            return addUtmParams(baseUrl);
        } else {
            console.log("Buff163: Falling back to general search URL (non-vanilla).");
            let searchUrl = `https://buff.163.com/market/csgo#game=csgo&page_num=1&search=${encodedBaseSearchName}`;
            searchUrl += (isStatTrak ? `&category=tag_weapon_stat` : '');
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
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            let itemData = bMarketMap ? bMarketMap[fullInput] : null;
            if (!itemData && bMarketMap) {
                const normalizedInput = fullInput
                    .replace(/^★\s*/, '')
                    .replace(/['"]/g, "'")
                    .replace(/\s+/g, ' ')
                    .trim();
                for (const [key, value] of Object.entries(bMarketMap)) {
                    const normalizedKey = key
                        .replace(/^★\s*/, '')
                        .replace(/['"]/g, "'")
                        .replace(/\s+/g, ' ')
                        .trim();
                    if (normalizedInput === normalizedKey) {
                        itemData = value;
                        break;
                    }
                }
                if (!itemData) {
                    itemData = bMarketMap[fullInput];
                }
            }
            if (itemData && itemData.goods_id) {
                const url = `https://buff.market/market/goods/${itemData.goods_id}`;
                return addUtmParams(url);
            }
            let searchUrl = `https://buff.market/market/all?search=${encodedBaseSearchName}`;
            searchUrl += (isStatTrak ? `&category=tag_weapon_stat` : '');
            return addUtmParams(searchUrl);
        }
        if (isVanillaSearch) {
            let bMarketGoodId = null;
            if (bMarketMap) {
                const itemData = bMarketMap[baseSearchName];
                if (itemData) {
                    bMarketGoodId = isStatTrak ? itemData["st_vanilla"] : itemData["vanilla"];
                }
            }
            if (bMarketGoodId) {
                const url = `https://buff.market/market/goods/${bMarketGoodId}`;
                return addUtmParams(url);
            } else {
                let vanillaUrl = `https://buff.market/market/all?search=${encodedBaseSearchName}`;
                if (isStatTrak) {
                    vanillaUrl += `&category=tag_weapon_stat`;
                }
                vanillaUrl += '&tab=selling';
                return addUtmParams(vanillaUrl);
            }
        }
        let bMarketGoodId = null;
        let phaseTagId = null;
        if (exterior && bMarketMap) {
            const bMarketMapLookupKey = phaseName ? `★ ${baseSearchName}` : fullInput;
            const bMarketItemData = bMarketMap[bMarketMapLookupKey];
            if (bMarketItemData) {
                const bMarketIdKey = isStatTrak ? `st_${exterior}` : exterior;
                const exteriorData = bMarketItemData[bMarketIdKey];
                if (exteriorData) {
                    if (phaseName && typeof exteriorData === 'object' && !Array.isArray(exteriorData) && exteriorData !== null) {
                        if (exteriorData[phaseName]) {
                            phaseTagId = exteriorData[phaseName];
                        }
                        if (exteriorData["bmarket_goods_id"]) {
                            bMarketGoodId = exteriorData["bmarket_goods_id"];
                        }
                    } else if (!phaseName && typeof exteriorData === 'number') {
                        bMarketGoodId = exteriorData;
                    } else if (!phaseName && typeof exteriorData === 'object' && exteriorData["bmarket_goods_id"]) {
                        bMarketGoodId = exteriorData["bmarket_goods_id"];
                    }
                }
            }
        }
        if (bMarketGoodId !== null) {
            let baseUrl = `https://buff.market/market/goods/${bMarketGoodId}?tab=Sell&`;
            let fragmentParams = [];
            if (phaseTagId !== null) {
                fragmentParams.push(`tag_ids=${phaseTagId}`);
            }
            if (paintSeed !== null) {
                fragmentParams.push(`paintseed=${paintSeed}`);
            }
            if (!isDefaultFloatRange(exterior, minFloat, maxFloat)) {
                fragmentParams.push(`min_paintwear=${minFloat}`);
                fragmentParams.push(`max_paintwear=${maxFloat}`);
            }
            baseUrl += fragmentParams.join('&');
            return addUtmParams(baseUrl);
        } else {
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

    // C5Game
    static generateC5(params, mappings) {
        const { baseSearchName, fullInput, finalSearchName, encodedBaseSearchName, isStatTrak, exterior, isVanillaSearch, minFloat, maxFloat, paintSeed, phaseName } = params;
        const { c5Map } = mappings || {};
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            let id = c5Map ? c5Map[fullInput] : null;
            if (!id && c5Map) {
                const normalizedInput = fullInput
                    .replace(/['"]/g, "'")
                    .replace(/\s+/g, ' ')
                    .trim();
                for (const [key, value] of Object.entries(c5Map)) {
                    const normalizedKey = key
                        .replace(/['"]/g, "'")
                        .replace(/\s+/g, ' ')
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
            let url = `https://c5game.com/csgo?keyword=${encodedBaseSearchName}`;
            url += (isStatTrak ? `&statTrak=1` : "");
            return addUtmParams(url);
        }
        const currentWearCategory = exteriorMappings.wearCategory[exterior];
        if (isVanillaSearch || exterior) {
            let key;
            let secondaryKey;
            if (isVanillaSearch) {
                if (fullInput.includes(' | Vanilla')) {
                    if (isStatTrak) {
                        key = fullInput.replace('★', '★ StatTrak™');
                    } else {
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
                const isKnife = fullInput.startsWith('★');
                const isDoppler = finalSearchName.includes('Doppler') && !finalSearchName.includes('Gamma');
                const isGammaDoppler = finalSearchName.includes('Gamma Doppler');
                const label = exteriorMappings.labels[exterior];
                if (isDoppler || isGammaDoppler) {
                    key = `${isKnife ? '★ ' : ''}${isStatTrak ? 'StatTrak™ ' : ''}${baseSearchName}${label ? ` (${label})` : ''}`;
                } else {
                    key = `${isKnife ? '★ ' : ''}${isStatTrak ? 'StatTrak™ ' : ''}${baseSearchName}${label ? ` (${label})` : ''}`;
                }
            }
                let id = c5Map ? c5Map[key] : null;
                if (!id && secondaryKey && c5Map) {
                    id = c5Map[secondaryKey];
                }
            if (id) {
                const encodedItemName = encodeURIComponent(key);
                let url = `https://c5game.com/csgo/${id}/${encodedItemName}/sell?`;
                if (!isVanillaSearch && !isDefaultFloatRange(exterior, minFloat, maxFloat)) {
                    url += `&minWear=${minFloat}&maxWear=${maxFloat}`;
                }
                if (paintSeed !== null && paintSeed !== undefined) {
                    url += `&paintSeed=${paintSeed}`;
                }
                if (phaseName && phaseMappings.c5game?.[phaseName]) {
                    url += `&levelIds=${phaseMappings.c5game[phaseName]}`;
                }
                return addUtmParams(url);
            }
        }
        let url = `https://c5game.com/csgo?keyword=${encodedBaseSearchName}`;
        url += (isStatTrak ? `&statTrak=1` : "");
        url += (currentWearCategory ? `&exterior=${currentWearCategory}` : "");
        if (!isDefaultFloatRange(exterior, minFloat, maxFloat)) {
            url += `&min_float=${minFloat}&max_float=${maxFloat}`;
        }
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
            const baseMatchKey = Object.keys(skinMap).find(k => {
                const normalizedKey = k.toLowerCase().replace(/[|\s]+/g, ' ').trim();
                const normalizedInput = baseSearchName.replace(/^StatTrak™\s*/i, '').toLowerCase().replace(/[|\s]+/g, ' ').trim();
                return normalizedKey === normalizedInput;
            });
            if (baseMatchKey) { csfloatEntry = skinMap[baseMatchKey]; }
        }
        if (!csfloatEntry) {
            return null;
        }
        const category = isStatTrak ? 2 : 1;
        let urlParams = '';
        const itemName = fullInput;
        if (getItemCategory(itemName) === ITEM_CATEGORIES.SPECIAL) {
            if (itemName.startsWith("Sticker |")) {
                urlParams = `sticker_index=${csfloatEntry.sticker_index}`;
            } else if (itemName.startsWith("Patch |")) {
                urlParams = `sticker_index=${csfloatEntry.sticker_index}`;
            } else if (itemName.startsWith("Charm |")) {
                urlParams = `keychain_index=${csfloatEntry.keychain_index}`;
            } else if (itemName.startsWith("Music Kit |")) {
                urlParams = `music_kit_index=${csfloatEntry.music_kit_index}`;
            } else {
                urlParams = `def_index=${csfloatEntry.def_index}`;
            }
        } else if (csfloatEntry.paint_index === undefined || csfloatEntry.paint_index === null) {
            urlParams = `def_index=${csfloatEntry.def_index}`;
        } else {
            urlParams = `def_index=${csfloatEntry.def_index}&paint_index=${csfloatEntry.paint_index}`;
        }
        let url = `https://csfloat.com/search?${urlParams}`;
        if (urlParams.includes('paint_index')) {
            url += `&category=${category}`;
            if (!isVanillaSearch && !isDefaultFloatRange(exterior, minFloat, maxFloat)) {
                url += `&min_float=${minFloat}&max_float=${maxFloat}`;
            }
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
            const knifeName = baseSearchName.startsWith('★') ? baseSearchName : `★ ${baseSearchName}`;
            searchNameParam = encodeURIComponent(knifeName);
        } else {
            searchNameParam = phaseName ? encodedFullInput : encodedBaseSearchName;
        }
        let url = `https://cs.money/market/buy/?limit=60&offset=0&name=${searchNameParam}&order=asc&sort=price`;
        if (!isVanillaSearch) {
            if (!isDefaultFloatRange(exterior, minFloat, maxFloat)) {
                url += `&minFloat=${minFloat}&maxFloat=${maxFloat}`;
            }
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
            url += `&family=vanilla`;
            if (isStatTrak) url += `&category_0=stattrak_tm`;
        } else {
            if (!isDefaultFloatRange(exterior, minFloat, maxFloat)) {
                url += `&floatValueFrom=${minFloat}&floatValueTo=${maxFloat}`;
            }
            if (isStatTrak) url += `&category_0=stattrak_tm`;
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
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            const goodsId = ecoMap ? ecoMap[fullInput] : null;
            if (goodsId) {
                const url = `https://www.ecosteam.cn/goods/730-${goodsId}-1-laypagesale-0-1.html`;
                return addUtmParams(url);
            }
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
        let goodsId = ecoMap ? ecoMap[key] : null;
        if (!goodsId && secondaryKey && ecoMap) {
            goodsId = ecoMap[secondaryKey];
        }
        if (goodsId) {
            const url = `https://www.ecosteam.cn/goods/730-${goodsId}-1-laypagesale-0-1.html`;
            return addUtmParams(url);
        }
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
        const queryName = isVanillaSearch ? encodeURIComponent(`${baseSearchName} | Vanilla`) : encodedBaseSearchName;
        let url = `https://gamerpay.gg/?query=${queryName}&sortBy=price&ascending=true&page=1`;
        if (!isVanillaSearch) {
            if (!isDefaultFloatRange(exterior, minFloat, maxFloat)) {
                url += `&floatMin=${minFloat}&floatMax=${maxFloat}`;
            }
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
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            let id = c5Map ? c5Map[fullInput] : null;
            if (!id && c5Map) {
                const normalizedInput = fullInput
                    .replace(/^★\s*/, '')
                    .replace(/['"]/g, "'")
                    .replace(/\s+(Phase\s*\d+|Ruby|Sapphire|Black Pearl|Emerald)$/i, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                for (const [key, value] of Object.entries(c5Map)) {
                    const normalizedKey = key
                        .replace(/^★\s*/, '')
                        .replace(/['"]/g, "'")
                        .replace(/\s+(Phase\s*\d+|Ruby|Sapphire|Black Pearl|Emerald)$/i, '')
                        .replace(/\s+/g, ' ')
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
            let url = `https://haloskins.com/market?keyword=${encodedBaseSearchName}&sort=1`;
            url += (isStatTrak ? `&statTrak=1` : "");
            return addUtmParams(url);
        }
        const currentWearCategory = exteriorMappings.wearCategory[exterior];
        if (isVanillaSearch || (exterior && exterior !== 'Any')) {
            let key;
            let secondaryKey;
            if (isVanillaSearch) {
                if (fullInput.includes(' | Vanilla')) {
                    if (isStatTrak) {
                        key = fullInput.replace('★', '★ StatTrak™');
                    } else {
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
                const isKnife = fullInput.startsWith('★');
                const label = exteriorMappings.labels[exterior];
                key = `${isKnife ? '★ ' : ''}${isStatTrak ? 'StatTrak™ ' : ''}${baseSearchName}${label ? ` (${label})` : ''}`;
            }
            let id = c5Map ? c5Map[key] : null;
            if (!id && secondaryKey && c5Map) {
                id = c5Map[secondaryKey];
            }
            if (id) {
                const url = `https://haloskins.com/market/${id}`;
                return addUtmParams(url);
            }
        }
        let url = `https://haloskins.com/market?keyword=${encodedBaseSearchName}&sort=1`;
        url += (isStatTrak ? `&statTrak=1` : "");
        url += (currentWearCategory ? `&exterior=${currentWearCategory}` : "");
        if (!isDefaultFloatRange(exterior, minFloat, maxFloat)) {
            url += `&min_float=${minFloat}&max_float=${maxFloat}`;
        }
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
                searchName = searchName.replace(/\(Phase\s*\d+\)/i, `(${phaseName})`);
            }
        }
        if (exterior && exterior !== 'Any') {
            if (exteriorMappings.labels[exterior]) {
                searchName += ` (${exteriorMappings.labels[exterior]})`;
            }
        }
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
            url += `&exterior=5`;
        } else {
            if (!isDefaultFloatRange(exterior, minFloat, maxFloat)) {
                url += `&float_from=${minFloat}&float_to=${maxFloat}`;
            }
            if (currentLisSkinsExteriorId) {
                url += `&exterior=${currentLisSkinsExteriorId}`;
            }
        }
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
            return url + '&utm_campaign=newcampaign&utm_source=SkinScanner&cpid=28e643b6-8c56-4212-b09c-ba3cabec7d7a&oid=4c69d079-ad2a-44b0-a9ac-d0afc2167ee7';
        }
        const currentExteriorLabel = exteriorMappings.labels[exterior];
        let url = `https://market.csgo.com/en/?search=${encodedBaseSearchName}`;
        url += (isStatTrak ? `&categories=StatTrak™` : '');
        if (isVanillaSearch) {
            url += `&quality=Not%20Painted`;
        } else if (currentExteriorLabel) {
            url += `&quality=${encodeURIComponent(currentExteriorLabel)}`;
        }
        if (!isVanillaSearch && !isDefaultFloatRange(exterior, minFloat, maxFloat)) {
            url += `&floatMin=${minFloat}&floatMax=${maxFloat}`;
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
        const wearKey = isStatTrak ? `st_${exterior}` : exterior;
        let mhnc = pirateEntry[wearKey];
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
        const plus = (s) => (s || '').trim().replace(/\s+/g, '+');
        const wrap = (query) => `https://rapidskins.com/a/dadscap#rsredir=${encodeURIComponent(`https://www.rapidskins.com/buy?${query}`)}`;
        if (category === ITEM_CATEGORIES.SPECIAL) {
            let query = `search=${plus(baseSearchName)}`;
            if (noTradeHold) query += `&maximumUnlockDays=0`;
            return wrap(query);
        }
        const isVanillaByName = /\|\s*Vanilla/i.test(baseSearchName) || /\|\s*Vanilla/i.test(fullInput || '');
        const isVanillaKnifeNoSkin = !/\|/.test(baseSearchName) && /\b(knife|bayonet|karambit|butterfly|flip|gut|huntsman|bowie|falchion|stiletto|kukri|navaja|talon|ursus|paracord|survival|nomad|skeleton|classic|shadow\s*daggers|m9)\b/i.test(baseSearchName);
        if (isVanillaSearch || isVanillaByName || isVanillaKnifeNoSkin) {
            const knifeName = baseSearchName.replace(/\s*\|\s*Vanilla/i, '').replace(/^★\s*/, '');
            const proper = isStatTrak ? `★ StatTrak™ ${knifeName}` : `★ ${knifeName}`;
            let query = `marketHashNames=${plus(proper)}`;
            if (noTradeHold) query += `&maximumUnlockDays=0`;
            return wrap(query);
        }
        const knifeNameRegex = /\b(knife|bayonet|karambit|butterfly|flip|gut|huntsman|bowie|falchion|stiletto|kukri|navaja|talon|ursus|paracord|survival|nomad|skeleton|classic|shadow\s*daggers|m9)\b/i;
        const isKnife = (category === ITEM_CATEGORIES.KNIFE) || knifeNameRegex.test(baseSearchName);
        const isGlove = category === ITEM_CATEGORIES.GLOVE;
        const isWeapon = category === ITEM_CATEGORIES.WEAPON;
        const useSearch = (isKnife || isGlove || isWeapon) && !exteriorLabel && !isVanillaSearch && !(/\|\s*Vanilla/i.test(baseSearchName) || /\|\s*Vanilla/i.test(fullInput || ''));
        if (useSearch) {
            let query = `search=${plus(baseSearchName)}`;
            if (noTradeHold) query += `&maximumUnlockDays=0`;
            return wrap(query);
        }
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
        const currentExteriorLabel = exteriorMappings.labels[exterior];
        const wearLabelParam = currentExteriorLabel ? encodeURIComponent(`["${currentExteriorLabel}"]`) : "[]";
        let searchString = encodedBaseSearchName;
        if (!isVanillaSearch && phaseName && phaseMappings.shadowpay?.[phaseName]) {
            searchString += phaseMappings.shadowpay[phaseName];
        }
        let url = `https://shadowpay.com/csgo-items?search=${searchString}&sort_column=price&sort_dir=asc`;
        if (isVanillaSearch) {
            url += `&vanilla_only=1`;
        } else {
            if (!isDefaultFloatRange(exterior, minFloat, maxFloat)) {
                const floatRangeParam = encodeURIComponent(JSON.stringify({ from: minFloat, to: maxFloat }));
                url += `&float=${floatRangeParam}`;
            }
            if (exterior) url += `&exteriors=${wearLabelParam}`;
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
            if (!isDefaultFloatRange(exterior, wearGt, wearLt)) {
                url += `&wlb=${wearGt}&wub=${wearLt}`;
            }
            url += (currentExteriorId ? `&exterior=${currentExteriorId}` : "");
        } else {
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
            searchString = `${searchString} (${currentExteriorLabel})`;
        }
        const encodedSearch = searchString.replace(/ /g, '+');
        return addUtmParams(`https://skinflow.gg/buy?referral=DADSCAP&search=${encodedSearch}`);
    }

    // Skinout
    static generateSkinout(params, _mappings) {
        const { baseSearchName, minFloat, maxFloat, isStatTrak, noTradeHold, exterior, phaseName, isVanillaSearch, fullInput } = params;
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            let skinoutSearchTerm = baseSearchName;
            if (isStatTrak) {
                skinoutSearchTerm = `StatTrak™ ${baseSearchName}`;
            }
            const encodedSkinoutSearchTerm = encodeURIComponent(skinoutSearchTerm);
            let url = `https://skinout.gg/en/market?search=${encodedSkinoutSearchTerm}&sort=price_asc`;
            return addUtmParams(url);
        }
        if (isVanillaSearch) {
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
        if (!isDefaultFloatRange(exterior, minFloat, maxFloat)) {
            url += `&float_min=${minFloat}&float_max=${maxFloat}`;
        }
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
        if (isVanillaSearch) {
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
        if (!exterior || exterior === 'Any') {
            let url = `https://skin.place/buy-cs2-skins?search=${encodeURIComponent(finalSearchName.replace(/^★\s*/, ''))}&sort_column=price&sort_dir=asc&utm_campaign=US5shYfSgvPfQCV`;
            if (isStatTrak) {
                url += '&is_stattrak=1';
            }
            if (phaseName) {
                const phaseFormatted = phaseName.replace(' ', '+');
                url += `&phases=["${phaseFormatted}"]`;
            }
            if (noTradeHold) {
                url += '&is_hold=0';
            }
            return addUtmParams(url);
            
        }
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
        let url = `https://skin.place/buy-cs2-skins/${normalizedName}`;
        const queryParams = [];
        queryParams.push('utm_campaign=US5shYfSgvPfQCV');
        if (isStatTrak) {
            queryParams.push('is_stattrak=1');
        }
        if (exteriorMappings.urlFormattedPlus[exterior]) {
            queryParams.push(`exterior=${exteriorMappings.urlFormattedPlus[exterior]}`);
        }
        if (!isDefaultFloatRange(exterior, minFloat, maxFloat)) {
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
            url += `&vanilla=1`;
        } else {
            if (!isDefaultFloatRange(exterior, wearGt, wearLt)) {
                url += `&weargt=${wearGt}&wearlt=${wearLt}`;
            }
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
        const slug = baseSearchName
            .replace(/★\s*/g, '')
            .replace(/StatTrak™\s*/gi, '')
            .replace(/\s*\|\s*/g, '-')
            .replace(/\s+/g, '-')
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL) {
            return addUtmParams(`https://skins.com/item/${slug}`);
        }
        const queryParams = [];
        if (!isVanillaSearch && exterior && exterior !== 'Any') {
            queryParams.push(`exterior=${exterior}`);
        }
        if (isStatTrak) {
            queryParams.push('st=true');
        }
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
                const nameWithoutStar = name.startsWith('★ ') ? name.substring(2) : name;
                name = `★ StatTrak™ ${nameWithoutStar}`;
            }
            const encoded = encodeURIComponent(name);
            const url = `https://steamcommunity.com/market/listings/730/${encoded}`;
            return addUtmParams(url);
        }
        if (exterior && exterior !== 'Any') {
            const knifeAndGloveIdentifiers = ["Knife |", "Bayonet |", "Daggers |", "Karambit |", "Gloves |", "Wraps |"];
            const isKnifeOrGlove = knifeAndGloveIdentifiers.some(identifier => finalSearchName.includes(identifier));
            let searchName = finalSearchName;
            if (isKnifeOrGlove && !finalSearchName.startsWith('★')) {
                searchName = `★ ${finalSearchName}`;
            }
            const itemName = `${searchName}${currentExteriorLabel ? ` (${currentExteriorLabel})` : ''}`;
            const encoded = encodeURIComponent(itemName);
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
        const searchQuery = isVanillaSearch ? `${encodedBaseSearchName}&exact=1` : encodedBaseSearchName;
        let url = `https://waxpeer.com/r/dadscap?all=0&search=${searchQuery}`;
        url += (isStatTrak ? `&stat_trak=1` : "");
        if (!isVanillaSearch) {
            url += (exterior ? `&exterior=${exterior.toUpperCase()}` : "");
            if (!isDefaultFloatRange(exterior, minFloat, maxFloat)) {
                url += `&min_float=${minFloat}&max_float=${maxFloat}`;
            }
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
            url += `&exterior=e5`;
        } else {
            if (!isDefaultFloatRange(exterior, minFloat, maxFloat)) {
                url += `&float-from=${minFloat}&float-to=${maxFloat}`;
            }
            if (exterior && currentWhitemarketExteriorCode) url += `&exterior=${currentWhitemarketExteriorCode}`;
            else url += '&exterior=e0%2Ce1%2Ce2%2Ce3%2Ce4';
        }
        url += (isStatTrak ? `&stattrak=true` : "");
        url += (paintSeed !== null ? `&pattern=${paintSeed}` : "");
        if (!isVanillaSearch && phaseName && phaseMappings.whitemarket?.[phaseName]) {
            url += `&phase=${phaseMappings.whitemarket[phaseName]}`;
        }
        return addUtmParams(url);
    }

    // YouPin898
    static generateYoupin(params, mappings) {
        const { baseSearchName, fullInput, finalSearchName, encodedBaseSearchName, isStatTrak, exterior, isVanillaSearch } = params;
        const { uuMap } = mappings || {};
        if (getItemCategory(fullInput) === ITEM_CATEGORIES.SPECIAL || isVanillaSearch || (!isVanillaSearch && exterior && exterior !== 'Any')) {
            let key;
            let secondaryKey;
            if (isVanillaSearch) {
                if (fullInput.includes(' | Vanilla')) {
                    if (isStatTrak) {
                        key = fullInput.replace('★', '★ StatTrak™');
                    } else {
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
                const isDoppler = finalSearchName.includes('Doppler') && !finalSearchName.includes('Gamma');
                const isGammaDoppler = finalSearchName.includes('Gamma Doppler');
                const isKnife = fullInput.startsWith('★');
                const label = exteriorMappings.labels[exterior];
                if (isDoppler || isGammaDoppler) {
                    key = `${isKnife ? '★ ' : ''}${isStatTrak ? 'StatTrak™ ' : ''}${baseSearchName}${label ? ` (${label})` : ''}`;
                } else {
                    key = `${isKnife ? '★ ' : ''}${isStatTrak ? 'StatTrak™ ' : ''}${baseSearchName}${label ? ` (${label})` : ''}`;
                }
            }
            let id = uuMap ? uuMap[key] : null;
            if (!id && secondaryKey && uuMap) {
                id = uuMap[secondaryKey];
            }
            if (id) {
                const url = `https://youpin898.com/market/goods-list?listType=10&templateId=${id}&gameId=730`;
                return addUtmParams(url);
            }
        }
        let url = `https://youpin898.com/market/goods-list?listType=10&gameId=730&keyword=${encodedBaseSearchName}`;
        url += (isStatTrak ? `&statTrak=1` : "");
        return addUtmParams(url);
    }

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