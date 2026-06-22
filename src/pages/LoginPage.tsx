import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { useBrandConfig } from '@/config/branding';
import { useTenantBranding } from '@/contexts/TenantBrandingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const brandConfig = useBrandConfig();
  const { branding, error: tenantError } = useTenantBranding();

  // Login requires the tenant UUID (tenant.id), resolved from the branding payload.
  const resolvedTenantId = branding?.id ?? null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Tenant must be resolved (unless logging in as super admin)
    if (!isSuperAdmin && !resolvedTenantId) {
      setError('Tenant not found. Please check the URL (e.g. ?tenant=acme).');
      return;
    }

    setIsLoading(true);

    try {
      const credentials = isSuperAdmin
        ? { email, password }
        : { email, password, tenantId: resolvedTenantId! };

      const response = await authService.login(credentials);
      setUser(response.user);
      navigate('/');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 p-4 transition-colors duration-200">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            {brandConfig.logoUrl ? (
              <img src={brandConfig.logoUrl} alt={brandConfig.name} className="h-20 w-auto" />
            ) : (
              <div 
                className="h-20 w-20 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: brandConfig.primaryColor }}
              >
                <Dumbbell className="h-10 w-10 text-white" />
              </div>
            )}
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {brandConfig.name}
          </CardTitle>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wider uppercase">
            {brandConfig.tagline}
          </p>
          <CardDescription className="pt-2">
            Sign in to manage your fitness facility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 p-4 text-sm bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-300 mb-1">Login Error</p>
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {tenantError && !isSuperAdmin && (
              <div className="flex items-center gap-2 p-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>Tenant not found: {tenantError}</span>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="superAdmin"
                checked={isSuperAdmin}
                onChange={(e) => setIsSuperAdmin(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                disabled={isLoading}
              />
              <Label htmlFor="superAdmin" className="text-sm font-normal cursor-pointer">
                Login as Super Admin
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Admin access only</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
