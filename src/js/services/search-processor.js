/* SearchProcessor
 * Processes user input for skin searches, handling StatTrak, exterior, float ranges, and paint seeds.
 * Returns an object with all necessary parameters for generating marketplace URLs.
 */
import { validatePaintSeed } from '../utils/validation.js';

/**
 * Processes and parses CS:GO skin search inputs to extract relevant search parameters
 */
export class SearchProcessor {
    /**
     * Processes user input and extracts all search parameters for marketplace URLs
     * @param {string} fullInput - The complete search input from the user
     * @param {boolean} isStatTrakChecked - Whether StatTrak option is selected
     * @param {string} exterior - The exterior condition (e.g., "Factory New", "Field-Tested")
     * @param {number} minFloat - Minimum float value (0-1)
     * @param {number} maxFloat - Maximum float value (0-1)
     * @param {string} paintSeedValue - Paint seed value as string
     * @returns {Object|null} Processed search parameters object, or null if input is empty
     */
    static processInput(fullInput, isStatTrakChecked, exterior, minFloat, maxFloat, paintSeedValue) {
        const trimmedFullInput = fullInput.trim();
        // Return null for empty searches
        if (!trimmedFullInput) return null;
        
        // Check if searching for a Vanilla skin (skins without any paint/pattern)
        const isVanillaSearch = trimmedFullInput.endsWith(" | Vanilla");
        
        // Initialize Doppler-related variables
        let dopplerType = null;
        let phaseName = null;
        
        // Regex to match Doppler phases in parentheses (e.g., "(Phase 2)", "(Ruby)")
        const phaseRegex = /\s*\((Phase\s*\d+|Ruby|Sapphire|Black Pearl|Emerald)\)/i;
        // Regex to identify Doppler or Gamma Doppler skins
        const phaseTypeRegex = /\b(Doppler|Gamma Doppler)/i;
        
        let phaseMatch = null;
        // Only look for Doppler phases if not searching for Vanilla
        if (!isVanillaSearch) {
            phaseMatch = trimmedFullInput.match(phaseRegex);
            if (phaseMatch && phaseMatch.length > 1) {
                // Extract the phase name (e.g., "Phase 2", "Ruby")
                phaseName = phaseMatch[1].trim();
                // Determine if it's regular Doppler or Gamma Doppler
                const typeMatch = trimmedFullInput.match(phaseTypeRegex);
                if (typeMatch) {
                    dopplerType = typeMatch[0].trim();
                }
            }
        }
        
        // Extract the base search name by removing special suffixes
        let baseSearchName;
        if (isVanillaSearch) {
            // Remove " | Vanilla" suffix
            baseSearchName = trimmedFullInput.substring(0, trimmedFullInput.lastIndexOf(" | Vanilla")).trim();
        } else if (phaseName) {
            // Remove Doppler phase information from the search
            baseSearchName = trimmedFullInput.replace(phaseRegex, '').trim();
        } else {
            // Use the full input as base search name
            baseSearchName = trimmedFullInput;
        }
        
        // Prepend "StatTrak™" if the option is checked
        const finalSearchName = isStatTrakChecked ? `StatTrak™ ${baseSearchName}` : baseSearchName;
        
        // Return comprehensive search parameters object
        return {
            fullInput: trimmedFullInput,
            baseSearchName,
            finalSearchName,
            encodedBaseSearchName: encodeURIComponent(baseSearchName),
            encodedFullInput: encodeURIComponent(trimmedFullInput),
            phaseName,
            dopplerType,
            isVanillaSearch,
            isStatTrak: isStatTrakChecked,
            exterior,
            minFloat,
            maxFloat,
            // Validate and parse paint seed, return null if invalid or empty
            paintSeed: (paintSeedValue !== '' && validatePaintSeed(paintSeedValue)) ? parseInt(paintSeedValue, 10) : null,
        };
    }
}