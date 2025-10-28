import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Users, Plus, X } from 'lucide-react';

/**
 * FamilyInfoCard Component
 * Handles family and household information including children, elderly care, and pets
 */
const FamilyInfoCard = ({
  profileData,
  isEditing,
  onProfileChange,
  sectionAnimation,
  errors = {},
  touched = {},
}) => {
  const [newChildAge, setNewChildAge] = useState('');
  const [newPetType, setNewPetType] = useState('');

  const addToArray = (field, value, setter) => {
    if (!value.trim()) return;
    onProfileChange({
      ...profileData,
      [field]: [...(profileData[field] || []), value.trim()],
    });
    setter('');
  };

  const removeFromArray = (field, index) => {
    onProfileChange({
      ...profileData,
      [field]: profileData[field].filter((_, i) => i !== index),
    });
  };

  return (
    <motion.div {...sectionAnimation(0.2)}>
      <Card>
        <CardHeader className='bg-gradient-to-r from-purple-50 to-purple-100'>
          <div className='flex items-center gap-3'>
            <Users className='h-6 w-6 text-purple-600' />
            <div>
              <CardTitle>Family Information</CardTitle>
              <CardDescription>Details about your household</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-6 space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='family_size'>Family Size</Label>
              <Input
                id='family_size'
                type='number'
                min='1'
                value={profileData.family_size}
                onChange={(e) =>
                  onProfileChange({
                    ...profileData,
                    family_size: parseInt(e.target.value) || 1,
                  })
                }
                disabled={!isEditing}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='children_count'>Number of Children</Label>
              <Input
                id='children_count'
                type='number'
                min='0'
                value={profileData.children_count}
                onChange={(e) =>
                  onProfileChange({
                    ...profileData,
                    children_count: parseInt(e.target.value) || 0,
                  })
                }
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Children Ages */}
          {profileData.children_count > 0 && (
            <div className='space-y-2'>
              <Label>Children Ages</Label>
              <div className='flex flex-wrap gap-2 mb-2'>
                {(profileData.children_ages || []).map((age, index) => (
                  <Badge key={index} variant='secondary' className='pl-3 pr-1'>
                    {age} years
                    {isEditing && (
                      <button
                        onClick={() => removeFromArray('children_ages', index)}
                        className='ml-2 hover:bg-gray-300 rounded-full p-0.5'
                      >
                        <X className='h-3 w-3' />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              {isEditing && (
                <div className='flex gap-2'>
                  <Input
                    type='number'
                    min='0'
                    max='18'
                    placeholder='Enter age'
                    value={newChildAge}
                    onChange={(e) => setNewChildAge(e.target.value)}
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => addToArray('children_ages', newChildAge, setNewChildAge)}
                  >
                    <Plus className='h-4 w-4' />
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Elderly Care Needed</Label>
              <p className='text-sm text-gray-500'>Requires care for elderly family members</p>
            </div>
            <Switch
              checked={profileData.elderly_care_needed}
              onCheckedChange={(checked) =>
                onProfileChange({ ...profileData, elderly_care_needed: checked })
              }
              disabled={!isEditing}
            />
          </div>

          <Separator />

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Have Pets</Label>
              <p className='text-sm text-gray-500'>Do you have pets at home?</p>
            </div>
            <Switch
              checked={profileData.pets}
              onCheckedChange={(checked) => onProfileChange({ ...profileData, pets: checked })}
              disabled={!isEditing}
            />
          </div>

          {profileData.pets && (
            <div className='space-y-2'>
              <Label>Pet Types</Label>
              <div className='flex flex-wrap gap-2 mb-2'>
                {(profileData.pet_types || []).map((pet, index) => (
                  <Badge key={index} variant='secondary' className='pl-3 pr-1'>
                    {pet}
                    {isEditing && (
                      <button
                        onClick={() => removeFromArray('pet_types', index)}
                        className='ml-2 hover:bg-gray-300 rounded-full p-0.5'
                      >
                        <X className='h-3 w-3' />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              {isEditing && (
                <div className='flex gap-2'>
                  <Input
                    placeholder='e.g., Dog, Cat'
                    value={newPetType}
                    onChange={(e) => setNewPetType(e.target.value)}
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => addToArray('pet_types', newPetType, setNewPetType)}
                  >
                    <Plus className='h-4 w-4' />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FamilyInfoCard;
