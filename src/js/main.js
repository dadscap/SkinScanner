/* Main Script for SkinScanner Extension
 * Handles initialization, event listeners, and interactions between components.
 */
import { debounce } from './utils/url-helpers.js';
import { StorageManager } from './utils/storage.js';
import { updatePaintSeedInputValidationClass } from './utils/validation.js';
import { MarketplaceURLs } from './marketplaces/url-generators.js';
import { DarkModeManager } from './components/dark-mode.js';
import { FloatRangeManager } from './components/float-range.js';
import { MarketSelector } from './components/market-selector.js';
import { AutocompleteComponent } from './components/autocomplete.js';
import { WhatsNewManager } from './components/whats-new.js';
import { TabManager } from './services/tab-manager.js';
import { SearchProcessor } from './services/search-processor.js';
import { getMappings } from './services/data-service.js';

if (typeof browser === "undefined") {
    var browser = chrome;
}

document.addEventListener('DOMContentLoaded', async () => {
    const body = document.body;
    const skinForm = document.getElementById('skinForm');
    const itemNameInput = document.getElementById('item_name');
    const stattrakCheckbox = document.getElementById('stattrak');
    const noTradeholdCheckbox = document.getElementById('notradehold');
    const exteriorSelect = document.getElementById('exterior');
    const minFloatRange = document.getElementById('minFloatRange');
    const maxFloatRange = document.getElementById('maxFloatRange');
    const minFloatInput = document.getElementById('minFloatInput');
    const maxFloatInput = document.getElementById('maxFloatInput');
    const minFloatLabel = document.getElementById('minFloatLabel');
    const maxFloatLabel = document.getElementById('maxFloatLabel');
    const floatRangeDiv = document.querySelector('.float-range');
    const paintSeedInput = document.getElementById('paint_seed');
    const selectAllCheckbox = document.getElementById('selectAll');
    const selectBuySellCheckbox = document.getElementById('selectBuySell');
    const selectTradeCheckbox = document.getElementById('selectTrade');
    const selectChinaCheckbox = document.getElementById('selectChina');
    const marketListContainer = document.getElementById('marketList');
    const marketCheckboxes = marketListContainer.querySelectorAll('input[name="market"]');
    const marketItems = marketListContainer.querySelectorAll('.market-item');
    const searchButton = document.getElementById('searchButton');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const resetFiltersButton = document.getElementById('resetFiltersButton');
    const settingsButton = document.getElementById('settingsButton');

    // --- Debounced Save State Function ---
    const doSaveState = async () => {
        const state = {
            itemName: itemNameInput.value,
            isStatTrak: stattrakCheckbox.checked,
            noTradeHold: noTradeholdCheckbox.checked,
            exterior: exteriorSelect.value,
            minFloat: minFloatInput.value,
            maxFloat: maxFloatInput.value,
            paintSeed: paintSeedInput.value,
            selectedMarkets: marketSelector.getSelectedMarkets(),
            selectAll: selectAllCheckbox.checked
        };
        await StorageManager.saveState(state);
        console.log("State saved:", state);
    };
    const debouncedSaveState = debounce(doSaveState, 300);

    // --- Initialize Components ---
    const darkModeManager = new DarkModeManager(darkModeToggle, body);
    const floatRangeElements = { minFloatRange, maxFloatRange, minFloatInput, maxFloatInput, minFloatLabel, maxFloatLabel, floatRangeDiv, exteriorSelect, paintSeedInput };
    const floatRangeManager = new FloatRangeManager(floatRangeElements, debouncedSaveState);
    const marketSelectorElements = {
        selectAllCheckbox,
        selectBuySellCheckbox,
        selectTradeCheckbox,
        selectChinaCheckbox,
        marketListContainer,
        marketCheckboxes,
        marketItems,
        searchButton
    };
    const marketSelector = new MarketSelector(marketSelectorElements, debouncedSaveState);
    
    // Initialize autocomplete component
    const autocomplete = new AutocompleteComponent(itemNameInput, {
        maxResults: 50,
        minSearchLength: 1,
        debounceDelay: 150,
        highlightSearch: true,
        enableKeyboardNavigation: true,
        showResultCount: true // Show total result count
    });

    // Initialize What's New manager
    const whatsNewManager = new WhatsNewManager();

    // --- Load Preferences & State ---
    await darkModeManager.loadPreference();
    const savedState = await StorageManager.loadState();
    if (savedState && typeof savedState === 'object') {
        console.log("Loading saved state:", savedState);
        itemNameInput.value = savedState.itemName || '';
        stattrakCheckbox.checked = savedState.isStatTrak || false;
        noTradeholdCheckbox.checked = savedState.noTradeHold || false;
        floatRangeManager.applyState(savedState);
        marketSelector.applyState(savedState);
    } else {
        console.log("No saved state found, initializing defaults from components.");
        floatRangeManager.updateSlidersFromInput(false); // Ensure UI consistency
        updatePaintSeedInputValidationClass(paintSeedInput);
        marketSelector.updateSelectAllState(); // Ensure button text is correct
    }
     // Call save state for any simple inputs not handled by components
    itemNameInput.addEventListener('input', debouncedSaveState);
    stattrakCheckbox.addEventListener('change', debouncedSaveState);
    noTradeholdCheckbox.addEventListener('change', debouncedSaveState);

    // --- Reset Filters Functionality ---
    const resetFiltersToDefault = async () => {
        // Reset all form fields to their default values
        itemNameInput.value = '';
        stattrakCheckbox.checked = false;
        noTradeholdCheckbox.checked = false;
        exteriorSelect.value = '';
        paintSeedInput.value = '';
        
        // Reset float range using the component method
        floatRangeManager.resetToDefaults();
        
        // Reset marketplace selections using the component method
        marketSelector.resetToDefaults();
        
        // Save the reset state
        await doSaveState();
        
        console.log("All filters reset to default values");
    };

    // Handle reset button click with confirmation
    if (resetFiltersButton) {
        resetFiltersButton.addEventListener('click', async () => {
            // Check if user wants to skip confirmation
            const skipConfirmation = await StorageManager.getSkipResetConfirmation();
            
            if (skipConfirmation) {
                await resetFiltersToDefault();
                return;
            }
            
            // Show confirmation dialog
            const confirmed = await showResetConfirmationDialog();
            if (confirmed) {
                await resetFiltersToDefault();
            }
        });
    }

    // Handle settings button click
    if (settingsButton) {
        settingsButton.addEventListener('click', async () => {
            await showSettingsDialog();
        });
    }

    // Reset confirmation dialog function
    const showResetConfirmationDialog = () => {
        return new Promise((resolve) => {
            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-content">
                    <h3>Reset All Filters</h3>
                    <p>Are you sure you want to reset all filters to their default values?</p>
                    <div class="modal-checkbox">
                        <label>
                            <input type="checkbox" id="skipConfirmationCheckbox">
                            Don't ask me again
                        </label>
                    </div>
                    <div class="modal-buttons">
                        <button id="confirmResetButton" class="button-confirm">Yes, Reset</button>
                        <button id="cancelResetButton" class="button-cancel">Cancel</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            // Handle confirm button
            document.getElementById('confirmResetButton').addEventListener('click', async () => {
                const skipCheckbox = document.getElementById('skipConfirmationCheckbox');
                if (skipCheckbox.checked) {
                    await StorageManager.setSkipResetConfirmation(true);
                }
                document.body.removeChild(overlay);
                resolve(true);
            });
            
            // Handle cancel button
            document.getElementById('cancelResetButton').addEventListener('click', () => {
                document.body.removeChild(overlay);
                resolve(false);
            });
            
            // Handle overlay click (cancel)
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    document.body.removeChild(overlay);
                    resolve(false);
                }
            });
        });
    };

    // --- Load Mappings and Populate Autocomplete ---
    const mappings = await getMappings();
    if (mappings && mappings.skinMap && Object.keys(mappings.skinMap).length > 0) {
        // Extract skin names for autocomplete
        const skinNames = Object.keys(mappings.skinMap);
        autocomplete.setData(skinNames);
        console.log(`Loaded ${skinNames.length} skin names for autocomplete`);
        
        if (searchButton) searchButton.disabled = marketSelector.getSelectedMarkets().length === 0;
    } else {
        console.error("SkinMap data is missing!");
        if (searchButton) {
            searchButton.disabled = true;
            searchButton.textContent = "Error: Skin data missing";
        }
    }

    // --- Check and Show What's New After Everything is Loaded ---
    await whatsNewManager.checkAndShow();

    // --- Form Submission ---
    if (skinForm) {
        skinForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!floatRangeManager.validateInputs()) { // Use component's validation
                alert('Please correct the float range.');
                return;
            }
            if (!updatePaintSeedInputValidationClass(paintSeedInput)) {
                 alert('Please correct the paint seed (0-1000).');
                 return;
            }

            const selectedMarkets = marketSelector.getSelectedMarkets();
            if (selectedMarkets.length > 10) {
                const skipWarning = await StorageManager.getSkipMarketWarning();
                if (!skipWarning) {
                    const continueSearch = await showMarketWarningDialog(selectedMarkets.length);
                    if (!continueSearch) {
                        return; // Stop if user cancels
                    }
                }
            }

            const searchParams = SearchProcessor.processInput(
                itemNameInput.value,
                stattrakCheckbox.checked,
                exteriorSelect.value,
                parseFloat(minFloatInput.value),
                parseFloat(maxFloatInput.value),
                paintSeedInput.value
            );
            if (!searchParams) {
                alert('Please enter an item name.');
                return;
            }
            searchParams.noTradeHold = noTradeholdCheckbox.checked;
            searchParams.wearGt = Math.round(searchParams.minFloat * 100);
            searchParams.wearLt = Math.round(searchParams.maxFloat * 100);

            if (selectedMarkets.length === 0) {
                alert('Please select at least one marketplace.');
                return;
            }
            searchButton.disabled = true;
            searchButton.textContent = 'DO NOT CLOSE THIS PAGE! Opening tabs...';
            const urlsToOpen = MarketplaceURLs.generateAll(searchParams, selectedMarkets, mappings);
            await TabManager.openTabs(urlsToOpen);
            marketSelector.updateSearchButtonText();
            console.log("Finished opening tabs.");
        });
    } else {
        console.error("Skin form not found!");
    }

    // Market selection warning dialog
    const showMarketWarningDialog = (marketCount) => {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-content">
                    <h3>Market Selection Warning</h3>
                    <p>You are about to open ${marketCount} new tabs. Are you sure you want to continue?</p>
                    <div class="modal-checkbox">
                        <label>
                            <input type="checkbox" id="skipMarketWarningCheckbox">
                            Don't ask me again
                        </label>
                    </div>
                    <div class="modal-buttons">
                        <button id="confirmMarketWarningButton" class="button-confirm">Yes, Continue</button>
                        <button id="cancelMarketWarningButton" class="button-cancel">Cancel</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            document.getElementById('confirmMarketWarningButton').addEventListener('click', async () => {
                const skipCheckbox = document.getElementById('skipMarketWarningCheckbox');
                if (skipCheckbox.checked) {
                    await StorageManager.setSkipMarketWarning(true);
                }
                document.body.removeChild(overlay);
                resolve(true);
            });
            
            document.getElementById('cancelMarketWarningButton').addEventListener('click', () => {
                document.body.removeChild(overlay);
                resolve(false);
            });
            
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    document.body.removeChild(overlay);
                    resolve(false);
                }
            });
        });
    };

    // Settings dialog function
    const showSettingsDialog = async () => {
        // Get current tab delay setting
        const currentDelay = await StorageManager.getTabDelay();
        
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-content">
                    <h3>General Settings</h3>
                    <div class="settings-section">
                        <h4>Tab Opening Speed</h4>
                        <p>Controls how quickly new tabs are opened when searching multiple marketplaces.</p>
                        <div class="tiered-bar">
                            <button class="tiered-bar-option" data-delay="1000">VERY<br>Slow</button>
                            <button class="tiered-bar-option" data-delay="500">Slow</button>
                            <button class="tiered-bar-option" data-delay="250">Medium</button>
                            <button class="tiered-bar-option" data-delay="100">Fast</button>
                            <button class="tiered-bar-option" data-delay="50">VERY<br>Fast</button>
                        </div>
                        <div class="current-selection">
                            Current: <span class="value" id="currentDelayDisplay"></span>
                        </div>
                    </div>
                    <div class="modal-buttons">
                        <button id="saveSettingsButton" class="button-confirm">Save Settings</button>
                        <button id="cancelSettingsButton" class="button-cancel">Cancel</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            // Set up tiered bar functionality
            const options = overlay.querySelectorAll('.tiered-bar-option');
            const currentDisplay = overlay.querySelector('#currentDelayDisplay');
            let selectedDelay = currentDelay;
            
            // Function to update display text
            const updateDisplayText = (delay) => {
                const delayTexts = {
                    1000: 'VERY Slow (1000ms)',
                    500: 'Slow (500ms)',
                    250: 'Medium (250ms)',
                    100: 'Fast (100ms)',
                    50: 'VERY Fast (50ms)'
                };
                currentDisplay.textContent = delayTexts[delay] || `${delay}ms`;
            };
            
            // Set initial active state and display
            options.forEach(option => {
                const delay = parseInt(option.dataset.delay);
                if (delay === currentDelay) {
                    option.classList.add('active');
                }
                
                option.addEventListener('click', () => {
                    // Remove active from all options
                    options.forEach(opt => opt.classList.remove('active'));
                    // Add active to clicked option
                    option.classList.add('active');
                    // Update selected delay
                    selectedDelay = delay;
                    updateDisplayText(delay);
                });
            });
            
            // Set initial display
            updateDisplayText(currentDelay);
            
            // Handle save button
            document.getElementById('saveSettingsButton').addEventListener('click', async () => {
                await StorageManager.setTabDelay(selectedDelay);
                document.body.removeChild(overlay);
                resolve(true);
            });
            
            // Handle cancel button
            document.getElementById('cancelSettingsButton').addEventListener('click', () => {
                document.body.removeChild(overlay);
                resolve(false);
            });
            
            // Handle overlay click (cancel)
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    document.body.removeChild(overlay);
                    resolve(false);
                }
            });
        });
    };
});