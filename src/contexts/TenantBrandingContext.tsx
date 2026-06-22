import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTenantFromUrl } from '@/hooks/useTenantFromUrl';
import { tenantService, BrandingData } from '@/services/tenant.service';
import { hexToHslComponents } from '@/lib/utils';

interface TenantBrandingContextType {
  // Full branding payload. `branding.id` is the tenant UUID (used for login),
  // `branding.tenantId` is the slug, plus name/colors/font/logo.
  branding: BrandingData | null;
  isLoading: boolean;
  error: string | null;
}

const TenantBrandingContext = createContext<TenantBrandingContextType>({
  branding: null,
  isLoading: true,
  error: null,
});

export function TenantBrandingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const subdomain = useTenantFromUrl();
  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subdomain) {
      // No tenant in the URL — fall back to default branding, surface no error
      // until the user actually attempts to log in.
      setIsLoading(false);
      return;
    }

    const fetchBranding = async () => {
      setIsLoading(true);
      try {
        const data = await tenantService.getBranding(subdomain);
        setBranding(data);
        setError(null);
        applyBranding(data);
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          'Failed to load tenant branding';
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranding();
  }, [subdomain]);

  const applyBranding = (data: BrandingData) => {
    // Apply CSS variables for dynamic branding
    const root = document.documentElement;
    const primary = data.primaryColor || '#f97316';
    root.style.setProperty('--brand-primary', primary);
    root.style.setProperty('--brand-primary-hover', data.primaryHover || '#ea580c');
    root.style.setProperty('--brand-font', data.fontFamily || 'Inter');

    // Drive shadcn's --primary / --ring tokens so EVERY button and any
    // bg-primary / text-primary / ring-primary element across the admin app
    // adopts the tenant color. These tokens are HSL components, not hex.
    const primaryHsl = hexToHslComponents(primary);
    if (primaryHsl) {
      root.style.setProperty('--primary', primaryHsl);
      root.style.setProperty('--ring', primaryHsl);
    }

    // Update favicon if provided
    if (data.faviconUrl) {
      const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (link) {
        link.href = data.faviconUrl;
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = data.faviconUrl;
        document.head.appendChild(newLink);
      }
    }

    // Inject Google Fonts or web font for custom fontFamily
    if (data.fontFamily && data.fontFamily !== 'Inter') {
      const fontName = data.fontFamily.replace(/\s+/g, '+');
      const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;600;700&display=swap`;

      // Check if already injected
      const existing = document.querySelector(
        `link[href*="${fontName}"]`
      ) as HTMLLinkElement;
      if (!existing) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = googleFontsUrl;
        document.head.appendChild(link);
      }
    }
  };

  return (
    <TenantBrandingContext.Provider value={{ branding, isLoading, error }}>
      {children}
    </TenantBrandingContext.Provider>
  );
}

export function useTenantBranding(): TenantBrandingContextType {
  const context = useContext(TenantBrandingContext);
  if (!context) {
    throw new Error('useTenantBranding must be used within TenantBrandingProvider');
  }
  return context;
}
