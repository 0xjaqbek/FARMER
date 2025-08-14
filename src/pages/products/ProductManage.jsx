// src/pages/products/ProductManage.jsx
// Simplified version without table components (using Cards instead)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Eye, Trash2, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  deleteDoc,
  updateDoc 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function ProductManage() {
  const { currentUser, userProfile } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Load products on component mount
  useEffect(() => {
    if (currentUser && userProfile) {
      loadProducts();
    }
  }, [currentUser, userProfile]);

const loadProducts = async () => {
  try {
    setLoading(true);
    
    console.log('Fetching products for user:', currentUser.uid);
    console.log('User profile role:', userProfile?.role);
    
    const productsRef = collection(db, 'products');
    
    // Now you can use orderBy since the composite index is enabled
    let q = query(
      productsRef,
      where('rolnikId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    
    console.log('Querying with rolnikId:', currentUser.uid);
    let snapshot = await getDocs(q);
    let productList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('Products found with rolnikId:', productList.length);
    
    // If no products found with rolnikId, try with farmerId (fallback)
    if (productList.length === 0) {
      console.log('No products found with rolnikId, trying farmerId...');
      
      // Check if you have a composite index for farmerId too
      try {
        q = query(
          productsRef,
          where('farmerId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        
        snapshot = await getDocs(q);
        productList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('Products found with farmerId:', productList.length);
      } catch {
        console.log('No composite index for farmerId, querying without orderBy');
        
        // Fallback without orderBy for farmerId
        q = query(
          productsRef,
          where('farmerId', '==', currentUser.uid)
        );
        
        snapshot = await getDocs(q);
        productList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
          };
        });
        
        // Sort in JavaScript for farmerId queries
        productList.sort((a, b) => b.createdAt - a.createdAt);
      }
    }
    
    console.log('Final product list:', productList);
    setProducts(productList);
    
  } catch (error) {
    console.error('Error loading products:', error);
    toast({
      title: "Error",
      description: "Failed to load products. Please try again.",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};

  // Delete product
  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await deleteDoc(doc(db, 'products', productId));
      
      // Remove from local state
      setProducts(prev => prev.filter(p => p.id !== productId));
      
      toast({
        title: "Success",
        description: "Product deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  // Toggle product status
  const handleToggleStatus = async (productId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      await updateDoc(doc(db, 'products', productId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Update local state
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, status: newStatus } : p
      ));
      
      toast({
        title: "Success",
        description: `Product ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error updating product status:', error);
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive"
      });
    }
  };

  // Filter products based on search and status
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Get status badge variant
  const getStatusVariant = (status) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'pending': return 'outline';
      default: return 'secondary';
    }
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  // Check if user is farmer
  const isFarmer = userProfile?.role === 'rolnik' || userProfile?.role === 'farmer';

  if (!isFarmer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">Only farmers can manage products.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manage Products</h1>
          <p className="text-gray-600">
            {products.length} product{products.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        <Link to="/products/add">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('active')}
              >
                Active
              </Button>
              <Button
                variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('inactive')}
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {loading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </CardContent>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-gray-400 mb-4">
              <Plus className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Start by adding your first product to the marketplace.'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Link to="/products/add">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              {/* Product Image */}
              {product.images?.[0] && (
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                </div>
              )}
              
              <CardContent className="p-4">
                {/* Product Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                    <Badge variant={getStatusVariant(product.status || 'active')}>
                      {product.status || 'active'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="secondary">{product.category}</Badge>
                    <span className="text-gray-600">
                      Stock: {product.stockQuantity || product.actualQuantity || 0} {product.unit}
                    </span>
                  </div>
                  
                  <div className="text-lg font-bold text-green-600">
                    {formatPrice(product.price)} / {product.unit}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1">
                    <Link to={`/products/${product.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    
                    <Link to={`/products/edit/${product.id}`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(product.id, product.status)}
                  >
                    {product.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Debug Info (remove in production) */}
      {import.meta.env.MODE === 'development' && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <div className="space-y-1">
              <p><strong>User ID:</strong> {currentUser?.uid}</p>
              <p><strong>User Role:</strong> {userProfile?.role}</p>
              <p><strong>Products Found:</strong> {products.length}</p>
              <p><strong>Filtered Products:</strong> {filteredProducts.length}</p>
              <p><strong>Search Term:</strong> {searchTerm || 'None'}</p>
              <p><strong>Filter Status:</strong> {filterStatus}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}