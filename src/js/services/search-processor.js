/* SearchProcessor
 * Processes user input for skin searches, handling StatTrak, exterior, float ranges, and paint seeds.
 * Returns an object with all necessary parameters for generating marketplace URLs.
 * Includes validation logic to prevent invalid attribute combinations for different item types.
 */
import { validatePaintSeed } from '../utils/validation.js';
import { canHaveStatTrak, canHaveFloat, canHavePaintSeed } from '../config/constants.js';

/**
 * Processes and parses CS:GO skin search inputs to extract relevant search parameters
 */
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
        // Return null for empty searches
        if (!trimmedFullInput) return null;

        // Remove star prefix before doing anything else
        const isKnife = trimmedFullInput.startsWith('★ ');
        const cleanedInput = trimmedFullInput.replace(/^★\s*/, '');

        // Check if searching for a Vanilla skin (skins without any paint/pattern)
        const isVanillaSearch = cleanedInput.endsWith(" | Vanilla");

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
            phaseMatch = cleanedInput.match(phaseRegex);
            if (phaseMatch && phaseMatch.length > 1) {
                // Extract the phase name (e.g., "Phase 2", "Ruby")
                phaseName = phaseMatch[1].trim();
                // Determine if it's regular Doppler or Gamma Doppler
                const typeMatch = cleanedInput.match(phaseTypeRegex);
                if (typeMatch) {
                    dopplerType = typeMatch[0].trim();
                }
            }
        }

        // Extract the base search name by removing special suffixes
        let baseSearchName;
        if (isVanillaSearch) {
            // Remove " | Vanilla" suffix
            baseSearchName = cleanedInput.substring(0, cleanedInput.lastIndexOf(" | Vanilla")).trim();
        } else {
            // Use the cleaned input as base search name
            baseSearchName = cleanedInput;
        }
        
        // Apply validation logic based on item type capabilities
        const itemCanHaveStatTrak = canHaveStatTrak(baseSearchName);
        const itemCanHaveFloat = canHaveFloat(baseSearchName);
        const itemCanHavePaintSeed = canHavePaintSeed(baseSearchName);
        
        // Only apply StatTrak if the item type supports it
        const validatedStatTrak = isStatTrakChecked && itemCanHaveStatTrak;
        
        // Prepend "StatTrak™" only if the item can have StatTrak and it's checked
        // For knives/gloves (items that had ★), insert StatTrak™ after the star
        let finalSearchName;
        if (validatedStatTrak) {
            if (isKnife) {
                // Insert StatTrak™ after the star: "★ StatTrak™ Bayonet..."
                finalSearchName = `★ StatTrak™ ${baseSearchName}`;
            } else {
                // Regular items: prepend StatTrak™
                finalSearchName = `StatTrak™ ${baseSearchName}`;
            }
        } else {
            finalSearchName = baseSearchName;
        }
        
        // Only apply float/exterior values if the item type supports them
        const validatedExterior = itemCanHaveFloat ? exterior : '';
        const validatedMinFloat = itemCanHaveFloat ? minFloat : 0;
        const validatedMaxFloat = itemCanHaveFloat ? maxFloat : 1;
        
        // Only apply paint seed if the item type supports it and the value is valid
        const validatedPaintSeed = (itemCanHavePaintSeed && paintSeedValue !== '' && validatePaintSeed(paintSeedValue))
            ? parseInt(paintSeedValue, 10)
            : null;
        
        // Return comprehensive search parameters object with validations applied
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
            // Include capability flags for reference by URL generators
            capabilities: {
                canHaveStatTrak: itemCanHaveStatTrak,
                canHaveFloat: itemCanHaveFloat,
                canHavePaintSeed: itemCanHavePaintSeed
            }
        };
    }
}