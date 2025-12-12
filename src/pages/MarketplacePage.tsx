import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { marketplaceService, Product } from '@/services/marketplace.service';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import AddProductForm from '@/components/forms/AddProductForm';

// Image Carousel Component
function ProductImageCarousel({ product }: { product: Product }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Get images array, sorted by displayOrder
  const images = product.images 
    ? [...product.images].sort((a, b) => a.displayOrder - b.displayOrder)
    : product.imageUrls?.map((url, index) => ({ imageUrl: url, displayOrder: index })) || [];

  const hasMultipleImages = images.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
        <Package className="h-16 w-16 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
      <img
        src={images[currentImageIndex].imageUrl}
        alt={product.title}
        className="w-full h-full object-cover"
      />
      
      {hasMultipleImages && (
        <>
          {/* Previous Button */}
          <button
            onClick={(e) => { e.preventDefault(); previousImage(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          {/* Next Button */}
          <button
            onClick={(e) => { e.preventDefault(); nextImage(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          
          {/* Image Indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.preventDefault(); setCurrentImageIndex(index); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentImageIndex 
                    ? 'bg-white w-4' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  useEffect(() => {
    if (user?.tenantId) {
      fetchProducts();
    }
  }, [user?.tenantId]);

  const fetchProducts = async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await marketplaceService.getProducts(user.tenantId, {
        limit: 50,
      });
      
      // Handle both old format (data/meta) and new format (products/total)
      const data = response.products || response.data || [];
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setProducts(data);
        console.log('✅ Products loaded:', data.length, 'products');
      } else {
        console.error('❌ Invalid products data:', data);
        setProducts([]);
        setError('Invalid data format received');
      }
    } catch (error: any) {
      console.error('❌ Error fetching products:', error?.message || error);
      setError('Failed to load products. Using sample data.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProductSuccess = () => {
    setIsAddProductOpen(false);
    fetchProducts();
  };

  // Mock data as fallback
  const mockProducts: Product[] = [
    {
      id: '1',
      title: 'Protein Powder - Vanilla',
      description: 'Premium whey protein isolate for muscle recovery',
      originalPrice: 2999,
      discountedPrice: 1999,
      currency: 'INR',
      category: 'Supplements',
      quantity: 45,
      stockStatus: 'in_stock',
      isVip: false,
      isFeatured: true,
      hasReturnPolicy: true,
      returnPolicyDays: 30,
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Yoga Mat - Premium',
      description: 'Non-slip eco-friendly yoga mat with carrying strap',
      originalPrice: 1499,
      currency: 'INR',
      category: 'Equipment',
      quantity: 23,
      stockStatus: 'limited',
      isVip: false,
      isFeatured: false,
      hasReturnPolicy: true,
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Resistance Bands Set',
      description: 'Set of 5 resistance bands for strength training',
      originalPrice: 999,
      currency: 'INR',
      category: 'Equipment',
      quantity: 67,
      stockStatus: 'in_stock',
      isVip: false,
      isFeatured: false,
      hasReturnPolicy: false,
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const displayProducts = products.length > 0 ? products : (loading ? [] : mockProducts);

  const getStockStatus = (quantity: number, stockStatus: string) => {
    if (stockStatus === 'out_of_stock' || quantity === 0) {
      return { text: 'Out of Stock', color: 'text-red-600' };
    }
    if (stockStatus === 'limited' || quantity < 20) {
      return { text: 'Low Stock', color: 'text-orange-600' };
    }
    return { text: 'In Stock', color: 'text-green-600' };
  };

  const formatPrice = (price: number | string | undefined | null, currency: string) => {
    const symbols: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
    };
    const numPrice = price ? Number(price) : 0;
    return `${symbols[currency] || currency} ${numPrice.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-gray-600 mt-1">Manage products and inventory</p>
        </div>
        <Button onClick={() => setIsAddProductOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-700">{displayProducts.length}</div>
            <p className="text-sm text-gray-500">Total Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-600">
              {displayProducts.filter(p => p.stockStatus === 'in_stock').length}
            </div>
            <p className="text-sm text-gray-500">In Stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-indigo-600">
              {displayProducts.filter(p => p.isFeatured).length}
            </div>
            <p className="text-sm text-gray-500">Featured</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-rose-600">
              {displayProducts.filter(p => p.stockStatus === 'out_of_stock').length}
            </div>
            <p className="text-sm text-gray-500">Out of Stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading products...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="py-4">
            <p className="text-orange-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && displayProducts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No products found. Add your first product to get started!</p>
            <Button className="mt-4" onClick={() => setIsAddProductOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      {!loading && displayProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProducts.map((product) => {
            const stockStatus = getStockStatus(product.quantity, product.stockStatus);
          
          return (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">
                      {product.title}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{product.category}</p>
                  </div>
                  <div className="flex gap-1">
                    {product.isFeatured && (
                      <Badge variant="default" className="text-xs">Featured</Badge>
                    )}
                    {product.isVip && (
                      <Badge variant="secondary" className="text-xs">VIP</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product Image Carousel */}
                <ProductImageCarousel product={product} />

                <p className="text-sm text-gray-600 line-clamp-2">
                  {product.description}
                </p>

                {/* Price and Stock */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Price:</span>
                    <div className="text-right">
                      {product.discountedPrice && Number(product.discountedPrice) < Number(product.originalPrice) ? (
                        <div>
                          <p className="text-xs text-gray-500 line-through">
                            {formatPrice(product.originalPrice, product.currency)}
                          </p>
                          <p className="text-lg font-bold text-green-600">
                            {formatPrice(product.discountedPrice, product.currency)}
                          </p>
                          <Badge variant="destructive" className="text-xs">
                            {Number(product.discountPercentage || 0).toFixed(0)}% OFF
                          </Badge>
                        </div>
                      ) : (
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(product.originalPrice, product.currency)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Stock:</span>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{product.quantity} units</p>
                      <p className={`text-xs ${stockStatus.color}`}>
                        {stockStatus.text}
                      </p>
                    </div>
                  </div>
                  {product.hasReturnPolicy && (
                    <div className="text-xs text-green-600 flex items-center gap-1">
                      ✓ {product.returnPolicyDays}-day return policy
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1">
                    View Details
                  </Button>
                </div>
              </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Product Side Panel */}
      <Sheet open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add New Product</SheetTitle>
            <SheetDescription>
              Fill in the product details and upload images
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <AddProductForm
              onSuccess={handleAddProductSuccess}
              onCancel={() => setIsAddProductOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
