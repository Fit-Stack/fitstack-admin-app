import apiClient from '@/lib/axios';

export interface Product {
  id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  originalPrice: number;
  discountedPrice?: number;
  discountPercentage?: number;
  currency: string;
  brand?: string;
  category: string;
  sku?: string;
  stockStatus: 'in_stock' | 'out_of_stock' | 'limited';
  quantity: number;
  isVip: boolean;
  isFeatured: boolean;
  hasReturnPolicy: boolean;
  returnPolicyDays?: number;
  imageUrls: string[];
  averageRating?: number;
  totalReviews?: number;
  searchTags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  stockStatus?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  isVip?: boolean;
  hasReturnPolicy?: boolean;
  minRating?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface Enquiry {
  id: string;
  productId: string;
  product?: Product;
  userId: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  message: string;
  status: 'pending' | 'contacted' | 'converted' | 'closed';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export const marketplaceService = {
  async getProducts(tenantId: string, filters?: ProductFilters): Promise<{ products: Product[]; total: number }> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/marketplace/products`, {
      params: filters,
    });
    return data;
  },

  async getProductById(tenantId: string, productId: string): Promise<Product> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/marketplace/products/${productId}`);
    return data;
  },

  async createProduct(tenantId: string, productData: FormData): Promise<Product> {
    const { data } = await apiClient.post(`/tenants/${tenantId}/marketplace/products`, productData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  async updateProduct(tenantId: string, productId: string, productData: Partial<Product>): Promise<Product> {
    const { data } = await apiClient.patch(`/tenants/${tenantId}/marketplace/products/${productId}`, productData);
    return data;
  },

  async deleteProduct(tenantId: string, productId: string): Promise<void> {
    await apiClient.delete(`/tenants/${tenantId}/marketplace/products/${productId}`);
  },

  async getFeaturedProducts(tenantId: string, limit: number = 10): Promise<Product[]> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/marketplace/products/featured`, {
      params: { limit },
    });
    return data;
  },

  async getEnquiries(tenantId: string, filters?: any): Promise<{ enquiries: Enquiry[]; total: number }> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/marketplace/enquiries`, {
      params: filters,
    });
    return data;
  },

  async getEnquiryStatistics(tenantId: string): Promise<any> {
    const { data } = await apiClient.get(`/tenants/${tenantId}/marketplace/enquiries/statistics`);
    return data;
  },

  async updateEnquiry(tenantId: string, enquiryId: string, updates: Partial<Enquiry>): Promise<Enquiry> {
    const { data } = await apiClient.patch(`/tenants/${tenantId}/marketplace/enquiries/${enquiryId}`, updates);
    return data;
  },
};
