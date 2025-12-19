import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, DollarSign, Package, Star, Edit2, Trash2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuthStore } from '@/store/authStore';
import { marketplaceService, Product } from '@/services/marketplace.service';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';

export default function MarketplaceProductDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    shortDescription: '',
    originalPrice: '',
    discountedPrice: '',
    brand: '',
    category: '',
    quantity: '',
    stockStatus: 'in_stock' as 'in_stock' | 'out_of_stock' | 'limited',
  });
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const tenantId = user?.tenantId;
  const productId = id;

  const fetchData = useCallback(async () => {
    if (!tenantId || !productId) return;

    try {
      setLoading(true);
      setError(null);

      const productData = await marketplaceService.getProductById(tenantId, productId);
      setProduct(productData);
      setEditForm({
        title: productData.title,
        description: productData.description || '',
        shortDescription: productData.shortDescription || '',
        originalPrice: String(productData.originalPrice),
        discountedPrice: String(productData.discountedPrice || ''),
        brand: productData.brand || '',
        category: productData.category,
        quantity: String(productData.quantity),
        stockStatus: productData.stockStatus,
      });
    } catch (e: any) {
      console.error('Error loading product details:', e);
      setError(e?.response?.data?.message || 'Failed to load product details');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [tenantId, productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdate = async () => {
    if (!tenantId || !productId) return;

    try {
      setUpdating(true);
      await marketplaceService.updateProduct(tenantId, productId, {
        title: editForm.title,
        description: editForm.description,
        shortDescription: editForm.shortDescription,
        originalPrice: parseFloat(editForm.originalPrice),
        discountedPrice: editForm.discountedPrice ? parseFloat(editForm.discountedPrice) : undefined,
        brand: editForm.brand,
        category: editForm.category,
        quantity: parseInt(editForm.quantity),
        stockStatus: editForm.stockStatus,
      });
      success('Success', 'Product updated successfully');
      setIsEditOpen(false);
      fetchData();
    } catch (e: any) {
      console.error('Error updating product:', e);
      showError('Error', e?.response?.data?.message || 'Failed to update product');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!tenantId || !productId) return;
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      setDeleting(true);
      await marketplaceService.deleteProduct(tenantId, productId);
      success('Success', 'Product deleted successfully');
      navigate('/marketplace');
    } catch (e: any) {
      console.error('Error deleting product:', e);
      showError('Error', e?.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-gray-600">Loading product...</p>
      </div>
    );
  }

  if (!productId || !tenantId) {
    return (
      <Card>
        <CardContent className="py-6">
          <EmptyState
            icon={Package}
            title="Product not found"
            description="Missing tenant or product id."
            actionLabel="Back to Marketplace"
            onAction={() => navigate('/marketplace')}
            actionIcon={ArrowLeft}
          />
        </CardContent>
      </Card>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/marketplace')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="py-6">
            <EmptyState
              icon={Package}
              title="Failed to load product"
              description={error || 'Something went wrong.'}
              actionLabel="Retry"
              onAction={fetchData}
              actionIcon={Package}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayImages = product.images?.map(img => img.imageUrl) || product.imageUrls || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/marketplace')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
            <p className="text-gray-600 mt-1">Product details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{product.stockStatus}</Badge>
          <Badge variant="outline">{product.category}</Badge>
          <Button size="sm" onClick={() => setIsEditOpen(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {displayImages.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {displayImages.slice(0, 4).map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`${product.title} ${idx + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div className="text-2xl font-bold text-gray-900">
                {product.currency} {product.discountedPrice || product.originalPrice}
              </div>
            </div>
            <p className="text-sm text-gray-600">Current Price</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{product.quantity}</div>
            <p className="text-sm text-gray-600">In Stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div className="text-2xl font-bold text-gray-900">
                {product.averageRating || 'N/A'}
              </div>
            </div>
            <p className="text-sm text-gray-600">{product.totalReviews || 0} Reviews</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Brand</p>
              <p className="font-medium text-gray-900">{product.brand || 'N/A'}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">SKU</p>
              <p className="font-medium text-gray-900">{product.sku || 'N/A'}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Category</p>
              <Badge variant="outline">{product.category}</Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Stock Status</p>
              <Badge variant={product.stockStatus === 'in_stock' ? 'success' : 'destructive'}>
                {product.stockStatus}
              </Badge>
            </div>

            {product.discountPercentage && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Discount</p>
                <Badge variant="secondary">{product.discountPercentage}% OFF</Badge>
              </div>
            )}

            {product.hasReturnPolicy && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Return Policy</p>
                <p className="font-medium text-gray-900">{product.returnPolicyDays} days</p>
              </div>
            )}
          </div>

          {product.shortDescription && (
            <div className="mt-6">
              <p className="text-sm text-gray-600">Short Description</p>
              <p className="mt-1 text-gray-900">{product.shortDescription}</p>
            </div>
          )}

          {product.description && (
            <div className="mt-6">
              <p className="text-sm text-gray-600">Description</p>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{product.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Product</SheetTitle>
            <SheetDescription>Update product information</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input
                id="shortDescription"
                value={editForm.shortDescription}
                onChange={(e) => setEditForm({ ...editForm, shortDescription: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="originalPrice">Original Price *</Label>
              <Input
                id="originalPrice"
                type="number"
                value={editForm.originalPrice}
                onChange={(e) => setEditForm({ ...editForm, originalPrice: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="discountedPrice">Discounted Price</Label>
              <Input
                id="discountedPrice"
                type="number"
                value={editForm.discountedPrice}
                onChange={(e) => setEditForm({ ...editForm, discountedPrice: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={editForm.brand}
                onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                value={editForm.quantity}
                onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="stockStatus">Stock Status *</Label>
              <select
                id="stockStatus"
                value={editForm.stockStatus}
                onChange={(e) => setEditForm({ ...editForm, stockStatus: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="limited">Limited</option>
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdate} disabled={updating} className="flex-1">
                {updating ? 'Updating...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setIsEditOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
