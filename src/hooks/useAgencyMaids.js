/**
 * useAgencyMaids Hook
 *
 * Custom hook for managing agency maids using Clean Architecture use-cases.
 * Provides CRUD operations, filtering, sorting, and pagination for maids.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createLogger } from '@/utils/logger';

// Import use-cases from application layer
import {
  GetAgencyMaids,
  GetMaidDetails,
  DeleteMaid,
  BulkUploadMaids
} from '@ethio-maids/app-profiles-agency';

// Import adapters from infrastructure layer
import {
  SupabaseMaidProfileRepository,
  SupabaseAuditLogger
} from '@ethio-maids/infra-profiles-agency';

// Import Supabase client
import { supabase } from '@/lib/databaseClient';

const log = createLogger('useAgencyMaids');

export const useAgencyMaids = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [maids, setMaids] = useState([]);
  const [selectedMaid, setSelectedMaid] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const agencyId = user?.id;

  // Initialize dependencies (memoized)
  const dependencies = useMemo(() => {
    const maidProfileRepository = new SupabaseMaidProfileRepository(supabase);
    const auditLogger = new SupabaseAuditLogger(supabase);

    return {
      maidProfileRepository,
      auditLogger,
      getAgencyMaidsUseCase: new GetAgencyMaids({
        maidProfileRepository,
        auditLogger
      }),
      getMaidDetailsUseCase: new GetMaidDetails({
        maidProfileRepository,
        auditLogger
      }),
      deleteMaidUseCase: new DeleteMaid({
        maidProfileRepository,
        auditLogger
      }),
      bulkUploadMaidsUseCase: new BulkUploadMaids({
        maidProfileRepository,
        auditLogger
      })
    };
  }, []);

  /**
   * Load maids with current filters and pagination
   */
  const loadMaids = useCallback(async (page = pagination.page, newFilters = filters) => {
    if (!agencyId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await dependencies.getAgencyMaidsUseCase.execute({
        agencyId,
        userId: user?.id,
        filters: newFilters,
        sortBy,
        sortOrder,
        page,
        limit: pagination.limit
      });

      setMaids(result.maids);
      setPagination({
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage
      });

      log.info('Loaded maids:', { count: result.maids.length, total: result.total });

    } catch (err) {
      log.error('Error loading maids:', err);
      setError(err.message);
      setMaids([]);
    } finally {
      setLoading(false);
    }
  }, [agencyId, user?.id, dependencies.getAgencyMaidsUseCase, sortBy, sortOrder, pagination.limit, filters, pagination.page]);

  /**
   * Load detailed information for a specific maid
   */
  const loadMaidDetails = useCallback(async (maidId, options = {}) => {
    if (!agencyId || !maidId) return null;

    try {
      setLoading(true);
      setError(null);

      const result = await dependencies.getMaidDetailsUseCase.execute({
        maidId,
        agencyId,
        userId: user?.id,
        includeDocuments: options.includeDocuments !== false,
        includeApplications: options.includeApplications !== false,
        includeMetrics: options.includeMetrics !== false
      });

      setSelectedMaid(result);
      log.info('Loaded maid details:', { maidId });

      return result;

    } catch (err) {
      log.error('Error loading maid details:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [agencyId, user?.id, dependencies.getMaidDetailsUseCase]);

  /**
   * Delete or archive a maid
   */
  const deleteMaid = useCallback(async (maidId, reason = null, hardDelete = false) => {
    if (!agencyId || !maidId) return false;

    try {
      setLoading(true);
      setError(null);

      const result = await dependencies.deleteMaidUseCase.execute({
        maidId,
        agencyId,
        userId: user?.id,
        reason,
        hardDelete
      });

      if (result.success) {
        log.info('Maid deleted successfully:', { maidId, hardDelete });
        // Reload the maids list
        await loadMaids();
        return true;
      }

      return false;

    } catch (err) {
      log.error('Error deleting maid:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [agencyId, user?.id, dependencies.deleteMaidUseCase, loadMaids]);

  /**
   * Bulk upload maids
   */
  const bulkUploadMaids = useCallback(async (maidsData, validateOnly = false) => {
    if (!agencyId || !maidsData || maidsData.length === 0) {
      throw new Error('Invalid maids data');
    }

    try {
      setLoading(true);
      setError(null);

      const result = await dependencies.bulkUploadMaidsUseCase.execute({
        agencyId,
        userId: user?.id,
        maidsData,
        validateOnly
      });

      log.info('Bulk upload completed:', {
        total: result.summary.total,
        succeeded: result.summary.succeeded,
        failed: result.summary.failed
      });

      // If not validation-only, reload the maids list
      if (!validateOnly && result.summary.succeeded > 0) {
        await loadMaids();
      }

      return result;

    } catch (err) {
      log.error('Error during bulk upload:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [agencyId, user?.id, dependencies.bulkUploadMaidsUseCase, loadMaids]);

  /**
   * Update filters and reload maids
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    loadMaids(1, newFilters);
  }, [loadMaids]);

  /**
   * Update sort and reload maids
   */
  const updateSort = useCallback((field, order) => {
    setSortBy(field);
    setSortOrder(order);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    // loadMaids will be triggered by useEffect
  }, []);

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      loadMaids(pagination.page + 1);
    }
  }, [pagination.hasNextPage, pagination.page, loadMaids]);

  /**
   * Go to previous page
   */
  const prevPage = useCallback(() => {
    if (pagination.hasPrevPage) {
      loadMaids(pagination.page - 1);
    }
  }, [pagination.hasPrevPage, pagination.page, loadMaids]);

  /**
   * Go to specific page
   */
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadMaids(page);
    }
  }, [pagination.totalPages, loadMaids]);

  /**
   * Refresh/reload current view
   */
  const refresh = useCallback(() => {
    loadMaids();
  }, [loadMaids]);

  // Load maids on mount and when sort changes
  useEffect(() => {
    loadMaids();
  }, [sortBy, sortOrder]); // Only reload when sort changes, not on every render

  return {
    // State
    maids,
    selectedMaid,
    loading,
    error,
    filters,
    sortBy,
    sortOrder,
    pagination,

    // Actions
    loadMaids,
    loadMaidDetails,
    deleteMaid,
    bulkUploadMaids,
    updateFilters,
    updateSort,
    refresh,

    // Pagination actions
    nextPage,
    prevPage,
    goToPage,

    // Utilities
    clearError: () => setError(null),
    clearSelectedMaid: () => setSelectedMaid(null)
  };
};
