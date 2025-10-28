/**
 * Mock Supabase Client for Testing
 * Re-exports the databaseClient mock
 */

// Import the database client mock
import { supabase, database } from './databaseClient.js';

// Export as named export
export { supabase };

// Export as default
export default database;
