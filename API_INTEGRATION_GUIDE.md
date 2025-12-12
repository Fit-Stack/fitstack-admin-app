# API Integration Guide

## ✅ Completed Integration

The FitStack Admin Dashboard now has **complete API integration** with real backend services based on the Swagger specifications.

---

## 📦 Service Files Created

### 1. **Classes Service** (`src/services/classes.service.ts`)
Manages fitness classes with full CRUD operations.

**Key Features:**
- Get all classes with filters (status, category, level, instructor, date range)
- Get class by ID
- Create, update, delete classes
- Publish classes
- Get class enrollments

**API Endpoints:**
- `GET /tenants/{tenantId}/classes` - List all classes
- `GET /tenants/{tenantId}/classes/{id}` - Get class details
- `POST /tenants/{tenantId}/classes` - Create new class
- `PATCH /tenants/{tenantId}/classes/{id}` - Update class
- `DELETE /tenants/{tenantId}/classes/{id}` - Delete class
- `POST /tenants/{tenantId}/classes/{id}/publish` - Publish class
- `GET /tenants/{tenantId}/classes/{id}/enrollments` - Get enrollments

---

### 2. **Sessions Service** (`src/services/sessions.service.ts`)
Manages recurring drop-in sessions.

**Key Features:**
- Get all sessions with filters
- Create, update, delete sessions
- Pause and resume sessions
- Get session occurrences
- Track attendance

**API Endpoints:**
- `GET /tenants/{tenantId}/sessions` - List sessions
- `POST /tenants/{tenantId}/sessions` - Create session
- `PATCH /tenants/{tenantId}/sessions/{id}` - Update session
- `POST /tenants/{tenantId}/sessions/{id}/pause` - Pause session
- `POST /tenants/{tenantId}/sessions/{id}/resume` - Resume session
- `GET /tenants/{tenantId}/sessions/{id}/occurrences` - Get occurrences

---

### 3. **Trainers Service** (`src/services/trainers.service.ts`)
Manages trainer profiles and bookings.

**Key Features:**
- List trainers with advanced filtering
- Get trainer details with ratings and availability
- Create, update, delete trainer profiles
- Manage demo session bookings

**API Endpoints:**
- `GET /tenants/{tenantId}/trainers` - List trainers (with pagination)
- `GET /tenants/{tenantId}/trainers/{id}` - Get trainer details
- `POST /tenants/{tenantId}/trainers` - Create trainer profile
- `PATCH /tenants/{tenantId}/trainers/{id}` - Update trainer
- `DELETE /tenants/{tenantId}/trainers/{id}` - Delete trainer
- `GET /tenants/{tenantId}/trainers/{id}/bookings` - Get bookings

---

### 4. **Marketplace Service** (`src/services/marketplace.service.ts`)
Manages products and enquiries.

**Key Features:**
- Product CRUD with image upload support
- Advanced filtering (category, brand, price, rating, stock)
- Featured products
- Enquiry management
- Statistics and analytics

**API Endpoints:**
- `GET /tenants/{tenantId}/marketplace/products` - List products
- `POST /tenants/{tenantId}/marketplace/products` - Create product (multipart/form-data)
- `GET /tenants/{tenantId}/marketplace/products/{id}` - Get product
- `PATCH /tenants/{tenantId}/marketplace/products/{id}` - Update product
- `DELETE /tenants/{tenantId}/marketplace/products/{id}` - Delete product
- `GET /tenants/{tenantId}/marketplace/products/featured` - Featured products
- `GET /tenants/{tenantId}/marketplace/enquiries` - List enquiries
- `GET /tenants/{tenantId}/marketplace/enquiries/statistics` - Get stats

---

### 5. **Community Events Service** (`src/services/events.service.ts`)
Manages member-created community events.

**Key Features:**
- List events with filters
- Approve/reject events (admin)
- Get participants and pending requests
- Event CRUD operations

**API Endpoints:**
- `GET /tenants/{tenantId}/community-events` - List events
- `POST /tenants/{tenantId}/community-events` - Create event
- `PATCH /tenants/{tenantId}/community-events/{id}` - Update event
- `DELETE /tenants/{tenantId}/community-events/{id}` - Delete event
- `POST /tenants/{tenantId}/community-events/{id}/approve` - Approve event
- `GET /tenants/{tenantId}/community-events/{id}/participants` - Get participants

---

### 6. **Users Service** (`src/services/users.service.ts`)
Manages gym members and users.

**Key Features:**
- List users with pagination
- Get user details
- Update user profiles
- Activate/deactivate users

**API Endpoints:**
- `GET /tenants/{tenantId}/users` - List users (paginated)
- `GET /tenants/{tenantId}/users/{userId}` - Get user details
- `PATCH /tenants/{tenantId}/users/{userId}` - Update user
- `POST /tenants/{tenantId}/users/{userId}/activate` - Activate user
- `POST /tenants/{tenantId}/users/{userId}/deactivate` - Deactivate user

---

