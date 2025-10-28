import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';

/**
 * ProfileHeader Component
 * Displays profile completion, edit controls, and validation errors
 */
const ProfileHeader = ({
  editMode,
  setEditMode,
  showPreview,
  setShowPreview,
  profileCompleteness,
  saving,
  autoSaving,
  hasUnsavedChanges,
  validationErrors,
  onSave,
  onCancel,
  progressAnnouncementRef,
}) => {
  return (
    <div className='space-y-6'>
      {/* Header Section */}
      <div className='bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-6'>
        <div className='flex justify-between items-start'>
          <div className='flex items-start gap-4'>
            <Button
              variant='ghost'
              asChild
              className='gap-2 text-gray-600 hover:text-purple-600 hover:bg-white/60'
            >
              <a href='/dashboard/maid'>
                <ArrowLeft className='h-4 w-4' />
                Dashboard
              </a>
            </Button>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                Build Your Professional Profile
              </h1>
              <p className='text-gray-600 max-w-2xl'>
                Create a compelling profile to attract the best employers. Complete
                all sections to maximize your visibility.
              </p>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            {/* Auto-save indicator */}
            {autoSaving && (
              <div
                className='flex items-center gap-2 text-sm text-gray-500'
                role='status'
                aria-live='polite'
              >
                <Loader2 className='h-4 w-4 animate-spin' />
                Saving changes...
              </div>
            )}

            {/* Progress announcement for screen readers */}
            <div
              ref={progressAnnouncementRef}
              className='sr-only'
              aria-live='polite'
              aria-atomic='true'
            />

            {/* Edit/Save buttons */}
            {!editMode ? (
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={() => setShowPreview(!showPreview)}
                  className='gap-2'
                >
                  {showPreview ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                  {showPreview ? 'Hide Preview' : 'Preview'}
                </Button>
                <Button
                  onClick={() => setEditMode(true)}
                  className='gap-2 bg-purple-600 hover:bg-purple-700'
                >
                  <Edit className='h-4 w-4' />
                  Edit Profile
                </Button>
              </div>
            ) : (
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={onCancel}
                  disabled={saving}
                >
                  <X className='h-4 w-4 mr-1' />
                  Cancel
                </Button>
                <Button
                  onClick={onSave}
                  className='gap-2 bg-green-600 hover:bg-green-700'
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className='h-4 w-4' />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Profile completion progress */}
        <div className='mt-6'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm font-medium text-gray-700'>
              Profile Completion
            </span>
            <span className='text-sm font-bold text-purple-700'>
              {profileCompleteness}%
            </span>
          </div>
          <Progress value={profileCompleteness} className='h-3 bg-white border' />
          <div className='flex justify-between mt-1'>
            <span className='text-xs text-gray-500'>
              {profileCompleteness < 50
                ? 'Getting started'
                : profileCompleteness < 80
                ? 'Almost there'
                : 'Excellent profile!'}
            </span>
            <span className='text-xs text-gray-500'>
              {profileCompleteness === 100
                ? 'Complete'
                : 'Complete all sections to maximize visibility'}
            </span>
          </div>
        </div>
      </div>

      {/* Validation Errors Alert */}
      {Object.keys(validationErrors).length > 0 && editMode && (
        <Alert className='border-red-200 bg-red-50'>
          <AlertTriangle className='h-4 w-4 text-red-600' />
          <AlertDescription className='text-red-800'>
            <strong>Please fix these errors:</strong>
            <ul className='list-disc list-inside mt-2 space-y-1'>
              {Object.values(validationErrors).map((error, index) => (
                <li key={index} className='text-sm'>
                  {error}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ProfileHeader;
