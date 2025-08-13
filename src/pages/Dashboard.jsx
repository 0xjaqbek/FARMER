// src/pages/Dashboard.jsx - Dashboard page

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOrdersByClient, getOrdersByRolnik } from '../firebase/orders';
import { getProductsByFarmer } from '../firebase/products';
import { getAllRolniks, findNearbyRolniks } from '../firebase/users';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, Package, Users, Activity, Loader2 } from 'lucide-react';
import OrderStatus from '@/components/orders/OrderStatus';

const Dashboard = () => {
  const { userProfile, currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [nearbyRolniks, setNearbyRolniks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile || !currentUser) return;
      
      try {
        setLoading(true);
        setError('');
        
        console.log('Dashboard fetchData - userProfile:', userProfile);
        console.log('Dashboard fetchData - currentUser:', currentUser);
        
        // Fetch data based on user role
        if (userProfile.role === 'klient') {
          try {
            // FIXED: Check if currentUser.uid exists before making query
            if (currentUser?.uid) {
              console.log('Fetching orders for client:', currentUser.uid);
              const clientOrders = await getOrdersByClient(currentUser.uid);
              setOrders(clientOrders);
            } else {
              console.warn('No currentUser.uid available for orders query');
              setOrders([]);
            }
          } catch (orderErr) {
            console.error('Error fetching client orders:', orderErr);
            setOrders([]);
          }
          
          try {
            // FIXED: Check if postalCode exists and is valid before querying
            if (userProfile?.postalCode && userProfile.postalCode.trim().length >= 2) {
              console.log('Fetching nearby rolniks for postal code:', userProfile.postalCode);
              const nearby = await findNearbyRolniks(userProfile.postalCode);
              setNearbyRolniks(nearby);
            } else {
              console.warn('No valid postalCode available for nearby rolniks query:', userProfile?.postalCode);
              // Fallback: get all rolniks if no postal code
              try {
                const allRolniks = await getAllRolniks();
                setNearbyRolniks(allRolniks.slice(0, 10)); // Limit to first 10
              } catch (fallbackErr) {
                console.error('Error getting fallback rolniks:', fallbackErr);
                setNearbyRolniks([]);
              }
            }
          } catch (rolnikErr) {
            console.error('Error fetching nearby rolniks:', rolnikErr);
            setNearbyRolniks([]);
          }
        } else if (userProfile.role === 'rolnik') {
          try {
            // FIXED: Check if userProfile.uid exists
            if (userProfile?.uid || currentUser?.uid) {
              const userId = userProfile.uid || currentUser.uid;
              console.log('Fetching orders for rolnik:', userId);
              const rolnikOrders = await getOrdersByRolnik(userId);
              setOrders(rolnikOrders);
            } else {
              console.warn('No user ID available for rolnik orders query');
              setOrders([]);
            }
          } catch (orderErr) {
            console.error('Error fetching rolnik orders:', orderErr);
            setOrders([]);
          }
          
          try {
            // FIXED: Check if userProfile.uid exists
            if (userProfile?.uid || currentUser?.uid) {
              const userId = userProfile.uid || currentUser.uid;
              console.log('Fetching products for rolnik:', userId);
              const rolnikProducts = await getProductsByFarmer(userId);
              setProducts(rolnikProducts);
            } else {
              console.warn('No user ID available for products query');
              setProducts([]);
            }
          } catch (productErr) {
            console.error('Error fetching rolnik products:', productErr);
            setProducts([]);
          }
        } else if (userProfile.role === 'admin') {
          try {
            // Fetch all rolniks for admin
            console.log('Fetching all rolniks for admin');
            const allRolniks = await getAllRolniks();
            setNearbyRolniks(allRolniks);
          } catch (adminErr) {
            console.error('Error fetching rolniks for admin:', adminErr);
            setNearbyRolniks([]);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load some dashboard data. Please refresh to try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile, currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Welcome, {userProfile?.firstName || 'User'}!</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {userProfile?.role === 'klient' && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Your Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ShoppingCart className="h-10 w-10 text-green-600 mr-4" />
                  <div>
                    <p className="text-3xl font-bold">{orders.length}</p>
                    <p className="text-gray-500">Total Orders</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link to="/orders">View All Orders</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Nearby Farmers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-10 w-10 text-green-600 mr-4" />
                  <div>
                    <p className="text-3xl font-bold">{nearbyRolniks.length}</p>
                    <p className="text-gray-500">Available</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link to="/browse">Browse Products</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {userProfile?.role === 'rolnik' && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Your Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Package className="h-10 w-10 text-green-600 mr-4" />
                  <div>
                    <p className="text-3xl font-bold">{products.length}</p>
                    <p className="text-gray-500">Listed</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link to="/products/manage">Manage Products</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Activity className="h-10 w-10 text-green-600 mr-4" />
                  <div>
                    <p className="text-3xl font-bold">{orders.length}</p>
                    <p className="text-gray-500">Total Orders</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link to="/orders">View All Orders</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Recent Activity Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.slice(0, 3).map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                        {(order.items?.[0]?.productImage || order.productImage) ? (
                          <img
                            src={order.items?.[0]?.productImage || order.productImage}
                            alt={order.items?.[0]?.productName || order.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {order.items?.[0]?.productName || order.productName || 'Unknown Product'}
                          {order.items && order.items.length > 1 && ` +${order.items.length - 1} more`}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {order.items?.[0]?.quantity || order.quantity || 0} {order.items?.[0]?.unit || order.unit || 'items'} - 
                          ${(order.totalPrice || 0).toFixed(2)}
                        </p>
                        <div className="flex items-center mt-1">
                          <OrderStatus status={order.status || 'pending'} size="badge" />
                          <span className="text-xs text-gray-500 ml-2">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Date unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/orders/${order.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <div className="text-center mt-4">
              <Button variant="outline" asChild>
                <Link to="/orders">View All Activity</Link>
              </Button>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500 mb-4">No recent activity found.</p>
              {userProfile?.role === 'klient' && (
                <Button asChild>
                  <Link to="/browse">Browse Products</Link>
                </Button>
              )}
              {userProfile?.role === 'rolnik' && (
                <Button asChild>
                  <Link to="/products/add">Add Your First Product</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;