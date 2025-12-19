import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Package, ShoppingCart, ChevronLeft, ChevronRight, Search, Filter, X, Star } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { marketplaceService, Product, ProductFilters } from '@/services/marketplace.service';
import { EmptyState } from '@/components/ui/empty-state';
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

// Stock status options
const STOCK_STATUS_OPTIONS = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'limited', label: 'Limited Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

// Sort options
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'title', label: 'Title' },
  { value: 'originalPrice', label: 'Price' },
  { value: 'averageRating', label: 'Rating' },
  { value: 'quantity', label: 'Stock Quantity' },
];

export default function MarketplacePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 10;

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedStockStatus, setSelectedStockStatus] = useState('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [isFeatured, setIsFeatured] = useState<boolean | undefined>(undefined);
  const [isVip, setIsVip] = useState<boolean | undefined>(undefined);
  const [hasReturnPolicy, setHasReturnPolicy] = useState<boolean | undefined>(undefined);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory, selectedBrand, selectedStockStatus, minPrice, maxPrice, isFeatured, isVip, hasReturnPolicy, minRating, sortBy, sortOrder]);

  useEffect(() => {
    if (user?.tenantId) {
      fetchProducts();
    }
  }, [user?.tenantId, currentPage, debouncedSearch, selectedCategory, selectedBrand, selectedStockStatus, minPrice, maxPrice, isFeatured, isVip, hasReturnPolicy, minRating, sortBy, sortOrder]);

  const fetchProducts = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);
      setError(null);

      // Build filters object
      const filters: ProductFilters = {
        page: currentPage,
        limit: limit,
        sortBy,
        sortOrder,
      };

      if (debouncedSearch) filters.search = debouncedSearch;
      if (selectedCategory) filters.category = selectedCategory;
      if (selectedBrand) filters.brand = selectedBrand;
      if (selectedStockStatus) filters.stockStatus = selectedStockStatus;
      if (minPrice) filters.minPrice = Number(minPrice);
      if (maxPrice) filters.maxPrice = Number(maxPrice);
      if (isFeatured !== undefined) filters.isFeatured = isFeatured;
      if (isVip !== undefined) filters.isVip = isVip;
      if (hasReturnPolicy !== undefined) filters.hasReturnPolicy = hasReturnPolicy;
      if (minRating !== undefined) filters.minRating = minRating;

      const response = await marketplaceService.getProducts(user.tenantId, filters);
      
      const data = response.data || [];
      
      if (Array.isArray(data)) {
        setProducts(data);
        const total = response.total || 0;
        setTotalProducts(total);
        setTotalPages(Math.ceil(total / limit));
      } else {
        setProducts([]);
        setError('Invalid data format received');
      }
    } catch (error: any) {
      console.error('Error fetching products:', error?.message || error);
      setError('Failed to load products.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId, currentPage, debouncedSearch, selectedCategory, selectedBrand, selectedStockStatus, minPrice, maxPrice, isFeatured, isVip, hasReturnPolicy, minRating, sortBy, sortOrder]);

  const handleAddProductSuccess = () => {
    setIsAddProductOpen(false);
    fetchProducts();
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedBrand('');
    setSelectedStockStatus('');
    setMinPrice('');
    setMaxPrice('');
    setIsFeatured(undefined);
    setIsVip(undefined);
    setHasReturnPolicy(undefined);
    setMinRating(undefined);
    setSortBy('createdAt');
    setSortOrder('DESC');
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedBrand || selectedStockStatus || minPrice || maxPrice || isFeatured !== undefined || isVip !== undefined || hasReturnPolicy !== undefined || minRating !== undefined;


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

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4">
            {/* Search and Toggle Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products by title, description, brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Toggle Filters Button */}
              <Button
                variant={showFilters ? 'default' : 'outline'}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    !
                  </Badge>
                )}
              </Button>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearAllFilters} className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                {/* Category Filter */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Category</Label>
                  <Input
                    placeholder="e.g. Supplements"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  />
                </div>

                {/* Brand Filter */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Brand</Label>
                  <Input
                    placeholder="e.g. Nike"
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                  />
                </div>

                {/* Stock Status Filter */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Stock Status</Label>
                  <select
                    value={selectedStockStatus}
                    onChange={(e) => setSelectedStockStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="">All Status</option>
                    {STOCK_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Min Rating Filter */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Minimum Rating</Label>
                  <select
                    value={minRating ?? ''}
                    onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="">Any Rating</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                    <option value="2">2+ Stars</option>
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Min Price</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Max Price</Label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>

                {/* Sort By */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</Label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Order</Label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'ASC' | 'DESC')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="DESC">Newest First</option>
                    <option value="ASC">Oldest First</option>
                  </select>
                </div>

                {/* Boolean Filters - Full Width */}
                <div className="md:col-span-2 lg:col-span-4">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Product Features</Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setIsFeatured(isFeatured === true ? undefined : true)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        isFeatured === true
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Star className="h-3 w-3" />
                      Featured Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsVip(isVip === true ? undefined : true)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        isVip === true
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      VIP Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasReturnPolicy(hasReturnPolicy === true ? undefined : true)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        hasReturnPolicy === true
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      With Return Policy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-700">{totalProducts}</div>
            <p className="text-sm text-gray-500">Total Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-600">
              {products.filter((p: Product) => p.stockStatus === 'in_stock').length}
            </div>
            <p className="text-sm text-gray-500">In Stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-indigo-600">
              {products.filter((p: Product) => p.isFeatured).length}
            </div>
            <p className="text-sm text-gray-500">Featured</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-rose-600">
              {products.filter((p: Product) => p.stockStatus === 'out_of_stock').length}
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
      {!loading && products.length === 0 && (
        <Card>
          <CardContent className="py-6">
            <EmptyState
              icon={ShoppingCart}
              title={hasActiveFilters ? "No products match your filters" : "No products yet"}
              description={hasActiveFilters 
                ? "Try adjusting your search or filters to find products."
                : "Add your first product to start building your marketplace."
              }
              actionLabel={hasActiveFilters ? "Clear Filters" : "Add Product"}
              onAction={hasActiveFilters ? clearAllFilters : () => setIsAddProductOpen(true)}
              actionIcon={hasActiveFilters ? X : Plus}
            />
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product: Product) => {
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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate(`/marketplace/${product.id}`)}
                  >
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

      {/* Pagination */}
      {totalProducts > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalProducts)} of {totalProducts} products
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || loading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
