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
        this.paintSeedAlertTimeout = null;
        this.paintSeedAlertElement = null;
        this.lastValidPaintSeed = '';
        
        this.debouncedStateChange = this.debounce(() => {
            this.onStateChange();
        }, 100);
        
        this.fastVisualUpdate = this.debounce(() => {
            this.updateRangeFillImmediate();
        }, 16);

        this.elements.exteriorSelect?.addEventListener('change', () => this.onExteriorChange());
        
        this.elements.minFloatRange?.addEventListener('input', (e) => this.handleRangeInput(e, 'min'));
        this.elements.maxFloatRange?.addEventListener('input', (e) => this.handleRangeInput(e, 'max'));
        
        this.elements.minFloatInput?.addEventListener('keydown', (e) => this.handleFloatInputKeydown(e));
        this.elements.maxFloatInput?.addEventListener('keydown', (e) => this.handleFloatInputKeydown(e));
        this.elements.minFloatInput?.addEventListener('input', () => this.updateSlidersFromInput());
        this.elements.maxFloatInput?.addEventListener('input', () => this.updateSlidersFromInput());
        this.elements.paintSeedInput?.addEventListener('keydown', (e) => this.handlePaintSeedKeydown(e));
        this.elements.paintSeedInput?.addEventListener('input', () => {
            this.sanitizePaintSeedInput();
            updatePaintSeedInputValidationClass(this.elements.paintSeedInput);
            this.onStateChange();
        });

        this.dualRangeContainer = this.elements.minFloatRange?.closest('.dual-range-container');
        
        this.initializePaintSeedInput();
        this.updateSlidersFromInput(false);
    }

    handleFloatInputKeydown(event) {
        if (event.ctrlKey || event.metaKey || event.altKey) return;

        const allowedKeys = [
            'Backspace',
            'Delete',
            'ArrowLeft',
            'ArrowRight',
            'ArrowUp',
            'ArrowDown',
            'Home',
            'End',
            'Tab',
            'Enter'
        ];
        if (allowedKeys.includes(event.key)) return;

        if (event.key.length === 1 && !/[\d.]/.test(event.key)) {
            event.preventDefault();
        }
    }

    handlePaintSeedKeydown(event) {
        if (event.ctrlKey || event.metaKey || event.altKey) return;

        const allowedKeys = [
            'Backspace',
            'Delete',
            'ArrowLeft',
            'ArrowRight',
            'ArrowUp',
            'ArrowDown',
            'Home',
            'End',
            'Tab',
            'Enter'
        ];
        if (allowedKeys.includes(event.key)) return;

        if (event.key.length === 1 && !/\d/.test(event.key)) {
            event.preventDefault();
        }
    }

    initializePaintSeedInput() {
        const input = this.elements.paintSeedInput;
        if (!input) return;

        const normalized = this.normalizePaintSeedValue(input.value);
        input.value = normalized.tooLarge ? '' : normalized.value;
        this.lastValidPaintSeed = input.value;
    }

    ensurePaintSeedAlertElement() {
        if (this.paintSeedAlertElement || !this.elements.paintSeedInput) return;

        const alertElement = document.createElement('div');
        alertElement.className = 'paint-seed-alert';
        alertElement.textContent = 'Paint seed values can only range between 0 and 1000.';

        const container = this.elements.paintSeedInput.parentElement;
        if (container) {
            const teaser = container.querySelector('.secret-teaser');
            if (teaser) {
                container.insertBefore(alertElement, teaser);
            } else {
                container.appendChild(alertElement);
            }
        }

        this.paintSeedAlertElement = alertElement;
    }

    showPaintSeedAlert() {
        this.ensurePaintSeedAlertElement();
        if (!this.paintSeedAlertElement || !this.elements.paintSeedInput) return;

        if (this.paintSeedAlertTimeout) {
            clearTimeout(this.paintSeedAlertTimeout);
        }

        this.paintSeedAlertElement.classList.add('is-visible');
        this.elements.paintSeedInput.classList.add('paint-seed-alert-active');

        this.paintSeedAlertTimeout = setTimeout(() => {
            this.paintSeedAlertElement.classList.remove('is-visible');
            this.elements.paintSeedInput.classList.remove('paint-seed-alert-active');
            this.paintSeedAlertTimeout = null;
        }, 2000);
    }

    normalizePaintSeedValue(rawValue) {
        const rawString = String(rawValue ?? '');
        const digitsOnly = rawString.replace(/[^\d]/g, '');
        if (digitsOnly === '') {
            return { value: '', tooLarge: false };
        }

        const numericValue = parseInt(digitsOnly, 10);
        if (Number.isNaN(numericValue)) {
            return { value: '', tooLarge: false };
        }

        return { value: digitsOnly, tooLarge: numericValue > 1000 };
    }

    sanitizePaintSeedInput() {
        const input = this.elements.paintSeedInput;
        if (!input) return;

        const normalized = this.normalizePaintSeedValue(input.value);

        if (normalized.tooLarge) {
            input.value = this.lastValidPaintSeed;
            this.showPaintSeedAlert();
            return;
        }

        input.value = normalized.value;
        this.lastValidPaintSeed = normalized.value;
    }

    sanitizeFloatInputValue(rawValue) {
        if (typeof rawValue !== 'string') {
            rawValue = String(rawValue ?? '');
        }

        const isNegative = rawValue.trim().startsWith('-');
        let cleaned = rawValue.replace(/[^\d.]/g, '');
        const firstDotIndex = cleaned.indexOf('.');
        if (firstDotIndex !== -1) {
            const integerPart = cleaned.slice(0, firstDotIndex);
            let decimalPart = cleaned.slice(firstDotIndex + 1).replace(/\./g, '');
            if (decimalPart.length > 3) {
                decimalPart = decimalPart.slice(0, 3);
            }
            cleaned = `${integerPart}.${decimalPart}`;
        }

        if (cleaned.startsWith('.')) {
            cleaned = `0${cleaned}`;
        }

        if (isNegative) {
            return '0.000';
        }

        if (cleaned === '') return '';

        const numericValue = parseFloat(cleaned);
        if (!Number.isNaN(numericValue)) {
            if (numericValue > 1) return '1.000';
            if (numericValue < 0) return '0.000';
        }

        return cleaned;
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

        const minSanitized = this.sanitizeFloatInputValue(this.elements.minFloatInput.value);
        const maxSanitized = this.sanitizeFloatInputValue(this.elements.maxFloatInput.value);

        if (minSanitized !== this.elements.minFloatInput.value) {
            this.elements.minFloatInput.value = minSanitized;
        }
        if (maxSanitized !== this.elements.maxFloatInput.value) {
            this.elements.maxFloatInput.value = maxSanitized;
        }

        const minNumeric = parseFloat(minSanitized);
        const maxNumeric = parseFloat(maxSanitized);
        const minHasNumber = !Number.isNaN(minNumeric);
        const maxHasNumber = !Number.isNaN(maxNumeric);

        let minInputValue = minHasNumber ? minNumeric : 0;
        let maxInputValue = maxHasNumber ? maxNumeric : 0;

        const clampedMin = Math.max(0, Math.min(1, minInputValue));
        const clampedMax = Math.max(0, Math.min(1, maxInputValue));

        if (minHasNumber && clampedMin !== minInputValue) {
            this.elements.minFloatInput.value = clampedMin.toFixed(3);
        }
        if (maxHasNumber && clampedMax !== maxInputValue) {
            this.elements.maxFloatInput.value = clampedMax.toFixed(3);
        }

        minInputValue = clampedMin;
        maxInputValue = clampedMax;
        
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
        if (this.elements.paintSeedInput) {
            const normalized = this.normalizePaintSeedValue(this.elements.paintSeedInput.value);
            this.elements.paintSeedInput.value = normalized.tooLarge ? '' : normalized.value;
            this.lastValidPaintSeed = this.elements.paintSeedInput.value;
        }
        
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
        this.lastValidPaintSeed = '';
        
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
        
        if (this.paintSeedAlertTimeout) {
            clearTimeout(this.paintSeedAlertTimeout);
            this.paintSeedAlertTimeout = null;
        }

        if (this.debouncedStateChange) {
            this.debouncedStateChange = null;
        }
        if (this.fastVisualUpdate) {
            this.fastVisualUpdate = null;
        }
    }
}
