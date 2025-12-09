/* MarketSelector
 * Handles the selection and management of market checkboxes in the UI.
 */

/**
 * Manages marketplace checkbox selections with category groupings and state persistence
 */
export class MarketSelector {
    /**
     * Initialize the market selector with DOM elements and state change callback
     * @param {Object} elements - Object containing all required DOM elements
     * @param {Function} onStateChangeCallback - Callback function to execute when selection state changes
     */
    constructor(elements, onStateChangeCallback) {
        this.elements = elements;
        this.onStateChange = onStateChangeCallback;

        // Define category mappings - groups marketplaces by their business model
        this.categories = {
            // Buy/Sell marketplaces - traditional marketplaces where users buy/sell items
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
            // Trade marketplaces - focused on item-for-item trades
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
            // Chinese marketplaces - region-specific marketplaces
            china: [
                'market-buff',
                'market-c5',
                'market-ecosteam',
                'market-youpin'
            ]
        };

        // Set up event listeners for category selector checkboxes
        // Use optional chaining (?.) to safely handle missing elements
        this.elements.selectAllCheckbox?.addEventListener('change', () => this.toggleAllMarkets());
        this.elements.selectBuySellCheckbox?.addEventListener('change', () => this.toggleCategoryMarkets('buysell'));
        this.elements.selectTradeCheckbox?.addEventListener('change', () => this.toggleCategoryMarkets('trade'));
        this.elements.selectChinaCheckbox?.addEventListener('change', () => this.toggleCategoryMarkets('china'));
        
        // Set up event listeners for individual market checkboxes
        this.elements.marketItems.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox) {
                // Update states when individual checkbox changes
                checkbox.addEventListener('change', () => {
                    this.updateSelectAllState();
                    this.updateCategoryStates();
                    this.onStateChange();
                });
                // Allow clicking on the entire item to toggle the checkbox
                item.addEventListener('click', (event) => {
                    // Prevent double-toggle when clicking directly on checkbox or label
                    if (event.target !== checkbox && event.target !== item.querySelector('label')) {
                        checkbox.checked = !checkbox.checked;
                        // Dispatch change event to trigger state updates
                        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                });
            }
        });
        
        // Initialize states on construction
        this.updateSelectAllState();
        this.updateCategoryStates();
    }

    /**
     * Updates the "Select All" checkbox state based on individual market selections
     * Sets indeterminate state when some but not all markets are selected
     */
    updateSelectAllState() {
        const allChecked = Array.from(this.elements.marketCheckboxes).every(cb => cb.checked);
        const anyChecked = Array.from(this.elements.marketCheckboxes).some(cb => cb.checked);
        
        if (this.elements.selectAllCheckbox) {
            // Fully checked only if all markets are selected
            this.elements.selectAllCheckbox.checked = allChecked && this.elements.marketCheckboxes.length > 0;
            // Indeterminate state when partially selected
            this.elements.selectAllCheckbox.indeterminate = !allChecked && anyChecked;
        }
        
        // Update search button to reflect selection count
        this.updateSearchButtonText();
    }

    /**
     * Updates category checkbox states based on their member market selections
     * Handles checked/indeterminate states for each category
     */
    updateCategoryStates() {
        // Update Buy/Sell category state
        if (this.elements.selectBuySellCheckbox) {
            const buySellCheckboxes = this.getCategoryCheckboxes('buysell');
            const allBuySellChecked = buySellCheckboxes.every(cb => cb.checked);
            const anyBuySellChecked = buySellCheckboxes.some(cb => cb.checked);
            // Set checked if all in category are selected
            this.elements.selectBuySellCheckbox.checked = allBuySellChecked && buySellCheckboxes.length > 0;
            // Set indeterminate if partially selected
            this.elements.selectBuySellCheckbox.indeterminate = !allBuySellChecked && anyBuySellChecked;
        }

        // Update Trade category state
        if (this.elements.selectTradeCheckbox) {
            const tradeCheckboxes = this.getCategoryCheckboxes('trade');
            const allTradeChecked = tradeCheckboxes.every(cb => cb.checked);
            const anyTradeChecked = tradeCheckboxes.some(cb => cb.checked);
            this.elements.selectTradeCheckbox.checked = allTradeChecked && tradeCheckboxes.length > 0;
            this.elements.selectTradeCheckbox.indeterminate = !allTradeChecked && anyTradeChecked;
        }

        // Update China category state
        if (this.elements.selectChinaCheckbox) {
            const chinaCheckboxes = this.getCategoryCheckboxes('china');
            const allChinaChecked = chinaCheckboxes.every(cb => cb.checked);
            const anyChinaChecked = chinaCheckboxes.some(cb => cb.checked);
            this.elements.selectChinaCheckbox.checked = allChinaChecked && chinaCheckboxes.length > 0;
            this.elements.selectChinaCheckbox.indeterminate = !allChinaChecked && anyChinaChecked;
        }
    }

    /**
     * Gets all checkbox elements belonging to a specific category
     * @param {string} categoryName - Name of the category ('buysell', 'trade', or 'china')
     * @returns {Array<HTMLInputElement>} Array of checkbox elements in the category
     */
    getCategoryCheckboxes(categoryName) {
        const categoryIds = this.categories[categoryName];
        // Filter market checkboxes to only those with IDs in the category
        return Array.from(this.elements.marketCheckboxes).filter(cb =>
            categoryIds.includes(cb.id)
        );
    }

    /**
     * Toggles all markets in a specific category on/off
     * @param {string} categoryName - Name of the category to toggle
     */
    toggleCategoryMarkets(categoryName) {
        let categoryCheckbox;
        
        // Map category name to its checkbox element
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

        // Get the desired state from the category checkbox
        const isChecked = categoryCheckbox.checked;
        const categoryCheckboxes = this.getCategoryCheckboxes(categoryName);
        
        // Apply the state to all checkboxes in the category
        categoryCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        
        // Update all states and notify of change
        this.updateSelectAllState();
        this.updateCategoryStates();
        this.onStateChange();
    }

    /**
     * Updates the search button text to show number of tabs that will open
     * Disables button when no markets are selected
     */
    updateSearchButtonText() {
        if (!this.elements.searchButton) return;
        
        const numSelected = this.getSelectedMarkets().length;
        const baseText = "Find Listings";
        
        if (numSelected > 0) {
            // Show count and pluralize "market" appropriately
            this.elements.searchButton.textContent = `${baseText} On ${numSelected} Market${numSelected !== 1 ? 's' : ''}`;
            this.elements.searchButton.disabled = false;
        } else {
            // No markets selected - disable button
            this.elements.searchButton.textContent = baseText;
            this.elements.searchButton.disabled = true;
        }
    }

    /**
     * Toggles all market checkboxes based on "Select All" checkbox state
     */
    toggleAllMarkets() {
        if (!this.elements.selectAllCheckbox) return;
        
        const isChecked = this.elements.selectAllCheckbox.checked;
        // Apply the state to all market checkboxes
        this.elements.marketCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        
        // Update states and notify of change
        this.updateSelectAllState();
        this.updateCategoryStates();
        this.onStateChange();
    }

    /**
     * Gets the values of all currently selected market checkboxes
     * @returns {Array<string>} Array of selected market values
     */
    getSelectedMarkets() {
        return Array.from(this.elements.marketCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
    }

    /**
     * Applies a saved state to restore previous selections
     * @param {Object} state - Saved state object containing selectAll and selectedMarkets
     */
    applyState(state) {
        // Restore select all checkbox state
        this.elements.selectAllCheckbox.checked = state.selectAll || false;
        
        // Ensure selectedMarkets is an array (handle corrupted state)
        const savedMarkets = Array.isArray(state.selectedMarkets) ? state.selectedMarkets : [];
        
        // Restore individual market selections
        this.elements.marketCheckboxes.forEach(cb => {
            cb.checked = savedMarkets.includes(cb.value);
        });
        
        // Update UI to reflect restored state
        this.updateSelectAllState();
        this.updateCategoryStates();
    }

    /**
     * Resets all selections to default (everything unchecked)
     */
    resetToDefaults() {
        // Uncheck all market checkboxes
        this.elements.marketCheckboxes.forEach(cb => {
            cb.checked = false;
        });
        
        // Reset select all checkbox
        if (this.elements.selectAllCheckbox) {
            this.elements.selectAllCheckbox.checked = false;
            this.elements.selectAllCheckbox.indeterminate = false;
        }
        
        // Reset category checkboxes
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
        
        // Update search button text
        this.updateSearchButtonText();
    }
}