
import { UTM_SOURCE, UTM_MEDIUM, UTM_CAMPAIGN } from '../config/constants.js';

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
export function addUtmParams(url, marketKey) { 
    if (!url) 
        return null;
    const utmParams = {
        utm_source: UTM_SOURCE,
        utm_medium: UTM_MEDIUM,
        utm_campaign: UTM_CAMPAIGN,
        utm_content: marketKey
    };
    const validUtmParams = Object.entries(utmParams)
        .filter(([_key, value]) => value)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    if (
        validUtmParams.length === 0) 
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

export function ShadowPayUtmParams(url, marketKey) {
    if (!url) return null;
    const utmParams = {
        utm_source: UTM_SOURCE,
        utm_medium: UTM_MEDIUM,
        utm_content: marketKey
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