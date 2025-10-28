/**
 * Unit Tests for SponsorService
 * Tests all core sponsor profile operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sponsorService } from '../sponsorService';
import { supabase } from '@/lib/databaseClient';

// Mock Supabase
vi.mock('@/lib/databaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('SponsorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadAvatar', () => {
    it('should upload avatar successfully', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const userId = 'user-123';
      const mockPath = `sponsor-avatars/${userId}-${Date.now()}.jpg`;
      const mockUrl = `https://storage.supabase.co/avatars/${mockPath}`;

      const uploadMock = vi.fn().mockResolvedValue({
        data: { path: mockPath },
        error: null,
      });

      const getPublicUrlMock = vi.fn().mockReturnValue({
        data: { publicUrl: mockUrl },
      });

      supabase.storage.from = vi.fn(() => ({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
      }));

      const result = await sponsorService.uploadAvatar(userId, mockFile);

      expect(result.error).toBeNull();
      expect(result.data).toHaveProperty('url');
      expect(result.data).toHaveProperty('path');
      expect(uploadMock).toHaveBeenCalled();
    });

    it('should return error when no file provided', async () => {
      const result = await sponsorService.uploadAvatar('user-123', null);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toBe('No file provided');
      expect(result.data).toBeNull();
    });

    it('should handle upload errors', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockError = new Error('Upload failed');

      supabase.storage.from = vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
        getPublicUrl: vi.fn(),
      }));

      const result = await sponsorService.uploadAvatar('user-123', mockFile);

      expect(result.error).toBe(mockError);
      expect(result.data).toBeNull();
    });
  });

  describe('getSponsorProfile', () => {
    it('should fetch sponsor profile and map column names', async () => {
      const userId = 'user-123';
      const mockProfileData = {
        id: userId,
        full_name: 'John Doe',
        household_size: 4,
        number_of_children: 2,
        city: 'Dubai',
        country: 'UAE',
        avatar_url: 'https://example.com/avatar.jpg',
      };

      const mockAvatarData = {
        avatar_url: 'https://example.com/avatar2.jpg',
      };

      const singleMock = vi.fn()
        .mockResolvedValueOnce({ data: mockProfileData, error: null })
        .mockResolvedValueOnce({ data: mockAvatarData, error: null });

      supabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: singleMock,
      }));

      const result = await sponsorService.getSponsorProfile(userId);

      expect(result.error).toBeNull();
      expect(result.data).toHaveProperty('family_size', 4);
      expect(result.data).toHaveProperty('children_count', 2);
      expect(result.data.household_size).toBe(4);
      expect(result.data.number_of_children).toBe(2);
    });

    it('should return PROFILE_NOT_FOUND error when profile does not exist', async () => {
      const userId = 'user-123';

      supabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      }));

      const result = await sponsorService.getSponsorProfile(userId);

      expect(result.error).toBeTruthy();
      expect(result.error.code).toBe('PROFILE_NOT_FOUND');
      expect(result.data).toBeNull();
    });
  });

  describe('updateSponsorProfile', () => {
    it('should update existing profile and map field names', async () => {
      const userId = 'user-123';
      const profileData = {
        full_name: 'John Doe',
        family_size: 5,
        children_count: 3,
        city: 'Dubai',
        country: 'UAE',
      };

      const existingProfile = { id: userId };

      const singleMock = vi.fn()
        .mockResolvedValueOnce({ data: existingProfile, error: null })
        .mockResolvedValueOnce({
          data: { ...profileData, household_size: 5, number_of_children: 3 },
          error: null,
        });

      supabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: singleMock,
      }));

      const result = await sponsorService.updateSponsorProfile(userId, profileData);

      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
    });

    it('should insert new profile if not exists', async () => {
      const userId = 'user-456';
      const profileData = {
        full_name: 'Jane Smith',
        family_size: 3,
        children_count: 1,
      };

      const singleMock = vi.fn()
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({
          data: { id: userId, ...profileData },
          error: null,
        });

      supabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: singleMock,
      }));

      const result = await sponsorService.updateSponsorProfile(userId, profileData);

      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
    });
  });

  describe('searchMaids', () => {
    it('should search maids with filters', async () => {
      const filters = {
        searchText: 'cook',
        country: 'Ethiopia',
        minExperience: 2,
      };

      const mockMaids = [
        { id: '1', name: 'Maid 1', country: 'Ethiopia', years_experience: 3 },
        { id: '2', name: 'Maid 2', country: 'Ethiopia', years_experience: 5 },
      ];

      supabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockMaids, error: null }),
      }));

      const result = await sponsorService.searchMaids(filters);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it('should sanitize search text to prevent SQL injection', async () => {
      const filters = {
        searchText: "cook'; DROP TABLE profiles; --",
      };

      supabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      }));

      const result = await sponsorService.searchMaids(filters);

      expect(result.error).toBeNull();
      // Verify that dangerous characters were removed
      expect(filters.searchText).not.toContain("'");
      expect(filters.searchText).not.toContain(';');
    });
  });

  describe('addToFavorites', () => {
    it('should add maid to favorites', async () => {
      const maidId = 'maid-123';
      const notes = 'Great cook';
      const mockUser = { id: 'sponsor-123' };

      supabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      supabase.from = vi.fn(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'fav-1', sponsor_id: mockUser.id, maidId, notes },
          error: null,
        }),
      }));

      const result = await sponsorService.addToFavorites(maidId, notes);

      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
    });

    it('should return error when user not authenticated', async () => {
      supabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await sponsorService.addToFavorites('maid-123');

      expect(result.error).toBeTruthy();
      expect(result.error.message).toBe('Not authenticated');
    });
  });

  describe('createBooking', () => {
    it('should create booking request', async () => {
      const bookingData = {
        maid_id: 'maid-123',
        start_date: '2025-11-01',
        notes: 'Need full-time help',
      };

      const mockUser = { id: 'sponsor-123' };

      supabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      supabase.from = vi.fn(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'booking-1', ...bookingData, sponsor_id: mockUser.id, status: 'pending' },
          error: null,
        }),
      }));

      const result = await sponsorService.createBooking(bookingData);

      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(result.data.status).toBe('pending');
    });
  });

  describe('getDashboardStats', () => {
    it('should fetch dashboard statistics', async () => {
      const mockUser = { id: 'sponsor-123' };

      supabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      supabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }));

      // Mock the Promise.all results
      vi.spyOn(Promise, 'all').mockResolvedValue([
        { count: 10 },
        { count: 5 },
        { count: 2 },
      ]);

      const result = await sponsorService.getDashboardStats();

      expect(result.error).toBeNull();
      expect(result.data).toHaveProperty('totalBookings');
      expect(result.data).toHaveProperty('totalFavorites');
      expect(result.data).toHaveProperty('activeBookings');
    });
  });
});
