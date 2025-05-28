export class MarketSelector {
    constructor(elements, onStateChangeCallback) {
        this.elements = elements;
        this.onStateChange = onStateChangeCallback;

        this.elements.selectAllCheckbox?.addEventListener('change', () => this.toggleAllMarkets());
        this.elements.marketItems.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.updateSelectAllState();
                    this.onStateChange();
                });
                item.addEventListener('click', (event) => {
                    if (event.target !== checkbox && event.target !== item.querySelector('label')) {
                        checkbox.checked = !checkbox.checked;
                        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                });
            }
        });
        this.updateSelectAllState();
    }

    updateSelectAllState() {
        const allChecked = Array.from(this.elements.marketCheckboxes).every(cb => cb.checked);
        const anyChecked = Array.from(this.elements.marketCheckboxes).some(cb => cb.checked);
        if (this.elements.selectAllCheckbox) {
            this.elements.selectAllCheckbox.checked = allChecked && this.elements.marketCheckboxes.length > 0;
            this.elements.selectAllCheckbox.indeterminate = !allChecked && anyChecked;
        }
        this.updateSearchButtonText();
    }

    updateSearchButtonText() {
        if (!this.elements.searchButton) return;
        const numSelected = this.getSelectedMarkets().length;
        const baseText = "Find Listings";
        if (numSelected > 0) {
            this.elements.searchButton.textContent = `${baseText} (${numSelected} new tab${numSelected !== 1 ? 's' : ''})`;
            this.elements.searchButton.disabled = false;
        } else {
            this.elements.searchButton.textContent = baseText;
            this.elements.searchButton.disabled = true;
        }
    }

    toggleAllMarkets() {
        if (!this.elements.selectAllCheckbox) return;
        const isChecked = this.elements.selectAllCheckbox.checked;
        this.elements.marketCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        this.updateSelectAllState();
        this.onStateChange();
    }

    getSelectedMarkets() {
        return Array.from(this.elements.marketCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
    }

    applyState(state) {
        this.elements.selectAllCheckbox.checked = state.selectAll || false;
        const savedMarkets = Array.isArray(state.selectedMarkets) ? state.selectedMarkets : [];
        this.elements.marketCheckboxes.forEach(cb => {
            cb.checked = savedMarkets.includes(cb.value);
        });
        this.updateSelectAllState();
    }
}