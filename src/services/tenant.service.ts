import api from '@/lib/axios';

export interface BrandingData {
  id: string;
  tenantId: string;
  name: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  primaryHover?: string;
  fontFamily?: string;
}

export interface TenantData {
  id: string;
  tenantId: string;
  name: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  primaryHover?: string;
  fontFamily?: string;
  subdomain?: string;
  contactEmail: string;
  contactPhone?: string;
  description?: string;
  status: string;
  isActive: boolean;
}

class TenantService {
  /**
   * Fetch branding data for a tenant (public endpoint, no auth required)
   */
  async getBranding(subdomain?: string, tenantId?: string): Promise<BrandingData> {
    const params = new URLSearchParams();
    if (subdomain) params.append('subdomain', subdomain);
    if (tenantId) params.append('tenantId', tenantId);

    const { data } = await api.get<BrandingData>(
      `/tenants/branding?${params.toString()}`
    );
    return data;
  }

  /**
   * Get full tenant data including branding (requires auth)
   */
  async getTenantBranding(tenantId: string): Promise<TenantData> {
    const { data } = await api.get<TenantData>(`/tenants/${tenantId}`);
    return data;
  }

  /**
   * Update tenant branding (requires auth as admin of that tenant)
   */
  async updateTenantBranding(
    tenantId: string,
    branding: Partial<{
      name: string;
      tagline: string;
      logoUrl: string;
      primaryColor: string;
      primaryHover: string;
      fontFamily: string;
      faviconUrl: string;
    }>
  ): Promise<TenantData> {
    const { data } = await api.patch<TenantData>(`/tenants/${tenantId}`, branding);
    return data;
  }
}

export const tenantService = new TenantService();
