import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AgencyDashboardService } from '@/services/agencyDashboardService';
import { createLogger } from '@/utils/logger';

// Import use-cases from application layer
import { GetAgencyKPIs, GetAgencyAlerts, GetPipelineFunnel, GetTasksSLA } from '@ethio-maids/app-dashboard-agency';

// Import adapters from infrastructure layer
import { SupabaseAgencyRepository, SupabaseAuditLogger } from '@ethio-maids/infra-dashboard-agency';

// Import Supabase client
import { supabase } from '@/lib/databaseClient';

const log = createLogger('useAgencyDashboard');

export const useAgencyDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [pipelineFunnel, setPipelineFunnel] = useState({});
  const [timeToHireTrend, setTimeToHireTrend] = useState({});
  const [tasksSLA, setTasksSLA] = useState({});
  const [error, setError] = useState(null);

  const agencyId = user?.id;

  // Initialize adapters and use-cases (memoized to prevent recreating on every render)
  const dependencies = useMemo(() => {
    const agencyRepository = new SupabaseAgencyRepository({
      supabaseClient: supabase,
      logger: log
    });

    const auditLogger = new SupabaseAuditLogger({
      supabaseClient: supabase,
      logger: log,
      enabled: true
    });

    return {
      agencyRepository,
      auditLogger,
      getAgencyKPIsUseCase: new GetAgencyKPIs({ agencyRepository, auditLogger }),
      getAgencyAlertsUseCase: new GetAgencyAlerts({ agencyRepository, auditLogger }),
      getPipelineFunnelUseCase: new GetPipelineFunnel({ agencyRepository, auditLogger }),
      getTasksSLAUseCase: new GetTasksSLA({ agencyRepository, auditLogger })
    };
  }, []); // Empty dependency array - these are stateless services

  const loadDashboardData = useCallback(async () => {
    if (!agencyId) return;

    try {
      setLoading(true);
      setError(null);

      // Use new use-cases following Clean Architecture and CQRS pattern
      const [
        kpisData,
        alertsData,
        pipelineData,
        timeToHireData,
        tasksData
      ] = await Promise.all([
        // Use GetAgencyKPIs use-case with CQRS pattern
        dependencies.getAgencyKPIsUseCase.execute({
          agencyId,
          userId: user?.id
        }),
        // Use GetAgencyAlerts use-case with CQRS pattern
        dependencies.getAgencyAlertsUseCase.execute({
          agencyId,
          userId: user?.id
        }),
        // Use GetPipelineFunnel use-case with CQRS pattern
        dependencies.getPipelineFunnelUseCase.execute({
          agencyId,
          userId: user?.id,
          dateRange: 30
        }),
        // TODO: Migrate GetTimeToHireTrend to use-case (Time to hire is calculated differently)
        AgencyDashboardService.getTimeToHireTrend(agencyId),
        // Use GetTasksSLA use-case with CQRS pattern
        dependencies.getTasksSLAUseCase.execute({
          agencyId,
          userId: user?.id
        })
      ]);

      setKpis(kpisData);
      setAlerts(alertsData);
      setPipelineFunnel(pipelineData);
      setTimeToHireTrend(timeToHireData);
      setTasksSLA(tasksData);

    } catch (err) {
      log.error('Error loading dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [agencyId, user?.id, dependencies]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const refreshKPIs = useCallback(async () => {
    if (!agencyId) return;

    try {
      // NEW: Use GetAgencyKPIs use-case
      const kpisData = await dependencies.getAgencyKPIsUseCase.execute({
        agencyId,
        userId: user?.id
      });
      setKpis(kpisData);
    } catch (err) {
      log.error('Error refreshing KPIs:', err);
    }
  }, [agencyId, user?.id, dependencies]);

  const refreshAlerts = useCallback(async () => {
    if (!agencyId) return;

    try {
      // NEW: Use GetAgencyAlerts use-case
      const alertsData = await dependencies.getAgencyAlertsUseCase.execute({
        agencyId,
        userId: user?.id
      });
      setAlerts(alertsData);
    } catch (err) {
      log.error('Error refreshing alerts:', err);
    }
  }, [agencyId, user?.id, dependencies]);

  const logAuditEvent = useCallback(async (action, entityType, entityId, details = {}) => {
    if (!agencyId || !user) return;

    try {
      // NEW: Use SupabaseAuditLogger adapter directly
      await dependencies.auditLogger.log({
        agencyId,
        userId: user.id,
        action,
        entityType,
        entityId,
        details,
        timestamp: new Date()
      });
    } catch (err) {
      log.error('Error logging audit event:', err);
    }
  }, [agencyId, user, dependencies]);

  return {
    // Data
    kpis,
    alerts,
    pipelineFunnel,
    timeToHireTrend,
    tasksSLA,

    // State
    loading,
    error,

    // Actions
    refreshData: loadDashboardData,
    refreshKPIs,
    refreshAlerts,
    logAuditEvent
  };
};

export const useMaidsManagement = (filters = {}) => {
  const { user } = useAuth();
  const [maids, setMaids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0
  });

  const agencyId = user?.id;

  const loadMaids = useCallback(async (newFilters = filters) => {
    if (!agencyId) return;

    try {
      setLoading(true);
      setError(null);

      const maidsData = await AgencyDashboardService.getMaidsWithFilters(agencyId, newFilters);
      setMaids(maidsData);
      setPagination(prev => ({
        ...prev,
        total: maidsData.length
      }));

    } catch (err) {
      log.error('Error loading maids:', err);
      setError(err.message);
      setMaids([]);
    } finally {
      setLoading(false);
    }
  }, [agencyId, filters]);

  useEffect(() => {
    loadMaids();
  }, [loadMaids]);

  const publishMaid = useCallback(async (maidId) => {
    // Implementation for publishing maid
    // Updates maid status and logs audit event
  }, [agencyId]);

  const hideMaid = useCallback(async (maidId) => {
    // Implementation for hiding maid
    // Updates maid status and logs audit event
  }, [agencyId]);

  const requestDocuments = useCallback(async (maidId, documentTypes) => {
    // Implementation for requesting documents
    // Creates document requests and logs audit event
  }, [agencyId]);

  const scheduleInterview = useCallback(async (maidId, interviewDetails) => {
    // Implementation for scheduling interview
    // Creates interview record and logs audit event
  }, [agencyId]);

  const addToShortlist = useCallback(async (maidId, shortlistId) => {
    // Implementation for adding to shortlist
    // Updates shortlist and logs audit event
  }, [agencyId]);

  const exportMaids = useCallback(async (selectedMaids = []) => {
    // Implementation for exporting maids data
    // Generates CSV/Excel export with audit logging
  }, []);

  return {
    // Data
    maids,
    pagination,

    // State
    loading,
    error,

    // Actions
    loadMaids,
    publishMaid,
    hideMaid,
    requestDocuments,
    scheduleInterview,
    addToShortlist,
    exportMaids
  };
};