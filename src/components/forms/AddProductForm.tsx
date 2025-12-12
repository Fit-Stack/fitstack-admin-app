import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, X } from 'lucide-react';
import { marketplaceService } from '@/services/marketplace.service';
import { useAuthStore } from '@/store/authStore';

interface AddProductFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface ProductFormData {
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
  searchTags?: string;
}

export default function AddProductForm({ onSuccess, onCancel }: AddProductFormProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageUrls] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: {
      currency: 'INR',
      stockStatus: 'in_stock',
      quantity: 0,
      isVip: false,
      isFeatured: false,
      hasReturnPolicy: false,
    },
  });

  const hasReturnPolicy = watch('hasReturnPolicy');
  const originalPrice = watch('originalPrice');
  const discountedPrice = watch('discountedPrice');

  // Calculate discount percentage automatically
  const calculateDiscountPercentage = () => {
    if (originalPrice && discountedPrice && discountedPrice < originalPrice) {
      const discount = ((originalPrice - discountedPrice) / originalPrice) * 100;
      setValue('discountPercentage', Math.round(discount));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > 10) {
      alert('Maximum 10 images allowed');
      return;
    }

    // Validate file size (5MB each)
    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      alert('Each image must be less than 5MB');
      return;
    }

    setImages(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!user?.tenantId) {
      alert('User not authenticated');
      return;
    }

    try {
      setLoading(true);

      // Create FormData for multipart/form-data
      const formData = new FormData();

      // Add all text fields
      formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      if (data.shortDescription) formData.append('shortDescription', data.shortDescription);
      formData.append('originalPrice', data.originalPrice.toString());
      if (data.discountedPrice) formData.append('discountedPrice', data.discountedPrice.toString());
      if (data.discountPercentage) formData.append('discountPercentage', data.discountPercentage.toString());
      formData.append('currency', data.currency);
      if (data.brand) formData.append('brand', data.brand);
      formData.append('category', data.category);
      if (data.sku) formData.append('sku', data.sku);
      formData.append('stockStatus', data.stockStatus);
      formData.append('quantity', data.quantity.toString());
      formData.append('isVip', data.isVip.toString());
      formData.append('isFeatured', data.isFeatured.toString());
      formData.append('hasReturnPolicy', data.hasReturnPolicy.toString());
      if (data.hasReturnPolicy && data.returnPolicyDays) {
        formData.append('returnPolicyDays', data.returnPolicyDays.toString());
      }
      if (data.searchTags) formData.append('searchTags', data.searchTags);

      // Add existing image URLs if any
      if (existingImageUrls.length > 0) {
        formData.append('existingImageUrls', existingImageUrls.join(','));
      }

      // Add image files
      images.forEach((image) => {
        formData.append('images', image);
      });

      await marketplaceService.createProduct(user.tenantId, formData);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating product:', error);
      alert(error.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Supplements',
    'Equipment',
    'Accessories',
    'Apparel',
    'Nutrition',
    'Recovery',
    'Technology',
    'Other',
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

        <div>
          <Label htmlFor="title">Product Title *</Label>
          <Input
            id="title"
            {...register('title', { required: 'Product title is required' })}
            placeholder="e.g., Premium Protein Powder"
          />
          {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <Label htmlFor="shortDescription">Short Description</Label>
          <Input
            id="shortDescription"
            {...register('shortDescription')}
            placeholder="Brief one-line description"
          />
        </div>

        <div>
          <Label htmlFor="description">Full Description</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Detailed product description..."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              {...register('category', { required: 'Category is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>}
          </div>

          <div>
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              {...register('brand')}
              placeholder="e.g., MuscleBlaze"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
          <Input
            id="sku"
            {...register('sku')}
            placeholder="e.g., SKU-12345"
          />
        </div>

        <div>
          <Label htmlFor="searchTags">Search Tags (comma-separated)</Label>
          <Input
            id="searchTags"
            {...register('searchTags')}
            placeholder="e.g., protein, whey, fitness, muscle"
          />
          <p className="text-xs text-gray-500 mt-1">Help users find this product with relevant keywords</p>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="currency">Currency *</Label>
            <select
              id="currency"
              {...register('currency')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>

          <div>
            <Label htmlFor="originalPrice">Original Price *</Label>
            <Input
              id="originalPrice"
              type="number"
              step="0.01"
              min="0"
              {...register('originalPrice', {
                required: 'Original price is required',
                min: { value: 0, message: 'Price must be positive' },
                valueAsNumber: true,
              })}
              placeholder="2999"
              onBlur={calculateDiscountPercentage}
            />
            {errors.originalPrice && <p className="text-sm text-red-600 mt-1">{errors.originalPrice.message}</p>}
          </div>

          <div>
            <Label htmlFor="discountedPrice">Discounted Price</Label>
            <Input
              id="discountedPrice"
              type="number"
              step="0.01"
              min="0"
              {...register('discountedPrice', { valueAsNumber: true })}
              placeholder="1999"
              onBlur={calculateDiscountPercentage}
            />
          </div>
        </div>

        {discountedPrice && originalPrice && discountedPrice < originalPrice && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-800">
              Discount: <span className="font-semibold">{Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)}%</span> off
            </p>
          </div>
        )}
      </div>

      {/* Inventory */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900">Inventory</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="stockStatus">Stock Status *</Label>
            <select
              id="stockStatus"
              {...register('stockStatus')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="in_stock">In Stock</option>
              <option value="limited">Limited Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          <div>
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              {...register('quantity', {
                required: 'Quantity is required',
                min: { value: 0, message: 'Quantity cannot be negative' },
                valueAsNumber: true,
              })}
              placeholder="100"
            />
            {errors.quantity && <p className="text-sm text-red-600 mt-1">{errors.quantity.message}</p>}
          </div>
        </div>
      </div>

      {/* Product Features */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900">Product Features</h3>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFeatured"
              {...register('isFeatured')}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isFeatured" className="cursor-pointer">
              Featured Product (Show on homepage)
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isVip"
              {...register('isVip')}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isVip" className="cursor-pointer">
              VIP/Premium Product
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasReturnPolicy"
              {...register('hasReturnPolicy')}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="hasReturnPolicy" className="cursor-pointer">
              Has Return Policy
            </Label>
          </div>

          {hasReturnPolicy && (
            <div className="ml-6">
              <Label htmlFor="returnPolicyDays">Return Policy Days</Label>
              <Input
                id="returnPolicyDays"
                type="number"
                min="1"
                {...register('returnPolicyDays', { valueAsNumber: true })}
                placeholder="30"
              />
              <p className="text-xs text-gray-500 mt-1">Number of days for returns</p>
            </div>
          )}
        </div>
      </div>

      {/* Product Images */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-900">Product Images</h3>
        <p className="text-sm text-gray-600">Upload up to 10 images (max 5MB each)</p>

        <div>
          <Label htmlFor="images" className="cursor-pointer">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Click to upload images</p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
            </div>
          </Label>
          <input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Product'
          )}
        </Button>
      </div>
    </form>
  );
}
