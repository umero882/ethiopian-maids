import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const MaidFilters = ({ filters, setFilters, allSkills, allLanguages }) => {
  const handleMultiSelectChange = (filterKey, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: prev[filterKey].includes(value)
        ? prev[filterKey].filter((item) => item !== value)
        : [...prev[filterKey], value],
    }));
  };

  const handleSliderChange = (filterKey, value) => {
    setFilters((prev) => ({ ...prev, [filterKey]: value }));
  };

  const handleInputChange = (filterKey, value) => {
    setFilters((prev) => ({ ...prev, [filterKey]: value }));
  };

  const countries = [
    { value: 'all', label: 'All Countries' },
    { value: 'Philippines', label: 'Philippines' },
    { value: 'Indonesia', label: 'Indonesia' },
    { value: 'Sri Lanka', label: 'Sri Lanka' },
    { value: 'India', label: 'India' },
    { value: 'Ethiopia', label: 'Ethiopia' },
    { value: 'Kenya', label: 'Kenya' },
    { value: 'Uganda', label: 'Uganda' },
    { value: 'Tanzania', label: 'Tanzania' },
  ];

  const experienceLevels = [
    { value: 'all', label: 'Any Experience' },
    { value: '0-1', label: '0-1 Year' },
    { value: '1-3', label: '1-3 Years' },
    { value: '3-5', label: '3-5 Years' },
    { value: '5+', label: '5+ Years' },
  ];

  const visaStatuses = [
    { value: 'all', label: 'Any Visa Status' },
    { value: 'UAE Valid', label: 'UAE Valid' },
    { value: 'Saudi Valid', label: 'Saudi Valid' },
    { value: 'Qatar Valid', label: 'Qatar Valid' },
    { value: 'Kuwait Valid', label: 'Kuwait Valid' },
    { value: 'Bahrain Valid', label: 'Bahrain Valid' },
    { value: 'Oman Valid', label: 'Oman Valid' },
    { value: 'Home Country', label: 'In Home Country (Needs Visa)' },
  ];

  const serviceTypes = [
    { id: 'childcare', label: 'Childcare' },
    { id: 'elderCare', label: 'Elder Care' },
    { id: 'cooking', label: 'Cooking' },
    { id: 'petCare', label: 'Pet Care' },
    { id: 'generalHousekeeping', label: 'General Housekeeping' },
    { id: 'specialNeedsCare', label: 'Special Needs Care' },
    { id: 'tutoring', label: 'Tutoring' },
    { id: 'laundryServices', label: 'Laundry Services' },
    { id: 'gardening', label: 'Gardening' },
  ];

  const accommodationTypes = [
    { value: 'all', label: 'Any Accommodation' },
    { value: 'Live-in', label: 'Live-in' },
    { value: 'Live-out', label: 'Live-out (Hourly)' },
  ];

  return (
    <div className='space-y-6 p-1'>
      <div>
        <Label
          htmlFor='country-select'
          className='text-md font-semibold mb-2 block'
        >
          Country of Origin
        </Label>
        <Select
          value={filters.country}
          onValueChange={(value) => handleInputChange('country', value)}
        >
          <SelectTrigger id='country-select' className='w-full'>
            <SelectValue placeholder='Select country' />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.value} value={country.value}>
                {country.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label
          htmlFor='experience-select'
          className='text-md font-semibold mb-2 block'
        >
          Years of Experience
        </Label>
        <Select
          value={filters.experience}
          onValueChange={(value) => handleInputChange('experience', value)}
        >
          <SelectTrigger id='experience-select' className='w-full'>
            <SelectValue placeholder='Select experience level' />
          </SelectTrigger>
          <SelectContent>
            {experienceLevels.map((exp) => (
              <SelectItem key={exp.value} value={exp.value}>
                {exp.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className='text-md font-semibold mb-2 block'>Age Range</Label>
        <div className='flex items-center space-x-2 mb-1'>
          <Input
            type='number'
            placeholder='Min'
            value={filters.ageRange[0]}
            onChange={(e) =>
              handleSliderChange('ageRange', [
                parseInt(e.target.value) || 0,
                filters.ageRange[1],
              ])
            }
            className='w-1/2'
          />
          <Input
            type='number'
            placeholder='Max'
            value={filters.ageRange[1]}
            onChange={(e) =>
              handleSliderChange('ageRange', [
                filters.ageRange[0],
                parseInt(e.target.value) || 100,
              ])
            }
            className='w-1/2'
          />
        </div>
        <Slider
          value={filters.ageRange}
          onValueChange={(value) => handleSliderChange('ageRange', value)}
          max={65}
          min={18}
          step={1}
          className='w-full'
        />
        <div className='flex justify-between text-xs text-gray-500 mt-1'>
          <span>{filters.ageRange[0]} years</span>
          <span>{filters.ageRange[1]} years</span>
        </div>
      </div>

      <div>
        <Label
          htmlFor='visa-status-select'
          className='text-md font-semibold mb-2 block'
        >
          Visa Status
        </Label>
        <Select
          value={filters.visaStatus}
          onValueChange={(value) => handleInputChange('visaStatus', value)}
        >
          <SelectTrigger id='visa-status-select' className='w-full'>
            <SelectValue placeholder='Select visa status' />
          </SelectTrigger>
          <SelectContent>
            {visaStatuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className='text-md font-semibold mb-2 block'>
          Service Types
        </Label>
        <div className='grid grid-cols-2 gap-2'>
          {serviceTypes.map((service) => (
            <div key={service.id} className='flex items-center space-x-2'>
              <Checkbox
                id={`service-${service.id}`}
                checked={filters.serviceType.includes(service.label)}
                onCheckedChange={() =>
                  handleMultiSelectChange('serviceType', service.label)
                }
              />
              <Label
                htmlFor={`service-${service.id}`}
                className='font-normal text-sm'
              >
                {service.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label
          htmlFor='accommodation-select'
          className='text-md font-semibold mb-2 block'
        >
          Accommodation Type
        </Label>
        <Select
          value={filters.accommodationType}
          onValueChange={(value) =>
            handleInputChange('accommodationType', value)
          }
        >
          <SelectTrigger id='accommodation-select' className='w-full'>
            <SelectValue placeholder='Select accommodation type' />
          </SelectTrigger>
          <SelectContent>
            {accommodationTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className='text-md font-semibold mb-2 block'>Skills</Label>
        <Select
          onValueChange={(value) =>
            value &&
            !filters.skills.includes(value) &&
            handleMultiSelectChange('skills', value)
          }
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Add skills...' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Available Skills</SelectLabel>
              {allSkills.sort().map((skill) => (
                <SelectItem
                  key={skill}
                  value={skill}
                  disabled={filters.skills.includes(skill)}
                >
                  {skill}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className='mt-2 flex flex-wrap gap-2'>
          {filters.skills.map((skill) => (
            <Badge
              key={skill}
              variant='secondary'
              className='flex items-center gap-1'
            >
              {skill}
              <button
                onClick={() => handleMultiSelectChange('skills', skill)}
                className='text-xs text-red-500 hover:text-red-700'
              >
                ✕
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label className='text-md font-semibold mb-2 block'>
          Languages Spoken
        </Label>
        <Select
          onValueChange={(value) =>
            value &&
            !filters.languages.includes(value) &&
            handleMultiSelectChange('languages', value)
          }
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Add languages...' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Available Languages</SelectLabel>
              {allLanguages.sort().map((lang) => (
                <SelectItem
                  key={lang}
                  value={lang}
                  disabled={filters.languages.includes(lang)}
                >
                  {lang}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className='mt-2 flex flex-wrap gap-2'>
          {filters.languages.map((lang) => (
            <Badge
              key={lang}
              variant='secondary'
              className='flex items-center gap-1'
            >
              {lang}
              <button
                onClick={() => handleMultiSelectChange('languages', lang)}
                className='text-xs text-red-500 hover:text-red-700'
              >
                ✕
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MaidFilters;
