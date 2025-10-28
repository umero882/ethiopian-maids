import { ADMIN_DEVELOPMENT_MODE } from '@/config/admin.config';

// Import both hooks
import { useAdminAuth as useDevAdminAuth } from '@/contexts/AdminAuthContext.dev';
import { useAdminAuth as useProdAdminAuth } from '@/contexts/AdminAuthContext';

// Export the appropriate hook based on environment
export const useAdminAuth = ADMIN_DEVELOPMENT_MODE
  ? useDevAdminAuth
  : useProdAdminAuth;