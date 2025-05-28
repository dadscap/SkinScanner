export class SearchProcessor {
    static processInput(fullInput, isStatTrakChecked, exterior, minFloat, maxFloat, paintSeedValue) {
        const trimmedFullInput = fullInput.trim();
        if (!trimmedFullInput) return null;

        const isVanillaSearch = trimmedFullInput.endsWith(" | Vanilla");
        let dopplerType = null;
        let phaseName = null;
        const phaseRegex = /\s*\((Phase\s*\d+|Ruby|Sapphire|Black Pearl|Emerald)\)/i;
        const phaseTypeRegex = /\b(Doppler|Gamma Doppler)/i;
        let phaseMatch = null;

        if (!isVanillaSearch) {
            phaseMatch = trimmedFullInput.match(phaseRegex);
            if (phaseMatch && phaseMatch.length > 1) {
                phaseName = phaseMatch[1].trim();
                const typeMatch = trimmedFullInput.match(phaseTypeRegex);
                if (typeMatch) {
                    dopplerType = typeMatch[0].trim();
                }
            }
        }

        let baseSearchName;
        if (isVanillaSearch) {
            baseSearchName = trimmedFullInput.substring(0, trimmedFullInput.lastIndexOf(" | Vanilla")).trim();
        } else if (phaseName) {
            baseSearchName = trimmedFullInput.replace(phaseRegex, '').trim();
        } else {
            baseSearchName = trimmedFullInput;
        }

        const finalSearchName = isStatTrakChecked ? `StatTrak™ ${baseSearchName}` : baseSearchName;

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
            paintSeed: (paintSeedValue !== '' && validatePaintSeed(paintSeedValue)) ? parseInt(paintSeedValue, 10) : null,

        };
    }
}
import { validatePaintSeed } from '../utils/validation.js';