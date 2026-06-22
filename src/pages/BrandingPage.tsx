import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { tenantService } from '@/services/tenant.service';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Upload, Eye, Save } from 'lucide-react';

interface BrandingFormData {
  name: string;
  tagline: string;
  logoUrl: string | null;
  primaryColor: string;
  primaryHover: string;
  fontFamily: string;
  faviconUrl: string | null;
}

const GOOGLE_FONTS = [
  'Inter',
  'Roboto',
  'Poppins',
  'Montserrat',
  'Open Sans',
  'Lato',
  'Raleway',
  'Ubuntu',
  'Work Sans',
  'Playfair Display',
];

export default function BrandingPage() {
  const { user } = useAuthStore();
  const { success: showSuccess, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<BrandingFormData>({
    name: '',
    tagline: '',
    logoUrl: null,
    primaryColor: '#f97316',
    primaryHover: '#ea580c',
    fontFamily: 'Inter',
    faviconUrl: null,
  });

  // Load current tenant branding
  useEffect(() => {
    const loadBranding = async () => {
      if (!user?.tenantId) return;

      try {
        const response = await tenantService.getTenantBranding(user.tenantId);
        setFormData({
          name: response.name || '',
          tagline: response.tagline || '',
          logoUrl: response.logoUrl || null,
          primaryColor: response.primaryColor || '#f97316',
          primaryHover: response.primaryHover || '#ea580c',
          fontFamily: response.fontFamily || 'Inter',
          faviconUrl: response.faviconUrl || null,
        });
        setError('');
      } catch (err) {
        console.error('Failed to load branding:', err);
        setError('Failed to load current branding settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadBranding();
  }, [user?.tenantId]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showError('Error', 'Logo must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({
        ...prev,
        logoUrl: event.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      showError('Error', 'Favicon must be smaller than 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({
        ...prev,
        faviconUrl: event.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenantId) return;

    setIsSaving(true);
    setError('');

    try {
      await tenantService.updateTenantBranding(user.tenantId, {
        name: formData.name,
        tagline: formData.tagline,
        primaryColor: formData.primaryColor,
        primaryHover: formData.primaryHover,
        fontFamily: formData.fontFamily,
        ...(formData.logoUrl && formData.logoUrl.startsWith('data:') && { logoUrl: formData.logoUrl }),
        ...(formData.faviconUrl && formData.faviconUrl.startsWith('data:') && { faviconUrl: formData.faviconUrl }),
      });

      showSuccess('Success', 'Branding updated successfully! Refresh the page to see changes.');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update branding';
      setError(message);
      showError('Error', message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading branding settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Branding Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Customize your gym's branding. Changes will be reflected across the admin portal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Brand Configuration</CardTitle>
              <CardDescription>Update your gym's visual identity</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-6 flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Gym Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Gym Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your Gym Name"
                    disabled={isSaving}
                    required
                  />
                </div>

                {/* Tagline */}
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleInputChange}
                    placeholder="Admin Portal, Fitness Hub, etc."
                    disabled={isSaving}
                  />
                </div>

                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo</Label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center justify-center h-24 w-24 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary cursor-pointer transition-colors">
                      <input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        disabled={isSaving}
                        className="hidden"
                      />
                      <div className="text-center">
                        <Upload className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                        <span className="text-xs text-gray-600">Click to upload</span>
                      </div>
                    </label>
                    {formData.logoUrl && (
                      <img
                        src={formData.logoUrl}
                        alt="Logo preview"
                        className="h-24 w-24 object-contain rounded-lg bg-gray-50"
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Max 2MB. PNG or SVG recommended.</p>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        id="primaryColor"
                        type="color"
                        name="primaryColor"
                        value={formData.primaryColor}
                        onChange={handleInputChange}
                        disabled={isSaving}
                        className="h-10 w-14 rounded cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={formData.primaryColor}
                        onChange={handleInputChange}
                        name="primaryColor"
                        disabled={isSaving}
                        className="flex-1"
                        placeholder="#f97316"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="primaryHover">Primary Hover Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        id="primaryHover"
                        type="color"
                        name="primaryHover"
                        value={formData.primaryHover}
                        onChange={handleInputChange}
                        disabled={isSaving}
                        className="h-10 w-14 rounded cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={formData.primaryHover}
                        onChange={handleInputChange}
                        name="primaryHover"
                        disabled={isSaving}
                        className="flex-1"
                        placeholder="#ea580c"
                      />
                    </div>
                  </div>
                </div>

                {/* Font Family */}
                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <select
                    id="fontFamily"
                    name="fontFamily"
                    value={formData.fontFamily}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {GOOGLE_FONTS.map(font => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">
                    <span
                      style={{ fontFamily: `${formData.fontFamily}, sans-serif` }}
                      className="font-semibold"
                    >
                      Preview: {formData.fontFamily}
                    </span>
                  </p>
                </div>

                {/* Favicon Upload */}
                <div className="space-y-2">
                  <Label htmlFor="favicon">Favicon (Optional)</Label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center justify-center h-16 w-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary cursor-pointer transition-colors">
                      <input
                        id="favicon"
                        type="file"
                        accept="image/*"
                        onChange={handleFaviconChange}
                        disabled={isSaving}
                        className="hidden"
                      />
                      <div className="text-center">
                        <Upload className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                        <span className="text-xs text-gray-600">Upload</span>
                      </div>
                    </label>
                    {formData.faviconUrl && (
                      <img
                        src={formData.faviconUrl}
                        alt="Favicon preview"
                        className="h-16 w-16 object-contain rounded-lg bg-gray-50"
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Max 1MB. ICO, PNG, or SVG.</p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full"
                  size="lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Branding'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </CardTitle>
                <CardDescription>How your branding will look</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Sidebar Preview */}
                <div
                  className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                  style={{ backgroundColor: '#f9fafb' }}
                >
                  <div
                    className="p-4 text-white"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    {/* Logo Area */}
                    <div className="flex items-center gap-3 mb-4">
                      {formData.logoUrl ? (
                        <img
                          src={formData.logoUrl}
                          alt="Logo"
                          className="h-10 w-10 rounded"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-white/20 flex items-center justify-center text-sm font-bold">
                          {formData.name.charAt(0) || 'G'}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-sm">{formData.name || 'Gym Name'}</p>
                        <p className="text-xs opacity-90">{formData.tagline || 'Tagline'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Nav Items Preview */}
                  <div className="p-3 space-y-2">
                    {['Dashboard', 'Classes', 'Sessions', 'Users'].map(item => (
                      <div
                        key={item}
                        className="px-3 py-2 rounded text-sm font-medium cursor-default transition-colors"
                        style={{
                          backgroundColor: item === 'Dashboard' ? formData.primaryColor : 'transparent',
                          color: item === 'Dashboard' ? 'white' : '#666',
                        }}
                        onMouseEnter={(e) => {
                          if (item !== 'Dashboard') {
                            (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (item !== 'Dashboard') {
                            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  {/* User Avatar Preview */}
                  <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: formData.primaryColor }}
                      >
                        A
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">Admin</p>
                        <p className="text-xs text-gray-500">admin@gym.com</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Font Preview */}
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Font Preview:</p>
                  <p
                    style={{ fontFamily: `${formData.fontFamily}, sans-serif` }}
                    className="text-sm font-semibold text-gray-900 dark:text-gray-100"
                  >
                    The quick brown fox jumps
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
