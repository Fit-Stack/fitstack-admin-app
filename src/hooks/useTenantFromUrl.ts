import { useEffect, useState } from 'react';

/**
 * Extract tenant subdomain from URL
 * Production: gym1.fitstack.com → 'gym1'
 * Dev: localhost:5173?tenant=gym1 → 'gym1'
 * Falls back to VITE_TENANT_SUBDOMAIN env var if set
 */
export function useTenantFromUrl(): string | null {
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    // Query param always takes priority (for dev/testing)
    const params = new URLSearchParams(window.location.search);
    const queryTenant = params.get('tenant');
    if (queryTenant) {
      setSubdomain(queryTenant);
      return;
    }

    // Check env var
    const envTenant = import.meta.env.VITE_TENANT_SUBDOMAIN as string;
    if (envTenant) {
      setSubdomain(envTenant);
      return;
    }

    // Extract from hostname (production subdomain routing)
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Extract first part before first dot
      const parts = hostname.split('.');
      if (parts.length > 1 && parts[0] !== 'www') {
        setSubdomain(parts[0]);
        return;
      }
    }

    setSubdomain(null);
  }, []);

  return subdomain;
}
