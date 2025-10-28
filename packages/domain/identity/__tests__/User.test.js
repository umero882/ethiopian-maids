/**
 * User Entity Tests
 *
 * Tests for domain logic in User entity.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { User } from '../entities/User.js';
import { UserRole } from '../value-objects/UserRole.js';

describe('User Entity', () => {
  let user;

  beforeEach(() => {
    user = new User({
      id: 'user-1',
      email: 'test@example.com',
      emailVerified: false,
      phoneNumber: null,
      phoneVerified: false,
      role: UserRole.maid(),
      status: 'active',
    });
  });

  describe('Email Verification', () => {
    it('should verify email and emit event', () => {
      user.verifyEmail();

      expect(user.emailVerified).toBe(true);

      const events = user.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('UserEmailVerified');
      expect(events[0].payload.userId).toBe('user-1');
    });

    it('should throw error if email already verified', () => {
      user.verifyEmail();

      expect(() => user.verifyEmail()).toThrow('Email already verified');
    });

    it('should update updatedAt timestamp', () => {
      const before = user.updatedAt;

      // Wait a bit to ensure timestamp changes
      setTimeout(() => {
        user.verifyEmail();
        expect(user.updatedAt.getTime()).toBeGreaterThan(before.getTime());
      }, 10);
    });
  });

  describe('Phone Verification', () => {
    it('should verify phone and emit event', () => {
      user.verifyPhone('+1234567890');

      expect(user.phoneNumber).toBe('+1234567890');
      expect(user.phoneVerified).toBe(true);

      const events = user.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('UserPhoneVerified');
    });
  });

  describe('Suspension', () => {
    it('should suspend active user', () => {
      user.suspend('Terms violation');

      expect(user.status).toBe('suspended');

      const events = user.pullDomainEvents();
      expect(events[0].type).toBe('UserSuspended');
      expect(events[0].payload.reason).toBe('Terms violation');
    });

    it('should throw error if user already deleted', () => {
      user.status = 'deleted';

      expect(() => user.suspend('reason')).toThrow('Cannot suspend deleted user');
    });
  });

  describe('Reactivation', () => {
    it('should reactivate suspended user', () => {
      user.suspend('Test');
      user.pullDomainEvents(); // Clear events

      user.reactivate();

      expect(user.status).toBe('active');

      const events = user.pullDomainEvents();
      expect(events[0].type).toBe('UserReactivated');
    });

    it('should throw error if user not suspended', () => {
      expect(() => user.reactivate()).toThrow('Only suspended users can be reactivated');
    });
  });

  describe('Permissions', () => {
    it('should check permissions via role', () => {
      expect(user.can('profile:read')).toBe(true);
      expect(user.can('profile:update')).toBe(true);
      expect(user.can('admin:access')).toBe(false);
    });

    it('should allow all permissions for admin', () => {
      const admin = new User({
        id: 'admin-1',
        email: 'admin@example.com',
        role: UserRole.admin(),
        status: 'active',
      });

      expect(admin.can('profile:read')).toBe(true);
      expect(admin.can('admin:access')).toBe(true);
      expect(admin.can('any:permission')).toBe(true);
    });
  });

  describe('Status Checks', () => {
    it('should check if user is active', () => {
      expect(user.isActive()).toBe(true);

      user.suspend('test');
      expect(user.isActive()).toBe(false);
    });

    it('should check if user is verified', () => {
      expect(user.isVerified()).toBe(false);

      user.verifyEmail();
      expect(user.isVerified()).toBe(false); // Still need phone

      user.verifyPhone('+1234567890');
      expect(user.isVerified()).toBe(true);
    });
  });

  describe('Domain Events', () => {
    it('should accumulate multiple events', () => {
      user.verifyEmail();
      user.verifyPhone('+1234567890');

      const events = user.pullDomainEvents();
      expect(events).toHaveLength(2);
    });

    it('should clear events after pulling', () => {
      user.verifyEmail();
      user.pullDomainEvents();

      const events = user.pullDomainEvents();
      expect(events).toHaveLength(0);
    });
  });
});
