/* AutocompleteComponent
 * Replaces the native datalist with a custom dropdown implementation
 * Note: Won't work for local installs (go back a few commits and download the massive JSON file in '/data')
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
        this.scrollPosition = 0;
        this.resultCache = new Map();
        this.dataReady = false;
        this.pendingQuery = null;
        this.activeQueryId = 0;
        
        this.init();
    }
    
    init() {
        this.createDropdownElements();
        this.setupEventListeners();
        this.setupKeyboardNavigation();
        this.updateClearButtonVisibility();
    }
    
    createDropdownElements() {
        const existingContainer = this.input.parentElement.querySelector('.autocomplete-container');
        if (!existingContainer) {
            const container = document.createElement('div');
            container.className = 'autocomplete-container';
            this.input.parentNode.insertBefore(container, this.input);
            container.appendChild(this.input);
        }
        
        this.container = this.input.parentElement;
        
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'autocomplete-dropdown';
        this.dropdown.setAttribute('role', 'listbox');
        this.dropdown.setAttribute('aria-label', 'Autocomplete suggestions');

        this.resultsContainer = document.createElement('div');
        this.resultsContainer.className = 'autocomplete-results';
        
        this.loadingElement = document.createElement('div');
        this.loadingElement.className = 'autocomplete-loading';
        this.loadingElement.innerHTML = '<div class="loading-spinner"></div><span>Loading...</span>';
        
        this.emptyElement = document.createElement('div');
        this.emptyElement.className = 'autocomplete-empty';
        this.emptyElement.textContent = 'No results found';

        this.resultCountElement = document.createElement('div');
        this.resultCountElement.className = 'autocomplete-result-count';
        this.resultCountElement.style.display = 'none';
        
        this.dropdown.appendChild(this.resultsContainer);
        this.dropdown.appendChild(this.loadingElement);
        this.dropdown.appendChild(this.emptyElement);
        this.dropdown.appendChild(this.resultCountElement);
        this.container.appendChild(this.dropdown);

        this.clearButton = document.createElement('button');
        this.clearButton.className = 'autocomplete-clear-button';
        this.clearButton.innerHTML = '&times;';
        this.clearButton.setAttribute('aria-label', 'Clear search input');
        this.clearButton.style.display = 'none';
        this.container.appendChild(this.clearButton);
        
        this.input.setAttribute('role', 'combobox');
        this.input.setAttribute('aria-expanded', 'false');
        this.input.setAttribute('aria-autocomplete', 'list');
        this.input.setAttribute('aria-owns', this.dropdown.id = 'autocomplete-dropdown-' + Date.now());
    }
    
    setupEventListeners() {
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
        
        this.input.addEventListener('blur', () => {
            setTimeout(() => {
                if (!this.dropdown.contains(document.activeElement) && !this.clearButton.contains(document.activeElement)) {
                    this.hide();
                }
            }, 150);
        });
        
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target) && !this.clearButton.contains(e.target)) {
                this.hide();
            }
        });
        
        this.dropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.autocomplete-item');
            if (item) {
                this.selectItem(item);
            }
        });

        this.clearButton.addEventListener('click', () => {
            this.clear();
            this.input.focus();
            this.updateClearButtonVisibility();
            this.hide();
        });
        
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
        const trimmedValue = value.trim();
        
        if (trimmedValue.length < this.options.minSearchLength) {
            this.hide();
            this.pendingQuery = null;
            return;
        }

        if (!this.dataReady) {
            this.pendingQuery = trimmedValue;
            this.showLoading();
            this.show();
            return;
        }
        
        const normalizedValue = trimmedValue.toLowerCase();
        const hasPerfectMatch = this.data.some(item => item.toLowerCase() === normalizedValue);
        
        if (hasPerfectMatch) {
            this.hide();
            this.pendingQuery = null;
            return;
        }
        
        this.debounceTimer = setTimeout(() => {
            this.search(trimmedValue);
        }, this.options.debounceDelay);
    }
    
    search(query) {
        const trimmedQuery = query.trim();
        if (!trimmedQuery || trimmedQuery.length < this.options.minSearchLength) {
            this.hide();
            this.updateResultCount(0, this.data.length);
            this.pendingQuery = null;
            return;
        }

        if (!this.dataReady) {
            this.pendingQuery = trimmedQuery;
            this.showLoading();
            return;
        }
        
        this.pendingQuery = null;
        const cacheKey = trimmedQuery.toLowerCase();
        const isCached = this.resultCache.has(cacheKey);

        if (!isCached) {
            this.showLoading();
        } else {
            this.hideEmpty();
            this.hideLoading();
        }

        const currentQueryId = ++this.activeQueryId;

        if (isCached) {
            this.filteredData = this.resultCache.get(cacheKey);
            this.renderResults();
            this.showOrHideBasedOnMatch(trimmedQuery);
            return;
        }
        
        const results = this.filterData(trimmedQuery);
        if (currentQueryId !== this.activeQueryId) return;

        this.filteredData = results;
        this.resultCache.set(cacheKey, results);
        this.renderResults();
        this.showOrHideBasedOnMatch(trimmedQuery);
    }
    
    showOrHideBasedOnMatch(query) {
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
        
        for (const item of this.data) {
            const normalizedItem = item.toLowerCase();
            if (normalizedItem === normalizedQuery) {
                results.push({ text: item, relevance: 100 });
            } else if (normalizedItem.startsWith(normalizedQuery)) {
                results.push({ text: item, relevance: 90 });
            }
        }
        
        for (const item of this.data) {
            const normalizedItem = item.toLowerCase();
            if (!normalizedItem.startsWith(normalizedQuery) &&
                normalizedItem.includes(normalizedQuery)) {
                results.push({ text: item, relevance: 50 });
            }
        }
        
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
        
        return results
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, this.options.maxResults)
            .map(r => r.text);
    }

    getWeaponType(itemName) {
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
        if (itemName.includes("Knife")) return "Knife";
        if (itemName.includes("Gloves")) return "Gloves";
        
        return "Other";
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

        const sortedGroupKeys = Object.keys(grouped).sort((a, b) => {
            const order = ["AK-47", "M4A4", "AWP", "Desert Eagle", "Knife", "Gloves", "Other"];
            const indexA = order.indexOf(a);
            const indexB = order.indexOf(b);

            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return grouped[b].length - grouped[a].length;
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
            this.hideLoading();
            this.showEmpty();
            this.updateResultCount(0, this.data.length);
            this.show();
            return;
        }
        
        this.hideLoading();
        this.hideEmpty();
        
        const query = this.input.value.toLowerCase();
        let totalRenderedItems = 0;

        this.filteredData.forEach((item) => {
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

        itemElement.classList.add('selected-confirm');
        setTimeout(() => {
            itemElement.classList.remove('selected-confirm');
        }, 500);

        const changeEvent = new Event('change', { bubbles: true });
        this.input.dispatchEvent(changeEvent);
        
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
        
        this.positionDropdown();
        this.resultsContainer.scrollTop = this.scrollPosition;
    }
    
    hide() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.dropdown.classList.remove('open');
        this.input.setAttribute('aria-expanded', 'false');
        this.selectedIndex = -1;
        this.scrollPosition = this.resultsContainer.scrollTop;
    }
    
    positionDropdown() {
        const inputRect = this.input.getBoundingClientRect();
        
        this.dropdown.style.width = `${inputRect.width}px`;
        this.dropdown.style.left = '0';
        this.dropdown.style.top = `${inputRect.height + 2}px`;
    }
    
    showLoading() {
        this.loadingElement.style.display = 'flex';
        this.emptyElement.style.display = 'none';
        this.resultsContainer.style.display = 'none';
        this.resultCountElement.style.display = 'none';
        if (!this.isOpen) {
            this.show();
        }
    }
    
    hideLoading() {
        this.loadingElement.style.display = 'none';
        this.resultsContainer.style.display = 'block';
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

    setData(data) {
        this.data = Array.isArray(data) ? data : [];
        this.dataReady = true;
        this.resultCache.clear();

        let ranQueuedSearch = false;
        if (this.pendingQuery && this.pendingQuery.length >= this.options.minSearchLength) {
            const queuedQuery = this.pendingQuery;
            this.pendingQuery = null;
            this.search(queuedQuery);
            ranQueuedSearch = true;
        }
        return ranQueuedSearch;
    }
    
    updateData(data) {
        const ranQueuedSearch = this.setData(data);
        if (ranQueuedSearch) return;

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
        this.hide();
        if (this.dropdown && this.dropdown.parentNode) {
            this.dropdown.parentNode.removeChild(this.dropdown);
        }
        if (this.clearButton && this.clearButton.parentNode) {
            this.clearButton.parentNode.removeChild(this.clearButton);
        }
        
        this.input.removeAttribute('role');
        this.input.removeAttribute('aria-expanded');
        this.input.removeAttribute('aria-autocomplete');
        this.input.removeAttribute('aria-owns');
        this.input.removeAttribute('aria-activedescendant');
        
        clearTimeout(this.debounceTimer);
    }

    updateResultCount(visibleCount, totalCount) {
        if (!this.options.showResultCount || !this.resultCountElement) return;

        if (!visibleCount) {
            this.resultCountElement.style.display = 'none';
            return;
        }

        const formatter = new Intl.NumberFormat();
        this.resultCountElement.textContent = `Showing ${formatter.format(visibleCount)} of ${formatter.format(totalCount)} results`;
        this.resultCountElement.style.display = 'block';
    }
}
