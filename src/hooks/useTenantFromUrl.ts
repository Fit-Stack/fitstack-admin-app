import { useEffect, useState } from 'react';

/**
 * Extract tenant subdomain from URL
 * Production: gym1.fitstack.com → 'gym1'
 * Dev: localhost:5173?tenant=gym1 → 'gym1'
 * Falls back to VITE_TENANT_SUBDOMAIN env var if set
 */
const TENANT_STORAGE_KEY = 'tenant_subdomain';

export function useTenantFromUrl(): string | null {
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    // Query param always takes priority (for dev/testing). Persist it so it
    // survives a refresh — navigation after login drops the ?tenant= param,
    // and without this the app would fall back to default branding.
    const params = new URLSearchParams(window.location.search);
    const queryTenant = params.get('tenant');
    if (queryTenant) {
      localStorage.setItem(TENANT_STORAGE_KEY, queryTenant);
      setSubdomain(queryTenant);
      return;
    }

    // Check env var
    const envTenant = import.meta.env.VITE_TENANT_SUBDOMAIN as string;
    if (envTenant) {
      setSubdomain(envTenant);
      return;
    }

    // Extract from hostname (production subdomain routing, e.g.
    // gym1.fitstack.com). Skip hosting domains like *.vercel.app whose first
    // label is the app name, not a tenant.
    const hostname = window.location.hostname;
    if (
      hostname !== 'localhost' &&
      hostname !== '127.0.0.1' &&
      !hostname.endsWith('.vercel.app')
    ) {
      const parts = hostname.split('.');
      if (parts.length > 2 && parts[0] !== 'www') {
        localStorage.setItem(TENANT_STORAGE_KEY, parts[0]);
        setSubdomain(parts[0]);
        return;
      }
    }

    // Fall back to the last tenant we resolved (survives refresh on hosts that
    // don't carry the tenant in the URL, e.g. Vercel deployments).
    const stored = localStorage.getItem(TENANT_STORAGE_KEY);
    if (stored) {
      setSubdomain(stored);
      return;
    }

    setSubdomain(null);
  }, []);

  return subdomain;
}
