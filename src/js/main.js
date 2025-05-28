// Import All Needed Classes/Const
import { skinMap } from './config/constants.js';
import { debounce } from './utils/url-helpers.js';
import { StorageManager } from './utils/storage.js';
import { updatePaintSeedInputValidationClass } from './utils/validation.js';
import { MarketplaceURLs } from './marketplaces/url-generators.js';
import { DarkModeManager } from './components/dark-mode.js';
import { FloatRangeManager } from './components/float-range.js';
import { MarketSelector } from './components/market-selector.js';
import { TabManager } from './services/tab-manager.js';
import { SearchProcessor } from './services/search-processor.js';

// Browser ID
if (typeof browser === "undefined") {
    var browser = chrome; 
}

// Main Logic
document.addEventListener('DOMContentLoaded', async () => {
    const body = document.body;
    const skinDatalist = document.getElementById('skinList');
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
    const marketListContainer = document.getElementById('marketList');
    const marketCheckboxes = marketListContainer.querySelectorAll('input[name="market"]');
    const marketItems = marketListContainer.querySelectorAll('.market-item');
    const searchButton = document.getElementById('searchButton');
    const darkModeToggle = document.getElementById('darkModeToggle');


    // --- Save State Function (persist settings) ---
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
        floatRangeManager.applyState(savedState);
        marketSelector.applyState(savedState);
    } else {
        console.log("No saved state found, initializing defaults from components.");
        floatRangeManager.updateSlidersFromInput(false);
        updatePaintSeedInputValidationClass(paintSeedInput);
        marketSelector.updateSelectAllState();
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
            if (!floatRangeManager.validateInputs()) { 
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
            );
            if (!searchParams) {
                alert('Please enter an item name.');
                return;
            }
            searchParams.noTradeHold = noTradeholdCheckbox.checked;
            searchParams.wearGt = Math.round(searchParams.minFloat * 100);
            searchParams.wearLt = Math.round(searchParams.maxFloat * 100);

            const selectedMarkets = marketSelector.getSelectedMarkets();
            if (selectedMarkets.length === 0) {
                alert('Please select at least one marketplace.');
                return;
            }
            searchButton.disabled = true;
            searchButton.textContent = 'KEEP WINDOW OPEN';
            const urlsToOpen = MarketplaceURLs.generateAll(searchParams, selectedMarkets);
            await TabManager.openTabs(urlsToOpen);
            marketSelector.updateSearchButtonText();
            console.log("Finished opening tabs.");
        });
    } else {
        console.error("Skin form not found!");
    }
});