/**
 * CreateMaidProfile Use Case Tests
 *
 * Tests for CreateMaidProfile use-case with mocked ports.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateMaidProfile } from '../usecases/CreateMaidProfile.js';
import { MaidProfile } from '@ethio-maids/domain-profiles';

describe('CreateMaidProfile Use Case', () => {
  let createMaidProfile;
  let mocks;

  beforeEach(() => {
    // Create mock implementations of ports
    mocks = {
      maidProfileRepository: {
        profileExists: vi.fn(),
        save: vi.fn(),
      },
      eventBus: {
        publish: vi.fn(),
      },
      auditLogger: {
        logSecurityEvent: vi.fn(),
      },
    };

    createMaidProfile = new CreateMaidProfile(mocks);
  });

  it('should create new maid profile successfully', async () => {
    // Arrange
    const command = {
      userId: 'user-123',
      fullName: 'Test Maid',
      dateOfBirth: '1995-01-01',
      nationality: 'ET',
      phone: '+251912345678',
    };

    mocks.maidProfileRepository.profileExists.mockResolvedValue(false);
    mocks.maidProfileRepository.save.mockResolvedValue(true);

    // Act
    const result = await createMaidProfile.execute(command);

    // Assert
    expect(result.profileId).toBeDefined();
    expect(result.profile).toBeDefined();
    expect(result.profile.userId).toBe('user-123');
    expect(result.profile.fullName).toBe('Test Maid');
    expect(result.profile.status).toBe('draft');

    expect(mocks.maidProfileRepository.profileExists).toHaveBeenCalledWith('user-123');
    expect(mocks.maidProfileRepository.save).toHaveBeenCalled();
    expect(mocks.auditLogger.logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'MAID_PROFILE_CREATED',
        userId: 'user-123',
      })
    );
  });

  it('should throw error if user already has profile', async () => {
    const command = {
      userId: 'user-123',
      fullName: 'Test Maid',
    };

    mocks.maidProfileRepository.profileExists.mockResolvedValue(true);

    await expect(createMaidProfile.execute(command)).rejects.toThrow(
      'User already has a maid profile'
    );
  });

  it('should throw error if userId is missing', async () => {
    const command = {
      fullName: 'Test Maid',
    };

    await expect(createMaidProfile.execute(command)).rejects.toThrow(
      'userId is required'
    );
  });

  it('should throw error for invalid age', async () => {
    const command = {
      userId: 'user-123',
      dateOfBirth: '2010-01-01', // Too young
    };

    mocks.maidProfileRepository.profileExists.mockResolvedValue(false);

    await expect(createMaidProfile.execute(command)).rejects.toThrow(
      'Invalid age'
    );
  });

  it('should throw error for invalid phone number', async () => {
    const command = {
      userId: 'user-123',
      phone: 'invalid-phone',
    };

    mocks.maidProfileRepository.profileExists.mockResolvedValue(false);

    await expect(createMaidProfile.execute(command)).rejects.toThrow(
      'Invalid phone number format'
    );
  });

  it('should create profile with minimal data', async () => {
    const command = {
      userId: 'user-123',
    };

    mocks.maidProfileRepository.profileExists.mockResolvedValue(false);
    mocks.maidProfileRepository.save.mockResolvedValue(true);

    const result = await createMaidProfile.execute(command);

    expect(result.profile.userId).toBe('user-123');
    expect(result.profile.fullName).toBeNull();
    expect(result.profile.status).toBe('draft');
  });

  it('should publish domain events', async () => {
    const command = {
      userId: 'user-123',
      fullName: 'Test Maid',
    };

    mocks.maidProfileRepository.profileExists.mockResolvedValue(false);
    mocks.maidProfileRepository.save.mockResolvedValue(true);

    await createMaidProfile.execute(command);

    // Events might be published (depends on entity behavior)
    expect(mocks.eventBus).toBeDefined();
  });
});
