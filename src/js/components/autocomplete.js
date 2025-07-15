
/**
 * Modern Autocomplete Component
 * Replaces the native datalist with a custom dropdown implementation
 */

export class AutocompleteComponent {
    constructor(inputElement, options = {}) {
        this.input = inputElement;
        this.options = {
            maxResults: options.maxResults || 50,
            minSearchLength: options.minSearchLength || 1,
            debounceDelay: options.debounceDelay || 150,
            highlightSearch: options.highlightSearch !== false,
            enableKeyboardNavigation: options.enableKeyboardNavigation !== false,
            showResultCount: options.showResultCount !== false,
            ...options
        };
        
        this.data = [];
        this.filteredData = [];
        this.selectedIndex = -1;
        this.isOpen = false;
        this.debounceTimer = null;
        this.scrollPosition = 0; // For scroll position memory
        this.resultCache = new Map(); // For result caching
        
        this.init();
    }
    
    init() {
        this.createDropdownElements();
        this.setupEventListeners();
        this.setupKeyboardNavigation();
        this.updateClearButtonVisibility();
    }
    
    createDropdownElements() {
        // Create container wrapper around input if it doesn't exist
        const existingContainer = this.input.parentElement.querySelector('.autocomplete-container');
        if (!existingContainer) {
            const container = document.createElement('div');
            container.className = 'autocomplete-container';
            this.input.parentNode.insertBefore(container, this.input);
            container.appendChild(this.input);
        }
        
        this.container = this.input.parentElement;
        
        // Create dropdown element
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'autocomplete-dropdown';
        this.dropdown.setAttribute('role', 'listbox');
        this.dropdown.setAttribute('aria-label', 'Autocomplete suggestions');

        // Create results container
        this.resultsContainer = document.createElement('div');
        this.resultsContainer.className = 'autocomplete-results';
        
        // Create loading indicator
        this.loadingElement = document.createElement('div');
        this.loadingElement.className = 'autocomplete-loading';
        this.loadingElement.innerHTML = '<div class="loading-spinner"></div><span>Loading...</span>';
        
        // Create empty state
        this.emptyElement = document.createElement('div');
        this.emptyElement.className = 'autocomplete-empty';
        this.emptyElement.textContent = 'No results found';

        // Create result count element
        this.resultCountElement = document.createElement('div');
        this.resultCountElement.className = 'autocomplete-result-count';
        
        // Append elements
        this.dropdown.appendChild(this.resultsContainer);
        this.dropdown.appendChild(this.loadingElement);
        this.dropdown.appendChild(this.emptyElement);
        this.dropdown.appendChild(this.resultCountElement); // Add result count element
        this.container.appendChild(this.dropdown);

        // Add clear button to input
        this.clearButton = document.createElement('button');
        this.clearButton.className = 'autocomplete-clear-button';
        this.clearButton.innerHTML = '&times;'; // '×' character
        this.clearButton.setAttribute('aria-label', 'Clear search input');
        this.clearButton.style.display = 'none'; // Hidden by default
        this.container.appendChild(this.clearButton);
        
        // Set up ARIA attributes
        this.input.setAttribute('role', 'combobox');
        this.input.setAttribute('aria-expanded', 'false');
        this.input.setAttribute('aria-autocomplete', 'list');
        this.input.setAttribute('aria-owns', this.dropdown.id = 'autocomplete-dropdown-' + Date.now());
    }
    
