/**
 * Legacy Supabase Client - Redirect to Database Client
 * This file redirects to the new database client for backward compatibility
 */

// Simply re-export from the new database client
export { supabase } from './databaseClient.js';

// Also export as default for compatibility
import { supabase } from './databaseClient.js';
export default supabase;
