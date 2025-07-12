/* FloatRangeManager
 * Manages float range inputs and their interactions in the UI.
 */
import { exteriorPresets } from '../config/constants.js';
import { validateFloatInputsDOM, updatePaintSeedInputValidationClass } from '../utils/validation.js';

export class FloatRangeManager {
    constructor(elements, onStateChangeCallback) {
        this.elements = elements;
        this.onStateChange = onStateChangeCallback;
        
        // Performance optimization properties
        this.animationFrameId = null;
        this.dualRangeContainer = null;
        this.cachedValues = { min: 0, max: 1 };
        this.isUpdating = false;
        
        // Debounced state change callback
        this.debouncedStateChange = this.debounce(() => {
            this.onStateChange();
        }, 100);
        
        // Fast visual update callback (no debounce)
        this.fastVisualUpdate = this.debounce(() => {
            this.updateRangeFillImmediate();
        }, 16); // ~60fps

        this.elements.exteriorSelect?.addEventListener('change', () => this.onExteriorChange());
        
        // Use optimized event handlers for range inputs
        this.elements.minFloatRange?.addEventListener('input', (e) => this.handleRangeInput(e, 'min'));
        this.elements.maxFloatRange?.addEventListener('input', (e) => this.handleRangeInput(e, 'max'));
        
        this.elements.minFloatInput?.addEventListener('input', () => this.updateSlidersFromInput());
        this.elements.maxFloatInput?.addEventListener('input', () => this.updateSlidersFromInput());
        this.elements.paintSeedInput?.addEventListener('input', () => {
            updatePaintSeedInputValidationClass(this.elements.paintSeedInput);
            this.onStateChange();
        });

        // Cache the dual range container reference
        this.dualRangeContainer = this.elements.minFloatRange?.closest('.dual-range-container');
        
        this.updateSlidersFromInput(false);
    }

    // Debounce utility for performance optimization
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Optimized range input handler with immediate visual feedback
    handleRangeInput(event, type) {
        if (this.isUpdating) return;
        
        const value = parseFloat(event.target.value) || 0;
        const otherType = type === 'min' ? 'max' : 'min';
        const otherValue = this.cachedValues[otherType];
        
        // Immediate constraint checking
        let constrainedValue = value;
        if (type === 'min' && value > otherValue) {
            constrainedValue = otherValue;
            event.target.value = constrainedValue;
        } else if (type === 'max' && value < otherValue) {
            constrainedValue = otherValue;
            event.target.value = constrainedValue;
        }
        
        // Cache the new value
        this.cachedValues[type] = constrainedValue;
        
        // Immediate visual update using requestAnimationFrame
        this.updateRangeFillImmediate();
        
        // Update input fields immediately
        this.updateInputFieldsImmediate(type, constrainedValue);
        
        // Debounced validation and state change
        this.fastVisualUpdate();
        this.debouncedStateChange();
    }

