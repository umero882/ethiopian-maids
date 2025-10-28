import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { agencyService } from '@/services/agencyService';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

const AgencyEditMaidPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [maid, setMaid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    experience: '',
    status: '',
    skills: [],
    agencyNotes: '',
  });

  // Available skills for selection
  const availableSkills = [
    'Cooking',
    'Cleaning',
    'Childcare',
    'Elderly Care',
    'Laundry',
    'Pet Care',
    'Gardening',
    'Driving',
  ];

  useEffect(() => {
    const fetchMaid = async () => {
      try {
        const { data, error } = await agencyService.getAgencyMaidById(id);

        if (error) {
          setError(error);
          toast({
            title: 'Error loading maid details',
            description:
              error.message || 'An error occurred while loading maid details.',
            variant: 'destructive',
          });
        } else if (!data) {
          setError(new Error('Maid not found'));
          toast({
            title: 'Maid not found',
            description: 'The requested maid profile could not be found.',
            variant: 'destructive',
          });
        } else {
          setMaid(data);
          // Initialize form data with maid data
          setFormData({
            name: data.name || '',
            country: data.country || '',
            experience: data.experience || '',
            status: data.status || 'pending',
            skills: data.skills || [],
            agencyNotes: data.agencyNotes || '',
          });
        }
      } catch (err) {
        setError(err);
        toast({
          title: 'Error loading maid details',
          description: 'An unexpected error occurred.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMaid();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleStatusChange = (value) => {
    setFormData({
      ...formData,
      status: value,
    });
  };

  const handleSkillToggle = (skill) => {
    setFormData((prev) => {
      const newSkills = prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill];

      return {
        ...prev,
        skills: newSkills,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data, error } = await agencyService.updateAgencyMaid(
        id,
        formData
      );

      if (error) {
        toast({
          title: 'Error updating maid profile',
          description:
            error.message || 'An error occurred while updating the profile.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Profile updated',
          description: 'The maid profile has been successfully updated.',
        });
        navigate(`/dashboard/agency/maids/${id}`);
      }
    } catch (err) {
      toast({
        title: 'Error updating maid profile',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full p-10'>
        <div className='text-center space-y-4'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700 mx-auto'></div>
          <p className='text-gray-600'>Loading maid details...</p>
        </div>
      </div>
    );
  }

  if (error || !maid) {
    return (
      <div className='flex flex-col items-center justify-center h-full p-10'>
        <div className='text-center space-y-4'>
          <div className='bg-red-100 text-red-700 p-4 rounded-lg max-w-md'>
            <p className='font-semibold'>Error loading maid details</p>
            <p>{error?.message || 'The requested maid could not be found.'}</p>
          </div>
          <Button
            onClick={() => navigate('/dashboard/agency/maids')}
            variant='outline'
          >
            <ArrowLeft className='mr-2 h-4 w-4' /> Back to Maids
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => navigate(`/dashboard/agency/maids/${id}`)}
          >
            <ArrowLeft className='mr-2 h-4 w-4' /> Back
          </Button>
          <h1 className='text-3xl font-bold text-gray-800'>
            Edit Maid Profile
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <Card className='shadow-lg border-0'>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update the maid's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Full Name</Label>
                <Input
                  id='name'
                  name='name'
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder='Enter full name'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='country'>Nationality</Label>
                <Input
                  id='country'
                  name='country'
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder='Enter country of origin'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='experience'>Experience</Label>
                <Input
                  id='experience'
                  name='experience'
                  value={formData.experience}
                  onChange={handleInputChange}
                  placeholder='e.g., 3 years'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='status'>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger id='status'>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='active'>Active</SelectItem>
                    <SelectItem value='pending'>Pending</SelectItem>
                    <SelectItem value='placed'>Placed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className='shadow-lg border-0'>
            <CardHeader>
              <CardTitle>Skills & Notes</CardTitle>
              <CardDescription>Update skills and agency notes</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-3'>
                <Label>Skills</Label>
                <div className='grid grid-cols-2 gap-2'>
                  {availableSkills.map((skill) => (
                    <div key={skill} className='flex items-center space-x-2'>
                      <Checkbox
                        id={`skill-${skill}`}
                        checked={formData.skills.includes(skill)}
                        onCheckedChange={() => handleSkillToggle(skill)}
                      />
                      <Label
                        htmlFor={`skill-${skill}`}
                        className='cursor-pointer'
                      >
                        {skill}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='agencyNotes'>Agency Notes</Label>
                <Textarea
                  id='agencyNotes'
                  name='agencyNotes'
                  value={formData.agencyNotes}
                  onChange={handleInputChange}
                  placeholder='Internal notes about this maid'
                  className='min-h-[100px]'
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='mt-6 flex justify-end space-x-3'>
          <Button
            type='button'
            variant='outline'
            onClick={() => navigate(`/dashboard/agency/maids/${id}`)}
          >
            Cancel
          </Button>
          <Button type='submit' disabled={saving}>
            {saving ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Saving Changes
              </>
            ) : (
              <>
                <Save className='mr-2 h-4 w-4' />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AgencyEditMaidPage;
