import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Plus, X } from 'lucide-react';

/**
 * BudgetWorkCard Component
 * Handles salary budget and work conditions including hours, benefits, and requirements
 */
const BudgetWorkCard = ({
  profileData,
  isEditing,
  onProfileChange,
  sectionAnimation,
  errors = {},
  touched = {},
}) => {
  const [newBenefit, setNewBenefit] = useState('');

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
    <motion.div {...sectionAnimation(0.4)}>
      <Card>
        <CardHeader className='bg-gradient-to-r from-orange-50 to-orange-100'>
          <div className='flex items-center gap-3'>
            <DollarSign className='h-6 w-6 text-orange-600' />
            <div>
              <CardTitle>Budget & Work Conditions</CardTitle>
              <CardDescription>Salary range and working arrangements</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-6 space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='salary_budget_min'>Minimum Salary</Label>
              <Input
                id='salary_budget_min'
                type='number'
                min='0'
                value={profileData.salary_budget_min || ''}
                onChange={(e) =>
                  onProfileChange({
                    ...profileData,
                    salary_budget_min: parseInt(e.target.value) || null,
                  })
                }
                disabled={!isEditing}
                placeholder='0'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='salary_budget_max'>Maximum Salary</Label>
              <Input
                id='salary_budget_max'
                type='number'
                min='0'
                value={profileData.salary_budget_max || ''}
                onChange={(e) =>
                  onProfileChange({
                    ...profileData,
                    salary_budget_max: parseInt(e.target.value) || null,
                  })
                }
                disabled={!isEditing}
                placeholder='0'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='currency'>Currency</Label>
              <Select
                value={profileData.currency}
                onValueChange={(value) =>
                  onProfileChange({ ...profileData, currency: value })
                }
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='USD'>USD</SelectItem>
                  <SelectItem value='SAR'>SAR</SelectItem>
                  <SelectItem value='AED'>AED</SelectItem>
                  <SelectItem value='EUR'>EUR</SelectItem>
                  <SelectItem value='GBP'>GBP</SelectItem>
                  <SelectItem value='ETB'>ETB (Ethiopian Birr)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='working_hours_per_day'>Working Hours/Day</Label>
              <Input
                id='working_hours_per_day'
                type='number'
                min='1'
                max='24'
                value={profileData.working_hours_per_day}
                onChange={(e) =>
                  onProfileChange({
                    ...profileData,
                    working_hours_per_day: parseInt(e.target.value) || 8,
                  })
                }
                disabled={!isEditing}
              />
              <p className='text-xs text-gray-500'>Standard: 8-10 hours</p>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='days_off_per_week'>Days Off/Week</Label>
              <Input
                id='days_off_per_week'
                type='number'
                min='0'
                max='7'
                value={profileData.days_off_per_week}
                onChange={(e) =>
                  onProfileChange({
                    ...profileData,
                    days_off_per_week: parseInt(e.target.value) || 1,
                  })
                }
                disabled={!isEditing}
              />
              <p className='text-xs text-gray-500'>Standard: 1 day</p>
            </div>
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Live-in Required</Label>
              <p className='text-sm text-gray-500'>Maid must live at your residence</p>
            </div>
            <Switch
              checked={profileData.live_in_required}
              onCheckedChange={(checked) =>
                onProfileChange({ ...profileData, live_in_required: checked })
              }
              disabled={!isEditing}
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Overtime Available</Label>
              <p className='text-sm text-gray-500'>Can work extra hours when needed</p>
            </div>
            <Switch
              checked={profileData.overtime_available}
              onCheckedChange={(checked) =>
                onProfileChange({ ...profileData, overtime_available: checked })
              }
              disabled={!isEditing}
            />
          </div>

          <div className='space-y-2'>
            <Label>Additional Benefits</Label>
            <p className='text-xs text-gray-500 mb-2'>
              Include benefits like health insurance, annual bonus, transportation, etc.
            </p>
            <div className='flex flex-wrap gap-2 mb-2'>
              {(profileData.additional_benefits || []).map((benefit, index) => (
                <Badge key={index} variant='secondary' className='pl-3 pr-1'>
                  {benefit}
                  {isEditing && (
                    <button
                      onClick={() => removeFromArray('additional_benefits', index)}
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
                  placeholder='e.g., Health Insurance, Annual Bonus'
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('additional_benefits', newBenefit, setNewBenefit);
                    }
                  }}
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => addToArray('additional_benefits', newBenefit, setNewBenefit)}
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

export default BudgetWorkCard;
