// src/hooks/use-toast.js
import React, { useState, useCallback, useEffect } from 'react';

// Toast types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error', 
  WARNING: 'warning',
  INFO: 'info'
};

// Global toast state
let globalToasts = [];
let globalListeners = [];

// Add a listener for toast updates
const addListener = (listener) => {
  globalListeners.push(listener);
  return () => {
    globalListeners = globalListeners.filter(l => l !== listener);
  };
};

// Notify all listeners of toast changes
const notifyListeners = () => {
  globalListeners.forEach(listener => listener([...globalToasts]));
};

// Generate unique ID for toasts
const generateId = () => Math.random().toString(36).substr(2, 9);

// Add a toast to the global state
const addToast = (toast) => {
  const id = generateId();
  const newToast = {
    id,
    title: '',
    description: '',
    variant: TOAST_TYPES.INFO,
    duration: 5000,
    ...toast
  };
  
  globalToasts.push(newToast);
  
  // Use setTimeout to avoid updating during render
  setTimeout(() => {
    notifyListeners();
  }, 0);
  
  // Auto remove toast after duration
  if (newToast.duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, newToast.duration);
  }
  
  return id;
};

// Remove a toast from global state
const removeToast = (id) => {
  globalToasts = globalToasts.filter(toast => toast.id !== id);
  setTimeout(() => {
    notifyListeners();
  }, 0);
};

// Main useToast hook
export const useToast = () => {
  const [toasts, setToasts] = useState(globalToasts);
  
  // Subscribe to global toast changes
  useEffect(() => {
    const unsubscribe = addListener(setToasts);
    return unsubscribe;
  }, []);
  
  const toast = useCallback((options) => {
    if (typeof options === 'string') {
      return addToast({ description: options });
    }
    return addToast(options);
  }, []);
  
  const dismiss = useCallback((id) => {
    removeToast(id);
  }, []);
  
  return {
    toast,
    dismiss,
    toasts
  };
};