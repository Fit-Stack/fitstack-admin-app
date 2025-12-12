# FitStack Admin Dashboard - Complete Development Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Tech Stack](#tech-stack)
4. [Authentication](#authentication)
5. [API Integration](#api-integration)
6. [Core Features](#core-features)
7. [Implementation Examples](#implementation-examples)
8. [Deployment](#deployment)

---

## 🎯 Overview

**FitStack Admin Dashboard** is a React-based Progressive Web App (PWA) for gym administrators to manage all aspects of their fitness facility.

### Key Characteristics
- **Admin-Only**: Restricted to `ADMIN` and `SUPER_ADMIN` roles
- **No Self-Registration**: Admins must be created by super admins or backend
- **Multi-Tenant**: Each admin manages their specific tenant
- **PWA-Ready**: Installable, offline-capable, mobile-responsive
- **Real-time**: Live data synchronization and notifications

### Core Features
- 📊 **Dashboard Analytics** - Overview cards, charts, recent activity
- 📚 **Classes Management** - CRUD, scheduling, enrollments
- ⏰ **Sessions Management** - CRUD, recurrence, attendance tracking
- 👨‍🏫 **Trainers Management** - Profiles, bookings, ratings
- 🛒 **Marketplace** - Products CRUD, enquiries management
- 📢 **Announcements** - Create, schedule, target audiences
- 🎉 **Community Events** - View, approve/reject member events
- 👥 **Users Management** - View members, activity tracking
- 🔔 **Notifications** - Send push notifications, broadcast messages

---

## 🚀 Quick Start

### 1. Create Project

```bash
# Create Vite + React + TypeScript project
npm create vite@latest fitstack-admin -- --template react-ts
cd fitstack-admin
```

### 2. Install Dependencies

```bash
# Core
npm install react-router-dom zustand axios date-fns

# UI (shadcn/ui dependencies)
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-toast @radix-ui/react-label @radix-ui/react-slot @radix-ui/react-tabs

# Forms
npm install react-hook-form zod @hookform/resolvers

# Styling
npm install tailwindcss postcss autoprefixer clsx tailwind-merge class-variance-authority
npm install -D @tailwindcss/forms

# Icons & Charts
npm install lucide-react recharts

# PWA
npm install -D vite-plugin-pwa

# Dev
npm install -D @types/node

# Initialize Tailwind
npx tailwindcss init -p
```

### 3. Configure Environment

```env
# .env.local
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=FitStack Admin Dashboard
VITE_APP_VERSION=1.0.0
```

### 4. Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Sidebar, Header, Footer
│   ├── forms/           # Form components
│   ├── tables/          # Data tables
│   └── common/          # Reusable components
├── pages/
│   ├── auth/            # Login
│   ├── dashboard/       # Dashboard
│   ├── classes/         # Classes pages
│   ├── sessions/        # Sessions pages
│   ├── trainers/        # Trainers pages
│   ├── marketplace/     # Marketplace pages
│   └── announcements/   # Announcements pages
├── services/            # API services
├── stores/              # Zustand stores
├── hooks/               # Custom hooks
├── lib/                 # Utilities
├── types/               # TypeScript types
├── App.tsx
├── main.tsx
└── router.tsx
```

---

## 🛠️ Tech Stack

### Core Technologies
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool (fast HMR, optimized builds)
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible component library
- **Zustand** - Lightweight state management
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **React Hook Form + Zod** - Form handling & validation
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **Vite PWA Plugin** - Progressive Web App features

### Why This Stack?
- ⚡ **Vite**: Lightning-fast dev server, optimized production builds
- 🪶 **Zustand**: Simpler than Redux, 1KB gzipped
- 🎨 **shadcn/ui**: Copy-paste components, full customization
- 📝 **React Hook Form**: Performant forms, minimal re-renders
- 🔒 **Zod**: Runtime type validation for forms

---

## 🔐 Authentication

### Login Flow

```typescript
// src/services/auth.service.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface LoginCredentials {
  email: string;
  password: string;
  tenantId?: string; // Optional for super admin
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: 'admin' | 'super_admin';
    tenantId?: string;
  };
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const endpoint = credentials.tenantId 
      ? '/auth/login' 
      : '/auth/super-admin/login';
    
    const { data } = await axios.post<AuthResponse>(
      `${API_BASE_URL}${endpoint}`,
      credentials
    );

    // Store tokens
    localStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getUser(): AuthResponse['user'] | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'admin' || user?.role === 'super_admin';
  }
}

export const authService = new AuthService();
```

### Axios Interceptor

```typescript
// src/lib/axios.ts
import axios from 'axios';
import { authService } from '@/services/auth.service';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Auth Store (Zustand)

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, type AuthResponse } from '@/services/auth.service';

interface AuthState {
  user: AuthResponse['user'] | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  login: (email: string, password: string, tenantId?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (email, password, tenantId) => {
        set({ loading: true, error: null });
        try {
          const response = await authService.login({ email, password, tenantId });
          
          // Check if user is admin
          if (!['admin', 'super_admin'].includes(response.user.role)) {
            throw new Error('Access denied. Admin privileges required.');
          }

          set({
            user: response.user,
            accessToken: response.access_token,
            isAuthenticated: true,
            loading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || error.message || 'Login failed',
            loading: false,
          });
          throw error;
        }
      },

      logout: () => {
        authService.logout();
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'fitstack-admin-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### Protected Routes

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export const ProtectedRoute = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">Admin privileges required</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
```

---

## 🔌 API Integration

### API Endpoints Reference

```typescript
// src/lib/constants.ts
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  SUPER_ADMIN_LOGIN: '/auth/super-admin/login',
  
  // Classes
  CLASSES: (tenantId: string) => `/tenants/${tenantId}/classes`,
  CLASS_DETAIL: (tenantId: string, id: string) => `/tenants/${tenantId}/classes/${id}`,
  CLASS_PUBLISH: (tenantId: string, id: string) => `/tenants/${tenantId}/classes/${id}/publish`,
  CLASS_ENROLLMENTS: (tenantId: string, id: string) => `/tenants/${tenantId}/classes/${id}/enrollments`,
  
  // Sessions
  SESSIONS: (tenantId: string) => `/tenants/${tenantId}/sessions`,
  SESSION_DETAIL: (tenantId: string, id: string) => `/tenants/${tenantId}/sessions/${id}`,
  SESSION_PAUSE: (tenantId: string, id: string) => `/tenants/${tenantId}/sessions/${id}/pause`,
  SESSION_RESUME: (tenantId: string, id: string) => `/tenants/${tenantId}/sessions/${id}/resume`,
  
  // Trainers
  TRAINERS: (tenantId: string) => `/tenants/${tenantId}/trainers`,
  TRAINER_DETAIL: (tenantId: string, id: string) => `/tenants/${tenantId}/trainers/${id}`,
  TRAINER_BOOKINGS: (tenantId: string, id: string) => `/tenants/${tenantId}/trainers/${id}/bookings`,
  
  // Marketplace
  PRODUCTS: (tenantId: string) => `/tenants/${tenantId}/marketplace/products`,
  PRODUCT_DETAIL: (tenantId: string, id: string) => `/tenants/${tenantId}/marketplace/products/${id}`,
  ENQUIRIES: (tenantId: string) => `/tenants/${tenantId}/marketplace/enquiries`,
  ENQUIRY_DETAIL: (tenantId: string, id: string) => `/tenants/${tenantId}/marketplace/enquiries/${id}`,
  
  // Announcements
  ANNOUNCEMENTS: (tenantId: string) => `/tenants/${tenantId}/announcements`,
  ANNOUNCEMENT_DETAIL: (tenantId: string, id: string) => `/tenants/${tenantId}/announcements/${id}`,
  
  // Community Events
  EVENTS: (tenantId: string) => `/tenants/${tenantId}/community-events`,
  EVENT_APPROVE: (tenantId: string, id: string) => `/tenants/${tenantId}/community-events/${id}/approve`,
  
  // Users
  USERS: (tenantId: string) => `/tenants/${tenantId}/users`,
  USER_DETAIL: (tenantId: string, id: string) => `/tenants/${tenantId}/users/${id}`,
  
  // Notifications
  SEND_NOTIFICATION: (tenantId: string) => `/tenants/${tenantId}/notifications/send`,
  SEND_BATCH: (tenantId: string) => `/tenants/${tenantId}/notifications/send-batch`,
  
  // Schedule (Unified Calendar)
  SCHEDULE: (tenantId: string) => `/tenants/${tenantId}/schedule`,
};
```

### Service Layer Example

```typescript
// src/services/classes.service.ts
import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/lib/constants';

export interface Class {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructorId: string;
  instructor?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  capacity: number;
  enrolled: number;
  price: number;
  startDate: string;
  endDate: string;
  startTime: string;
  duration: number;
  status: 'published' | 'draft' | 'cancelled' | 'completed';
}

export interface CreateClassDto {
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructorId: string;
  capacity: number;
  price: number;
  startDate: string;
  endDate: string;
  startTime: string;
  duration: number;
  recurrencePattern: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[];
  };
}

class ClassesService {
  async getAll(tenantId: string, params?: any): Promise<Class[]> {
    const { data } = await api.get(API_ENDPOINTS.CLASSES(tenantId), { params });
    return data;
  }

  async getById(tenantId: string, id: string): Promise<Class> {
    const { data } = await api.get(API_ENDPOINTS.CLASS_DETAIL(tenantId, id));
    return data;
  }

  async create(tenantId: string, dto: CreateClassDto): Promise<Class> {
    const { data } = await api.post(API_ENDPOINTS.CLASSES(tenantId), dto);
    return data;
  }

  async update(tenantId: string, id: string, dto: Partial<CreateClassDto>): Promise<Class> {
    const { data } = await api.patch(API_ENDPOINTS.CLASS_DETAIL(tenantId, id), dto);
    return data;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.CLASS_DETAIL(tenantId, id));
  }

  async publish(tenantId: string, id: string): Promise<Class> {
    const { data } = await api.post(API_ENDPOINTS.CLASS_PUBLISH(tenantId, id));
    return data;
  }

  async getEnrollments(tenantId: string, id: string): Promise<any[]> {
    const { data } = await api.get(API_ENDPOINTS.CLASS_ENROLLMENTS(tenantId, id));
    return data;
  }
}

export const classesService = new ClassesService();
```

---

## 🎯 Core Features

### 1. Dashboard Analytics

**API**: `GET /tenants/:tenantId/analytics/overview`

**Features**:
- Overview cards (total members, active classes, revenue, enquiries)
- Revenue chart (last 6 months)
- Enrollment trends chart
- Recent activity feed

### 2. Classes Management

**APIs**:
- `POST /tenants/:tenantId/classes` - Create
- `GET /tenants/:tenantId/classes` - List (with filters)
- `GET /tenants/:tenantId/classes/:id` - View details
- `PATCH /tenants/:tenantId/classes/:id` - Update
- `DELETE /tenants/:tenantId/classes/:id` - Delete
- `POST /tenants/:tenantId/classes/:id/publish` - Publish
- `GET /tenants/:tenantId/classes/:id/enrollments` - View enrollments

**Features**:
- Create structured training programs
- Assign trainers
- Set capacity, pricing, difficulty
- Define schedule (start/end date, time, recurrence)
- Manage enrollments
- Publish/draft workflow
- Filter by status, category, trainer

### 3. Sessions Management

**APIs**:
- `POST /tenants/:tenantId/sessions` - Create
- `GET /tenants/:tenantId/sessions` - List
- `GET /tenants/:tenantId/sessions/:id` - View details
- `PATCH /tenants/:tenantId/sessions/:id` - Update
- `DELETE /tenants/:tenantId/sessions/:id` - Delete
- `POST /tenants/:tenantId/sessions/:id/pause` - Pause
- `POST /tenants/:tenantId/sessions/:id/resume` - Resume

**Features**:
- Create recurring gym activities
- Optional trainer assignment
- Drop-in attendance tracking
- Pause/resume sessions
- Real-time live status (15 min before start)
- Filter by status, category, date

### 4. Trainers Management

**APIs**:
- `POST /tenants/:tenantId/trainers` - Create
- `GET /tenants/:tenantId/trainers` - List
- `GET /tenants/:tenantId/trainers/:id` - View details
- `PATCH /tenants/:tenantId/trainers/:id` - Update
- `DELETE /tenants/:tenantId/trainers/:id` - Delete
- `GET /tenants/:tenantId/trainers/:id/bookings` - View bookings

**Features**:
- Create trainer profiles
- Set specializations, certifications, hourly rate
- Manage demo session availability
- View and manage bookings
- Track ratings and reviews

### 5. Marketplace Products

**APIs**:
- `POST /tenants/:tenantId/marketplace/products` - Create (with image upload)
- `GET /tenants/:tenantId/marketplace/products` - List
- `GET /tenants/:tenantId/marketplace/products/:id` - View details
- `PATCH /tenants/:tenantId/marketplace/products/:id` - Update
- `DELETE /tenants/:tenantId/marketplace/products/:id` - Delete

**Features**:
- Create products with multiple images
- Set pricing (original, discounted)
- Manage stock status and quantity
- Upload images to Supabase Storage
- Search by title, brand, category
- Filter by price range, stock status

### 6. Marketplace Enquiries

**APIs**:
- `GET /tenants/:tenantId/marketplace/enquiries` - List all
- `GET /tenants/:tenantId/marketplace/enquiries/:id` - View details
- `PATCH /tenants/:tenantId/marketplace/enquiries/:id` - Update status

**Features**:
- View all customer enquiries
- Update status (pending → contacted → converted → closed)
- Add admin notes
- Track response time
- Filter by status, product, date range

### 7. Announcements

**APIs**:
- `POST /tenants/:tenantId/announcements` - Create
- `GET /tenants/:tenantId/announcements` - List
- `GET /tenants/:tenantId/announcements/:id` - View details
- `PATCH /tenants/:tenantId/announcements/:id` - Update
- `DELETE /tenants/:tenantId/announcements/:id` - Delete

**Features**:
- Create announcements with rich text
- Set priority (low, medium, high, urgent)
- Target specific audiences
- Schedule future announcements
- Set expiration dates

### 8. Community Events

**APIs**:
- `GET /tenants/:tenantId/community-events` - List
- `GET /tenants/:tenantId/community-events/:id` - View details
- `POST /tenants/:tenantId/community-events/:id/approve` - Approve

**Features**:
- View member-created events
- Approve/reject pending events
- Monitor participation

### 9. Users Management

**APIs**:
- `GET /tenants/:tenantId/users` - List all
- `GET /tenants/:tenantId/users/:id` - View details
- `PATCH /tenants/:tenantId/users/:id` - Update

**Features**:
- View all members, trainers, admins
- Search by name, email, phone
- Filter by role, status
- View user activity

### 10. Notifications

**APIs**:
- `POST /tenants/:tenantId/notifications/send` - Send to user
- `POST /tenants/:tenantId/notifications/send-batch` - Broadcast

**Features**:
- Send push notifications
- Broadcast to all members
- Schedule future notifications

---

## 💻 Implementation Examples

### Dashboard Page

```typescript
// src/pages/dashboard/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, ShoppingBag, TrendingUp } from 'lucide-react';
import api from '@/lib/axios';

export function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get(`/tenants/${user?.tenantId}/analytics/overview`);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeClasses || 0}</div>
            <p className="text-xs text-muted-foreground">Across all categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats?.totalRevenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Enquiries</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingEnquiries || 0}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### Classes List with Table

