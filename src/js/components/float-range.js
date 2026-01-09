/* FloatRangeManager
 * Manages float range inputs and their interactions in the UI.
 */
import { exteriorPresets } from '../config/constants.js';
import { validateFloatInputsDOM, updatePaintSeedInputValidationClass } from '../utils/validation.js';

export class FloatRangeManager {
    
    constructor(elements, onStateChangeCallback) {
        this.elements = elements;
        this.onStateChange = onStateChangeCallback;
        
        this.animationFrameId = null;
        this.dualRangeContainer = null;
        this.cachedValues = { min: 0, max: 1 };
        this.isUpdating = false;
        this.isUpdatingExterior = false;
        
        this.debouncedStateChange = this.debounce(() => {
            this.onStateChange();
        }, 100);
        
        this.fastVisualUpdate = this.debounce(() => {
            this.updateRangeFillImmediate();
        }, 16);

        this.elements.exteriorSelect?.addEventListener('change', () => this.onExteriorChange());
        
        this.elements.minFloatRange?.addEventListener('input', (e) => this.handleRangeInput(e, 'min'));
        this.elements.maxFloatRange?.addEventListener('input', (e) => this.handleRangeInput(e, 'max'));
        
        this.elements.minFloatInput?.addEventListener('input', () => this.updateSlidersFromInput());
        this.elements.maxFloatInput?.addEventListener('input', () => this.updateSlidersFromInput());
        this.elements.paintSeedInput?.addEventListener('input', () => {
            updatePaintSeedInputValidationClass(this.elements.paintSeedInput);
            this.onStateChange();
        });

        this.dualRangeContainer = this.elements.minFloatRange?.closest('.dual-range-container');
        
        this.updateSlidersFromInput(false);
    }

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

    handleRangeInput(event, type) {
        if (this.isUpdating) return;
        
        const value = parseFloat(event.target.value) || 0;
        const otherType = type === 'min' ? 'max' : 'min';
        const otherValue = this.cachedValues[otherType];
        
        let constrainedValue = value;
        if (type === 'min' && value > otherValue) {
            constrainedValue = otherValue;
            event.target.value = constrainedValue;
        } else if (type === 'max' && value < otherValue) {
            constrainedValue = otherValue;
            event.target.value = constrainedValue;
        }
        
        this.cachedValues[type] = constrainedValue;
        
        this.updateRangeFillImmediate();
        
        this.updateInputFieldsImmediate(type, constrainedValue);
        
        this.fastVisualUpdate();
        this.debouncedStateChange();
        
        this.updateExteriorFromFloatRange();
    }

    updateRangeFillImmediate() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        this.animationFrameId = requestAnimationFrame(() => {
            const minPercent = this.cachedValues.min * 100;
            const maxPercent = this.cachedValues.max * 100;
            
            if (this.dualRangeContainer) {
                this.dualRangeContainer.style.setProperty('--range-fill-left', `${minPercent}%`);
                this.dualRangeContainer.style.setProperty('--range-fill-right', `${100 - maxPercent}%`);
            }
        });
    }

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


    updateSlidersFromInput(doSave = true) {
        this.isUpdating = true;
        
        let minInputValue = parseFloat(this.elements.minFloatInput.value) || 0;
        let maxInputValue = parseFloat(this.elements.maxFloatInput.value) || 0;
        
        minInputValue = Math.max(0, Math.min(1, minInputValue));
        maxInputValue = Math.max(0, Math.min(1, maxInputValue));
        
        if (minInputValue > maxInputValue) {
            minInputValue = maxInputValue;
            this.elements.minFloatInput.value = minInputValue.toFixed(3);
        }
        if (maxInputValue < minInputValue) {
            maxInputValue = minInputValue;
            this.elements.maxFloatInput.value = maxInputValue.toFixed(3);
        }
        
        this.cachedValues.min = minInputValue;
        this.cachedValues.max = maxInputValue;
        
        this.elements.minFloatRange.value = minInputValue;
        this.elements.maxFloatRange.value = maxInputValue;
        if (this.elements.minFloatLabel) this.elements.minFloatLabel.textContent = minInputValue.toFixed(3);
        if (this.elements.maxFloatLabel) this.elements.maxFloatLabel.textContent = maxInputValue.toFixed(3);
        
        this.updateRangeFillImmediate();
        this.validateInputs();
        
        this.isUpdating = false;
        
        if (doSave) {
            this.onStateChange();
            this.updateExteriorFromFloatRange();
        }
    }


    validateInputs() {
        return validateFloatInputsDOM(this.elements.minFloatInput, this.elements.maxFloatInput, this.elements.floatRangeDiv);
    }

    onExteriorChange() {
        if (this.isUpdatingExterior) return;
        
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
        
        this.cachedValues.min = parseFloat(this.elements.minFloatInput.value) || 0;
        this.cachedValues.max = parseFloat(this.elements.maxFloatInput.value) || 1;
        
        this.updateSlidersFromInput(false);
        this.updateRangeFillImmediate();
        updatePaintSeedInputValidationClass(this.elements.paintSeedInput);
    }

    resetToDefaults() {
        this.elements.exteriorSelect.value = '';
        this.elements.minFloatInput.value = '0.000';
        this.elements.maxFloatInput.value = '1.000';
        this.elements.paintSeedInput.value = '';
        
        this.cachedValues.min = 0;
        this.cachedValues.max = 1;
        
        this.updateSlidersFromInput(false);
        this.updateRangeFillImmediate();
        updatePaintSeedInputValidationClass(this.elements.paintSeedInput);
    }

    updateExteriorFromFloatRange() {
        if (this.isUpdatingExterior || !this.elements.exteriorSelect) return;
        
        const minFloat = this.cachedValues.min;
        const maxFloat = this.cachedValues.max;
        
        for (const [exteriorKey, boundaries] of Object.entries(exteriorPresets)) {
            const [exteriorMin, exteriorMax] = boundaries;
            
            if (minFloat >= exteriorMin && maxFloat <= exteriorMax) {
                this.isUpdatingExterior = true;
                this.elements.exteriorSelect.value = exteriorKey;
                this.isUpdatingExterior = false;
                return;
            }
        }
        
        this.isUpdatingExterior = true;
        this.elements.exteriorSelect.value = '';
        this.isUpdatingExterior = false;
    }

    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        if (this.debouncedStateChange) {
            this.debouncedStateChange = null;
        }
        if (this.fastVisualUpdate) {
            this.fastVisualUpdate = null;
        }
    }
}