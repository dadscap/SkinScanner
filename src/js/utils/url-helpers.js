/* Url Helpers
 * Utility functions for URL manipulation and debouncing.
 */
import { UTM_SOURCE } from '../config/constants.js';

/**
 * Creates a debounced version of a function that delays invoking the function until after
 * 'wait' milliseconds have elapsed since the last time it was invoked
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} The debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        // Clear any existing timeout to reset the wait period
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        // Set a new timeout to execute the function after the wait period
        timeout = setTimeout(later, wait);
    };
}

/**
 * Adds default UTM tracking parameters to a URL for analytics purposes
 * @param {string} url - The base URL to add UTM parameters to
 * @param {string} _marketKey - Marketplace identifier (currently unused but kept for compatibility)
 * @returns {string|null} The URL with UTM parameters appended, or null if no URL provided
 */
export function addUtmParams(url, _marketKey) {
    if (!url)
        return null;
    
    // Build UTM parameters object with default values
    const utmParams = {
        utm_source: UTM_SOURCE
    };
    
    // Filter out any undefined/null UTM values and encode for URL safety
    const validUtmParams = Object.entries(utmParams)
        .filter(([_key, value]) => value)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    
    // Return original URL if no valid UTM parameters to add
    if (
        validUtmParams.length === 0)
        { return url;
        }
    
    const utmString = validUtmParams.join('&');
    
    // Preserve URL fragments (hash) by splitting them out
    const urlParts = url.split('#');
    let base = urlParts[0];
    const fragment = urlParts.length > 1 ? '#' + urlParts[1] : '';
    
    // Append UTM params with proper separator (? for first param, & for additional)
    if (base.includes('?')) {
        base += '&' + utmString;}
    else {
        base += '?' + utmString;}
    
    // Reconstruct URL with fragment
    return base + fragment;
}

/**
 * Special UTM parameter handler for ShadowPay marketplace
 * Similar to addUtmParams but always appends with &
 * @param {string} url - The base URL to add UTM parameters to
 * @param {string} _marketKey - Marketplace identifier (currently unused but kept for compatibility)
 * @returns {string|null} The URL with UTM parameters appended, or null if no URL provided
 */
export function ShadowPayUtmParams(url, _marketKey) {
    if (!url) return null;
    
    // ShadowPay only uses default utm_source; campaign handled upstream
    const utmParams = {
        utm_source: UTM_SOURCE
    };
    
    // Filter and encode UTM parameters
    const validUtmParams = Object.entries(utmParams)
        .filter(([_key, value]) => value)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    
    if (validUtmParams.length === 0) return url;
    
    const utmString = validUtmParams.join('&');
    
    // Preserve URL fragments
    const urlParts = url.split('#');
    let base = urlParts[0];
    const fragment = urlParts.length > 1 ? '#' + urlParts[1] : '';
    
    // Note: Always uses & (assumes URL already has query parameters)
    base += '&' + utmString;
    
    return base + fragment;
}