```typescript
// src/pages/classes/ClassesListPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { classesService } from '@/services/classes.service';

export function ClassesListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchClasses();
  }, [search]);

  const fetchClasses = async () => {
    try {
      const data = await classesService.getAll(user!.tenantId!, { search });
      setClasses(data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Classes</h1>
          <p className="text-muted-foreground">
            Manage your fitness classes
          </p>
        </div>
        <Button onClick={() => navigate('/classes/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Class
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search classes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table component here */}
    </div>
  );
}
```

### Form with Validation

```typescript
// src/pages/classes/ClassCreatePage.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { classesService } from '@/services/classes.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const classSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  instructorId: z.string().uuid('Please select a trainer'),
  category: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  capacity: z.number().min(1),
  price: z.number().min(0),
  startDate: z.string(),
  endDate: z.string(),
  startTime: z.string(),
  duration: z.number().min(15),
});

type ClassFormData = z.infer<typeof classSchema>;

export function ClassCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
  });

  const onSubmit = async (data: ClassFormData) => {
    try {
      await classesService.create(user!.tenantId!, {
        ...data,
        recurrencePattern: {
          frequency: 'weekly',
          daysOfWeek: [],
        },
      });
      navigate('/classes');
    } catch (error) {
      console.error('Failed to create class:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Create Class</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register('title')} />
          {errors.title && (
            <p className="text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register('description')} />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* More fields... */}

        <div className="flex gap-4">
          <Button type="submit">Create Class</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/classes')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
```

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

