import { exteriorPresets } from '../config/constants.js';
import { validateFloatInputsDOM, updatePaintSeedInputValidationClass } from '../utils/validation.js';

export class FloatRangeManager {
    constructor(elements, onStateChangeCallback) { 
        this.elements = elements;
        this.onStateChange = onStateChangeCallback;

        this.elements.exteriorSelect?.addEventListener('change', () => this.onExteriorChange());
        this.elements.minFloatRange?.addEventListener('input', () => this.updateFloatUIFromRange());
        this.elements.maxFloatRange?.addEventListener('input', () => this.updateFloatUIFromRange());
        this.elements.minFloatInput?.addEventListener('input', () => this.updateSlidersFromInput());
        this.elements.maxFloatInput?.addEventListener('input', () => this.updateSlidersFromInput());
        this.elements.paintSeedInput?.addEventListener('input', () => {
            updatePaintSeedInputValidationClass(this.elements.paintSeedInput);
            this.onStateChange();
        });

        this.updateSlidersFromInput(false);
    }

    updateFloatUIFromRange(doSave = true) {
        const minRangeValue = parseFloat(this.elements.minFloatRange.value) || 0;
        const maxRangeValue = parseFloat(this.elements.maxFloatRange.value) || 0;
        this.elements.minFloatInput.value = minRangeValue.toFixed(3);
        this.elements.maxFloatInput.value = maxRangeValue.toFixed(3);
        if (this.elements.minFloatLabel) this.elements.minFloatLabel.textContent = this.elements.minFloatInput.value;
        if (this.elements.maxFloatLabel) this.elements.maxFloatLabel.textContent = this.elements.maxFloatInput.value;
        this.validateInputs();
        if (doSave) this.onStateChange();
    }

    updateSlidersFromInput(doSave = true) {
        const minInputValue = parseFloat(this.elements.minFloatInput.value) || 0;
        const maxInputValue = parseFloat(this.elements.maxFloatInput.value) || 0;
        this.elements.minFloatRange.value = Math.max(0, Math.min(1, minInputValue));
        this.elements.maxFloatRange.value = Math.max(0, Math.min(1, maxInputValue));
        if (this.elements.minFloatLabel) this.elements.minFloatLabel.textContent = parseFloat(this.elements.minFloatRange.value).toFixed(3);
        if (this.elements.maxFloatLabel) this.elements.maxFloatLabel.textContent = parseFloat(this.elements.maxFloatRange.value).toFixed(3);
        this.validateInputs();
        if (doSave) this.onStateChange();
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
        this.updateSlidersFromInput(false);
        updatePaintSeedInputValidationClass(this.elements.paintSeedInput);
    }
}