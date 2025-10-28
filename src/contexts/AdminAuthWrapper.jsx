import { ADMIN_DEVELOPMENT_MODE } from '@/config/admin.config';

// Import both contexts and hooks
import {
  AdminAuthProvider as DevAdminAuthProvider,
  useAdminAuth as useDevAdminAuth
} from '@/contexts/AdminAuthContext.dev';
import {
  AdminAuthProvider as ProdAdminAuthProvider,
  useAdminAuth as useProdAdminAuth
} from '@/contexts/AdminAuthContext';

// Export the appropriate provider and hook based on environment
export const AdminAuthProvider = ADMIN_DEVELOPMENT_MODE
  ? DevAdminAuthProvider
  : ProdAdminAuthProvider;

export const useAdminAuth = ADMIN_DEVELOPMENT_MODE
  ? useDevAdminAuth
  : useProdAdminAuth;