/* SearchProcessor
 * Processes user input and extracts all search parameters for marketplace URLs.
 */

import { validatePaintSeed } from '../utils/validation.js';
import { canHaveStatTrak, canHaveFloat, canHavePaintSeed } from '../config/constants.js';


export class SearchProcessor {
    /**
     * Processes user input and extracts all search parameters for marketplace URLs
     * Applies validation logic to prevent invalid attribute combinations for different item types
     * @param {string} fullInput - The complete search input from the user
     * @param {boolean} isStatTrakChecked - Whether StatTrak option is selected
     * @param {string} exterior - The exterior condition (e.g., "Factory New", "Field-Tested")
     * @param {number} minFloat - Minimum float value (0-1)
     * @param {number} maxFloat - Maximum float value (0-1)
     * @param {string} paintSeedValue - Paint seed value as string
     * @returns {Object|null} Processed search parameters object with validated attributes, or null if input is empty
     * @returns {Object.capabilities} Object containing boolean flags for item capabilities (canHaveStatTrak, canHaveFloat, canHavePaintSeed)
     */
    static processInput(fullInput, isStatTrakChecked, exterior, minFloat, maxFloat, paintSeedValue) {
        const trimmedFullInput = fullInput.trim();
        if (!trimmedFullInput) return null;

        const isKnife = trimmedFullInput.startsWith('★ ');
        const cleanedInput = trimmedFullInput.replace(/^★\s*/, '');

        const isVanillaSearch = cleanedInput.endsWith(" | Vanilla");

        let dopplerType = null;
        let phaseName = null;

        const phaseRegex = /\s*\((Phase\s*\d+|Ruby|Sapphire|Black Pearl|Emerald)\)/i;
        const phaseTypeRegex = /\b(Doppler|Gamma Doppler)/i;

        let phaseMatch = null;
        if (!isVanillaSearch) {
            phaseMatch = cleanedInput.match(phaseRegex);
            if (phaseMatch && phaseMatch.length > 1) {
                phaseName = phaseMatch[1].trim();
                const typeMatch = cleanedInput.match(phaseTypeRegex);
                if (typeMatch) {
                    dopplerType = typeMatch[0].trim();
                }
            }
        }

        let baseSearchName;
        if (isVanillaSearch) {
            baseSearchName = cleanedInput.substring(0, cleanedInput.lastIndexOf(" | Vanilla")).trim();
        } else {
            baseSearchName = cleanedInput;
        }
        
        const itemCanHaveStatTrak = canHaveStatTrak(baseSearchName);
        const itemCanHaveFloat = canHaveFloat(baseSearchName);
        const itemCanHavePaintSeed = canHavePaintSeed(baseSearchName);
        
        const validatedStatTrak = isStatTrakChecked && itemCanHaveStatTrak;
        
        let finalSearchName;
        if (validatedStatTrak) {
            if (isKnife) {
                finalSearchName = `★ StatTrak™ ${baseSearchName}`;
            } else {
                finalSearchName = `StatTrak™ ${baseSearchName}`;
            }
        } else {
            finalSearchName = baseSearchName;
        }
        
        const validatedExterior = itemCanHaveFloat ? exterior : '';
        const validatedMinFloat = itemCanHaveFloat ? minFloat : 0;
        const validatedMaxFloat = itemCanHaveFloat ? maxFloat : 1;
        
        const validatedPaintSeed = (itemCanHavePaintSeed && paintSeedValue !== '' && validatePaintSeed(paintSeedValue))
            ? parseInt(paintSeedValue, 10)
            : null;
        
        return {
            fullInput: trimmedFullInput,
            baseSearchName,
            finalSearchName,
            encodedBaseSearchName: encodeURIComponent(baseSearchName),
            encodedFullInput: encodeURIComponent(trimmedFullInput),
            phaseName,
            dopplerType,
            isVanillaSearch,
            isStatTrak: validatedStatTrak,
            exterior: validatedExterior,
            minFloat: validatedMinFloat,
            maxFloat: validatedMaxFloat,
            paintSeed: validatedPaintSeed,
            capabilities: {
                canHaveStatTrak: itemCanHaveStatTrak,
                canHaveFloat: itemCanHaveFloat,
                canHavePaintSeed: itemCanHavePaintSeed
            }
        };
    }
}