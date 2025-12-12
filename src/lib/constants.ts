export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
};

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  SUPER_ADMIN_LOGIN: '/auth/super-admin/login',
  LOGOUT: '/auth/logout',
  
  // Classes
  CLASSES: (tenantId: string) => `/tenants/${tenantId}/classes`,
  CLASS_DETAIL: (tenantId: string, classId: string) => `/tenants/${tenantId}/classes/${classId}`,
  
  // Sessions
  SESSIONS: (tenantId: string) => `/tenants/${tenantId}/sessions`,
  SESSION_DETAIL: (tenantId: string, sessionId: string) => `/tenants/${tenantId}/sessions/${sessionId}`,
  
  // Trainers
  TRAINERS: (tenantId: string) => `/tenants/${tenantId}/trainers`,
  TRAINER_DETAIL: (tenantId: string, trainerId: string) => `/tenants/${tenantId}/trainers/${trainerId}`,
  
  // Marketplace
  PRODUCTS: (tenantId: string) => `/tenants/${tenantId}/marketplace/products`,
  PRODUCT_DETAIL: (tenantId: string, productId: string) => `/tenants/${tenantId}/marketplace/products/${productId}`,
  
  // Events
  EVENTS: (tenantId: string) => `/tenants/${tenantId}/events`,
  EVENT_DETAIL: (tenantId: string, eventId: string) => `/tenants/${tenantId}/events/${eventId}`,
  
  // Analytics
  ANALYTICS: (tenantId: string) => `/tenants/${tenantId}/analytics`,
};
