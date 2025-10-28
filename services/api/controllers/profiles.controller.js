/**
 * Profiles API Controller
 *
 * HTTP handlers for maid profile operations.
 */

import { supabase } from '../lib/supabase.js';
import { EventBus } from '@ethio-maids/infra-common';
import { SupabaseAuditLogger } from '@ethio-maids/infra-identity';
import {
  CreateMaidProfile,
  UpdateMaidProfile,
  GetMaidProfile,
  SearchMaidProfiles,
  SubmitMaidProfileForReview,
  ApproveMaidProfile,
} from '@ethio-maids/app-profiles';
import {
  SupabaseMaidProfileRepository,
  SupabaseStorageService,
} from '@ethio-maids/infra-profiles';

// Validators (simple validation - in production use Zod/Joi)
const CreateMaidProfileValidator = {
  validate(body) {
    if (!body.userId) throw new Error('userId is required');
    return true;
  },
};

const UpdateMaidProfileValidator = {
  validate(body) {
    if (!body.profileId) throw new Error('profileId is required');
    if (!body.updates || typeof body.updates !== 'object') {
      throw new Error('updates object is required');
    }
    return true;
  },
};

const SearchMaidProfilesValidator = {
  validate(query) {
    if (query.page && (isNaN(query.page) || query.page < 1)) {
      throw new Error('page must be a positive number');
    }
    if (query.limit && (isNaN(query.limit) || query.limit < 1 || query.limit > 100)) {
      throw new Error('limit must be between 1 and 100');
    }
    return true;
  },
};

// Initialize dependencies
const maidProfileRepository = new SupabaseMaidProfileRepository(supabase);
const eventBus = new EventBus(supabase);
const auditLogger = new SupabaseAuditLogger(supabase);
const storageService = new SupabaseStorageService(supabase);

/**
 * POST /api/v1/profiles/maid
 * Create a new maid profile
 */
export async function createMaidProfile(req, res) {
  try {
    // 1. Validate request body
    CreateMaidProfileValidator.validate(req.body);

    // 2. Get user from auth middleware (in real app, add auth middleware)
    const userId = req.user?.id || req.body.userId;

    // 3. Execute use case
    const createMaidProfile = new CreateMaidProfile({
      maidProfileRepository,
      eventBus,
      auditLogger,
    });

    const result = await createMaidProfile.execute({
      userId,
      fullName: req.body.fullName,
      dateOfBirth: req.body.dateOfBirth,
      nationality: req.body.nationality,
      phone: req.body.phone,
    });

    // 4. Return response
    res.status(201).json({
      data: result,
      message: 'Maid profile created successfully',
    });
  } catch (error) {
    console.error('Error creating maid profile:', error);
    res.status(400).json({
      error: {
        message: error.message,
        code: 'PROFILE_CREATION_FAILED',
      },
    });
  }
}

/**
 * PATCH /api/v1/profiles/maid/:profileId
 * Update an existing maid profile
 */
export async function updateMaidProfile(req, res) {
  try {
    // 1. Validate request
    UpdateMaidProfileValidator.validate({ ...req.body, profileId: req.params.profileId });

    // 2. Get user from auth
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      });
    }

    // 3. Execute use case
    const updateMaidProfile = new UpdateMaidProfile({
      maidProfileRepository,
      eventBus,
      auditLogger,
    });

    const result = await updateMaidProfile.execute({
      profileId: req.params.profileId,
      userId,
      updates: req.body.updates,
    });

    // 4. Return response
    res.status(200).json({
      data: result,
      message: 'Maid profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating maid profile:', error);
    const statusCode = error.message === 'Unauthorized' ? 403 : 400;
    res.status(statusCode).json({
      error: {
        message: error.message,
        code: 'PROFILE_UPDATE_FAILED',
      },
    });
  }
}

/**
 * GET /api/v1/profiles/maid/:profileId
 * Get a maid profile by ID
 */
