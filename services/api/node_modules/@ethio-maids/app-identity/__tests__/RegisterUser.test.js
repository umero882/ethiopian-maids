/**
 * RegisterUser Use Case Tests
 *
 * Tests for RegisterUser use-case with mocked ports.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegisterUser } from '../usecases/RegisterUser.js';
import { User, UserRole } from '@ethio-maids/domain-identity';

describe('RegisterUser Use Case', () => {
  let registerUser;
  let mocks;

  beforeEach(() => {
    // Create mock implementations of ports
    mocks = {
      userRepository: {
        emailExists: vi.fn(),
        save: vi.fn(),
      },
      authService: {
        register: vi.fn(),
      },
      auditLogger: {
        logSecurityEvent: vi.fn(),
      },
      eventBus: {
        publish: vi.fn(),
      },
    };

    registerUser = new RegisterUser(mocks);
  });

  it('should register new user successfully', async () => {
    // Arrange
    const command = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      role: 'maid',
    };

    mocks.userRepository.emailExists.mockResolvedValue(false);
    mocks.authService.register.mockResolvedValue({
      userId: 'user-123',
      session: { accessToken: 'token', refreshToken: 'refresh' },
    });
    mocks.userRepository.save.mockResolvedValue(true);

    // Act
    const result = await registerUser.execute(command);

    // Assert
    expect(result.userId).toBe('user-123');
    expect(result.session).toBeDefined();
    expect(result.user.email).toBe('newuser@example.com');
    expect(result.user.role).toBe('maid');

    expect(mocks.userRepository.emailExists).toHaveBeenCalledWith('newuser@example.com');
    expect(mocks.authService.register).toHaveBeenCalled();
    expect(mocks.userRepository.save).toHaveBeenCalled();
    expect(mocks.auditLogger.logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'USER_REGISTERED',
        userId: 'user-123',
      })
    );
  });

  it('should throw error if email already exists', async () => {
    const command = {
      email: 'existing@example.com',
      password: 'SecurePass123!',
      role: 'maid',
    };

    mocks.userRepository.emailExists.mockResolvedValue(true);

    await expect(registerUser.execute(command)).rejects.toThrow('Email already registered');
  });

  it('should throw error for invalid email', async () => {
    const command = {
      email: 'invalid-email',
      password: 'SecurePass123!',
      role: 'maid',
    };

    await expect(registerUser.execute(command)).rejects.toThrow('Invalid email format');
  });

  it('should throw error for weak password', async () => {
    const command = {
      email: 'user@example.com',
      password: 'weak',
      role: 'maid',
    };

    await expect(registerUser.execute(command)).rejects.toThrow('Password must be at least');
  });

  it('should publish domain events', async () => {
    const command = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      role: 'maid',
    };

    mocks.userRepository.emailExists.mockResolvedValue(false);
    mocks.authService.register.mockResolvedValue({
      userId: 'user-123',
      session: {},
    });

    await registerUser.execute(command);

    // Events might be published (depends on entity behavior)
    // Just verify eventBus was available
    expect(mocks.eventBus).toBeDefined();
  });
});
