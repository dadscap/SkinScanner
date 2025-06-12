import {
    skinMap,
    buffMap,
    phaseMappings,
    exteriorIdMap,
    exteriorLabelMap, 
    spExteriorIdMap,
    lisSkinsExteriorIdMap,
    wearCategoryMap,
    whitemarketExteriorMap,
} from '../config/constants.js';
import { addUtmParams, ShadowPayUtmParams } from '../utils/url-helpers.js';

const phaseRegex = /\s*\((Phase\s*\d+|Ruby|Sapphire|Black Pearl|Emerald)\)/i;

export class MarketplaceURLs {
    // Avan.Martket
    static generateAvanmarket(params) {
        const { encodedBaseSearchName, minFloat, maxFloat, noTradeHold, isStatTrak, phaseName } = params;
        let url = `https://avan.market/en/market/cs?name=${encodedBaseSearchName}&float_min=${minFloat}&float_max=${maxFloat}&r=dadscap&sort=1`;
        url += (noTradeHold ? `&hold=0` : "");
        url += (isStatTrak ? '&special=StatTrak™' : '');
        if (phaseName && phaseMappings.avanmarket?.[phaseName]) {
            url += `&phase=${phaseMappings.avanmarket[phaseName]}`;
        }
        return addUtmParams(url, 'avanmarket');
    }
    // Bitskins
    static generateBitskins(params) {
        const { finalSearchName, minFloat, maxFloat, isVanillaSearch, exterior, noTradeHold, paintSeed, phaseName } = params;
        const currentExteriorId = exteriorIdMap[exterior]; 

        let whereClause = {
            skin_name: finalSearchName,
            float_value_from: minFloat,
            float_value_to: maxFloat,
            ...(isVanillaSearch ? { "exterior_id": [6] } : (exterior ? { exterior_id: [currentExteriorId] } : {})),
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
        return addUtmParams(baseUrl, 'bitskins');
    }
    // BUFF163
    static generateBuff(params) {
        const {
            isVanillaSearch,
            encodedBaseSearchName,
            isStatTrak,
            exterior, 
            phaseName,
            baseSearchName, 
            fullInput,     
            paintSeed,
            minFloat,
            maxFloat
        } = params;
        if (isVanillaSearch) {
            let vanillaUrl = `https://buff.163.com/market/csgo#game=csgo&page_num=1&category_group=knife&search=${encodedBaseSearchName}&exterior=wearcategoryna`;
            if (isStatTrak) {
                vanillaUrl += `&category=tag_weapon_stat`;
            }
            vanillaUrl += '&tab=selling';
            return addUtmParams(vanillaUrl, 'buff');
        }
        let buffGoodId = null;
        let phaseTagId = null;
        if (exterior && typeof buffMap !== 'undefined' && buffMap) {
            const buffMapLookupKey = phaseName ? baseSearchName : fullInput;
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
            fragmentParams.push(`min_paintwear=${minFloat}`);
            fragmentParams.push(`max_paintwear=${maxFloat}`);
            fragmentParams.push('sort_by=price.asc');
            baseUrl += fragmentParams.join('&');
            return addUtmParams(baseUrl, 'buff');
        } else {
            console.log("Buff163: Falling back to general search URL (non-vanilla).");
            let searchUrl = `https://buff.163.com/market/csgo#game=csgo&page_num=1&search=${encodedBaseSearchName}`;
            searchUrl += (isStatTrak ? `&category=tag_weapon_stat` : '');
            const searchExteriorFilter = wearCategoryMap[exterior]; // wearCategoryMap needs to be imported
            searchUrl += (searchExteriorFilter ? `&exterior=${searchExteriorFilter}` : "");
            if (paintSeed !== null) {
                searchUrl += `&paintseed=${paintSeed}`;
            }
            searchUrl += '&sort_by=price.asc';
            return addUtmParams(searchUrl, 'buff');
        }
    }
    // BUFF.Market
    static generateBuffmarket(params) {
        const { encodedBaseSearchName, isStatTrak, isVanillaSearch, exterior, minFloat, maxFloat } = params;
        const currentWearCategory = wearCategoryMap[exterior];
        let url = `https://buff.market/market/all?search=${encodedBaseSearchName}&sort_by=price.asc`;
        url += (isStatTrak ? `&category=stattrak` : '');
        if (isVanillaSearch) {
            url += `&series=not_painted`;
        } else if (currentWearCategory) {
            url += `&exterior=${currentWearCategory}`;
        }
        url += `&min_float=${minFloat}&max_float=${maxFloat}`;
        return addUtmParams(url, 'buffmarket');
    }
    // CS.Money
    static generateCsmoney(params) {
        const { phaseName, encodedFullInput, encodedBaseSearchName, minFloat, maxFloat, exterior, isStatTrak, paintSeed } = params;
        const searchNameParam = phaseName ? encodedFullInput : encodedBaseSearchName;
        let url = `https://cs.money/market/buy/?limit=60&offset=0&name=${searchNameParam}&order=asc&sort=price&minFloat=${minFloat}&maxFloat=${maxFloat}`;
        url += (exterior ? `&quality=${exterior}` : "");
        url += (isStatTrak ? `&isStatTrak=true` : "");
        url += (paintSeed !== null ? `&pattern=${paintSeed}` : "");
        return addUtmParams(url, 'csmoney');
    }
    // CS.Float
    static generateCsfloat(params) {
        const { fullInput, baseSearchName, minFloat, maxFloat, noTradeHold, paintSeed, isStatTrak } = params;
        let csfloatEntry = skinMap[fullInput];
        if (!csfloatEntry) {
            const baseMatchKey = Object.keys(skinMap).find(k => {
                const normalizedKey = k.toLowerCase().replace(phaseRegex, '').replace(/[|\s]+/g, ' ').trim();
                const normalizedInput = baseSearchName.toLowerCase().replace(/[|\s]+/g, ' ').trim();
                return normalizedKey === normalizedInput;
            });
            if (baseMatchKey) { csfloatEntry = skinMap[baseMatchKey]; }
        }
        if (!csfloatEntry) {
            return null;
        }
        const category = isStatTrak ? 2 : 1;
        let url = `https://csfloat.com/search?min_float=${minFloat}&max_float=${maxFloat}&def_index=${csfloatEntry.def_index}&paint_index=${csfloatEntry.paint_index}&category=${category}&sort_by=lowest_price`;
        url += (noTradeHold ? `&instant_sale_only=true` : "");
        url += (paintSeed !== null ? `&paint_seed=${paintSeed}` : "");
        return addUtmParams(url, 'csfloat');
    }
    // Market.csgo.com
    static generateCsgo(params) {
        const { encodedBaseSearchName, isStatTrak, isVanillaSearch, exterior, minFloat, maxFloat, phaseName } = params;
        const currentExteriorLabel = exteriorLabelMap[exterior];
        let url = `https://market.csgo.com/en/?search=${encodedBaseSearchName}`;
        url += (isStatTrak ? `&categories=StatTrak™` : '');
        if (isVanillaSearch) {
            url += `&quality=Not%20Painted`;
        } else if (currentExteriorLabel) {
            url += `&quality=${encodeURIComponent(currentExteriorLabel)}`;
        }
        url += (parseFloat(minFloat) > 0 || parseFloat(maxFloat) < 1 ? `&floatMin=${minFloat}&floatMax=${maxFloat}` : '');
        if (!isVanillaSearch && phaseName && phaseMappings.csgo?.[phaseName]) {
            url += `&phase=${phaseMappings.csgo[phaseName]}`;
        }
        url += '&sort=price&order=asc';
        return url + '&utm_campaign=newcampaign&utm_source=SkinScanner&cpid=28e643b6-8c56-4212-b09c-ba3cabec7d7a&oid=4c69d079-ad2a-44b0-a9ac-d0afc2167ee7';
    }
    // DMarket
    static generateDmarket(params) {
        const { encodedBaseSearchName, minFloat, maxFloat, isVanillaSearch, isStatTrak, exterior, noTradeHold, paintSeed, phaseName } = params;
        const currentExteriorLabel = exteriorLabelMap[exterior];
        let url = `https://dmarket.com/ingame-items/item-list/csgo-skins?title=${encodedBaseSearchName}&floatValueFrom=${minFloat}&floatValueTo=${maxFloat}`;
        if (isVanillaSearch) {
            url += `&family=vanilla`;
        } else {
            if (isStatTrak) url += `&category_0=stattrak_tm`;
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
    // GamerPay
    static generateGamerpay(params) {
        const { encodedBaseSearchName, minFloat, maxFloat, isStatTrak, noTradeHold, exterior, paintSeed, phaseName } = params;
        const currentExteriorLabel = exteriorLabelMap[exterior];
        let url = `https://gamerpay.gg/?query=${encodedBaseSearchName}&sortBy=price&ascending=true&floatMin=${minFloat}&floatMax=${maxFloat}&page=1`;
        url += (isStatTrak ? `&statTrak=True` : "");
        url += (noTradeHold ? `&tradeLockedDays=0` : "");
        url += (currentExteriorLabel ? `&wear=${currentExteriorLabel}` : "");
        url += (paintSeed !== null ? `&pattern=${paintSeed}` : "");
        if (phaseName && phaseMappings.gamerpay?.[phaseName]) {
            url += `&phases=${phaseMappings.gamerpay[phaseName]}`;
        }
        url += `&ref=764d43667d`; 
        return addUtmParams(url, 'gamerpay');
    }
    // Lis-skins
    static generateLisskins(params) {
        const { encodedBaseSearchName, isStatTrak, minFloat, maxFloat, isVanillaSearch, exterior, noTradeHold, phaseName } = params;
        const currentLisSkinsExteriorId = lisSkinsExteriorIdMap[exterior];
        let url = `https://lis-skins.com/market/csgo/?sort_by=price_asc&query=${encodedBaseSearchName}`;
        url += (isStatTrak ? `&is_stattrak=1` : "");
        url += `&float_from=${minFloat}&float_to=${maxFloat}`;
        if (isVanillaSearch) {
            url += `&exterior=5`;
        } else if (currentLisSkinsExteriorId) {
            url += `&exterior=${currentLisSkinsExteriorId}`;
        }
        url += (noTradeHold ? `&hold=-1` : "");
        if (!isVanillaSearch && phaseName && phaseMappings.lisskins?.[phaseName]) {
            url += `&phase=${phaseMappings.lisskins[phaseName]}`;
        }
        url += `&rf=1878725`;
        return addUtmParams(url, 'lisskins');
    }
    // ShadowPay
    static generateShadowpay(params) {
        const { exterior, minFloat, maxFloat, encodedBaseSearchName, isVanillaSearch, phaseName, isStatTrak } = params;
        const currentExteriorLabel = exteriorLabelMap[exterior];
        const wearLabelParam = currentExteriorLabel ? encodeURIComponent(`["${currentExteriorLabel}"]`) : "[]";
        const floatRangeParam = encodeURIComponent(JSON.stringify({ from: minFloat, to: maxFloat }));
        let searchString = encodedBaseSearchName;
        if (!isVanillaSearch && phaseName && phaseMappings.shadowpay?.[phaseName]) {
            searchString += phaseMappings.shadowpay[phaseName];
        }
        let url = `https://shadowpay.com/csgo-items?search=${searchString}&float=${floatRangeParam}&sort_column=price&sort_dir=asc`;
        if (isVanillaSearch) {
            url += `&vanilla_only=1`;
        } else {
            if (isStatTrak) url += `&is_stattrak=1`;
            if (exterior) url += `&exteriors=${wearLabelParam}`;
        }
        url += `&utm_campaign=KzvAR2XJATjoT8y`;
        return ShadowPayUtmParams(url, 'shadowpay');
    }
    // Skinport
    static generateSkinport(params) {
        const { encodedBaseSearchName, isVanillaSearch, exterior, isStatTrak, noTradeHold, paintSeed, phaseName } = params;
        const { wearGt, wearLt } = params;
        const currentSpExteriorId = spExteriorIdMap[exterior];

        const skinportSearchParam = encodedBaseSearchName.replace(/%20/g, '+');
        let url = `https://skinport.com/market?search=${skinportSearchParam}&order=asc&sort=price`;
        if (isVanillaSearch) {
            url += `&vanilla=1`;
        } else {
            url += `&weargt=${wearGt}&wearlt=${wearLt}`;
            if (currentSpExteriorId) url += `&exterior=${currentSpExteriorId}`;
            if (isStatTrak) url += `&stattrak=1`;
        }
        url += (noTradeHold ? `&lock=0` : "");
        url += (paintSeed !== null ? `&pattern=${paintSeed}` : "");
        if (!isVanillaSearch && phaseName && phaseMappings.skinport?.[phaseName]) {
            url += `&phase=${phaseMappings.skinport[phaseName]}`;
        }
        url += `&r=dadscap`;
        return addUtmParams(url, 'skinport');
    }
    // Steam
    static generateSteam(params) {
        const { finalSearchName, exterior, isVanillaSearch } = params;
        const currentExteriorLabel = exteriorLabelMap[exterior];
        const steamSearchName = finalSearchName + (!isVanillaSearch && currentExteriorLabel ? ` (${currentExteriorLabel})` : "");
        const baseUrl = `https://steamcommunity.com/market/search?q=${encodeURIComponent(steamSearchName)}&appid=730`;
        return addUtmParams(baseUrl, 'steam');
    }
    // Tradeit.gg
    static generateTradeit(params) {
        const { phaseName, isStatTrak, fullInput, finalSearchName, exterior, isVanillaSearch } = params;
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
    static generateWaxpeer(params) {
        const { encodedBaseSearchName, isStatTrak, exterior, minFloat, maxFloat, noTradeHold, phaseName } = params;
        let url = `https://waxpeer.com/en/r/dadscap?sort=ASC&order=price&all=0&search=${encodedBaseSearchName}`;
        url += (isStatTrak ? `&stat_trak=1` : "");
        url += (exterior ? `&exterior=${exterior.toUpperCase()}` : "");
        url += `&min_float=${minFloat}&max_float=${maxFloat}`;
        url += (noTradeHold ? `&instant=1` : "");
        if (phaseName && phaseMappings.waxpeer?.[phaseName]) {
            url += `&phase=${phaseMappings.waxpeer[phaseName]}`;
        }
        return addUtmParams(url, 'waxpeer');
    }
    // White.Market
    static generateWhitemarket(params) {
        const { encodedBaseSearchName, isVanillaSearch, minFloat, maxFloat, exterior, isStatTrak, paintSeed, phaseName } = params;
        const currentWhitemarketExteriorCode = whitemarketExteriorMap[exterior];
        let url = `https://white.market/market?name=${encodedBaseSearchName}&sort=pr_a&unique=false&ref=SkinScanner`;
        if (isVanillaSearch) {
            url += `&exterior=e5`;
        } else {
            url += `&float-from=${minFloat}&float-to=${maxFloat}`;
            if (exterior && currentWhitemarketExteriorCode) url += `&exterior=${currentWhitemarketExteriorCode}`;
            else url += '&exterior=e0%2Ce1%2Ce2%2Ce3%2Ce4';
        }
        url += (isStatTrak ? `&stattrak=true` : "");
        url += (paintSeed !== null ? `&pattern=${paintSeed}` : "");
        if (!isVanillaSearch && phaseName && phaseMappings.whitemarket?.[phaseName]) {
            url += `&phase=${phaseMappings.whitemarket[phaseName]}`;
        }
        return addUtmParams(url, 'whitemarket');
    }
    // Master (run all selected urls)
    static generateAll(params, selectedMarkets) {
        const urls = {};
        for (const market of selectedMarkets) {
            const methodName = `generate${market.charAt(0).toUpperCase() + market.slice(1)}`;
            if (typeof this[methodName] === 'function') {
                try {
                    urls[market] = this[methodName](params);
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