export async function getMaidProfile(req, res) {
  try {
    // 1. Get user from auth
    const requestorId = req.user?.id || null;
    const requestorRole = req.user?.role || 'guest';

    // 2. Execute use case
    const getMaidProfile = new GetMaidProfile({
      maidProfileRepository,
    });

    const result = await getMaidProfile.execute({
      profileId: req.params.profileId,
      requestorId,
      requestorRole,
    });

    // 3. Return response
    res.status(200).json({
      data: result,
    });
  } catch (error) {
    console.error('Error getting maid profile:', error);
    const statusCode = error.message === 'Profile not found' ? 404 :
                        error.message === 'Unauthorized' ? 403 : 400;
    res.status(statusCode).json({
      error: {
        message: error.message,
        code: 'PROFILE_FETCH_FAILED',
      },
    });
  }
}

/**
 * GET /api/v1/profiles/maid
 * Search maid profiles
 */
export async function searchMaidProfiles(req, res) {
  try {
    // 1. Validate query
    SearchMaidProfilesValidator.validate(req.query);

    // 2. Parse query parameters
    const query = {
      skills: req.query.skills ? req.query.skills.split(',') : [],
      languages: req.query.languages ? req.query.languages.split(',') : [],
      countries: req.query.countries ? req.query.countries.split(',') : [],
      nationality: req.query.nationality || null,
      minAge: req.query.minAge ? parseInt(req.query.minAge) : null,
      maxAge: req.query.maxAge ? parseInt(req.query.maxAge) : null,
      status: req.query.status || 'active',
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
    };

    // 3. Execute use case
    const searchMaidProfiles = new SearchMaidProfiles({
      maidProfileRepository,
    });

    const result = await searchMaidProfiles.execute(query);

    // 4. Return response
    res.status(200).json({
      data: result,
    });
  } catch (error) {
    console.error('Error searching maid profiles:', error);
    res.status(400).json({
      error: {
        message: error.message,
        code: 'PROFILE_SEARCH_FAILED',
      },
    });
  }
}

/**
 * POST /api/v1/profiles/maid/:profileId/submit
 * Submit maid profile for review
 */
export async function submitMaidProfileForReview(req, res) {
  try {
    // 1. Get user from auth
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      });
    }

    // 2. Execute use case
    const submitMaidProfileForReview = new SubmitMaidProfileForReview({
      maidProfileRepository,
      eventBus,
      auditLogger,
    });

    const result = await submitMaidProfileForReview.execute({
      profileId: req.params.profileId,
      userId,
    });

    // 3. Return response
    res.status(200).json({
      data: result,
      message: 'Maid profile submitted for review',
    });
  } catch (error) {
    console.error('Error submitting maid profile:', error);
    const statusCode = error.message.includes('Unauthorized') ? 403 : 400;
    res.status(statusCode).json({
      error: {
        message: error.message,
        code: 'PROFILE_SUBMISSION_FAILED',
      },
    });
  }
}

/**
 * POST /api/v1/profiles/maid/:profileId/approve
 * Approve maid profile (admin/agency only)
 */
export async function approveMaidProfile(req, res) {
  try {
    // 1. Get user from auth
    const approvedBy = req.user?.id;
    const approverRole = req.user?.role;

    if (!approvedBy || !approverRole) {
      return res.status(401).json({
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      });
    }

    // 2. Execute use case
    const approveMaidProfile = new ApproveMaidProfile({
      maidProfileRepository,
      eventBus,
      auditLogger,
    });

    const result = await approveMaidProfile.execute({
      profileId: req.params.profileId,
      approvedBy,
      approverRole,
    });

    // 3. Return response
    res.status(200).json({
      data: result,
      message: 'Maid profile approved successfully',
    });
  } catch (error) {
    console.error('Error approving maid profile:', error);
    const statusCode = error.message.includes('Unauthorized') ? 403 : 400;
    res.status(statusCode).json({
      error: {
        message: error.message,
        code: 'PROFILE_APPROVAL_FAILED',
      },
    });
  }
}
