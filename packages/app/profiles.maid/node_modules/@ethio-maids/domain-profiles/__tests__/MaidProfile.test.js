/**
 * MaidProfile Entity Tests
 *
 * Tests for domain logic in MaidProfile entity.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MaidProfile } from '../entities/MaidProfile.js';
import { ProfileStatus } from '../value-objects/ProfileStatus.js';
import { WorkExperience } from '../value-objects/WorkExperience.js';

describe('MaidProfile Entity', () => {
  let profile;

  beforeEach(() => {
    profile = new MaidProfile({
      id: 'profile-1',
      userId: 'user-1',
      fullName: 'Test Maid',
      dateOfBirth: new Date('1995-01-01'),
      nationality: 'ET',
      phone: '+251912345678',
      status: 'draft',
    });
  });

  describe('Creation', () => {
    it('should create profile with required fields', () => {
      expect(profile.id).toBe('profile-1');
      expect(profile.userId).toBe('user-1');
      expect(profile.fullName).toBe('Test Maid');
      expect(profile.status.isDraft()).toBe(true);
    });

    it('should initialize with default values', () => {
      const newProfile = new MaidProfile({
        id: 'profile-2',
        userId: 'user-2',
      });

      expect(newProfile.skills).toEqual([]);
      expect(newProfile.languages).toEqual([]);
      expect(newProfile.workExperience).toEqual([]);
      expect(newProfile.completionPercentage).toBe(0);
    });
  });

  describe('Update Basic Info', () => {
    it('should update basic information', () => {
      profile.updateBasicInfo({
        fullName: 'Updated Name',
        phone: '+251923456789',
      });

      expect(profile.fullName).toBe('Updated Name');
      expect(profile.phone).toBe('+251923456789');

      const events = profile.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('MaidProfileUpdated');
    });

    it('should throw error if profile is archived', () => {
      profile.status = ProfileStatus.archived();

      expect(() => profile.updateBasicInfo({ fullName: 'New Name' }))
        .toThrow('Cannot update archived profile');
    });
  });

  describe('Work Experience', () => {
    it('should add work experience', () => {
      const experience = new WorkExperience({
        country: 'SA',
        jobTitle: 'Housemaid',
        duties: ['cleaning', 'cooking'],
        startDate: '2020-01-01',
        endDate: '2022-01-01',
      });

      profile.addWorkExperience(experience);

      expect(profile.workExperience).toHaveLength(1);
      expect(profile.workExperience[0].country).toBe('SA');

      const events = profile.pullDomainEvents();
      expect(events[0].type).toBe('WorkExperienceAdded');
    });

    it('should throw error for invalid work experience', () => {
      expect(() => profile.addWorkExperience({ invalid: 'data' }))
        .toThrow('Invalid work experience object');
    });
  });

  describe('Skills Management', () => {
    it('should update skills', () => {
      profile.updateSkills(['cooking', 'cleaning', 'childcare']);

      expect(profile.skills).toEqual(['cooking', 'cleaning', 'childcare']);

      const events = profile.pullDomainEvents();
      expect(events[0].type).toBe('MaidSkillsUpdated');
    });

    it('should remove duplicate skills', () => {
      profile.updateSkills(['cooking', 'cooking', 'cleaning']);

      expect(profile.skills).toEqual(['cooking', 'cleaning']);
    });

    it('should throw error for invalid skills', () => {
      expect(() => profile.updateSkills('invalid'))
        .toThrow('Skills must be an array');
    });
  });

  describe('Languages', () => {
    it('should update languages', () => {
      profile.updateLanguages(['en', 'ar', 'am']);

      expect(profile.languages).toEqual(['en', 'ar', 'am']);
    });

    it('should remove duplicate languages', () => {
      profile.updateLanguages(['en', 'en', 'ar']);

      expect(profile.languages).toEqual(['en', 'ar']);
    });
  });

  describe('Document Upload', () => {
    it('should upload passport', () => {
      profile.uploadDocument('passport', 'https://storage.example.com/passport.pdf');

      expect(profile.passport).toBe('https://storage.example.com/passport.pdf');

      const events = profile.pullDomainEvents();
      expect(events[0].type).toBe('DocumentUploaded');
      expect(events[0].payload.documentType).toBe('passport');
    });

    it('should upload medical certificate', () => {
      profile.uploadDocument('medicalCertificate', 'https://storage.example.com/medical.pdf');

      expect(profile.medicalCertificate).toBe('https://storage.example.com/medical.pdf');
    });

    it('should throw error for invalid document type', () => {
      expect(() => profile.uploadDocument('invalidType', 'url'))
        .toThrow('Invalid document type');
    });
  });

  describe('Profile Submission', () => {
    it('should submit complete profile for review', () => {
      // Make profile complete
      profile.fullName = 'Complete Name';
      profile.dateOfBirth = new Date('1995-01-01');
      profile.phone = '+251912345678';
      profile.profilePhoto = 'https://photo.jpg';
      profile.updateSkills(['cooking']);
      profile.updateLanguages(['en']);
      profile.uploadDocument('passport', 'https://passport.pdf');
      profile.uploadDocument('medicalCertificate', 'https://medical.pdf');
      profile.uploadDocument('policeClearance', 'https://police.pdf');
      profile.pullDomainEvents(); // Clear events

      profile.submitForReview();

      expect(profile.status.isUnderReview()).toBe(true);

      const events = profile.pullDomainEvents();
      expect(events[0].type).toBe('MaidProfileSubmitted');
    });

    it('should throw error if profile is incomplete', () => {
      expect(() => profile.submitForReview())
        .toThrow('Profile must be complete before submission');
    });

    it('should throw error if profile is not draft', () => {
      profile.status = ProfileStatus.active();

      expect(() => profile.submitForReview())
        .toThrow('Only draft profiles can be submitted for review');
    });
  });

  describe('Profile Approval', () => {
    beforeEach(() => {
      profile.status = ProfileStatus.underReview();
    });

    it('should approve profile', () => {
      profile.approve('admin-1');

      expect(profile.status.isActive()).toBe(true);
      expect(profile.isVerified).toBe(true);
      expect(profile.verifiedAt).toBeDefined();

      const events = profile.pullDomainEvents();
      expect(events[0].type).toBe('MaidProfileApproved');
      expect(events[0].payload.approvedBy).toBe('admin-1');
    });

    it('should throw error if not under review', () => {
      profile.status = ProfileStatus.draft();

      expect(() => profile.approve('admin-1'))
        .toThrow('Only profiles under review can be approved');
    });
  });

  describe('Profile Rejection', () => {
    beforeEach(() => {
      profile.status = ProfileStatus.underReview();
    });

    it('should reject profile with reason', () => {
      profile.reject('Incomplete documents', 'admin-1');

      expect(profile.status.isRejected()).toBe(true);

      const events = profile.pullDomainEvents();
      expect(events[0].type).toBe('MaidProfileRejected');
      expect(events[0].payload.reason).toBe('Incomplete documents');
    });
  });

  describe('Profile Archival', () => {
    it('should archive active profile', () => {
      profile.status = ProfileStatus.active();

      profile.archive('User requested deletion');

      expect(profile.status.isArchived()).toBe(true);

      const events = profile.pullDomainEvents();
      expect(events[0].type).toBe('MaidProfileArchived');
    });

    it('should throw error if already archived', () => {
      profile.status = ProfileStatus.archived();

      expect(() => profile.archive('reason'))
        .toThrow('Profile already archived');
    });
  });

  describe('Completion Percentage', () => {
    it('should calculate completion percentage', () => {
      expect(profile.completionPercentage).toBeGreaterThan(0);

      profile.updateSkills(['cooking']);
      profile.updateLanguages(['en']);
      profile.uploadDocument('passport', 'url');

      expect(profile.completionPercentage).toBeGreaterThan(50);
    });

    it('should be 100% when all required fields filled', () => {
      profile.fullName = 'Name';
      profile.dateOfBirth = new Date('1995-01-01');
      profile.phone = '+251912345678';
      profile.profilePhoto = 'photo.jpg';
      profile.updateSkills(['cooking']);
      profile.updateLanguages(['en']);
      profile.uploadDocument('passport', 'passport.pdf');
      profile.uploadDocument('medicalCertificate', 'medical.pdf');
      profile.uploadDocument('policeClearance', 'police.pdf');

      expect(profile.completionPercentage).toBe(100);
      expect(profile.isComplete()).toBe(true);
    });
  });

  describe('Domain Events', () => {
    it('should accumulate multiple events', () => {
      profile.updateBasicInfo({ fullName: 'New Name' });
      profile.updateSkills(['cooking']);
      profile.uploadDocument('passport', 'url');

      const events = profile.pullDomainEvents();
      expect(events.length).toBeGreaterThanOrEqual(3);
    });

    it('should clear events after pulling', () => {
      profile.updateBasicInfo({ fullName: 'Name' });
      profile.pullDomainEvents();

      const events = profile.pullDomainEvents();
      expect(events).toHaveLength(0);
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON', () => {
      const json = profile.toJSON();

      expect(json.id).toBe('profile-1');
      expect(json.userId).toBe('user-1');
      expect(json.fullName).toBe('Test Maid');
      expect(json.status).toBe('draft');
    });
  });
});
