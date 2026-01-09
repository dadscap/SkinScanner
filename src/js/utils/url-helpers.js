/* Url Helpers
 * Utility functions for URL manipulation and debouncing.
 */

import { UTM_SOURCE } from '../config/constants.js';

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function addUtmParams(url, _marketKey) {
    if (!url)
        return null;
    
    const utmParams = {
        utm_source: UTM_SOURCE
    };
    const validUtmParams = Object.entries(utmParams)
        .filter(([_key, value]) => value)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    
    if (validUtmParams.length === 0)
        { return url;
        }
    
    const utmString = validUtmParams.join('&');
    const urlParts = url.split('#');
    let base = urlParts[0];
    const fragment = urlParts.length > 1 ? '#' + urlParts[1] : '';
    
    if (base.includes('?')) {
        base += '&' + utmString;}
    else {
        base += '?' + utmString;}
    return base + fragment;
}

export function ShadowPayUtmParams(url, _marketKey) {
    if (!url) return null;
    
    const utmParams = {
        utm_source: UTM_SOURCE
    };
    const validUtmParams = Object.entries(utmParams)
        .filter(([_key, value]) => value)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    
    if (validUtmParams.length === 0) return url;
    
    const utmString = validUtmParams.join('&');
    const urlParts = url.split('#');
    let base = urlParts[0];
    const fragment = urlParts.length > 1 ? '#' + urlParts[1] : '';
    
    base += '&' + utmString;
    return base + fragment;
}
