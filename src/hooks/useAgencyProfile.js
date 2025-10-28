/**
 * useAgencyProfile Hook
 *
 * Custom hook for managing agency profile using Clean Architecture use-cases.
 * Provides profile retrieval and update operations.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createLogger } from '@/utils/logger';

// Import use-cases from application layer
import {
  GetAgencyProfile,
  UpdateAgencyProfile
} from '@ethio-maids/app-profiles-agency';

// Import adapters from infrastructure layer
import {
  SupabaseAgencyProfileRepository,
  SupabaseAuditLogger
} from '@ethio-maids/infra-profiles-agency';

// Import Supabase client
import { supabase } from '@/lib/databaseClient';

const log = createLogger('useAgencyProfile');

export const useAgencyProfile = () => {
  const { user, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  const agencyId = user?.id;

  // Initialize dependencies (memoized)
  const dependencies = useMemo(() => {
    const agencyProfileRepository = new SupabaseAgencyProfileRepository(supabase);
    const auditLogger = new SupabaseAuditLogger(supabase);

    return {
      agencyProfileRepository,
      auditLogger,
      getAgencyProfileUseCase: new GetAgencyProfile({
        agencyProfileRepository,
        auditLogger
      }),
      updateAgencyProfileUseCase: new UpdateAgencyProfile({
        agencyProfileRepository,
        auditLogger
      })
    };
  }, []);

  /**
   * Load agency profile with optional inclusions
   */
  const loadProfile = useCallback(async (options = {}) => {
    if (!agencyId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await dependencies.getAgencyProfileUseCase.execute({
        agencyId,
        userId: user?.id,
        includeDocuments: options.includeDocuments !== false,
        includeStatistics: options.includeStatistics !== false
      });

      setProfile(result);
      log.info('Loaded agency profile:', { agencyId });

      return result;

    } catch (err) {
      log.error('Error loading agency profile:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [agencyId, user?.id, dependencies.getAgencyProfileUseCase]);

  /**
   * Update agency profile
   */
  const updateProfile = useCallback(async (updates) => {
    if (!agencyId) {
      throw new Error('Agency ID is required');
    }

    try {
      setSaving(true);
      setError(null);

      const result = await dependencies.updateAgencyProfileUseCase.execute({
        agencyId,
        userId: user?.id,
        updates
      });

      setProfile(result);
      log.info('Updated agency profile successfully');

      // Refresh user profile in auth context if needed
      if (refreshUserProfile) {
        await refreshUserProfile();
      }

      return result;

    } catch (err) {
      log.error('Error updating agency profile:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [agencyId, user?.id, dependencies.updateAgencyProfileUseCase, refreshUserProfile]);

  /**
   * Update specific fields (convenience method)
   */
  const updateFields = useCallback(async (fields) => {
    return await updateProfile(fields);
  }, [updateProfile]);

  /**
   * Refresh profile
   */
  const refresh = useCallback(() => {
    return loadProfile();
  }, [loadProfile]);

  // Load profile on mount
  useEffect(() => {
    if (agencyId) {
      loadProfile();
    }
  }, [agencyId]); // Only reload when agencyId changes

  // Computed values
  const isProfileComplete = useMemo(() => {
    return profile?.completionPercentage >= 100;
  }, [profile?.completionPercentage]);

  const isLicenseExpiring = useMemo(() => {
    if (!profile?.licenseExpiry) return false;

    const expiryDate = new Date(profile.licenseExpiry);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    return daysUntilExpiry > 0 && daysUntilExpiry <= 30; // Expiring within 30 days
  }, [profile?.licenseExpiry]);

  const isLicenseExpired = useMemo(() => {
    if (!profile?.licenseExpiry) return false;

    const expiryDate = new Date(profile.licenseExpiry);
    const today = new Date();

    return expiryDate < today;
  }, [profile?.licenseExpiry]);

  return {
    // State
    profile,
    loading,
    saving,
    error,

    // Computed
    isProfileComplete,
    isLicenseExpiring,
    isLicenseExpired,

    // Actions
    loadProfile,
    updateProfile,
    updateFields,
    refresh,

    // Utilities
    clearError: () => setError(null)
  };
};
