import { useState, useCallback } from 'react';

// Simple toast state management
let toastId = 0;
const toastState = {
  toasts: [],
  listeners: new Set(),
};

const addToast = (toast) => {
  const id = ++toastId;
  const newToast = { id, ...toast };
  toastState.toasts.push(newToast);

  // Notify all listeners
  toastState.listeners.forEach((listener) => listener());

  // Auto remove after 5 seconds
  setTimeout(() => {
    removeToast(id);
  }, 5000);

  return id;
};

const removeToast = (id) => {
  const index = toastState.toasts.findIndex((toast) => toast.id === id);
  if (index > -1) {
    toastState.toasts.splice(index, 1);
    toastState.listeners.forEach((listener) => listener());
  }
};

// Toast function for direct usage
export const toast = ({ title, description, variant = 'default' }) => {
  addToast({
    title,
    description,
    variant,
  });
};

// Hook for components that need to listen to toast state
export const useToast = () => {
  const [, forceUpdate] = useState({});

  const refresh = useCallback(() => {
    forceUpdate({});
  }, []);

  // Subscribe to toast state changes
  useState(() => {
    toastState.listeners.add(refresh);
    return () => {
      toastState.listeners.delete(refresh);
    };
  });

  return {
    toast,
    toasts: toastState.toasts,
    dismiss: removeToast,
  };
};
