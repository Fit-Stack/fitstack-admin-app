# White-Label Configuration Guide

This FitStack Admin Dashboard is designed as a **white-label solution** that can be easily customized for different gym brands.

## 🎨 Customization Options

### 1. Brand Identity

Configure your gym's brand identity by setting environment variables:

```env
# Brand Name (appears in sidebar and login page)
VITE_BRAND_NAME=YourGym

# Tagline (appears below brand name)
VITE_BRAND_TAGLINE=Admin Portal
```

### 2. Color Scheme

Customize the primary color to match your brand:

```env
# Primary color (hex format)
VITE_PRIMARY_COLOR=#f97316

# Primary hover color (slightly darker)
VITE_PRIMARY_HOVER=#ea580c
```

**Popular Color Schemes:**
- Orange (Default): `#f97316`
- Blue: `#3b82f6`
- Green: `#10b981`
- Purple: `#8b5cf6`
- Red: `#ef4444`
- Teal: `#14b8a6`

### 3. Custom Logo

Replace the default dumbbell icon with your gym's logo:

```env
# URL to your logo image (PNG, SVG, or JPG)
VITE_LOGO_URL=https://yourdomain.com/logo.png

# Recommended logo dimensions: 120x40px or similar aspect ratio
```

### 4. Favicon

Set a custom favicon for browser tabs:

```env
# URL to your favicon
VITE_FAVICON_URL=https://yourdomain.com/favicon.ico
```

## 📝 Configuration Steps

### Step 1: Create Environment File

Copy the example environment file:

```bash
cp .env.example .env
```

### Step 2: Edit Configuration

Open `.env` and customize the values:

```env
# Example for "PowerFit Gym"
VITE_BRAND_NAME=PowerFit
VITE_BRAND_TAGLINE=Management Portal
VITE_PRIMARY_COLOR=#3b82f6
VITE_PRIMARY_HOVER=#2563eb
VITE_LOGO_URL=https://powerfit.com/logo.png
```

### Step 3: Restart Development Server

After changing environment variables, restart the dev server:

```bash
npm run dev
```

## 🎯 Where Branding Appears

Your customizations will appear in:

1. **Login Page**
   - Logo/Icon at the top
   - Brand name as title
   - Tagline below name

2. **Sidebar**
   - Logo/Icon in header
   - Brand name
   - Tagline

3. **Navigation**
   - Active menu items use primary color
   - User avatar uses primary color

4. **Dashboard**
   - Charts use primary color
   - Buttons and interactive elements

5. **All Pages**
   - Primary buttons
   - Active states
   - Links and accents

## 🔧 Advanced Customization

### Custom CSS Variables

For more control, you can modify `src/index.css`:

```css
:root {
  --primary: 20.5 90.2% 48.2%; /* HSL format */
  --ring: 20.5 90.2% 48.2%;
}
```

### Tailwind Configuration

Edit `tailwind.config.js` for extended color palettes:

```javascript
primary: {
  50: '#fff7ed',
  100: '#ffedd5',
  // ... more shades
  900: '#7c2d12',
}
```

### Logo Specifications

**Sidebar Logo:**
- Recommended size: 40px height
- Format: PNG with transparency or SVG
- Aspect ratio: Square or horizontal

**Login Logo:**
- Recommended size: 80px height
- Format: PNG with transparency or SVG
- Should work on light backgrounds

## 📦 Multi-Tenant Deployment

For managing multiple gym brands:

### Option 1: Multiple Deployments

Deploy separate instances with different `.env` files:

```bash
# Gym A
VITE_BRAND_NAME=GymA
VITE_PRIMARY_COLOR=#f97316

# Gym B
VITE_BRAND_NAME=GymB
VITE_PRIMARY_COLOR=#3b82f6
```

### Option 2: Dynamic Configuration

Fetch branding from API based on tenant:

```typescript
// Modify src/config/branding.ts
const tenantId = getTenantFromURL();
const branding = await fetchBrandingConfig(tenantId);
```

## 🎨 Design System

The application uses a consistent design system:

- **Typography**: System fonts for performance
- **Spacing**: 4px base unit (Tailwind default)
- **Shadows**: Subtle elevation for depth
- **Borders**: Rounded corners (8px default)
- **Animations**: 200ms transitions

## ✅ Testing Your Branding

1. **Light Mode**: Check all pages in light mode
2. **Dark Mode**: Toggle dark mode and verify colors
3. **Mobile**: Test on mobile devices
4. **Logo**: Ensure logo displays correctly at all sizes
5. **Contrast**: Verify text is readable on colored backgrounds

## 🚀 Production Deployment

Before deploying:

1. ✅ Set all environment variables
2. ✅ Test branding in production build
3. ✅ Verify logo URLs are accessible
4. ✅ Check favicon appears correctly
5. ✅ Test on multiple devices

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📞 Support

For white-label customization support, contact the FitStack development team.

---

**Last Updated:** December 12, 2025
