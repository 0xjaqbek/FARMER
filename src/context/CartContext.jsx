// Fixed CartContext.jsx - Ensure proper farmer data storage

import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const { toast } = useToast();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('farmDirectCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log('Loaded cart from localStorage:', parsedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        setCartItems([]);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    console.log('Saving cart to localStorage:', cartItems);
    localStorage.setItem('farmDirectCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Calculate cart count and total
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Add item to cart - FIXED: Ensure all farmer data is preserved
  const addToCart = (product, quantity = 1) => {
    console.log('Adding product to cart:', product);
    console.log('Quantity:', quantity);
    
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        // Update quantity if item already exists
        toast({
          title: 'Updated cart',
          description: `Updated ${product.name} quantity in your cart`,
        });
        
        return prevItems.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item - FIXED: Include all necessary farmer fields
        const cartItem = {
          id: product.id,
          name: product.name,
          price: product.price,
          unit: product.unit || 'piece',
          image: product.images?.[0] || null,
          
          // FIXED: Try multiple possible field names and ensure we have farmer info
          rolnikId: product.rolnikId || product.farmerId || product.userId,
          rolnikName: product.rolnikName || product.farmerName || product.userName || 'Unknown Farmer',
          
          // Backup fields for compatibility
          farmerId: product.rolnikId || product.farmerId || product.userId,
          farmerName: product.rolnikName || product.farmerName || product.userName || 'Unknown Farmer',
          
          quantity
        };
        
        console.log('Created cart item:', cartItem);
        
        // Validate that we have farmer information
        if (!cartItem.rolnikId && !cartItem.farmerId) {
          console.error('Missing farmer ID in product:', product);
          toast({
            title: 'Error',
            description: 'Unable to add product: missing farmer information',
            variant: 'destructive'
          });
          return prevItems; // Don't add the item
        }
        
        toast({
          title: 'Added to cart',
          description: `${product.name} added to your cart`,
        });
        
        return [...prevItems, cartItem];
      }
    });
  };

  // Update item quantity
  const updateCartItemQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCartItems(prevItems => {
      const itemToRemove = prevItems.find(item => item.id === productId);
      if (itemToRemove) {
        toast({
          title: 'Removed from cart',
          description: `${itemToRemove.name} removed from your cart`,
        });
      }
      
      return prevItems.filter(item => item.id !== productId);
    });
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
    toast({
      title: 'Cart cleared',
      description: 'All items have been removed from your cart',
    });
  };

  // Debug function to log cart state
  const debugCart = () => {
    console.log('Current cart state:');
    console.log('Items:', cartItems);
    console.log('Count:', cartCount);
    console.log('Total:', cartTotal);
  };

  const value = {
    cartItems,
    cartCount,
    cartTotal,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    debugCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};