/**
 * SupabaseAgencyRepository - Infrastructure Adapter
 *
 * Implements AgencyDashboardRepository port using Supabase as the data source.
 * This adapter contains all Supabase-specific query logic.
 *
 * @implements {AgencyDashboardRepository}
 */

import { AgencyDashboardRepository } from '@ethio-maids/app-dashboard-agency';

export class SupabaseAgencyRepository extends AgencyDashboardRepository {
  /**
   * @param {Object} dependencies
   * @param {SupabaseClient} dependencies.supabaseClient - Supabase client instance
   * @param {Object} [dependencies.logger] - Optional logger for debugging
   */
  constructor({ supabaseClient, logger = console }) {
    super();

    if (!supabaseClient) {
      throw new Error('supabaseClient is required');
    }

    this.supabase = supabaseClient;
    this.logger = logger;
  }

  /**
   * Fetch KPI data for an agency
   * @param {string} agencyId
   * @returns {Promise<Object>} Raw KPI data for domain entity
   */
  async getKPIs(agencyId) {
    try {
      // Use Promise.allSettled for resilience - partial data better than complete failure
      const results = await Promise.allSettled([
        this._getActiveMaidsCount(agencyId),
        this._getJobsLiveCount(agencyId),
        this._getNewApplicantsTodayCount(agencyId),
        this._getInterviewsScheduledCount(agencyId),
        this._getHiresThisMonthCount(agencyId),
        this._getSubscriptionStatus(agencyId),
        this._getOverdueDocumentsCount(agencyId),
        this._getOpenDisputesCount(agencyId)
      ]);

      // Extract values with fallbacks
      return {
        activeMaids: results[0].status === 'fulfilled' ? results[0].value : 0,
        jobsLive: results[1].status === 'fulfilled' ? results[1].value : 0,
        newApplicantsToday: results[2].status === 'fulfilled' ? results[2].value : 0,
        interviewsScheduled: results[3].status === 'fulfilled' ? results[3].value : 0,
        hiresThisMonth: results[4].status === 'fulfilled' ? results[4].value : 0,
        subscriptionStatus: results[5].status === 'fulfilled'
          ? results[5].value
          : { status: 'active', plan_type: 'free' },
        overdueDocuments: results[6].status === 'fulfilled' ? results[6].value : 0,
        openDisputes: results[7].status === 'fulfilled' ? results[7].value : 0
      };
    } catch (error) {
      this.logger.error('[SupabaseAgencyRepository] Error fetching KPIs:', error);
      throw new Error(`Database error fetching KPIs: ${error.message}`);
    }
  }

