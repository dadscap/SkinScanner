/* Validation Utilities
 * Contains functions to validate various user inputs such as float ranges, paint seeds, and DOM elements.
 */

export function validateFloatRange(minVal, maxVal) {
    if (isNaN(minVal) || minVal < 0 || minVal > 1) return false;
    if (isNaN(maxVal) || maxVal < 0 || maxVal > 1) return false;
    if (minVal > maxVal) return false;
    return true;
}

export function validateFloatInputsDOM(minFloatInput, maxFloatInput, floatRangeDiv) {
    const minVal = parseFloat(minFloatInput.value);
    const maxVal = parseFloat(maxFloatInput.value);
    let isRangeValid = true;

    minFloatInput.classList.remove('invalid');
    maxFloatInput.classList.remove('invalid');
    if (floatRangeDiv) floatRangeDiv.classList.remove('invalid-float-range');

    if (isNaN(minVal) || minVal < 0 || minVal > 1) {
        minFloatInput.classList.add('invalid');
        isRangeValid = false;
    }
    
    if (isNaN(maxVal) || maxVal < 0 || maxVal > 1) {
        maxFloatInput.classList.add('invalid');
        isRangeValid = false;
    }
    
    if (!isNaN(minVal) && !isNaN(maxVal) && minVal > maxVal) {
        if (floatRangeDiv) floatRangeDiv.classList.add('invalid-float-range');
        minFloatInput.classList.add('invalid');
        maxFloatInput.classList.add('invalid');
        isRangeValid = false;
    }
    return isRangeValid;
}

export function validatePaintSeed(value) {
    const trimmedValue = value.trim();
    if (trimmedValue === '') return true;
    const num = parseInt(trimmedValue, 10);
    return Number.isInteger(num) && num >= 0 && num <= 1000 && String(num) === trimmedValue;
}

export function updatePaintSeedInputValidationClass(paintSeedInput) {
    const isValid = validatePaintSeed(paintSeedInput.value);
    paintSeedInput.classList.toggle('invalid', !isValid);
    return isValid;
}