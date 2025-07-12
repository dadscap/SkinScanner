/* Validation Utilities
 * Contains functions to validate various user inputs such as float ranges, paint seeds, and DOM elements.
 */

/**
 * Validates that float values are within the valid range (0-1) and properly ordered
 * @param {number} minVal - Minimum float value
 * @param {number} maxVal - Maximum float value
 * @returns {boolean} True if both values are valid and min <= max
 */
export function validateFloatRange(minVal, maxVal) {
    // Check if minimum value is valid (not NaN and within 0-1 range)
    if (isNaN(minVal) || minVal < 0 || minVal > 1) return false;
    // Check if maximum value is valid (not NaN and within 0-1 range)
    if (isNaN(maxVal) || maxVal < 0 || maxVal > 1) return false;
    // Ensure min is not greater than max
    if (minVal > maxVal) return false;
    return true;
}

/**
 * Validates float input values and updates DOM elements with appropriate CSS classes for visual feedback
 * @param {HTMLInputElement} minFloatInput - Minimum float input element
 * @param {HTMLInputElement} maxFloatInput - Maximum float input element
 * @param {HTMLElement} floatRangeDiv - Optional container div for the float range inputs
 * @returns {boolean} True if the float range is valid
 */
export function validateFloatInputsDOM(minFloatInput, maxFloatInput, floatRangeDiv) {
    // Parse float values from input elements
    const minVal = parseFloat(minFloatInput.value);
    const maxVal = parseFloat(maxFloatInput.value);
    let isRangeValid = true;

    // Clear any existing validation classes
    minFloatInput.classList.remove('invalid');
    maxFloatInput.classList.remove('invalid');
    if (floatRangeDiv) floatRangeDiv.classList.remove('invalid-float-range');

    // Validate minimum value and add invalid class if needed
    if (isNaN(minVal) || minVal < 0 || minVal > 1) {
        minFloatInput.classList.add('invalid');
        isRangeValid = false;
    }
    
    // Validate maximum value and add invalid class if needed
    if (isNaN(maxVal) || maxVal < 0 || maxVal > 1) {
        maxFloatInput.classList.add('invalid');
        isRangeValid = false;
    }
    
    // Check if min > max (only if both values are valid numbers)
    if (!isNaN(minVal) && !isNaN(maxVal) && minVal > maxVal) {
        // Mark the entire range container as invalid if provided
        if (floatRangeDiv) floatRangeDiv.classList.add('invalid-float-range');
        // Mark both inputs as invalid for this specific error
        minFloatInput.classList.add('invalid');
        maxFloatInput.classList.add('invalid');
        isRangeValid = false;
    }
    
    return isRangeValid;
}

/**
 * Validates paint seed values (must be integers between 0 and 1000)
 * @param {string} value - The paint seed value to validate
 * @returns {boolean} True if the value is valid (empty string or integer 0-1000)
 */
export function validatePaintSeed(value) {
    const trimmedValue = value.trim();
    // Empty values are considered valid (optional field)
    if (trimmedValue === '') return true;
    
    const num = parseInt(trimmedValue, 10);
    // Validate: must be an integer, within range 0-1000, and no extra characters
    // The String comparison ensures no decimal points or extra characters
    return Number.isInteger(num) && num >= 0 && num <= 1000 && String(num) === trimmedValue;
}

/**
 * Updates the CSS class of a paint seed input element based on its validation status
 * @param {HTMLInputElement} paintSeedInput - The paint seed input element to validate and update
 * @returns {boolean} True if the paint seed value is valid
 */
export function updatePaintSeedInputValidationClass(paintSeedInput) {
    const isValid = validatePaintSeed(paintSeedInput.value);
    // Toggle 'invalid' class based on validation result
    paintSeedInput.classList.toggle('invalid', !isValid);
    return isValid;
}