  /**
   * Fetch alert data for an agency
   * @param {string} agencyId
   * @returns {Promise<Array<Object>>} Array of raw alert data
   */
  async getAlerts(agencyId) {
    try {
      const alerts = [];

      // Failed payments
      const { data: failedPayments } = await this.supabase
        .from('agency_payment_failures')
        .select('*')
        .eq('agency_id', agencyId)
        .eq('resolved', false);

      if (failedPayments?.length > 0) {
        alerts.push({
          type: 'payment_failed',
          level: 'critical',
          message: `${failedPayments.length} payment(s) failed`,
          count: failedPayments.length,
          link: '/dashboard/agency/billing',
          metadata: { payments: failedPayments }
        });
      }

      // Get maid profiles for agency
      const { data: maidProfiles } = await this.supabase
        .from('maid_profiles')
        .select('id')
        .eq('agency_id', agencyId);

      const maidIds = maidProfiles?.map(profile => profile.id) || [];

      // Expiring documents (30, 60, 90 days)
      const expiryThresholds = [30, 60, 90];
      for (const days of expiryThresholds) {
        if (maidIds.length > 0) {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + days);

          const { count } = await this.supabase
            .from('maid_documents')
            .select('*', { count: 'exact', head: true })
            .in('maid_id', maidIds)
            .lt('expiry_date', futureDate.toISOString())
            .gt('expiry_date', new Date().toISOString());

          if (count > 0) {
            alerts.push({
              type: 'documents_expiring',
              level: days <= 30 ? 'critical' : days <= 60 ? 'warning' : 'info',
              message: `${count} document(s) expiring in ${days} days`,
              count,
              days,
              link: '/dashboard/agency/documents',
              metadata: { threshold: days }
            });
          }
        }
      }

      // Paused listings
      const { count: pausedJobs } = await this.supabase
        .from('agency_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId)
        .eq('status', 'paused');

      if (pausedJobs > 0) {
        alerts.push({
          type: 'paused_listings',
          level: 'warning',
          message: `${pausedJobs} job listing(s) paused`,
          count: pausedJobs,
          link: '/dashboard/agency/jobs',
          metadata: {}
        });
      }

      // Subscription expiring (7 days warning)
      const { data: subscription } = await this.supabase
        .from('agency_subscriptions')
        .select('expires_at, plan_type')
        .eq('agency_id', agencyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscription?.expires_at) {
        const expiryDate = new Date(subscription.expires_at);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
          alerts.push({
            type: 'subscription_expiring',
            level: 'warning',
            message: `Subscription expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}`,
            count: 1,
            days: daysUntilExpiry,
            link: '/dashboard/agency/billing',
            metadata: { plan_type: subscription.plan_type }
          });
        }
      }

      return alerts;
    } catch (error) {
      this.logger.error('[SupabaseAgencyRepository] Error fetching alerts:', error);
      throw new Error(`Database error fetching alerts: ${error.message}`);
    }
  }

  /**
   * Fetch pipeline funnel data
   * @param {string} agencyId
   * @param {number} dateRange - Days to look back
   * @returns {Promise<Object>} Pipeline funnel metrics
   */
  async getPipelineFunnel(agencyId, dateRange = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      // Get profiles count
      const { count: profiles } = await this.supabase
        .from('maid_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId)
        .gte('created_at', startDate.toISOString());

      // Get agency jobs first to use in subqueries
      const { data: agencyJobs } = await this.supabase
        .from('agency_jobs')
        .select('id')
        .eq('agency_id', agencyId);

      const jobIds = agencyJobs?.map(job => job.id) || [];

      // Get applications count
      let applied = 0;
      if (jobIds.length > 0) {
        const { count: appliedCount } = await this.supabase
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .in('job_id', jobIds)
          .gte('created_at', startDate.toISOString());
        applied = appliedCount || 0;
      }

      // Get interviews count
      const { count: interviewed } = await this.supabase
        .from('agency_interviews')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId)
        .gte('created_at', startDate.toISOString());

      // Get offers count
      let offered = 0;
      if (jobIds.length > 0) {
        const { count: offeredCount } = await this.supabase
          .from('job_offers')
          .select('*', { count: 'exact', head: true })
          .in('job_id', jobIds)
          .gte('created_at', startDate.toISOString());
        offered = offeredCount || 0;
      }

      // Get hires count
      const { count: hired } = await this.supabase
        .from('agency_placements')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId)
        .eq('status', 'hired')
        .gte('placement_date', startDate.toISOString());

      return {
        profiles: profiles || 0,
        applied,
        interviewed: interviewed || 0,
        offered,
        hired: hired || 0
      };
    } catch (error) {
      this.logger.error('[SupabaseAgencyRepository] Error fetching pipeline funnel:', error);
      throw new Error(`Database error fetching pipeline funnel: ${error.message}`);
    }
  }

  /**
   * Fetch time to hire trend data
   * @param {string} agencyId
   * @param {Array<string>} periods - Array of period strings like ['7d', '30d', '90d']
   * @returns {Promise<Object>} Map of period to average days
   */
  async getTimeToHireTrend(agencyId, periods = ['7d', '30d', '90d']) {
    const results = {};

    try {
      for (const period of periods) {
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Calculate average time to hire for this period
        const { data: placements } = await this.supabase
          .from('agency_placements')
          .select('placement_date, application_date')
          .eq('agency_id', agencyId)
          .eq('status', 'hired')
          .gte('placement_date', startDate.toISOString());

        let avgDays = 0;
        if (placements && placements.length > 0) {
          const totalDays = placements.reduce((sum, placement) => {
            const placementDate = new Date(placement.placement_date);
            const applicationDate = new Date(placement.application_date);
            const diffTime = Math.abs(placementDate - applicationDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return sum + diffDays;
          }, 0);
          avgDays = Math.round(totalDays / placements.length);
        }

        results[period] = avgDays;
      }

      return results;
    } catch (error) {
      this.logger.error('[SupabaseAgencyRepository] Error fetching time to hire trend:', error);
      throw new Error(`Database error fetching time to hire trend: ${error.message}`);
    }
  }

  /**
   * Fetch tasks with SLA information
   * @param {string} agencyId
   * @returns {Promise<Object>} Tasks grouped by timing (today, overdue, upcoming)
   */
  async getTasksSLA(agencyId) {
    try {
      const { data: tasks } = await this.supabase
        .from('agency_tasks')
        .select(`
          *,
          assignee:profiles!agency_tasks_assignee_id_fkey(name, email)
        `)
        .eq('agency_id', agencyId)
        .in('status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true });

      const today = new Date().toISOString().split('T')[0];

      return {
        today: tasks?.filter(t => t.due_date === today) || [],
        overdue: tasks?.filter(t => t.due_date < today) || [],
        upcoming: tasks?.filter(t => t.due_date > today) || []
      };
    } catch (error) {
      this.logger.error('[SupabaseAgencyRepository] Error fetching tasks SLA:', error);
      throw new Error(`Database error fetching tasks SLA: ${error.message}`);
    }
  }

  /**
   * Fetch subscription status
   * @param {string} agencyId
   * @returns {Promise<Object>} Subscription details
   */
  async getSubscriptionStatus(agencyId) {
    try {
      return await this._getSubscriptionStatus(agencyId);
    } catch (error) {
      this.logger.error('[SupabaseAgencyRepository] Error fetching subscription status:', error);
      throw new Error(`Database error fetching subscription status: ${error.message}`);
    }
  }

  // ========== Private Helper Methods ==========

  async _getActiveMaidsCount(agencyId) {
    const { count } = await this.supabase
      .from('maid_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('availability_status', 'available');

    return count || 0;
  }

  async _getJobsLiveCount(agencyId) {
    const { count } = await this.supabase
      .from('agency_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('status', 'active');

    return count || 0;
  }

  async _getNewApplicantsTodayCount(agencyId) {
    const today = new Date().toISOString().split('T')[0];

    const { count } = await this.supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)
      .in(
        'job_id',
        this.supabase
          .from('agency_jobs')
          .select('id')
          .eq('agency_id', agencyId)
      );

    return count || 0;
  }

  async _getInterviewsScheduledCount(agencyId) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { count } = await this.supabase
      .from('agency_interviews')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .gte('scheduled_date', new Date().toISOString())
      .lte('scheduled_date', tomorrow.toISOString())
      .eq('status', 'scheduled');

    return count || 0;
  }

  async _getHiresThisMonthCount(agencyId) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await this.supabase
      .from('agency_placements')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('status', 'hired')
      .gte('placement_date', startOfMonth.toISOString());

    return count || 0;
  }

  async _getSubscriptionStatus(agencyId) {
    // First, try to get subscription from the subscriptions table (used by Stripe webhook)
    const { data: subscription, error: subError } = await this.supabase
      .from('subscriptions')
      .select('status, plan_type, end_date, stripe_subscription_id')
      .eq('user_id', agencyId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscription) {
      return {
        status: subscription.status,
        plan_type: subscription.plan_type,
        expires_at: subscription.end_date,
        payment_status: 'paid'
      };
    }

    // Fallback to agency_subscriptions table for backward compatibility
    const { data, error } = await this.supabase
      .from('agency_subscriptions')
      .select('status, plan_type, expires_at, payment_status')
      .eq('agency_id', agencyId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // If no active subscription found in either table, return free plan
    if (error && error.code !== 'PGRST116') {
      this.logger.error('[SupabaseAgencyRepository] Error fetching subscription:', error);
    }

    return data || { status: 'active', plan_type: 'free' };
  }

  async _getOverdueDocumentsCount(agencyId) {
    const { count } = await this.supabase
      .from('agency_document_requirements')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .lt('due_date', new Date().toISOString())
      .eq('status', 'pending');

    return count || 0;
  }

  async _getOpenDisputesCount(agencyId) {
    const { count } = await this.supabase
      .from('agency_disputes')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .in('status', ['open', 'under_review']);

    return count || 0;
  }
}
