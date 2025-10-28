import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { initializePerformanceMonitoring } from '@/utils/performanceOptimizer';
import '@/lib/globalShims';

// Initialize performance monitoring
try {
  initializePerformanceMonitoring();
  if (import.meta.env.DEV) console.log('Performance monitoring initialized');
} catch (error) {
  console.error('Performance monitoring failed:', error);
}

if (import.meta.env.DEV) console.log('main.jsx is loading...');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
