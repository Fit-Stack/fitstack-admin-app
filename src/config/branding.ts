import { useTenantBranding } from '@/contexts/TenantBrandingContext';

// Dynamic white-label branding configuration
// Falls back to env vars if no tenant branding is available
export function useBrandConfig() {
  const { branding } = useTenantBranding();

  return {
    // Brand Identity
    name: branding?.name || import.meta.env.VITE_BRAND_NAME || 'FitStack',
    tagline: branding?.tagline || import.meta.env.VITE_BRAND_TAGLINE || 'Admin Portal',

    // Colors (use CSS color values)
    primaryColor: branding?.primaryColor || import.meta.env.VITE_PRIMARY_COLOR || '#f97316',
    primaryHover: branding?.primaryHover || import.meta.env.VITE_PRIMARY_HOVER || '#ea580c',

    // Logo (can be replaced with custom logo URL)
    logoUrl: branding?.logoUrl || import.meta.env.VITE_LOGO_URL || null,

    // Favicon
    faviconUrl: branding?.faviconUrl || import.meta.env.VITE_FAVICON_URL || null,

    // Font
    fontFamily: branding?.fontFamily || 'Inter',
  };
}
