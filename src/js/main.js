// js/main.js
import { skinMap } from './config/constants.js'; // And other constants if needed by main
import { debounce } from './utils/url-helpers.js';
import { StorageManager } from './utils/storage.js';
import { updatePaintSeedInputValidationClass } from './utils/validation.js';
import { MarketplaceURLs } from './marketplaces/url-generators.js';
import { DarkModeManager } from './components/dark-mode.js';
import { FloatRangeManager } from './components/float-range.js';
import { MarketSelector } from './components/market-selector.js';
import { TabManager } from './services/tab-manager.js';
import { SearchProcessor } from './services/search-processor.js';

if (typeof browser === "undefined") {
    var browser = chrome; // Define browser/chrome if not already defined
}

document.addEventListener('DOMContentLoaded', async () => {
    // --- Get DOM Elements ---
    const body = document.body;
    const skinDatalist = document.getElementById('skinList');
    const skinForm = document.getElementById('skinForm');
    const itemNameInput = document.getElementById('item_name');
    const stattrakCheckbox = document.getElementById('stattrak');
    const noTradeholdCheckbox = document.getElementById('notradehold');
    // ... (all other element getters from your original script)
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
    const marketListContainer = document.getElementById('marketList');
    const marketCheckboxes = marketListContainer.querySelectorAll('input[name="market"]');
    const marketItems = marketListContainer.querySelectorAll('.market-item');
    const searchButton = document.getElementById('searchButton');
    const darkModeToggle = document.getElementById('darkModeToggle');


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
            selectedMarkets: marketSelector.getSelectedMarkets(), // Get from component
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

    const marketSelectorElements = { selectAllCheckbox, marketListContainer, marketCheckboxes, marketItems, searchButton };
    const marketSelector = new MarketSelector(marketSelectorElements, debouncedSaveState);

    // --- Load Preferences & State ---
    await darkModeManager.loadPreference();

    const savedState = await StorageManager.loadState();
    if (savedState && typeof savedState === 'object') {
        console.log("Loading saved state:", savedState);
        itemNameInput.value = savedState.itemName || '';
        stattrakCheckbox.checked = savedState.isStatTrak || false;
        noTradeholdCheckbox.checked = savedState.noTradeHold || false;
        // Components handle their own state application
        floatRangeManager.applyState(savedState);
        marketSelector.applyState(savedState);
    } else {
        console.log("No saved state found, initializing defaults from components.");
        // Components should set their own defaults on init or have methods to reset
        floatRangeManager.updateSlidersFromInput(false); // Ensure UI consistency
        updatePaintSeedInputValidationClass(paintSeedInput);
        marketSelector.updateSelectAllState(); // Ensure button text is correct
    }
     // Call save state for any simple inputs not handled by components
    itemNameInput.addEventListener('input', debouncedSaveState);
    stattrakCheckbox.addEventListener('change', debouncedSaveState);
    noTradeholdCheckbox.addEventListener('change', debouncedSaveState);


    // --- Populate Datalist ---
    if (skinMap && Object.keys(skinMap).length > 0 && skinDatalist) {
        for (const skinName in skinMap) {
            const option = document.createElement('option');
            option.value = skinName;
            skinDatalist.appendChild(option);
        }
        if (searchButton) searchButton.disabled = marketSelector.getSelectedMarkets().length === 0;
    } else {
        console.error("SkinMap data is missing or skinDatalist not found!");
        if (searchButton) {
            searchButton.disabled = true;
            searchButton.textContent = "Error: Skin data missing";
        }
    }

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

            const searchParams = SearchProcessor.processInput(
                itemNameInput.value,
                stattrakCheckbox.checked,
                exteriorSelect.value,
                parseFloat(minFloatInput.value),
                parseFloat(maxFloatInput.value),
                paintSeedInput.value
                // Pass noTradeHoldCheckbox.checked if SearchProcessor needs it
            );

            if (!searchParams) {
                alert('Please enter an item name.');
                return;
            }
            
            // Add other params needed by URL generators if not already in searchParams
            searchParams.noTradeHold = noTradeholdCheckbox.checked;
            // Derive values that are common for many URL generators
            searchParams.wearGt = Math.round(searchParams.minFloat * 100);
            searchParams.wearLt = Math.round(searchParams.maxFloat * 100);
            // ... any other common derivations (exteriorLabel, exteriorId, etc.)


            const selectedMarkets = marketSelector.getSelectedMarkets();
            if (selectedMarkets.length === 0) {
                alert('Please select at least one marketplace.');
                return;
            }

            searchButton.disabled = true;
            searchButton.textContent = 'KEEP OPEN UNTIL THE END';

            const urlsToOpen = MarketplaceURLs.generateAll(searchParams, selectedMarkets);
            await TabManager.openTabs(urlsToOpen);

            // Reset button state (handled by marketSelector's updateSearchButtonText)
            marketSelector.updateSearchButtonText(); //This will re-enable button if markets are selected
            console.log("Finished opening tabs.");
        });
    } else {
        console.error("Skin form not found!");
    }
});