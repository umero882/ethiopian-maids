import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { agencyService } from '@/services/agencyService';
import { toast } from '@/components/ui/use-toast';
import UnifiedMaidForm from '@/components/profile/completion/UnifiedMaidForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProfileCompletionGate from '@/components/agency/ProfileCompletionGate';

/**
 * AgencyAddMaidPage - Page for agencies to add new maids
 * Uses the UnifiedMaidForm for consistency with self-registration
 */
const AgencyAddMaidPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({});

  // Handle form data updates from UnifiedMaidForm
  const handleFormUpdate = (newData) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  // Handle form submission from UnifiedMaidForm
  const handleFormSubmit = async (formData) => {
    setSubmitting(true);
    try {

      // Create the maid profile using the agency service
      const result = await agencyService.createMaidProfile(formData, user?.id);


      toast({
        title: 'Success',
        description: 'Maid profile created successfully!',
      });

      // Navigate back to maids list
      navigate('/dashboard/agency/maids');
    } catch (error) {
      console.error('❌ AgencyAddMaidPage - Error creating maid:', error);
      toast({
        title: 'Error',
        description:
          error.message || 'Failed to create maid profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProfileCompletionGate
      feature="maid management"
      description="Adding maid profiles to your agency"
    >
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => navigate('/dashboard/agency/maids')}
          >
            <ArrowLeft className='mr-2 h-4 w-4' /> Back to Maids
          </Button>
          <h1 className='text-3xl font-bold text-gray-800'>Add New Maid</h1>
        </div>

        {/* Unified Maid Form */}
        <UnifiedMaidForm
          onUpdate={handleFormUpdate}
          onSubmit={handleFormSubmit}
          initialData={formData}
          mode='agency-managed'
        />
      </div>
    </ProfileCompletionGate>
  );
};

export default AgencyAddMaidPage;