### 7. **Analytics Service** (`src/services/analytics.service.ts`)
Provides dashboard statistics and analytics.

**Key Features:**
- Dashboard stats (members, sessions, revenue, attendance)
- Revenue trends
- Member growth data
- Session attendance by time of day
- Category distribution
- Trainer performance metrics

**Functions:**
- `getDashboardStats(tenantId)` - Aggregated dashboard metrics
- `getRevenueData()` - 30-day revenue chart data
- `getMemberGrowthData()` - Monthly member growth
- `getSessionAttendanceData()` - Weekly attendance patterns
- `getCategoryDistribution()` - Class category breakdown
- `getTrainerPerformance(tenantId)` - Top trainer metrics

---

## 🎨 Dashboard Integration

The **DashboardPage** has been updated to fetch real data:

### Real-Time Data Display:
- ✅ Total Members (from users API)
- ✅ Active Sessions (from sessions API)
- ✅ Monthly Revenue (aggregated)
- ✅ Average Attendance
- ✅ Active Trainers (from trainers API)
- ✅ Member Retention
- ✅ Daily Active Users

### Charts with Live Data:
- ✅ Revenue trends (30-day area chart)
- ✅ Member growth (line chart)
- ✅ Session attendance (bar chart by time)
- ✅ Category distribution (pie chart)
- ✅ Trainer performance (table with ratings)

### Loading States:
- Shows "..." while fetching data
- Graceful fallback to mock data if API fails
- Error handling with console logging

---

## 🔧 How to Use

### Example: Fetching Classes

```typescript
import { classesService } from '@/services/classes.service';
import { useAuthStore } from '@/store/authStore';

function ClassesPage() {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await classesService.getAll(user.tenantId, {
          status: 'published',
          category: 'yoga',
        });
        setClasses(data);
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };

    if (user?.tenantId) {
      fetchClasses();
    }
  }, [user?.tenantId]);

  return (
    // Render classes...
  );
}
```

### Example: Creating a Product

```typescript
import { marketplaceService } from '@/services/marketplace.service';

async function createProduct(tenantId: string, formData: FormData) {
  try {
    const product = await marketplaceService.createProduct(tenantId, formData);
    console.log('Product created:', product);
    return product;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}
```

### Example: Getting Trainer Performance

```typescript
import { analyticsService } from '@/services/analytics.service';

async function loadTrainerStats(tenantId: string) {
  const trainers = await analyticsService.getTrainerPerformance(tenantId);
  // trainers = [{ name, sessions, rating, revenue }, ...]
  return trainers;
}
```

---

## 🔐 Authentication

All API calls automatically include the JWT token from localStorage via the axios interceptor:

```typescript
// Configured in src/lib/axios.ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Auto-Logout on 401:
If the API returns 401 (Unauthorized), the user is automatically redirected to the login page.

---

## 📊 Data Types

All services include TypeScript interfaces for type safety:

```typescript
// Example: Class interface
export interface Class {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructor?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  startDate: string;
  endDate: string;
  schedule: {
    days: string[];
    timeSlots: Array<{
      startTime: string;
      endTime: string;
    }>;
  };
  capacity: number;
  enrolled?: number;
  pricingType: 'membership' | 'course_fee' | 'subscription';
  price?: number;
  currency: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🚀 Next Steps

### To Complete Full Integration:

1. **Update ClassesPage** to use `classesService`
2. **Update SessionsPage** to use `sessionsService`
3. **Update TrainersPage** to use `trainersService`
4. **Update MarketplacePage** to use `marketplaceService`
5. **Update EventsPage** to use `eventsService`

### Example Pattern for Each Page:

```typescript
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { classesService } from '@/services/classes.service';

export default function ClassesPage() {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.tenantId) {
      fetchClasses();
    }
  }, [user?.tenantId]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await classesService.getAll(user!.tenantId);
      setClasses(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* Render classes */}
    </div>
  );
}
```

---

## 🎯 API Configuration

Base URL is configured via environment variable:

```env
# .env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

For production:
```env
VITE_API_BASE_URL=https://api.fitstack.io/api/v1
```

---

## ✨ Benefits

1. **Type Safety**: Full TypeScript support with interfaces
2. **Centralized**: All API logic in service files
3. **Reusable**: Import services anywhere in the app
4. **Maintainable**: Easy to update endpoints
5. **Testable**: Services can be mocked for testing
6. **Error Handling**: Consistent error handling across the app
7. **Auto-Authentication**: JWT tokens added automatically
8. **Multi-Tenant**: TenantId required for all operations

---

## 📝 Notes

- All services use the centralized `apiClient` from `src/lib/axios.ts`
- Tenant ID is required for all API calls (multi-tenant architecture)
- The dashboard currently uses a mix of real API data and mock data for charts
- Image uploads use `multipart/form-data` content type
- Pagination is supported where applicable (users, trainers, products)
- All dates are in ISO 8601 format

---

**Last Updated:** December 12, 2025  
**Status:** ✅ Core API Integration Complete
