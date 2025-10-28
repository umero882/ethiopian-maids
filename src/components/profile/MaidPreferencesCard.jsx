import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Plus, X } from 'lucide-react';

/**
 * MaidPreferencesCard Component
 * Handles maid preference requirements including skills, languages, and experience
 */
const MaidPreferencesCard = ({
  profileData,
  isEditing,
  onProfileChange,
  sectionAnimation,
  errors = {},
  touched = {},
}) => {
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

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
    <motion.div {...sectionAnimation(0.3)}>
      <Card>
        <CardHeader className='bg-gradient-to-r from-green-50 to-green-100'>
          <div className='flex items-center gap-3'>
            <Award className='h-6 w-6 text-green-600' />
            <div>
              <CardTitle>Maid Preferences</CardTitle>
              <CardDescription>Requirements for your ideal domestic worker</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-6 space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='preferred_experience_years'>Minimum Experience (years)</Label>
            <Input
              id='preferred_experience_years'
              type='number'
              min='0'
              value={profileData.preferred_experience_years}
              onChange={(e) =>
                onProfileChange({
                  ...profileData,
                  preferred_experience_years: parseInt(e.target.value) || 0,
                })
              }
              disabled={!isEditing}
            />
          </div>

          <div className='space-y-2'>
            <Label>Required Skills</Label>
            <div className='flex flex-wrap gap-2 mb-2'>
              {(profileData.required_skills || []).map((skill, index) => (
                <Badge key={index} variant='secondary' className='pl-3 pr-1'>
                  {skill}
                  {isEditing && (
                    <button
                      onClick={() => removeFromArray('required_skills', index)}
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
                  placeholder='e.g., Cooking, Cleaning'
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('required_skills', newSkill, setNewSkill);
                    }
                  }}
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => addToArray('required_skills', newSkill, setNewSkill)}
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
            )}
          </div>

          <div className='space-y-2'>
            <Label>Preferred Languages</Label>
            <div className='flex flex-wrap gap-2 mb-2'>
              {(profileData.preferred_languages || []).map((lang, index) => (
                <Badge key={index} variant='secondary' className='pl-3 pr-1'>
                  {lang}
                  {isEditing && (
                    <button
                      onClick={() => removeFromArray('preferred_languages', index)}
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
                  placeholder='e.g., English, Arabic'
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('preferred_languages', newLanguage, setNewLanguage);
                    }
                  }}
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => addToArray('preferred_languages', newLanguage, setNewLanguage)}
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MaidPreferencesCard;
