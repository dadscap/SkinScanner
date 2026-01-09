/* MarketSelector
 * Handles the selection and management of market checkboxes in the UI.
 */

export class MarketSelector {
    
    constructor(elements, onStateChangeCallback) {
        this.elements = elements;
        this.onStateChange = onStateChangeCallback;

        this.categories = {
            buysell: [
                'market-avanmarket',
                'market-bitskins',
                'market-buffmarket',
                'market-csdeals',
                'market-csfloat',
                'market-csmoney',
                'market-dmarket',
                'market-gamerpay',
                'market-haloskins',
                'market-lisskins',
                'market-mannco',
                'market-csgo',
                'market-shadowpay',
                'market-skinbaron',
                'market-skinscom',
                'market-skinout',
                'market-skinplace',
                'market-skinport',
                'market-steam',
                'market-waxpeer',
                'market-whitemarket'
            ],
            trade: [
                'market-itradegg',
                'market-pirateswap',
                'market-rapidskins',
                'market-skinflow',
                'market-skinsmonkey',
                'market-skinswap',
                'market-swapgg',
                'market-tradeit'
            ],
            china: [
                'market-buff',
                'market-c5',
                'market-ecosteam',
                'market-youpin'
            ]
        };

        this.elements.selectAllCheckbox?.addEventListener('change', () => this.toggleAllMarkets());
        this.elements.selectBuySellCheckbox?.addEventListener('change', () => this.toggleCategoryMarkets('buysell'));
        this.elements.selectTradeCheckbox?.addEventListener('change', () => this.toggleCategoryMarkets('trade'));
        this.elements.selectChinaCheckbox?.addEventListener('change', () => this.toggleCategoryMarkets('china'));
        
        this.elements.marketItems.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.updateSelectAllState();
                    this.updateCategoryStates();
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
        this.updateCategoryStates();
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

    updateCategoryStates() {
        if (this.elements.selectBuySellCheckbox) {
            const buySellCheckboxes = this.getCategoryCheckboxes('buysell');
            const allBuySellChecked = buySellCheckboxes.every(cb => cb.checked);
            const anyBuySellChecked = buySellCheckboxes.some(cb => cb.checked);
            this.elements.selectBuySellCheckbox.checked = allBuySellChecked && buySellCheckboxes.length > 0;
            this.elements.selectBuySellCheckbox.indeterminate = !allBuySellChecked && anyBuySellChecked;
        }

        if (this.elements.selectTradeCheckbox) {
            const tradeCheckboxes = this.getCategoryCheckboxes('trade');
            const allTradeChecked = tradeCheckboxes.every(cb => cb.checked);
            const anyTradeChecked = tradeCheckboxes.some(cb => cb.checked);
            this.elements.selectTradeCheckbox.checked = allTradeChecked && tradeCheckboxes.length > 0;
            this.elements.selectTradeCheckbox.indeterminate = !allTradeChecked && anyTradeChecked;
        }

        if (this.elements.selectChinaCheckbox) {
            const chinaCheckboxes = this.getCategoryCheckboxes('china');
            const allChinaChecked = chinaCheckboxes.every(cb => cb.checked);
            const anyChinaChecked = chinaCheckboxes.some(cb => cb.checked);
            this.elements.selectChinaCheckbox.checked = allChinaChecked && chinaCheckboxes.length > 0;
            this.elements.selectChinaCheckbox.indeterminate = !allChinaChecked && anyChinaChecked;
        }
    }

    getCategoryCheckboxes(categoryName) {
        const categoryIds = this.categories[categoryName];
        return Array.from(this.elements.marketCheckboxes).filter(cb =>
            categoryIds.includes(cb.id)
        );
    }

    toggleCategoryMarkets(categoryName) {
        let categoryCheckbox;
        
        switch(categoryName) {
            case 'buysell':
                categoryCheckbox = this.elements.selectBuySellCheckbox;
                break;
            case 'trade':
                categoryCheckbox = this.elements.selectTradeCheckbox;
                break;
            case 'china':
                categoryCheckbox = this.elements.selectChinaCheckbox;
                break;
            default:
                return;
        }
        
        if (!categoryCheckbox) return;

        const isChecked = categoryCheckbox.checked;
        const categoryCheckboxes = this.getCategoryCheckboxes(categoryName);
        
        categoryCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        
        this.updateSelectAllState();
        this.updateCategoryStates();
        this.onStateChange();
    }

    updateSearchButtonText() {
        if (!this.elements.searchButton) return;
        
        const numSelected = this.getSelectedMarkets().length;
        const baseText = "Find Listings";
        
        if (numSelected > 0) {
            this.elements.searchButton.textContent = `${baseText} On ${numSelected} Market${numSelected !== 1 ? 's' : ''}`;
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
        this.updateCategoryStates();
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
        this.updateCategoryStates();
    }

    resetToDefaults() {
        this.elements.marketCheckboxes.forEach(cb => {
            cb.checked = false;
        });
        
        if (this.elements.selectAllCheckbox) {
            this.elements.selectAllCheckbox.checked = false;
            this.elements.selectAllCheckbox.indeterminate = false;
        }
        
        if (this.elements.selectBuySellCheckbox) {
            this.elements.selectBuySellCheckbox.checked = false;
            this.elements.selectBuySellCheckbox.indeterminate = false;
        }
        
        if (this.elements.selectTradeCheckbox) {
            this.elements.selectTradeCheckbox.checked = false;
            this.elements.selectTradeCheckbox.indeterminate = false;
        }
        
        if (this.elements.selectChinaCheckbox) {
            this.elements.selectChinaCheckbox.checked = false;
            this.elements.selectChinaCheckbox.indeterminate = false;
        }
        
        this.updateSearchButtonText();
    }
}