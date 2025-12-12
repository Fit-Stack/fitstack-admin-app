import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, Package } from 'lucide-react';

export default function MarketplacePage() {
  // Mock data - in real app, fetch from API
  const products = [
    {
      id: '1',
      name: 'Protein Powder - Vanilla',
      description: 'Premium whey protein isolate for muscle recovery',
      price: 49.99,
      category: 'Supplements',
      stock: 45,
      status: 'published',
    },
    {
      id: '2',
      name: 'Yoga Mat - Premium',
      description: 'Non-slip eco-friendly yoga mat with carrying strap',
      price: 34.99,
      category: 'Equipment',
      stock: 23,
      status: 'published',
    },
    {
      id: '3',
      name: 'Resistance Bands Set',
      description: 'Set of 5 resistance bands for strength training',
      price: 24.99,
      category: 'Equipment',
      stock: 67,
      status: 'published',
    },
    {
      id: '4',
      name: 'Pre-Workout Energy',
      description: 'Energy boost supplement for intense workouts',
      price: 39.99,
      category: 'Supplements',
      stock: 0,
      status: 'out_of_stock',
    },
    {
      id: '5',
      name: 'Gym Towel Set',
      description: 'Quick-dry microfiber towels (pack of 3)',
      price: 19.99,
      category: 'Accessories',
      stock: 89,
      status: 'published',
    },
    {
      id: '6',
      name: 'Water Bottle - Insulated',
      description: '32oz stainless steel insulated water bottle',
      price: 29.99,
      category: 'Accessories',
      stock: 12,
      status: 'draft',
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      published: 'success',
      draft: 'secondary',
      out_of_stock: 'destructive',
    };
    return variants[status] || 'default';
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'text-red-600' };
    if (stock < 20) return { text: 'Low Stock', color: 'text-orange-600' };
    return { text: 'In Stock', color: 'text-green-600' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-gray-600 mt-1">Manage products and inventory</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          const stockStatus = getStockStatus(product.stock);
          
          return (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">
                      {product.name}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{product.category}</p>
                  </div>
                  <Badge variant={getStatusBadge(product.status)}>
                    {product.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product Image Placeholder */}
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>

                <p className="text-sm text-gray-600 line-clamp-2">
                  {product.description}
                </p>

                {/* Price and Stock */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Price:</span>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-gray-600" />
                      <span className="text-lg font-bold text-gray-900">
                        {product.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Stock:</span>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{product.stock} units</p>
                      <p className={`text-xs ${stockStatus.color}`}>
                        {stockStatus.text}
                      </p>
                    </div>
                  </div>
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
    </div>
  );
}