    setupEventListeners() {
        // Input events
        this.input.addEventListener('input', (e) => {
            this.handleInput(e.target.value);
            this.updateClearButtonVisibility();
        });
        
        this.input.addEventListener('focus', () => {
            if (this.input.value.length >= this.options.minSearchLength) {
                this.show();
            } else {
                this.hide();
            }
        });
        
        this.input.addEventListener('blur', (e) => {
            // Delay hiding to allow click on dropdown items
            setTimeout(() => {
                if (!this.dropdown.contains(document.activeElement) && !this.clearButton.contains(document.activeElement)) {
                    this.hide();
                }
            }, 150);
        });
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target) && !this.clearButton.contains(e.target)) {
                this.hide();
            }
        });
        
        // Dropdown item clicks
        this.dropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.autocomplete-item');
            if (item) {
                this.selectItem(item);
            }
        });

        // Clear button click
        this.clearButton.addEventListener('click', () => {
            this.clear();
            this.input.focus();
            this.updateClearButtonVisibility();
            this.hide();
        });
        
        // Prevent dropdown from closing when clicking inside
        this.dropdown.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });
    }
    
    setupKeyboardNavigation() {
        if (!this.options.enableKeyboardNavigation) return;
        
        this.input.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateDown();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateUp();
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (this.selectedIndex >= 0) {
                        this.selectItemByIndex(this.selectedIndex);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.hide();
                    break;
                case 'Tab':
                    this.hide();
                    break;
            }
        });
    }
    
    handleInput(value) {
        clearTimeout(this.debounceTimer);
        
        if (value.length < this.options.minSearchLength) {
            this.hide();
            return;
        }
        
        // Check for perfect match immediately to hide dropdown faster
        const normalizedValue = value.toLowerCase();
        const hasPerfectMatch = this.data.some(item => item.toLowerCase() === normalizedValue);
        
        if (hasPerfectMatch) {
            this.hide();
            return;
        }
        
        this.debounceTimer = setTimeout(() => {
            this.search(value);
        }, this.options.debounceDelay);
    }
    
    search(query) {
        if (!query || query.length < this.options.minSearchLength) {
            this.hide();
            return;
        }
        
        this.showLoading();

        // Check cache first
        if (this.resultCache.has(query)) {
            this.filteredData = this.resultCache.get(query);
            this.renderResults();
            this.showOrHideBasedOnMatch(query);
            return;
        }
        
        // Simulate async search (in real implementation, this could be async)
        setTimeout(() => {
            const results = this.filterData(query);
            this.filteredData = results;
            this.resultCache.set(query, results); // Cache results
            this.renderResults();
            this.showOrHideBasedOnMatch(query);
        }, 50);
    }
    
    showOrHideBasedOnMatch(query) {
        // Check if there's a perfect match
        const normalizedQuery = query.toLowerCase();
        const hasPerfectMatch = this.data.some(item => item.toLowerCase() === normalizedQuery);
        
        if (hasPerfectMatch) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    filterData(query) {
        const normalizedQuery = query.toLowerCase();
        const results = [];
        
        // First pass: exact matches and starts with
        for (const item of this.data) {
            const normalizedItem = item.toLowerCase();
            if (normalizedItem === normalizedQuery) {
                results.push({ text: item, relevance: 100 });
            } else if (normalizedItem.startsWith(normalizedQuery)) {
                results.push({ text: item, relevance: 90 });
            }
        }
        
        // Second pass: contains matches
        for (const item of this.data) {
            const normalizedItem = item.toLowerCase();
            if (!normalizedItem.startsWith(normalizedQuery) &&
                normalizedItem.includes(normalizedQuery)) {
                results.push({ text: item, relevance: 50 });
            }
        }
        
        // Third pass: fuzzy matches (word boundaries)
        const queryWords = normalizedQuery.split(/\s+/);
        for (const item of this.data) {
            const normalizedItem = item.toLowerCase();
            let hasAllWords = true;
            let wordMatches = 0;
            
            for (const word of queryWords) {
                if (normalizedItem.includes(word)) {
                    wordMatches++;
                } else {
                    hasAllWords = false;
                    break;
                }
            }
            
            if (hasAllWords && wordMatches === queryWords.length) {
                const existingResult = results.find(r => r.text === item);
                if (!existingResult) {
                    results.push({ text: item, relevance: 30 });
                }
            }
        }
        
        // Sort by relevance and limit results
        return results
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, this.options.maxResults)
            .map(r => r.text);
    }

    getWeaponType(itemName) {
        // This is a simplified example. A more robust solution would involve a mapping
        // or a more sophisticated parsing logic based on a comprehensive list of weapon names.
        const weaponTypes = [
            "AK-47", "M4A4", "M4A1-S", "AWP", "Desert Eagle", "Glock-18", "USP-S", "P250",
            "Five-SeveN", "Tec-9", "MP9", "MAC-10", "UMP-45", "P90", "PP-Bizon", "Nova",
            "XM1014", "Sawed-Off", "MAG-7", "Negev", "M249", "Galil AR", "FAMAS", "SSG 08",
            "SG 553", "AUG", "SCAR-20", "G3SG1", "Dual Berettas", "CZ75-Auto", "R8 Revolver",
            "MP5-SD", "Knife", "Gloves", "Sticker", "Music Kit", "Case", "Capsule", "Graffiti"
        ];
        
        for (const type of weaponTypes) {
            if (itemName.includes(type)) {
                return type;
            }
        }
        // Handle knives and gloves as special cases if they don't fit the above
        if (itemName.includes("Knife")) return "Knife";
        if (itemName.includes("Gloves")) return "Gloves";
        
        return "Other"; // Default category
    }

    groupResults(results) {
        const grouped = {};
        results.forEach(item => {
            const type = this.getWeaponType(item);
            if (!grouped[type]) {
                grouped[type] = [];
            }
            grouped[type].push(item);
        });

        // Sort groups (e.g., by number of items, or a predefined order)
        const sortedGroupKeys = Object.keys(grouped).sort((a, b) => {
            // Prioritize common weapon types or those with more results
            const order = ["AK-47", "M4A4", "AWP", "Desert Eagle", "Knife", "Gloves", "Other"];
            const indexA = order.indexOf(a);
            const indexB = order.indexOf(b);

            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return grouped[b].length - grouped[a].length; // Fallback to quantity
        });

        return sortedGroupKeys
            .filter(key => grouped[key] && grouped[key].length > 0)
            .map(key => ({
                type: key,
                items: grouped[key]
            }));
    }
    
    renderResults() {
        this.resultsContainer.innerHTML = '';
        this.selectedIndex = -1;
        
        if (this.filteredData.length === 0) {
            this.hide();
            return;
        }
        
        this.hideLoading();
        this.hideEmpty();
        
        const query = this.input.value.toLowerCase();
        let totalRenderedItems = 0;

        this.filteredData.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'autocomplete-item';
            itemElement.setAttribute('role', 'option');
            itemElement.setAttribute('aria-selected', 'false');
            itemElement.dataset.value = item;
            
            if (this.options.highlightSearch) {
                itemElement.innerHTML = this.highlightText(item, query);
            } else {
                itemElement.textContent = item;
            }
            
            this.resultsContainer.appendChild(itemElement);
            totalRenderedItems++;
        });
        this.updateResultCount(totalRenderedItems, this.data.length);
    }

    
    highlightText(text, query) {
        if (!query) return text;
        
        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const queryWords = query.split(/\s+/).filter(word => word.length > 0);
        
        let highlightedText = text;
        
        queryWords.forEach(word => {
            const regex = new RegExp(`(${escapeRegex(word)})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        });
        
        return highlightedText;
    }
    
    navigateDown() {
        const items = this.dropdown.querySelectorAll('.autocomplete-item');
        if (items.length === 0) return;
        
        this.selectedIndex = (this.selectedIndex + 1) % items.length;
        this.updateSelection();
    }
    
    navigateUp() {
        const items = this.dropdown.querySelectorAll('.autocomplete-item');
        if (items.length === 0) return;
        
        this.selectedIndex = this.selectedIndex <= 0 ? items.length - 1 : this.selectedIndex - 1;
        this.updateSelection();
    }
    
    updateSelection() {
        const items = this.dropdown.querySelectorAll('.autocomplete-item');
        
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
                item.setAttribute('aria-selected', 'true');
                // Smooth scroll into view
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                this.input.setAttribute('aria-activedescendant', item.id = 'autocomplete-item-' + Date.now() + '-' + index);
            } else {
                item.classList.remove('selected');
                item.setAttribute('aria-selected', 'false');
            }
        });
    }
    
    selectItem(itemElement) {
        const value = itemElement.dataset.value;
        this.input.value = value;
        this.input.focus();
        this.hide();

        // Visual feedback
        itemElement.classList.add('selected-confirm');
        setTimeout(() => {
            itemElement.classList.remove('selected-confirm');
        }, 500); // brief highlight flash

        // Trigger change event
        const changeEvent = new Event('change', { bubbles: true });
        this.input.dispatchEvent(changeEvent);
        
        // Trigger input event for any listeners
        const inputEvent = new Event('input', { bubbles: true });
        this.input.dispatchEvent(inputEvent);
    }
    
    selectItemByIndex(index) {
        const items = this.dropdown.querySelectorAll('.autocomplete-item');
        if (items[index]) {
            this.selectItem(items[index]);
        }
    }
    
    show() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.dropdown.classList.add('open');
        this.input.setAttribute('aria-expanded', 'true');
        
        // Position dropdown
        this.positionDropdown();
        // Restore scroll position
        this.resultsContainer.scrollTop = this.scrollPosition;
    }
    
    hide() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.dropdown.classList.remove('open');
        this.input.setAttribute('aria-expanded', 'false');
        this.selectedIndex = -1;
        // Save scroll position
        this.scrollPosition = this.resultsContainer.scrollTop;
    }
    
    positionDropdown() {
        const inputRect = this.input.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        // Position dropdown below input
        this.dropdown.style.width = `${inputRect.width}px`;
        this.dropdown.style.left = '0';
        this.dropdown.style.top = `${inputRect.height + 2}px`;
    }
    
    showLoading() {
        this.loadingElement.style.display = 'flex';
        this.emptyElement.style.display = 'none';
        this.resultsContainer.style.display = 'none';
        this.resultCountElement.style.display = 'none';
    }
    
    hideLoading() {
        this.loadingElement.style.display = 'none';
        this.resultsContainer.style.display = 'block';
        this.resultCountElement.style.display = 'block';
    }
    
    showEmpty() {
        this.emptyElement.style.display = 'block';
        this.loadingElement.style.display = 'none';
        this.resultsContainer.style.display = 'none';
        this.resultCountElement.style.display = 'none';
    }
    
    hideEmpty() {
        this.emptyElement.style.display = 'none';
    }

    updateClearButtonVisibility() {
        if (this.input.value.length > 0) {
            this.clearButton.style.display = 'block';
        } else {
            this.clearButton.style.display = 'none';
        }
    }

    updateResultCount(current, total) {
        if (this.options.showResultCount && current > 0) {
            this.resultCountElement.textContent = `Showing ${current} of ${total} results`;
            this.resultCountElement.style.display = 'block';
        } else {
            this.resultCountElement.style.display = 'none';
        }
    }

    
    // Public API methods
    setData(data) {
        this.data = Array.isArray(data) ? data : [];
    }
    
    updateData(data) {
        this.setData(data);
        if (this.input.value.length >= this.options.minSearchLength) {
            this.search(this.input.value);
        }
    }
    
    getValue() {
        return this.input.value;
    }
    
    setValue(value) {
        this.input.value = value;
        this.updateClearButtonVisibility();
    }
    
    clear() {
        this.input.value = '';
        this.hide();
        this.updateClearButtonVisibility();
    }
    
    destroy() {
        // Clean up event listeners and DOM elements
        this.hide();
        if (this.dropdown && this.dropdown.parentNode) {
            this.dropdown.parentNode.removeChild(this.dropdown);
        }
        if (this.clearButton && this.clearButton.parentNode) {
            this.clearButton.parentNode.removeChild(this.clearButton);
        }
        
        // Reset input attributes
        this.input.removeAttribute('role');
        this.input.removeAttribute('aria-expanded');
        this.input.removeAttribute('aria-autocomplete');
        this.input.removeAttribute('aria-owns');
        this.input.removeAttribute('aria-activedescendant');
        
        clearTimeout(this.debounceTimer);
    }
}