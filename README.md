# FitStack Admin Dashboard

A modern, responsive Progressive Web App (PWA) for managing fitness facilities. Built with React, TypeScript, Vite, and Shadcn UI.

## 🚀 Features

- **Admin-Only Access** - Secure authentication for ADMIN and SUPER_ADMIN roles
- **Progressive Web App** - Installable, offline-capable, mobile-responsive
- **Modern UI** - Clean interface built with Shadcn UI and Tailwind CSS
- **Dashboard Analytics** - Key metrics and insights at a glance
- **Class Management** - Create and manage fitness classes
- **Session Scheduling** - Schedule and track class sessions
- **Trainer Management** - Manage training staff and their profiles
- **Marketplace** - Product inventory and sales management
- **Event Management** - Community events and activities

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - Accessible component library
- **Zustand** - State management
- **React Router v6** - Routing
- **Axios** - HTTP client
- **React Hook Form + Zod** - Form handling and validation
- **date-fns** - Date utilities
- **Lucide React** - Icon library

## 📦 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure your API base URL:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   ```

## 🏃 Running the App

### Development Mode
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🔐 Authentication

The app supports two types of admin login:

### Regular Admin Login
- Requires: Email, Password, and Tenant ID
- Access: Limited to specific tenant's data

### Super Admin Login
- Requires: Email and Password only
- Access: Cross-tenant access (floater admin)
- Check the "Login as Super Admin" checkbox

## 📁 Project Structure

```
fitstack-admin-app/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── layout/       # Layout components
│   │   └── ui/           # Shadcn UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and configurations
│   ├── pages/            # Page components
│   ├── services/         # API services
│   ├── store/            # Zustand stores
│   ├── types/            # TypeScript types
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🎨 UI Components

This project uses [Shadcn UI](https://ui.shadcn.com/) components:
- Button
- Card
- Input
- Label
- Badge
- And more...

All components are customizable and built on top of Radix UI primitives.

## 🔌 API Integration

The app integrates with the FitStack backend API. Configure the API base URL in your `.env` file.

### API Endpoints Used:
- `/auth/login` - Regular admin login
- `/auth/super-admin/login` - Super admin login
- `/auth/logout` - Logout
- `/tenants/:tenantId/classes` - Classes management
- `/tenants/:tenantId/sessions` - Sessions management
- `/tenants/:tenantId/trainers` - Trainers management
- `/tenants/:tenantId/marketplace/products` - Products management
- `/tenants/:tenantId/events` - Events management

## 📱 PWA Features

The app is configured as a Progressive Web App with:
- Offline support
- Installable on mobile and desktop
- Service worker for caching
- App manifest for native-like experience

## 🎯 User Roles

- **ADMIN** - Full access to their tenant's data
- **SUPER_ADMIN** - Cross-tenant access (floater admin)

## 🔧 Development

### Code Formatting
```bash
npm run format
```

### Linting
```bash
npm run lint
```

## 📄 License

Copyright © 2025 FitStack Development Team

## 🤝 Contributing

This is a private project for FitStack fitness facilities.

## 📞 Support

For support, please contact the FitStack development team.
