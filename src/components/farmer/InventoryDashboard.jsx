// src/components/farmer/InventoryDashboard.jsx
// Complete inventory management interface for farmers

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Plus, 
  Edit, 
  Eye,
  Calendar,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { InventoryService } from '../../services/inventoryService';
import { useAuth } from '../../context/AuthContext';

export default function InventoryDashboard() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState({
    products: [],
    lowStockProducts: [],
    totalValue: 0,
    statistics: {}
  });
  
  // Modal states
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Form states
  const [batchForm, setBatchForm] = useState({
    quantity: '',
    harvestDate: '',
    expiryDate: '',
    cost: '',
    notes: ''
  });
  
  const [settingsForm, setSettingsForm] = useState({
    lowStockThreshold: '',
    hideWhenOutOfStock: false,
    allowBackorders: false
  });

  // Load inventory data
  useEffect(() => {
    loadInventoryData();
  }, [currentUser]);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      
      const [lowStockProducts, inventoryValue] = await Promise.all([
        InventoryService.getLowStockProducts(currentUser.uid),
        InventoryService.calculateInventoryValue(currentUser.uid)
      ]);
      
      setInventoryData({
        lowStockProducts,
        totalValue: inventoryValue.totalValue,
        breakdown: inventoryValue.breakdown,
        statistics: {
          totalProducts: inventoryValue.breakdown.length,
          totalItems: inventoryValue.totalItems,
          lowStockCount: lowStockProducts.length,
          outOfStockCount: lowStockProducts.filter(p => p.stockLevel === 'out').length
        }
      });
    } catch (error) {
      console.error('Error loading inventory data:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle adding new batch
  const handleAddBatch = async () => {
    try {
      if (!selectedProduct || !batchForm.quantity || !batchForm.harvestDate || !batchForm.expiryDate) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      await InventoryService.createBatch(selectedProduct.id, {
        quantity: parseInt(batchForm.quantity),
        harvestDate: batchForm.harvestDate,
        expiryDate: batchForm.expiryDate,
        cost: parseFloat(batchForm.cost) || 0,
        notes: batchForm.notes,
        status: 'available'
      });

      toast({
        title: "Success",
        description: "Batch added successfully"
      });

      // Reset form and close modal
      setBatchForm({
        quantity: '',
        harvestDate: '',
        expiryDate: '',
        cost: '',
        notes: ''
      });
      setShowBatchModal(false);
      setSelectedProduct(null);
      
      // Reload data
      loadInventoryData();
    } catch (error) {
      console.error('Error adding batch:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add batch",
        variant: "destructive"
      });
    }
  };

  // Handle updating inventory settings
  const handleUpdateSettings = async () => {
    try {
      if (!selectedProduct) return;

      await InventoryService.updateInventorySettings(selectedProduct.id, {
        lowStockThreshold: parseInt(settingsForm.lowStockThreshold),
        hideWhenOutOfStock: settingsForm.hideWhenOutOfStock,
        allowBackorders: settingsForm.allowBackorders
      });

      toast({
        title: "Success",
        description: "Inventory settings updated"
      });

      setShowSettingsModal(false);
      setSelectedProduct(null);
      loadInventoryData();
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive"
      });
    }
  };

  // Open batch modal
  const openBatchModal = (product) => {
    setSelectedProduct(product);
    setShowBatchModal(true);
  };

  // Open settings modal
  const openSettingsModal = (product) => {
    setSelectedProduct(product);
    setSettingsForm({
      lowStockThreshold: product.inventory?.lowStockThreshold?.toString() || '10',
      hideWhenOutOfStock: product.autoManagement?.hideWhenOutOfStock || false,
      allowBackorders: product.autoManagement?.allowBackorders || false
    });
    setShowSettingsModal(true);
  };

  // Get stock status
  const getStockStatus = (product) => {
    const available = product.inventory?.availableStock || 0;
    const threshold = product.inventory?.lowStockThreshold || 10;
    
    if (available === 0) return { status: 'out', color: 'destructive', label: 'Out of Stock' };
    if (available <= threshold) return { status: 'low', color: 'warning', label: 'Low Stock' };
    return { status: 'good', color: 'success', label: 'In Stock' };
  };

  // Get stock percentage for progress bar
  const getStockPercentage = (product) => {
    const available = product.inventory?.availableStock || 0;
    const total = product.inventory?.totalStock || 0;
    return total > 0 ? (available / total) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <Button onClick={() => window.location.href = '/products/add'}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{inventoryData.statistics.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">€{inventoryData.totalValue?.toFixed(2) || '0.00'}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-orange-600">
                  {inventoryData.statistics.lowStockCount}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {inventoryData.statistics.outOfStockCount}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">All Products</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Low Stock Alerts */}
          {inventoryData.lowStockProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                  Stock Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inventoryData.lowStockProducts.slice(0, 5).map((product) => {
                    const stockStatus = getStockStatus(product);
                    return (
                      <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{product.name}</h3>
                            <Badge variant={stockStatus.color}>{stockStatus.label}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {product.inventory?.availableStock || 0} {product.inventory?.unit || 'units'} remaining
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openBatchModal(product)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Restock
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inventory Value Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Value Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(inventoryData.breakdown || []).slice(0, 8).map((item) => (
                  <div key={item.productId} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.unit} @ €{item.averageCost?.toFixed(2)}/unit
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">€{item.value?.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>All Products</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(inventoryData.breakdown || []).map((product) => {
                    const stockStatus = getStockStatus(product);
                    const stockPercentage = getStockPercentage(product);
                    
                    return (
                      <TableRow key={product.productId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600">{product.unit}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-24">
                            <Progress value={stockPercentage} className="h-2" />
                            <p className="text-xs text-gray-600 mt-1">
                              {stockPercentage.toFixed(0)}%
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell>0</TableCell>
                        <TableCell>€{product.value?.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.color}>{stockStatus.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openBatchModal(product)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openSettingsModal(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.location.href = `/products/${product.productId}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryData.lowStockProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <div key={product.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium">{product.name}</h3>
                            <Badge variant={stockStatus.color}>{stockStatus.label}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Current stock: {product.inventory?.availableStock || 0} {product.inventory?.unit || 'units'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Threshold: {product.inventory?.lowStockThreshold || 10} {product.inventory?.unit || 'units'}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openBatchModal(product)}
                          >
                            Restock
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openSettingsModal(product)}
                          >
                            Settings
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {inventoryData.lowStockProducts.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No stock alerts at the moment</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Products</span>
                  <span className="font-medium">{inventoryData.statistics.totalProducts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Inventory Value</span>
                  <span className="font-medium">€{inventoryData.totalValue?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Products in Stock</span>
                  <span className="font-medium text-green-600">
                    {inventoryData.statistics.totalProducts - inventoryData.statistics.outOfStockCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Low Stock Alerts</span>
                  <span className="font-medium text-orange-600">
                    {inventoryData.statistics.lowStockCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Out of Stock</span>
                  <span className="font-medium text-red-600">
                    {inventoryData.statistics.outOfStockCount}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Value Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(inventoryData.breakdown || [])
                    .sort((a, b) => (b.value || 0) - (a.value || 0))
                    .slice(0, 5)
                    .map((product, index) => (
                      <div key={product.productId} className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-green-600">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-600">
                            {product.quantity} {product.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">€{product.value?.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Batch Modal */}
      <Dialog open={showBatchModal} onOpenChange={setShowBatchModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProduct && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="text-sm text-gray-600">
                  Current stock: {selectedProduct.inventory?.availableStock || 0} {selectedProduct.inventory?.unit || 'units'}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={batchForm.quantity}
                  onChange={(e) => setBatchForm(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="Enter quantity"
                />
              </div>
              <div>
                <Label htmlFor="cost">Cost per unit</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={batchForm.cost}
                  onChange={(e) => setBatchForm(prev => ({ ...prev, cost: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="harvestDate">Harvest Date *</Label>
                <Input
                  id="harvestDate"
                  type="date"
                  value={batchForm.harvestDate}
                  onChange={(e) => setBatchForm(prev => ({ ...prev, harvestDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="expiryDate">Expiry Date *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={batchForm.expiryDate}
                  onChange={(e) => setBatchForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={batchForm.notes}
                onChange={(e) => setBatchForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes about this batch"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBatchModal(false);
                  setSelectedProduct(null);
                  setBatchForm({ quantity: '', harvestDate: '', expiryDate: '', cost: '', notes: '' });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddBatch}>
                Add Batch
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Inventory Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProduct && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedProduct.name}</p>
              </div>
            )}
            
            <div>
              <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                value={settingsForm.lowStockThreshold}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
                placeholder="10"
              />
              <p className="text-xs text-gray-600 mt-1">
                You'll be notified when stock falls below this number
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hideWhenOutOfStock"
                  checked={settingsForm.hideWhenOutOfStock}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, hideWhenOutOfStock: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="hideWhenOutOfStock" className="text-sm">
                  Hide product when out of stock
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allowBackorders"
                  checked={settingsForm.allowBackorders}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, allowBackorders: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="allowBackorders" className="text-sm">
                  Allow customers to order when out of stock
                </Label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSettingsModal(false);
                  setSelectedProduct(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateSettings}>
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}