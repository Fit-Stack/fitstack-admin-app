// White-label branding configuration
// Customize these values for different gym brands

export const brandConfig = {
  // Brand Identity
  name: import.meta.env.VITE_BRAND_NAME || 'FitStack',
  tagline: import.meta.env.VITE_BRAND_TAGLINE || 'Admin Portal',
  
  // Colors (use CSS color values)
  primaryColor: import.meta.env.VITE_PRIMARY_COLOR || '#f97316', // Orange-500
  primaryHover: import.meta.env.VITE_PRIMARY_HOVER || '#ea580c', // Orange-600
  
  // Logo (can be replaced with custom logo URL)
  logoUrl: import.meta.env.VITE_LOGO_URL || null,
  
  // Favicon
  faviconUrl: import.meta.env.VITE_FAVICON_URL || null,
};
