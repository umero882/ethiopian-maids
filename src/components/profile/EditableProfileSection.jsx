import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Edit, Save, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const EditableProfileSection = ({
  title,
  icon: Icon,
  children,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  hasChanges = false,
  isLoading = false,
  error = null,
  canEdit = true,
  className = '',
  headerActions = null,
}) => {
  const [localIsEditing, setLocalIsEditing] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Use external editing state if provided, otherwise use local state
  const editingState = isEditing !== undefined ? isEditing : localIsEditing;

  useEffect(() => {
    setShowUnsavedWarning(hasChanges && !editingState);
  }, [hasChanges, editingState]);

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      setLocalIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      if (onSave) {
        await onSave();
      }
      if (isEditing === undefined) {
        setLocalIsEditing(false);
      }
      setShowUnsavedWarning(false);
      toast({
        title: 'Section updated',
        description: `${title} has been saved successfully.`,
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save failed',
        description:
          error.message || 'Failed to save changes. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmCancel = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmCancel) return;
    }

    if (onCancel) {
      onCancel();
    }
    if (isEditing === undefined) {
      setLocalIsEditing(false);
    }
    setShowUnsavedWarning(false);
  };

  return (
    <Card
      className={cn(
        'relative transition-all duration-200',
        editingState && 'ring-2 ring-blue-200 shadow-lg',
        error && 'ring-2 ring-red-200',
        className
      )}
    >
      {/* Unsaved changes indicator */}
      {showUnsavedWarning && (
        <div className='absolute -top-2 -right-2 z-10'>
          <Badge variant='destructive' className='animate-pulse'>
            Unsaved
          </Badge>
        </div>
      )}

      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-lg'>
            {Icon && <Icon className='h-5 w-5 text-gray-600' />}
            {title}
            {editingState && (
              <Badge variant='secondary' className='text-xs'>
                Editing
              </Badge>
            )}
          </CardTitle>

          <div className='flex items-center gap-2'>
            {headerActions}

            {canEdit && (
              <div className='flex items-center gap-1'>
                {editingState ? (
                  <>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleCancel}
                      disabled={isLoading}
                      className='h-8'
                    >
                      <X className='h-3 w-3 mr-1' />
                      Cancel
                    </Button>
                    <Button
                      size='sm'
                      onClick={handleSave}
                      disabled={isLoading || !hasChanges}
                      className='h-8'
                    >
                      {isLoading ? (
                        <Loader2 className='h-3 w-3 mr-1 animate-spin' />
                      ) : (
                        <Save className='h-3 w-3 mr-1' />
                      )}
                      Save
                    </Button>
                  </>
                ) : (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleEdit}
                    className='h-8'
                  >
                    <Edit className='h-3 w-3 mr-1' />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className='flex items-center gap-2 text-sm text-red-600 mt-2'>
            <AlertCircle className='h-4 w-4' />
            <span>{error}</span>
          </div>
        )}
      </CardHeader>

      <CardContent
        className={cn(
          'transition-all duration-200',
          editingState && 'bg-blue-50/30'
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
};

// Hook for managing section editing state
export const useEditableSection = (initialData = {}) => {
  const [data, setData] = useState(initialData);
  const [originalData, setOriginalData] = useState(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const hasChanges = JSON.stringify(data) !== JSON.stringify(originalData);

  const startEditing = () => {
    setOriginalData({ ...data });
    setIsEditing(true);
    setError(null);
  };

  const cancelEditing = () => {
    setData({ ...originalData });
    setIsEditing(false);
    setError(null);
  };

  const updateField = (field, value) => {
    setData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const saveChanges = async (saveFunction) => {
    if (!hasChanges) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await saveFunction(data);
      setOriginalData({ ...data });
      setIsEditing(false);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to save changes');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetData = (newData) => {
    setData(newData);
    setOriginalData(newData);
    setIsEditing(false);
    setError(null);
  };

  return {
    data,
    originalData,
    isEditing,
    isLoading,
    error,
    hasChanges,
    startEditing,
    cancelEditing,
    updateField,
    saveChanges,
    resetData,
    setData,
  };
};

export default EditableProfileSection;
