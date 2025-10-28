import { supabase } from '@/lib/databaseClient';
import { createLogger } from '@/utils/logger';
import { featureFlags } from '@/config/environmentConfig';
import { mockJobsData } from '@/data/mockJobs.js';

const log = createLogger('JobService');

function mapFiltersToQuery(query, filters) {
  if (!filters) return query;

  if (filters.country && filters.country !== 'all') {
    query = query.eq('country', filters.country);
  }
  if (filters.jobType && filters.jobType !== 'all') {
    query = query.eq('job_type', filters.jobType);
  }
  if (filters.accommodation && filters.accommodation !== 'all') {
    query = query.eq('accommodation', filters.accommodation);
  }
  if (filters.visaStatusRequired && filters.visaStatusRequired !== 'all') {
    query = query.contains('visa_status_required', [
      filters.visaStatusRequired,
    ]);
  }
  if (Array.isArray(filters.serviceType) && filters.serviceType.length > 0) {
    query = query.contains('service_type', filters.serviceType);
  }
  if (Array.isArray(filters.requirements) && filters.requirements.length > 0) {
    query = query.contains('requirements', filters.requirements);
  }
  if (
    Array.isArray(filters.languagesRequired) &&
    filters.languagesRequired.length > 0
  ) {
    query = query.contains('languages_required', filters.languagesRequired);
  }
  if (filters.urgentOnly) {
    query = query.eq('urgent', true);
  }
  return query;
}

function applyClientSideTransforms(jobs, getSalaryString) {
  return jobs.map((job) => {
    // Construct salary range string from database fields
    let salaryRangeString = null;
    if (job.salary_min && job.salary_max) {
      salaryRangeString = `${job.salary_min}-${job.salary_max}`;
    } else if (job.salary_min) {
      salaryRangeString = `${job.salary_min}`;
    } else if (job.salaryRange || job.salary_range) {
      salaryRangeString = job.salaryRange || job.salary_range;
    }

    return {
      ...job,
      // Provide a consistent salary display helper if provided
      salaryDisplay:
        typeof getSalaryString === 'function' && salaryRangeString
          ? getSalaryString(
              job.country,
              salaryRangeString,
              job.country,
              job.currency  // Pass the actual currency from the database
            )
          : job.salaryDisplay,
    };
  });
}

export async function getJobs({
  filters,
  searchTerm,
  sortBy,
  getSalaryString,
} = {}) {
  // Fallback to mock if feature flag enabled
  const useMock = featureFlags?.mockData === true;

  if (!useMock) {
    try {
      // First, get all jobs (not using join to avoid filtering out jobs without sponsor_id)
      let query = supabase.from('jobs').select('*');

      // Basic text search across common fields if supported
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        // Use ilike on a few likely columns
        query = query.or(
          `title.ilike.%${term}%,employer.ilike.%${term}%,location.ilike.%${term}%`
        );
      }

      query = mapFiltersToQuery(query, filters);

      // Sorting options (mirror UI options)
      if (sortBy === 'salaryHighToLow')
        query = query.order('salary_min', { ascending: false });
      else if (sortBy === 'salaryLowToHigh')
        query = query.order('salary_min', { ascending: true });
      else if (sortBy === 'newest')
        query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Fetch sponsor data for jobs that have sponsor_id
      const sponsorIds = [...new Set((data || []).map(job => job.sponsor_id).filter(Boolean))];
      let sponsorsMap = {};

      if (sponsorIds.length > 0) {
        const { data: sponsors } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, verification_status')
          .in('id', sponsorIds);

        if (sponsors) {
          sponsorsMap = sponsors.reduce((acc, sponsor) => {
            acc[sponsor.id] = sponsor;
            return acc;
          }, {});
        }
      }

      // Map sponsor data to employer field for backwards compatibility
      const jobsWithSponsor = (data || []).map(job => ({
        ...job,
        sponsor: job.sponsor_id ? sponsorsMap[job.sponsor_id] : null,
        employer: sponsorsMap[job.sponsor_id]?.name || job.employer || 'Sponsor',
        sponsor_name: sponsorsMap[job.sponsor_id]?.name || job.employer || 'Sponsor',
      }));

      const transformed = applyClientSideTransforms(
        jobsWithSponsor,
        getSalaryString
      );
      if (import.meta.env?.DEV)
        log.debug('Loaded jobs from database:', transformed.length);
      return transformed;
    } catch (err) {
      log.warn('Falling back to mock jobs due to error:', err?.message || err);
      // Fall through to mock
    }
  }

  // Mock fallback
  const transformed = applyClientSideTransforms(mockJobsData, getSalaryString);
  if (import.meta.env?.DEV)
    log.info('Using mock jobs data:', transformed.length);
  return transformed;
}

