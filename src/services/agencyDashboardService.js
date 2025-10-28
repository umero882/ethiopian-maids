import { supabase } from '@/lib/databaseClient';
import { createLogger } from '@/utils/logger';

const log = createLogger('AgencyDashboardService');

export class AgencyDashboardService {
  // KPI Calculations
  static async getAgencyKPIs(agencyId) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch KPIs');
      }

      // Fetch all KPIs with individual error handling
      const results = await Promise.allSettled([
        this.getActiveMaidsCount(agencyId),
        this.getJobsLiveCount(agencyId),
        this.getNewApplicantsTodayCount(agencyId),
        this.getInterviewsScheduledCount(agencyId),
        this.getHiresThisMonthCount(agencyId),
        this.getSubscriptionStatus(agencyId),
        this.getOverdueDocumentsCount(agencyId),
        this.getOpenDisputesCount(agencyId)
      ]);

      // Extract values with fallbacks for failed promises
      return {
        activeMaids: results[0].status === 'fulfilled' ? results[0].value : 0,
        jobsLive: results[1].status === 'fulfilled' ? results[1].value : 0,
        newApplicantsToday: results[2].status === 'fulfilled' ? results[2].value : 0,
        interviewsScheduled: results[3].status === 'fulfilled' ? results[3].value : 0,
        hiresThisMonth: results[4].status === 'fulfilled' ? results[4].value : 0,
        subscriptionStatus: results[5].status === 'fulfilled' ? results[5].value : { status: 'inactive', plan_type: 'basic' },
        overdueDocuments: results[6].status === 'fulfilled' ? results[6].value : 0,
        openDisputes: results[7].status === 'fulfilled' ? results[7].value : 0
      };
    } catch (error) {
      log.error('Error fetching agency KPIs:', error);
      throw new Error(`Failed to fetch agency KPIs: ${error.message}`);
    }
  }

  static async getActiveMaidsCount(agencyId) {
    const { count } = await supabase
      .from('maid_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('availability_status', 'available');

    return count || 0;
  }

  static async getJobsLiveCount(agencyId) {
    const { count } = await supabase
      .from('agency_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('status', 'active');

    return count || 0;
  }

  static async getNewApplicantsTodayCount(agencyId) {
    const today = new Date().toISOString().split('T')[0];

    const { count } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)
      .in(
        'job_id',
        supabase
          .from('agency_jobs')
          .select('id')
          .eq('agency_id', agencyId)
      );

    return count || 0;
  }

  static async getInterviewsScheduledCount(agencyId) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { count } = await supabase
      .from('agency_interviews')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .gte('scheduled_date', new Date().toISOString())
      .lte('scheduled_date', tomorrow.toISOString())
      .eq('status', 'scheduled');

    return count || 0;
  }

  static async getHiresThisMonthCount(agencyId) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('agency_placements')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('status', 'hired')
      .gte('placement_date', startOfMonth.toISOString());

    return count || 0;
  }

  static async getSubscriptionStatus(agencyId) {
    const { data } = await supabase
      .from('agency_subscriptions')
      .select('status, plan_type, expires_at, payment_status')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return data || { status: 'inactive', plan_type: 'basic' };
  }

  static async getOverdueDocumentsCount(agencyId) {
    const { count } = await supabase
      .from('agency_document_requirements')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .lt('due_date', new Date().toISOString())
      .eq('status', 'pending');

    return count || 0;
  }

  static async getOpenDisputesCount(agencyId) {
    const { count } = await supabase
      .from('agency_disputes')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .in('status', ['open', 'under_review']);

    return count || 0;
  }

  // Pipeline Analytics
  static async getPipelineFunnel(agencyId, dateRange = 30) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch pipeline funnel');
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      // Get profiles count
      const { count: profiles } = await supabase
        .from('maid_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId)
        .gte('created_at', startDate.toISOString());

      // Get agency jobs first to use in subqueries
      const { data: agencyJobs } = await supabase
        .from('agency_jobs')
        .select('id')
        .eq('agency_id', agencyId);

      const jobIds = agencyJobs?.map(job => job.id) || [];

      // Get applications count
      let applied = 0;
      if (jobIds.length > 0) {
        const { count: appliedCount } = await supabase
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .in('job_id', jobIds)
          .gte('created_at', startDate.toISOString());
        applied = appliedCount || 0;
      }

      // Get interviews count
      const { count: interviewed } = await supabase
        .from('agency_interviews')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId)
        .gte('created_at', startDate.toISOString());

      // Get offers count
      let offered = 0;
      if (jobIds.length > 0) {
        const { count: offeredCount } = await supabase
          .from('job_offers')
          .select('*', { count: 'exact', head: true })
          .in('job_id', jobIds)
          .gte('created_at', startDate.toISOString());
        offered = offeredCount || 0;
      }

      // Get hires count
      const { count: hired } = await supabase
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
      log.error('Error getting pipeline funnel:', error);
      throw new Error(`Failed to fetch pipeline funnel: ${error.message}`);
    }
  }

  // Time to Hire Analytics
  static async getTimeToHireTrend(agencyId, periods = ['7d', '30d', '90d']) {
    const results = {};

    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch time to hire trend');
      }

      for (const period of periods) {
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Calculate average time to hire for this period
        const { data: placements } = await supabase
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
      log.error('Error getting time to hire trend:', error);
      throw new Error(`Failed to fetch time to hire trend: ${error.message}`);
    }
  }

  // Tasks and SLA Management
  static async getTasksSLA(agencyId) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch tasks SLA');
      }

      const { data: tasks } = await supabase
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
      log.error('Error getting tasks SLA:', error);
      throw new Error(`Failed to fetch tasks SLA: ${error.message}`);
    }
  }

  // Alerts System
  static async getAgencyAlerts(agencyId) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch agency alerts');
      }

      const alerts = [];

      // Failed payments
      const { data: failedPayments } = await supabase
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
          link: '/dashboard/agency/billing'
        });
      }

      // Get maid profiles for agency first
      const { data: maidProfiles } = await supabase
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

          const { count } = await supabase
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
              link: '/dashboard/agency/documents'
            });
          }
        }
      }

      // Paused listings
      const { count: pausedJobs } = await supabase
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
          link: '/dashboard/agency/jobs'
        });
      }

      return alerts;
    } catch (error) {
      log.error('Error getting agency alerts:', error);
      throw new Error(`Failed to fetch agency alerts: ${error.message}`);
    }
  }

  // Maid Management
  static async getMaidsWithFilters(agencyId, filters = {}) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch maids');
      }

      let query = supabase
        .from('maid_profiles')
        .select(`
          *,
          documents:maid_documents(
            document_type,
            expiry_date,
            verification_status
          )
        `)
        .eq('agency_id', agencyId);

      // Apply filters
      if (filters.nationality) {
        query = query.in('nationality', filters.nationality);
      }

      if (filters.skills) {
        query = query.contains('skills', filters.skills);
      }

      if (filters.languages) {
        query = query.contains('languages', filters.languages);
      }

      if (filters.experienceRange) {
        const [min, max] = filters.experienceRange;
        query = query.gte('experience_years', min).lte('experience_years', max);
      }

      if (filters.verificationStatus) {
        query = query.eq('verification_status', filters.verificationStatus);
      }

      if (filters.availabilityStatus) {
        query = query.eq('availability_status', filters.availabilityStatus);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;

      return data?.map(maid => ({
        ...maid,
        // Mask PII in list view
        full_name: this.maskPII(maid.full_name),
        phone_number: this.maskPII(maid.phone_number, 'phone'),
        passport_number: this.maskPII(maid.passport_number, 'passport'),
        // Add computed fields
        documentsStatus: this.computeDocumentStatus(maid.documents),
        lastUpdate: maid.updated_at
      })) || [];
    } catch (error) {
      log.error('Error getting maids with filters:', error);
      throw new Error(`Failed to fetch maids: ${error.message}`);
    }
  }

  static maskPII(value, type = 'text') {
    if (!value) return value;

    switch (type) {
      case 'phone':
        return value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
      case 'passport':
        return value.replace(/(.{2})\w+(.{2})/, '$1****$2');
      default:
        return value.length > 6
          ? value.substring(0, 3) + '***' + value.substring(value.length - 2)
          : '***';
    }
  }

  static computeDocumentStatus(documents) {
    if (!documents?.length) return 'missing';

    const now = new Date();
    const hasExpired = documents.some(doc => new Date(doc.expiry_date) < now);
    const hasExpiringSoon = documents.some(doc => {
      const expiryDate = new Date(doc.expiry_date);
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    });

    if (hasExpired) return 'expired';
    if (hasExpiringSoon) return 'expiring';
    return 'valid';
  }

  // Audit Logging (basic, agency-scoped)
  static async logAgencyAuditEvent(agencyId, userId, action, entityType, entityId, details = {}) {
    try {
      const auditData = {
        agency_id: agencyId,
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
        ip_address: null, // To be populated from request context
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('agency_audit_logs')
        .insert(auditData);

      if (error) {
        log.error('Failed to log audit event:', error);
        throw new Error(`Failed to log audit event: ${error.message}`);
      }
    } catch (error) {
      log.error('Audit logging failed:', error.message);
      throw new Error(`Audit logging failed: ${error.message}`);
    }
  }

  // Sponsors Management Methods
  static async getSponsorsWithFilters(agencyId, filters = {}) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch sponsors');
      }

      let query = supabase
        .from('sponsors')
        .select('*, sponsor_jobs(*)')
        .eq('agency_id', agencyId);

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.location && filters.location !== 'all') {
        query = query.eq('location', filters.location);
      }

      if (filters.sponsorType && filters.sponsorType !== 'all') {
        query = query.eq('sponsor_type', filters.sponsorType);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((s) => ({
        ...s,
        full_name: s.full_name || s.name || '',
      }));
    } catch (error) {
      log.error('Failed to fetch sponsors:', error.message);
      throw new Error(`Failed to fetch sponsors: ${error.message}`);
    }
  }

  static async createSponsor(agencyId, sponsorData = {}) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to create sponsor');
      }

      const payload = {
        agency_id: agencyId,
        name: sponsorData.name?.trim() || null,
        email: sponsorData.email?.trim() || null,
        phone: sponsorData.phone?.trim() || null,
        location: sponsorData.location?.trim() || null,
        sponsor_type: sponsorData.sponsor_type || 'individual',
        status: 'pending',
        verification_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('sponsors')
        .insert(payload)
        .select('*, sponsor_jobs(*)')
        .single();

      if (error) throw error;

      await this.logAuditEvent(agencyId, 'sponsor_created', {
        sponsor_name: payload.name,
        sponsor_email: payload.email
      }, 'sponsor', data?.id);

      return data;
    } catch (error) {
      log.error('Failed to create sponsor:', error.message);
      throw new Error(`Failed to create sponsor: ${error.message}`);
    }
  }

  static async updateSponsor(agencyId, sponsorId, updates = {}) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to update sponsor');
      }

      const allowed = ['name','email','phone','location','sponsor_type','status','verification_status'];
      const payload = Object.fromEntries(
        Object.entries(updates)
          .filter(([k,v]) => allowed.includes(k))
          .map(([k,v]) => [k, typeof v === 'string' ? v.trim() : v])
      );
      payload.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('sponsors')
        .update(payload)
        .eq('id', sponsorId)
        .eq('agency_id', agencyId)
        .select('*, sponsor_jobs(*)')
        .single();

      if (error) throw error;

      await this.logAuditEvent(agencyId, 'sponsor_updated', {
        sponsor_id: sponsorId,
        fields: Object.keys(payload)
      }, 'sponsor', sponsorId);

      return data;
    } catch (error) {
      log.error('Failed to update sponsor:', error.message);
      throw new Error(`Failed to update sponsor: ${error.message}`);
    }
  }

  static async updateSponsorStatus(sponsorId, status, agencyId) {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', sponsorId)
        .eq('agency_id', agencyId)
        .select();

      if (error) throw error;

      await this.logAuditEvent(agencyId, 'sponsor_status_updated', {
        sponsor_id: sponsorId,
        new_status: status
      });

      return data?.[0];
    } catch (error) {
      log.error('Failed to update sponsor status:', error);
      throw new Error(`Failed to update sponsor status: ${error.message}`);
    }
  }

  static async deleteSponsor(sponsorId, agencyId) {
    try {
      const { error } = await supabase
        .from('sponsors')
        .delete()
        .eq('id', sponsorId)
        .eq('agency_id', agencyId);

      if (error) throw error;

      await this.logAuditEvent(agencyId, 'sponsor_deleted', {
        sponsor_id: sponsorId
      });

      return { success: true };
    } catch (error) {
      log.error('Failed to delete sponsor:', error);
      throw new Error(`Failed to delete sponsor: ${error.message}`);
    }
  }

  // Messaging System Methods
  static async getConversationsWithFilters(agencyId, filters = {}) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch conversations');
      }

      let query = supabase
        .from('conversations')
        .select('*, participants(*), latest_message(*)')
        .eq('agency_id', agencyId);

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.type && filters.type !== 'all') {
        query = query.eq('participant_type', filters.type);
      }

      if (filters.search) {
        query = query.or(`participant_name.ilike.%${filters.search}%,latest_message.content.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('last_message_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('Failed to fetch conversations:', error.message);
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }
  }

  static async getMessageTemplates(agencyId) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch message templates');
      }

      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('agency_id', agencyId)
        .order('category', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('Failed to fetch templates:', error.message);
      throw new Error(`Failed to fetch message templates: ${error.message}`);
    }
  }

  static async getMessages(conversationId) {
    try {
      if (!conversationId) {
        throw new Error('Conversation ID is required to fetch messages');
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles(name, avatar_url, user_type)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('Failed to fetch messages:', error.message);
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }
  }

  static async sendMessage(agencyId, conversationId, message) {
    try {
      const messageData = {
        conversation_id: conversationId,
        agency_id: agencyId,
        ...message,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      log.error('Failed to send message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  static async updateConversationStatus(conversationId, status, agencyId) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .eq('agency_id', agencyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      log.error('Failed to update conversation status:', error);
      throw new Error(`Failed to update conversation status: ${error.message}`);
    }
  }

  static async markConversationAsRead(conversationId, agencyId, userId) {
    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .update({
          last_read_at: new Date().toISOString()
        })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      log.error('Failed to mark conversation as read:', error);
      throw new Error(`Failed to mark conversation as read: ${error.message}`);
    }
  }

  // Calendar and Events
  static async getCalendarEvents(agencyId, startDate, endDate) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch calendar events');
      }

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('agency_id', agencyId)
        .gte('start_date', startDate)
        .lte('end_date', endDate)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('Failed to fetch calendar events:', error);
      throw new Error(`Failed to fetch calendar events: ${error.message}`);
    }
  }

  static async createCalendarEvent(agencyId, eventData) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to create calendar event');
      }

      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          agency_id: agencyId,
          ...eventData
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      log.error('Failed to create calendar event:', error);
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }

  static async updateCalendarEvent(eventId, updates, agencyId) {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', eventId)
        .eq('agency_id', agencyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      log.error('Failed to update calendar event:', error);
      throw new Error(`Failed to update calendar event: ${error.message}`);
    }
  }

  static async deleteCalendarEvent(eventId, agencyId) {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId)
        .eq('agency_id', agencyId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      log.error('Failed to delete calendar event:', error);
      throw new Error(`Failed to delete calendar event: ${error.message}`);
    }
  }

  // Tasks Management
  static async getTasksWithFilters(agencyId, filters = {}) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch tasks');
      }

      let query = supabase
        .from('agency_tasks')
        .select(`
          *,
          assignee:profiles!agency_tasks_assignee_id_fkey(name, email, avatar_url)
        `)
        .eq('agency_id', agencyId);

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      if (filters.assignee) {
        query = query.eq('assignee_id', filters.assignee);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('Failed to fetch tasks:', error);
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }
  }

  static async createTask(agencyId, taskData) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to create task');
      }

      const { data, error } = await supabase
        .from('agency_tasks')
        .insert({
          agency_id: agencyId,
          ...taskData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          assignee:profiles!agency_tasks_assignee_id_fkey(name, email, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      log.error('Failed to create task:', error);
      throw new Error(`Failed to create task: ${error.message}`);
    }
  }

  static async updateTask(taskId, updates, agencyId) {
    try {
      const { data, error } = await supabase
        .from('agency_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('agency_id', agencyId)
        .select(`
          *,
          assignee:profiles!agency_tasks_assignee_id_fkey(name, email, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      log.error('Failed to update task:', error);
      throw new Error(`Failed to update task: ${error.message}`);
    }
  }

  static async deleteTask(taskId, agencyId) {
    try {
      const { error } = await supabase
        .from('agency_tasks')
        .delete()
        .eq('id', taskId)
        .eq('agency_id', agencyId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      log.error('Failed to delete task:', error);
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }

  static async updateTaskStatus(taskId, status, agencyId) {
    try {
      const { data, error } = await supabase
        .from('agency_tasks')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('agency_id', agencyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      log.error('Failed to update task status:', error);
      throw new Error(`Failed to update task status: ${error.message}`);
    }
  }

  // Documents Management
  static async getDocumentsWithFilters(agencyId, filters = {}) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch documents');
      }

      let query = supabase
        .from('agency_documents')
        .select(`
          *,
          uploader:profiles!agency_documents_uploader_id_fkey(name, email)
        `)
        .eq('agency_id', agencyId);

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters.document_type && filters.document_type !== 'all') {
        query = query.eq('document_type', filters.document_type);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,document_number.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('Failed to fetch documents:', error);
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }
  }

  static async uploadDocument(agencyId, documentData) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to upload document');
      }

      const { data, error } = await supabase
        .from('agency_documents')
        .insert({
          agency_id: agencyId,
          ...documentData,
          uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await this.logAgencyAuditEvent(
        agencyId,
        documentData.uploader_id,
        'document_uploaded',
        'document',
        data.id,
        { document_name: documentData.name }
      );

      return data;
    } catch (error) {
      log.error('Failed to upload document:', error);
      throw new Error(`Failed to upload document: ${error.message}`);
    }
  }

  static async updateDocument(documentId, updates, agencyId) {
    try {
      const { data, error } = await supabase
        .from('agency_documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .eq('agency_id', agencyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      log.error('Failed to update document:', error);
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  static async deleteDocument(documentId, agencyId) {
    try {
      const { error } = await supabase
        .from('agency_documents')
        .delete()
        .eq('id', documentId)
        .eq('agency_id', agencyId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      log.error('Failed to delete document:', error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  // Compliance
  static async getComplianceChecklist(agencyId) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch compliance checklist');
      }

      const { data, error } = await supabase
        .from('agency_compliance_checklist')
        .select('*')
        .eq('agency_id', agencyId)
        .order('priority', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('Failed to fetch compliance checklist:', error);
      throw new Error(`Failed to fetch compliance checklist: ${error.message}`);
    }
  }

  static async updateComplianceItem(itemId, updates, agencyId) {
    try {
      const { data, error } = await supabase
        .from('agency_compliance_checklist')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('agency_id', agencyId)
        .select()
        .single();

      if (error) throw error;

      await this.logAgencyAuditEvent(
        agencyId,
        updates.completed_by,
        'compliance_updated',
        'compliance_item',
        itemId,
        { status: updates.status }
      );

      return data;
    } catch (error) {
      log.error('Failed to update compliance item:', error);
      throw new Error(`Failed to update compliance item: ${error.message}`);
    }
  }

  // Billing & Financial
  static async getBillingData(agencyId) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch billing data');
      }

      const results = await Promise.allSettled([
        this.getSubscriptionDetails(agencyId),
        this.getInvoices(agencyId),
        this.getPaymentMethods(agencyId),
        this.getUsageData(agencyId),
        this.getPayments(agencyId),
        this.getAvailablePlans()
      ]);

      return {
        subscription: results[0].status === 'fulfilled' ? results[0].value : null,
        invoices: results[1].status === 'fulfilled' ? results[1].value : [],
        paymentMethods: results[2].status === 'fulfilled' ? results[2].value : [],
        usage: results[3].status === 'fulfilled' ? results[3].value : null,
        payments: results[4].status === 'fulfilled' ? results[4].value : [],
        available_plans: results[5].status === 'fulfilled' ? results[5].value : []
      };
    } catch (error) {
      log.error('Failed to get billing data:', error);
      throw new Error(`Failed to fetch billing data: ${error.message}`);
    }
  }

  static async getSubscriptionDetails(agencyId) {
    try {
      const { data, error } = await supabase
        .from('agency_subscriptions')
        .select('*')
        .eq('agency_id', agencyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      // If no subscription exists, return mock data for free plan
      if (!data) {
        return {
          plan_name: 'Free',
          plan_type: 'monthly',
          status: 'active',
          amount: 0,
          currency: 'AED',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          features: [
            '3 maid listings',
            '5 message threads',
            '10 sponsor connections',
            'Standard customer support'
          ]
        };
      }

      // Ensure features array exists
      if (!data.features) {
        data.features = [
          '3 maid listings',
          '5 message threads',
          '10 sponsor connections',
          'Standard customer support'
        ];
      }

      return data;
    } catch (error) {
      log.error('Failed to get subscription details:', error);
      // Return mock data instead of throwing
      return {
        plan_name: 'Free',
        plan_type: 'monthly',
        status: 'active',
        amount: 0,
        currency: 'AED',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        features: [
          '3 maid listings',
          '5 message threads',
          '10 sponsor connections',
          'Standard customer support'
        ]
      };
    }
  }

  static async getInvoices(agencyId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('agency_invoices')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('Failed to get invoices:', error);
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }
  }

  static async getPaymentMethods(agencyId) {
    try {
      const { data, error } = await supabase
        .from('agency_payment_methods')
        .select('*')
        .eq('agency_id', agencyId)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('Failed to get payment methods:', error);
      throw new Error(`Failed to fetch payment methods: ${error.message}`);
    }
  }

  static async getUsageData(agencyId) {
    try {
      const { data, error } = await supabase
        .from('agency_usage')
        .select('*')
        .eq('agency_id', agencyId)
        .gte('period_start', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      // Return structured usage data or mock data if no data exists (Free plan limits)
      if (!data) {
        return {
          current_period: {
            maids_added: 0,
            jobs_posted: 0,
            api_calls: 0,
            storage_used_gb: 0,
            active_users: 1
          },
          limits: {
            maids: 3, // Free plan: 3 maid listings
            jobs: 5,
            api_calls_per_month: 100,
            storage_gb: 2,
            users: 1
          }
        };
      }

      return data;
    } catch (error) {
      log.error('Failed to get usage data:', error);
      // Return mock data instead of throwing to prevent breaking the billing page
      return {
        current_period: {
          maids_added: 0,
          jobs_posted: 0,
          api_calls: 0,
          storage_used_gb: 0,
          active_users: 1
        },
        limits: {
          maids: 3, // Free plan: 3 maid listings
          jobs: 5,
          api_calls_per_month: 100,
          storage_gb: 2,
          users: 1
        }
      };
    }
  }

  static async updatePaymentMethod(methodId, updates, agencyId) {
    try {
      const { data, error } = await supabase
        .from('agency_payment_methods')
        .update(updates)
        .eq('id', methodId)
        .eq('agency_id', agencyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      log.error('Failed to update payment method:', error);
      throw new Error(`Failed to update payment method: ${error.message}`);
    }
  }

  static async addPaymentMethod(agencyId, paymentMethodData) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to add payment method');
      }

      const { data, error } = await supabase
        .from('agency_payment_methods')
        .insert({
          agency_id: agencyId,
          ...paymentMethodData
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      log.error('Failed to add payment method:', error);
      throw new Error(`Failed to add payment method: ${error.message}`);
    }
  }

  static async deletePaymentMethod(methodId, agencyId) {
    try {
      const { error } = await supabase
        .from('agency_payment_methods')
        .delete()
        .eq('id', methodId)
        .eq('agency_id', agencyId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      log.error('Failed to delete payment method:', error);
      throw new Error(`Failed to delete payment method: ${error.message}`);
    }
  }

  static async getPayments(agencyId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('agency_payments')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error && error.code !== 'PGRST116') throw error;
      return data || [];
    } catch (error) {
      log.error('Failed to get payments:', error);
      // Return empty array instead of throwing to prevent breaking the billing page
      return [];
    }
  }

  static async getAvailablePlans() {
    try {
      // Mock data for available plans matching stripeConfig
      // TODO: Replace with actual database query when subscription_plans table is created
      return [
        {
          id: 'free',
          name: 'Free',
          price: 0,
          interval: 'month',
          currency: 'AED',
          description: 'Basic agency management',
          popular: false,
          features: [
            '3 maid listings',
            '5 message threads',
            '10 sponsor connections',
            'Standard customer support'
          ]
        },
        {
          id: 'pro',
          name: 'Professional',
          price: 295,
          interval: 'month',
          currency: 'AED',
          description: 'Comprehensive agency tools',
          popular: true,
          features: [
            '25 maid listings',
            '50 message threads',
            '100 sponsor connections',
            'Analytics dashboard',
            '24-hour support response',
            'Direct messaging'
          ]
        },
        {
          id: 'premium',
          name: 'Premium',
          price: 550,
          interval: 'month',
          currency: 'AED',
          description: 'Enterprise agency solution',
          popular: false,
          features: [
            'Unlimited maid listings',
            'Unlimited message threads',
            'Unlimited sponsor connections',
            'Advanced analytics dashboard',
            'Bulk upload capabilities',
            'Verification badge',
            '6-hour support response',
            'Direct messaging',
            'White-label options',
            'API access'
          ]
        }
      ];
    } catch (error) {
      log.error('Failed to get available plans:', error);
      return [];
    }
  }

  // Audit Log Methods
  static async logAuditEvent(agencyId, action, details = {}, entityType = null, entityId = null) {
    try {
      const auditData = {
        agency_id: agencyId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
        timestamp: new Date().toISOString(),
        ip_address: null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server'
      };

      const { error } = await supabase
        .from('agency_audit_logs')
        .insert(auditData);

      if (error) {
        log.error('Failed to log audit event:', error);
      }
    } catch (error) {
      log.error('Audit logging failed:', error.message);
    }
  }

  static async getAuditLogs(agencyId, filters = {}) {
    try {
      if (!agencyId) {
        throw new Error('Agency ID is required to fetch audit logs');
      }

      let query = supabase
        .from('agency_audit_logs')
        .select('*')
        .eq('agency_id', agencyId);

      // Apply filters
      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.entity_type) {
        query = query.eq('entity_type', filters.entity_type);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.start_date) {
        query = query.gte('timestamp', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('timestamp', filters.end_date);
      }

      const limit = filters.limit || 100;
      const offset = filters.offset || 0;

      query = query
        .order('timestamp', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      log.error('Failed to fetch audit logs:', error);
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }
  }

  // PII Masking and Data Protection (object-level)
  static maskPIIObject(data, maskingRules = {}) {
    if (!data || typeof data !== 'object') return data;

    const defaultRules = {
      email: (email) => {
        if (!email || !email.includes('@')) return email;
        const [local, domain] = email.split('@');
        return `${local.substring(0, 2)}***@${domain}`;
      },
      phone: (phone) => {
        if (!phone) return phone;
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length < 6) return phone;
        return cleaned.substring(0, 3) + '***' + cleaned.substring(cleaned.length - 2);
      },
      passport: (passport) => {
        if (!passport) return passport;
        return passport.substring(0, 2) + '***' + passport.substring(passport.length - 2);
      },
      visa: (visa) => {
        if (!visa) return visa;
        return '***' + visa.substring(visa.length - 4);
      },
      bankAccount: (account) => {
        if (!account) return account;
        return '***' + account.substring(account.length - 4);
      },
      address: (address) => {
        if (!address) return address;
        const parts = address.split(' ');
        return parts.length > 2 ? `${parts[0]} *** ${parts[parts.length - 1]}` : address;
      }
    };

    const rules = { ...defaultRules, ...maskingRules };
    const maskedData = { ...data };

    // Apply masking rules to known PII fields
    const piiFields = {
      email: rules.email,
      phone: rules.phone,
      mobile: rules.phone,
      telephone: rules.phone,
      passport_number: rules.passport,
      passport: rules.passport,
      visa_number: rules.visa,
      visa: rules.visa,
      bank_account: rules.bankAccount,
      account_number: rules.bankAccount,
      address: rules.address,
      home_address: rules.address,
      emergency_contact: rules.phone
    };

    Object.keys(maskedData).forEach(key => {
      const lowerKey = key.toLowerCase();

      // Check for exact matches
      if (piiFields[lowerKey]) {
        maskedData[key] = piiFields[lowerKey](maskedData[key]);
      }

      // Check for partial matches
      else if (lowerKey.includes('email')) {
        maskedData[key] = rules.email(maskedData[key]);
      }
      else if (lowerKey.includes('phone') || lowerKey.includes('mobile')) {
        maskedData[key] = rules.phone(maskedData[key]);
      }
      else if (lowerKey.includes('passport')) {
        maskedData[key] = rules.passport(maskedData[key]);
      }
      else if (lowerKey.includes('visa')) {
        maskedData[key] = rules.visa(maskedData[key]);
      }
      else if (lowerKey.includes('account')) {
        maskedData[key] = rules.bankAccount(maskedData[key]);
      }
      else if (lowerKey.includes('address')) {
        maskedData[key] = rules.address(maskedData[key]);
      }

      // Recursively mask nested objects
      if (typeof maskedData[key] === 'object' && maskedData[key] !== null) {
        maskedData[key] = this.maskPIIObject(maskedData[key], maskingRules);
      }
    });

    return maskedData;
  }

  static async getSecuritySettings() {
    try {
      // In production, fetch from database
      const { data, error } = await supabase
        .from('agency_security_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || {
        password_policy: {
          min_length: 8,
          require_uppercase: true,
          require_lowercase: true,
          require_numbers: true,
          require_symbols: false,
          password_expiry_days: 90
        },
        session_policy: {
          session_timeout_minutes: 480,
          concurrent_sessions_limit: 3,
          require_fresh_login_for_sensitive_actions: true
        },
        access_control: {
          ip_whitelist: [],
          require_2fa_for_admin: true,
          max_failed_login_attempts: 5,
          lockout_duration_minutes: 30
        },
        audit_settings: {
          log_all_actions: true,
          log_retention_days: 365,
          enable_real_time_alerts: true,
          alert_on_critical_actions: true
        },
        data_protection: {
          enable_pii_masking: true,
          auto_anonymize_after_days: 2555, // 7 years
          require_consent_for_data_processing: true,
          enable_right_to_be_forgotten: true
        }
      };
    } catch (error) {
      log.error('Error fetching security settings:', error);
      throw new Error('Failed to fetch security settings');
    }
  }

  static async updateSecuritySettings(settings, userId) {
    try {
      const { data, error } = await supabase
        .from('agency_security_settings')
        .upsert(settings)
        .select();

      if (error) throw error;

      // Log the security settings change
      await this.logAuditEvent(userId, 'security_settings_changed', {
        changed_settings: Object.keys(settings),
        userEmail: 'admin@agency.com'
      });

      return data?.[0] || settings;
    } catch (error) {
      log.error('Failed to update security settings:', error);
      throw new Error(`Failed to update security settings: ${error.message}`);
    }
  }
}

// Default export for compatibility with default imports
export default AgencyDashboardService;