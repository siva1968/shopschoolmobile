/**
 * Favicon utilities for the ecommerce platform
 * Handles fallback to default ecommerce-themed favicon when portal logo is not available
 */

// Default ecommerce-themed favicon (16x16) - inline SVG
const DEFAULT_FAVICON_SVG = `
<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="16" height="16" rx="2" fill="url(#gradient)"/>
  <path d="M3 4h10l-1 7H4L3 4z" fill="white" opacity="0.9"/>
  <circle cx="5" cy="13" r="1" fill="white"/>
  <circle cx="11" cy="13" r="1" fill="white"/>
  <path d="M3 2h1l0.5 2" stroke="white" stroke-width="1" fill="none" opacity="0.8"/>
</svg>
`;

/**
 * Get favicon URL with fallback to default ecommerce icon
 * @param portalLogo - Portal logo URL from backend
 * @returns URL to use for favicon
 */
export const getFaviconUrl = (portalLogo?: string | null): string => {
  if (portalLogo) {
    return portalLogo;
  }
  
  // Create data URL from inline SVG for default favicon
  const svgDataUrl = `data:image/svg+xml;base64,${btoa(DEFAULT_FAVICON_SVG)}`;
  return svgDataUrl;
};

/**
 * Get fallback title for the ecommerce platform
 */
export const getDefaultTitle = (schoolName?: string, portalName?: string): string => {
  if (schoolName) {
    return `${schoolName} - School Store`;
  }
  if (portalName) {
    return `${portalName} - Online Store`;
  }
  return 'ShopSchool - Your School Store';
};

/**
 * Get fallback description for SEO
 */
export const getDefaultDescription = (schoolName?: string, portalName?: string): string => {
  const baseName = schoolName || portalName || 'ShopSchool';
  return `Shop for school supplies, uniforms, books and more at ${baseName}. Easy online ordering with secure payment and fast delivery.`;
};