/**
 * Create a new job posting (for sponsors)
 * @param {Object} jobData - Job details
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createJob(jobData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    // Set expiration date if auto_expire_days is provided
    let expiresAt = null;
    if (jobData.auto_expire_days) {
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + jobData.auto_expire_days);
      expiresAt = expireDate.toISOString();
    }

    const jobPayload = {
      sponsor_id: user.id,
      title: jobData.title,
      description: jobData.description,
      job_type: jobData.job_type || 'full-time',
      country: jobData.country,
      city: jobData.city,
      address: jobData.address,
      required_skills: jobData.required_skills || [],
      preferred_nationality: jobData.preferred_nationality || [],
      languages_required: jobData.required_languages || [], // DB uses languages_required
      minimum_experience_years: jobData.minimum_experience_years || 0,
      age_preference_min: jobData.age_preference_min,
      age_preference_max: jobData.age_preference_max,
      education_requirement: jobData.education_requirement,
      working_hours_per_day: jobData.working_hours_per_day || 8,
      working_days_per_week: jobData.working_days_per_week || 6,
      days_off_per_week: jobData.days_off_per_week || 1,
      overtime_available: jobData.overtime_available || false,
      live_in_required: jobData.live_in_required !== undefined ? jobData.live_in_required : true,
      salary_min: jobData.salary_min,
      salary_max: jobData.salary_max,
      currency: jobData.currency || 'USD',
      salary_period: jobData.salary_period || 'monthly',
      benefits: jobData.benefits || [],
      contract_duration_months: jobData.contract_duration_months,
      start_date: jobData.start_date,
      end_date: jobData.end_date,
      probation_period_months: jobData.probation_period_months || 3,
      status: jobData.status || 'active',
      urgency_level: jobData.urgency_level || 'normal',
      max_applications: jobData.max_applications || 50,
      auto_expire_days: jobData.auto_expire_days || 30,
      requires_approval: jobData.requires_approval !== undefined ? jobData.requires_approval : true,
      expires_at: expiresAt,
    };

    const { data, error } = await supabase
      .from('jobs')
      .insert([jobPayload])
      .select()
      .single();

    if (error) throw error;

    log.info('Job created successfully:', data.id);
    return { data, error: null };
  } catch (error) {
    log.error('Error creating job:', error);
    return { data: null, error };
  }
}

/**
 * Update an existing job posting
 * @param {string} jobId - Job ID
 * @param {Object} jobData - Updated job details
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateJob(jobId, jobData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    // Verify ownership
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('sponsor_id')
      .eq('id', jobId)
      .single();

    if (fetchError) throw fetchError;

    if (existingJob.sponsor_id !== user.id) {
      return { data: null, error: new Error('Unauthorized: You can only update your own jobs') };
    }

    const { data, error } = await supabase
      .from('jobs')
      .update(jobData)
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;

    log.info('Job updated successfully:', jobId);
    return { data, error: null };
  } catch (error) {
    log.error('Error updating job:', error);
    return { data: null, error };
  }
}

/**
 * Delete a job posting
 * @param {string} jobId - Job ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function deleteJob(jobId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    // Verify ownership
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('sponsor_id')
      .eq('id', jobId)
      .single();

    if (fetchError) throw fetchError;

    if (existingJob.sponsor_id !== user.id) {
      return { data: null, error: new Error('Unauthorized: You can only delete your own jobs') };
    }

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId);

    if (error) throw error;

    log.info('Job deleted successfully:', jobId);
    return { data: { success: true }, error: null };
  } catch (error) {
    log.error('Error deleting job:', error);
    return { data: null, error };
  }
}

/**
 * Get all jobs posted by the current sponsor
 * @param {Object} options - Query options
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function getSponsorJobs(options = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const {
      status = null,
      limit = 50,
      offset = 0,
      orderBy = 'created_at',
      orderDirection = 'desc'
    } = options;

    let query = supabase
      .from('jobs')
      .select(`
        *,
        applications(count)
      `)
      .eq('sponsor_id', user.id);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    log.debug('Loaded sponsor jobs:', data?.length || 0);
    return { data, error: null };
  } catch (error) {
    log.error('Error fetching sponsor jobs:', error);
    return { data: null, error };
  }
}

/**
 * Get a single job by ID
 * @param {string} jobId - Job ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getJobById(jobId) {
  const useMock = featureFlags?.mockData === true;

  if (!useMock) {
    try {
      // First, get the job data
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;

      // Then, get the sponsor profile if sponsor_id exists
      let sponsor = null;
      if (jobData.sponsor_id) {
        const { data: sponsorData, error: sponsorError } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, verification_status')
          .eq('id', jobData.sponsor_id)
          .single();

        if (!sponsorError && sponsorData) {
          sponsor = sponsorData;
        }
      }

      // Combine the data
      const combinedData = {
        ...jobData,
        sponsor,
      };

      log.debug('Loaded job by ID from database:', jobId);
      return { data: combinedData, error: null };
    } catch (error) {
      log.warn('Falling back to mock job data due to error:', error?.message || error);
      // Fall through to mock
    }
  }

  // Mock fallback - find job by ID in mock data
  const job = mockJobsData.find(j => String(j.id) === String(jobId));
  if (job) {
    // Transform mock data to match database structure
    const transformedJob = {
      ...job,
      sponsor: {
        id: 'mock-sponsor-id',
        name: job.employer,
        avatar_url: null,
      },
      applications: [],
      applications_count: 0,
      views_count: Math.floor(Math.random() * 100) + 10,
    };
    log.debug('Loaded job by ID from mock data:', jobId);
    return { data: transformedJob, error: null };
  }

  return { data: null, error: new Error('Job not found') };
}

/**
 * Change job status
 * @param {string} jobId - Job ID
 * @param {string} status - New status (active, paused, filled, expired, cancelled)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function changeJobStatus(jobId, status) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const validStatuses = ['draft', 'active', 'paused', 'filled', 'expired', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return { data: null, error: new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`) };
    }

    const { data, error } = await supabase
      .from('jobs')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', jobId)
      .eq('sponsor_id', user.id)
      .select()
      .single();

    if (error) throw error;

    log.info('Job status changed:', jobId, status);
    return { data, error: null };
  } catch (error) {
    log.error('Error changing job status:', error);
    return { data: null, error };
  }
}

/**
 * Get job applications
 * @param {string} jobId - Job ID
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function getJobApplications(jobId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    // Verify job ownership
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('sponsor_id')
      .eq('id', jobId)
      .single();

    if (jobError) throw jobError;

    if (job.sponsor_id !== user.id) {
      return { data: null, error: new Error('Unauthorized: You can only view applications for your own jobs') };
    }

    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        maid:profiles!applications_maid_id_fkey(
          id,
          name,
          avatar_url,
          email
        ),
        job:jobs!applications_job_id_fkey(
          id,
          title
        )
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    log.debug('Loaded job applications:', data?.length || 0);
    return { data, error: null };
  } catch (error) {
    log.error('Error fetching job applications:', error);
    return { data: null, error };
  }
}

/**
 * Get dashboard statistics for sponsor's jobs
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getSponsorJobStats() {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, status, applications_count, views_count')
      .eq('sponsor_id', user.id);

    if (error) throw error;

    const stats = {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => j.status === 'active').length,
      draftJobs: jobs.filter(j => j.status === 'draft').length,
      filledJobs: jobs.filter(j => j.status === 'filled').length,
      totalApplications: jobs.reduce((sum, j) => sum + (j.applications_count || 0), 0),
      totalViews: jobs.reduce((sum, j) => sum + (j.views_count || 0), 0),
    };

    log.debug('Loaded sponsor job stats:', stats);
    return { data: stats, error: null };
  } catch (error) {
    log.error('Error fetching sponsor job stats:', error);
    return { data: null, error };
  }
}

/**
 * Get application by ID
 * @param {string} applicationId - Application ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getApplicationById(applicationId) {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        maid:profiles!applications_maid_id_fkey(
          id,
          name,
          avatar_url,
          email
        ),
        job:jobs!applications_job_id_fkey(
          id,
          title,
          sponsor_id
        )
      `)
      .eq('id', applicationId)
      .single();

    if (error) throw error;

    log.debug('Loaded application by ID:', applicationId);
    return { data, error: null };
  } catch (error) {
    log.error('Error fetching application:', error);
    return { data: null, error };
  }
}

/**
 * Update application status
 * @param {string} applicationId - Application ID
 * @param {string} status - New status
 * @param {Object} updates - Additional updates (notes, interview details, etc.)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateApplicationStatus(applicationId, status, updates = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const validStatuses = ['pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'accepted', 'rejected', 'withdrawn'];
    if (!validStatuses.includes(status)) {
      return { data: null, error: new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`) };
    }

    // Verify authorization (must own the job)
    const { data: application } = await supabase
      .from('applications')
      .select('job:jobs!applications_job_id_fkey(sponsor_id)')
      .eq('id', applicationId)
      .single();

    if (application?.job?.sponsor_id !== user.id) {
      return { data: null, error: new Error('Unauthorized') };
    }

    const updateData = {
      status,
      updated_at: new Date().toISOString(),
      ...updates,
    };

    const { data, error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;

    log.info('Application status updated:', applicationId, status);
    return { data, error: null };
  } catch (error) {
    log.error('Error updating application status:', error);
    return { data: null, error };
  }
}

/**
 * Add notes to application
 * @param {string} applicationId - Application ID
 * @param {string} notes - Sponsor notes
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function addApplicationNotes(applicationId, notes) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase
      .from('applications')
      .update({
        sponsor_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;

    log.info('Application notes added:', applicationId);
    return { data, error: null };
  } catch (error) {
    log.error('Error adding application notes:', error);
    return { data: null, error };
  }
}

/**
 * Toggle featured status for a job
 * @param {string} jobId - Job ID
 * @param {boolean} featured - Whether to feature the job
 * @param {number} daysToFeature - Number of days to feature (default 7)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function toggleJobFeatured(jobId, featured, daysToFeature = 7) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    // Verify ownership
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('sponsor_id')
      .eq('id', jobId)
      .single();

    if (fetchError) throw fetchError;

    if (existingJob.sponsor_id !== user.id) {
      return { data: null, error: new Error('Unauthorized: You can only feature your own jobs') };
    }

    // Calculate featured_until timestamp
    let featuredUntil = null;
    if (featured) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysToFeature);
      featuredUntil = futureDate.toISOString();
    }

    const { data, error } = await supabase
      .from('jobs')
      .update({
        featured,
        featured_until: featuredUntil,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;

    log.info('Job featured status toggled:', jobId, featured);
    return { data, error: null };
  } catch (error) {
    log.error('Error toggling featured status:', error);
    return { data: null, error };
  }
}

/**
 * Submit a job application (for maids)
 * @param {string} jobId - Job ID
 * @param {Object} applicationData - Application details
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function submitApplication(jobId, applicationData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    // Check if user is a maid
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    if (profile.user_type !== 'maid') {
      return { data: null, error: new Error('Only maids can apply for jobs') };
    }

    // Check if job exists and is active
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, max_applications, applications_count')
      .eq('id', jobId)
      .single();

    if (jobError) throw jobError;

    if (job.status !== 'active') {
      return { data: null, error: new Error('This job is not currently accepting applications') };
    }

    if (job.max_applications && job.applications_count >= job.max_applications) {
      return { data: null, error: new Error('This job has reached its maximum number of applications') };
    }

    // Check if user has already applied
    const { data: existingApplication } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('maid_id', user.id)
      .single();

    if (existingApplication) {
      return { data: null, error: new Error('You have already applied for this job') };
    }

    // Create application
    const applicationPayload = {
      job_id: jobId,
      maid_id: user.id,
      cover_letter: applicationData.coverLetter,
      proposed_salary: applicationData.proposedSalary ? parseInt(applicationData.proposedSalary) : null,
      proposed_currency: applicationData.proposedCurrency || 'USD',
      availability_date: applicationData.availableFrom || null,
      status: 'pending',
    };

    const { data, error } = await supabase
      .from('applications')
      .insert([applicationPayload])
      .select(`
        *,
        job:jobs!applications_job_id_fkey(
          id,
          title,
          sponsor_id
        )
      `)
      .single();

    if (error) throw error;

    log.info('Application submitted successfully:', data.id);
    return { data, error: null };
  } catch (error) {
    log.error('Error submitting application:', error);
    return { data: null, error };
  }
}

/**
 * Get applications for the current maid
 * @param {Object} options - Query options
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function getMaidApplications(options = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const {
      status = null,
      limit = 50,
      offset = 0,
      orderBy = 'created_at',
      orderDirection = 'desc'
    } = options;

    let query = supabase
      .from('applications')
      .select(`
        *,
        job:jobs!applications_job_id_fkey(
          id,
          title,
          country,
          city,
          job_type,
          salary_min,
          salary_max,
          currency,
          status,
          sponsor:profiles!jobs_sponsor_id_fkey(
            id,
            name,
            avatar_url
          )
        )
      `)
      .eq('maid_id', user.id);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    log.debug('Loaded maid applications:', data?.length || 0);
    return { data, error: null };
  } catch (error) {
    log.error('Error fetching maid applications:', error);
    return { data: null, error };
  }
}

/**
 * Withdraw an application (for maids)
 * @param {string} applicationId - Application ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function withdrawApplication(applicationId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    // Verify ownership
    const { data: existingApplication, error: fetchError } = await supabase
      .from('applications')
      .select('maid_id, status')
      .eq('id', applicationId)
      .single();

    if (fetchError) throw fetchError;

    if (existingApplication.maid_id !== user.id) {
      return { data: null, error: new Error('Unauthorized: You can only withdraw your own applications') };
    }

    if (existingApplication.status === 'accepted' || existingApplication.status === 'rejected') {
      return { data: null, error: new Error('Cannot withdraw an application that has already been accepted or rejected') };
    }

    const { data, error } = await supabase
      .from('applications')
      .update({
        status: 'withdrawn',
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;

    log.info('Application withdrawn successfully:', applicationId);
    return { data, error: null };
  } catch (error) {
    log.error('Error withdrawing application:', error);
    return { data: null, error };
  }
}
