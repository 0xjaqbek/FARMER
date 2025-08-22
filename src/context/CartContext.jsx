// src/context/CartContext.jsx - Fixed version without toast issues
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '../hooks/use-toast';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const { toast } = useToast(); 

  // Load cart from localStorage on component mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        console.log('Loading cart from localStorage:', parsedCart);
        setCartItems(parsedCart);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever cartItems changes
  useEffect(() => {
    try {
      console.log('Saving cart to localStorage:', cartItems);
      localStorage.setItem('cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cartItems]);

  // Calculate cart count
  const cartCount = cartItems.reduce((total, item) => total + (item.quantity || 0), 0);

  // Calculate cart total
  const cartTotal = cartItems.reduce((total, item) => {
    const price = item.price || 0;
    const quantity = item.quantity || 0;
    return total + (price * quantity);
  }, 0);

  // Add item to cart
  const addToCart = (product, quantity = 1) => {
    try {
      console.log('Adding to cart:', { product, quantity });
      
      if (!product || !product.id) {
        console.error('Invalid product provided to addToCart');
        return;
      }

      setCartItems(prevItems => {
        const existingItem = prevItems.find(item => item.id === product.id);
        
        if (existingItem) {
          // Update quantity of existing item
          const updatedItems = prevItems.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
          
          // Show notification after state update
          toast({
            title: "Cart Updated",
            description: `Updated ${product.name} quantity in cart`
          });
          
          return updatedItems;
        } else {
          // Add new item to cart
          const newItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images?.[0] || product.image || null,
            quantity: quantity,
            unit: product.unit || 'piece',
            farmerId: product.farmerId || product.rolnikId,
            farmerName: product.farmerName || product.rolnikName
          };
          
          // Show notification after state update
          toast({
            title: "Added to Cart",
            description: `${product.name} added to cart`
          });
          
          return [...prevItems, newItem];
        }
      });
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  // Update cart item quantity
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
      const updatedItems = prevItems.filter(item => item.id !== productId);
      
      if (itemToRemove) {
        toast({
          title: "Removed from Cart",
          description: `${itemToRemove.name} removed from cart`
        });
      }
      
      return updatedItems;
    });
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
    toast({
      title: "Cart Cleared",
      description: "All items removed from cart"
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