### PWA Configuration

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'FitStack Admin Dashboard',
        short_name: 'FitStack Admin',
        description: 'Admin dashboard for FitStack',
        theme_color: '#0ea5e9',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
});
```

---

## 📚 Additional Resources

### Backend API Documentation
- **API Quick Reference**: `docs/API_QUICK_REFERENCE.md`
- **Frontend API Guide**: `docs/FRONTEND_API_GUIDE.md`
- **Schedule API**: `docs/SCHEDULE_API.md`
- **Marketplace API**: `docs/MARKETPLACE_API.md`
- **Trainer Module**: `docs/TRAINER_MODULE.md`

### Authentication & Authorization
- **RBAC System**: `docs/RBAC_SYSTEM.md`
- **Super Admin**: `docs/CREATE_SUPER_ADMIN.md`
- **MFA Setup**: `docs/MFA_SUPER_ADMIN.md`

### Integrations
- **Push Notifications**: `docs/PUSH_NOTIFICATIONS_COMPLETE.md`
- **Feed System**: `docs/FEED_SYSTEM.md`
- **Image Upload**: `docs/MARKETPLACE_IMAGE_UPLOAD.md`

---

## ✅ Development Checklist

### Phase 1: Setup
- [ ] Create Vite project
- [ ] Install dependencies
- [ ] Configure Tailwind CSS
- [ ] Setup environment variables
- [ ] Create project structure

### Phase 2: Authentication
- [ ] Implement auth service
- [ ] Create auth store
- [ ] Setup Axios interceptors
- [ ] Create login page
- [ ] Implement protected routes

### Phase 3: Core Features
- [ ] Dashboard analytics
- [ ] Classes management
- [ ] Sessions management
- [ ] Trainers management
- [ ] Marketplace products
- [ ] Marketplace enquiries
- [ ] Announcements
- [ ] Community events
- [ ] Users management
- [ ] Notifications

### Phase 4: PWA
- [ ] Configure PWA plugin
- [ ] Create manifest.json
- [ ] Add service worker
- [ ] Test offline functionality

### Phase 5: Deployment
- [ ] Build for production
- [ ] Deploy to hosting
- [ ] Configure environment variables
- [ ] Test production build

---

**Document Version**: 1.0  
**Last Updated**: December 12, 2025  
**Author**: FitStack Development Team