    // Immediate range fill update using requestAnimationFrame
    updateRangeFillImmediate() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        this.animationFrameId = requestAnimationFrame(() => {
            const minPercent = this.cachedValues.min * 100;
            const maxPercent = this.cachedValues.max * 100;
            
            if (this.dualRangeContainer) {
                // Direct style updates for maximum performance
                this.dualRangeContainer.style.setProperty('--range-fill-left', `${minPercent}%`);
                this.dualRangeContainer.style.setProperty('--range-fill-right', `${100 - maxPercent}%`);
            }
        });
    }

    // Immediate input field updates
    updateInputFieldsImmediate(type, value) {
        const formattedValue = value.toFixed(3);
        
        if (type === 'min') {
            this.elements.minFloatInput.value = formattedValue;
            if (this.elements.minFloatLabel) {
                this.elements.minFloatLabel.textContent = formattedValue;
            }
        } else {
            this.elements.maxFloatInput.value = formattedValue;
            if (this.elements.maxFloatLabel) {
                this.elements.maxFloatLabel.textContent = formattedValue;
            }
        }
    }

    updateFloatUIFromRange(doSave = true) {
        // This method is now primarily used for legacy compatibility
        // The optimized handleRangeInput method handles most range updates
        let minRangeValue = parseFloat(this.elements.minFloatRange.value) || 0;
        let maxRangeValue = parseFloat(this.elements.maxFloatRange.value) || 0;
        
        // Ensure min doesn't exceed max and max doesn't go below min
        if (minRangeValue > maxRangeValue) {
            minRangeValue = maxRangeValue;
            this.elements.minFloatRange.value = minRangeValue;
        }
        if (maxRangeValue < minRangeValue) {
            maxRangeValue = minRangeValue;
            this.elements.maxFloatRange.value = maxRangeValue;
        }
        
        // Update cached values
        this.cachedValues.min = minRangeValue;
        this.cachedValues.max = maxRangeValue;
        
        this.elements.minFloatInput.value = minRangeValue.toFixed(3);
        this.elements.maxFloatInput.value = maxRangeValue.toFixed(3);
        if (this.elements.minFloatLabel) this.elements.minFloatLabel.textContent = this.elements.minFloatInput.value;
        if (this.elements.maxFloatLabel) this.elements.maxFloatLabel.textContent = this.elements.maxFloatInput.value;
        this.updateRangeFillImmediate();
        this.validateInputs();
        if (doSave) this.onStateChange();
    }

    updateSlidersFromInput(doSave = true) {
        this.isUpdating = true; // Prevent recursive updates
        
        let minInputValue = parseFloat(this.elements.minFloatInput.value) || 0;
        let maxInputValue = parseFloat(this.elements.maxFloatInput.value) || 0;
        
        // Clamp values to valid range
        minInputValue = Math.max(0, Math.min(1, minInputValue));
        maxInputValue = Math.max(0, Math.min(1, maxInputValue));
        
        // Ensure min doesn't exceed max and max doesn't go below min
        if (minInputValue > maxInputValue) {
            minInputValue = maxInputValue;
            this.elements.minFloatInput.value = minInputValue.toFixed(3);
        }
        if (maxInputValue < minInputValue) {
            maxInputValue = minInputValue;
            this.elements.maxFloatInput.value = maxInputValue.toFixed(3);
        }
        
        // Update cached values
        this.cachedValues.min = minInputValue;
        this.cachedValues.max = maxInputValue;
        
        this.elements.minFloatRange.value = minInputValue;
        this.elements.maxFloatRange.value = maxInputValue;
        if (this.elements.minFloatLabel) this.elements.minFloatLabel.textContent = minInputValue.toFixed(3);
        if (this.elements.maxFloatLabel) this.elements.maxFloatLabel.textContent = maxInputValue.toFixed(3);
        
        // Use optimized range fill update
        this.updateRangeFillImmediate();
        this.validateInputs();
        
        this.isUpdating = false; // Re-enable updates
        
        if (doSave) this.onStateChange();
    }

    updateRangeFill() {
        // Legacy method - now delegates to optimized version
        this.updateRangeFillImmediate();
    }

    validateInputs() {
        return validateFloatInputsDOM(this.elements.minFloatInput, this.elements.maxFloatInput, this.elements.floatRangeDiv);
    }

    onExteriorChange() {
        const exteriorKey = this.elements.exteriorSelect.value;
        const preset = exteriorPresets[exteriorKey];
        if (preset) {
            this.elements.minFloatInput.value = preset[0].toFixed(3);
            this.elements.maxFloatInput.value = preset[1].toFixed(3);
        } else {
            this.elements.minFloatInput.value = '0.000';
            this.elements.maxFloatInput.value = '1.000';
        }
        this.updateSlidersFromInput(true);
    }

    applyState(state) {
        this.elements.exteriorSelect.value = state.exterior || '';
        this.elements.minFloatInput.value = (typeof state.minFloat === 'string' && !isNaN(parseFloat(state.minFloat))) ? state.minFloat : '0.000';
        this.elements.maxFloatInput.value = (typeof state.maxFloat === 'string' && !isNaN(parseFloat(state.maxFloat))) ? state.maxFloat : '1.000';
        this.elements.paintSeedInput.value = state.paintSeed || '';
        
        // Initialize cached values
        this.cachedValues.min = parseFloat(this.elements.minFloatInput.value) || 0;
        this.cachedValues.max = parseFloat(this.elements.maxFloatInput.value) || 1;
        
        this.updateSlidersFromInput(false);
        this.updateRangeFillImmediate();
        updatePaintSeedInputValidationClass(this.elements.paintSeedInput);
    }

    resetToDefaults() {
        // Reset to default values
        this.elements.exteriorSelect.value = '';
        this.elements.minFloatInput.value = '0.000';
        this.elements.maxFloatInput.value = '1.000';
        this.elements.paintSeedInput.value = '';
        
        // Update cached values
        this.cachedValues.min = 0;
        this.cachedValues.max = 1;
        
        // Update UI elements
        this.updateSlidersFromInput(false);
        this.updateRangeFillImmediate();
        updatePaintSeedInputValidationClass(this.elements.paintSeedInput);
    }

    // Cleanup method to prevent memory leaks
    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Clear any pending timeouts from debounced functions
        if (this.debouncedStateChange) {
            this.debouncedStateChange = null;
        }
        if (this.fastVisualUpdate) {
            this.fastVisualUpdate = null;
        }
    }
}