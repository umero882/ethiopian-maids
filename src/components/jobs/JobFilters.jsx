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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const JobFilters = ({ filters, setFilters, allRequirements, allLanguages }) => {
  const handleInputChange = (filterKey, value) => {
    setFilters((prev) => ({ ...prev, [filterKey]: value }));
  };

  const handleMultiSelectChange = (filterKey, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: prev[filterKey].includes(value)
        ? prev[filterKey].filter((item) => item !== value)
        : [...prev[filterKey], value],
    }));
  };

  const countries = [
    { value: 'all', label: 'All Countries' },
    { value: 'UAE', label: 'UAE' },
    { value: 'Saudi Arabia', label: 'Saudi Arabia' },
    { value: 'Qatar', label: 'Qatar' },
    { value: 'Kuwait', label: 'Kuwait' },
    { value: 'Bahrain', label: 'Bahrain' },
    { value: 'Oman', label: 'Oman' },
  ];

  const jobTypes = [
    { value: 'all', label: 'All Job Types' },
    { value: 'Full-time', label: 'Full-time' },
    { value: 'Part-time', label: 'Part-time' },
    { value: 'Contract', label: 'Contract' },
    { value: 'Hourly', label: 'Hourly' },
  ];

  const accommodationTypes = [
    { value: 'all', label: 'Any Accommodation' },
    { value: 'Live-in', label: 'Live-in' },
    { value: 'Live-out', label: 'Live-out' },
    { value: 'Hourly (Not Live-in)', label: 'Hourly (Not Live-in)' },
  ];

  const visaStatusesRequired = [
    { value: 'all', label: 'Any Visa Status' },
    { value: 'UAE Valid', label: 'UAE Valid' },
    { value: 'Transferable Iqama', label: 'Transferable Iqama (KSA)' },
    { value: 'Saudi Valid', label: 'Saudi Valid' },
    { value: 'Qatar Valid RP', label: 'Qatar Valid RP' },
    {
      value: 'Kuwait Valid (Article 18 or 20)',
      label: 'Kuwait Valid (Article 18 or 20)',
    },
    { value: 'Bahrain Valid', label: 'Bahrain Valid' },
    { value: 'New Visa Available', label: 'New Visa Available' },
  ];

  const serviceTypes = [
    { id: 'childcare', label: 'Childcare' },
    { id: 'elderCare', label: 'Elder Care' },
    { id: 'cooking', label: 'Cooking' },
    { id: 'petCare', label: 'Pet Care' },
    { id: 'generalHousekeeping', label: 'General Housekeeping' },
    { id: 'specialNeedsCare', label: 'Special Needs Care' },
    { id: 'tutoring', label: 'Tutoring' },
    { id: 'officeCleaning', label: 'Office Cleaning' },
  ];

  return (
    <div className='space-y-6 p-1'>
      <div>
        <Label
          htmlFor='job-country-select'
          className='text-md font-semibold mb-2 block'
        >
          Job Location (Country)
        </Label>
        <Select
          value={filters.country}
          onValueChange={(value) => handleInputChange('country', value)}
        >
          <SelectTrigger id='job-country-select' className='w-full'>
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
          htmlFor='job-type-select'
          className='text-md font-semibold mb-2 block'
        >
          Job Type
        </Label>
        <Select
          value={filters.jobType}
          onValueChange={(value) => handleInputChange('jobType', value)}
        >
          <SelectTrigger id='job-type-select' className='w-full'>
            <SelectValue placeholder='Select job type' />
          </SelectTrigger>
          <SelectContent>
            {jobTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label
          htmlFor='job-accommodation-select'
          className='text-md font-semibold mb-2 block'
        >
          Accommodation
        </Label>
        <Select
          value={filters.accommodation}
          onValueChange={(value) => handleInputChange('accommodation', value)}
        >
          <SelectTrigger id='job-accommodation-select' className='w-full'>
            <SelectValue placeholder='Select accommodation' />
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
        <Label
          htmlFor='job-visa-status-select'
          className='text-md font-semibold mb-2 block'
        >
          Visa Status Required
        </Label>
        <Select
          value={filters.visaStatusRequired}
          onValueChange={(value) =>
            handleInputChange('visaStatusRequired', value)
          }
        >
          <SelectTrigger id='job-visa-status-select' className='w-full'>
            <SelectValue placeholder='Select visa status' />
          </SelectTrigger>
          <SelectContent>
            {visaStatusesRequired.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className='text-md font-semibold mb-2 block'>
          Service Types Needed
        </Label>
        <div className='grid grid-cols-2 gap-2'>
          {serviceTypes.map((service) => (
            <div key={service.id} className='flex items-center space-x-2'>
              <Checkbox
                id={`job-service-${service.id}`}
                checked={filters.serviceType.includes(service.label)}
                onCheckedChange={() =>
                  handleMultiSelectChange('serviceType', service.label)
                }
              />
              <Label
                htmlFor={`job-service-${service.id}`}
                className='font-normal text-sm'
              >
                {service.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className='text-md font-semibold mb-2 block'>
          Required Skills/Keywords
        </Label>
        <Select
          onValueChange={(value) =>
            value &&
            !filters.requirements.includes(value) &&
            handleMultiSelectChange('requirements', value)
          }
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Add required skills...' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Common Requirements</SelectLabel>
              {allRequirements.sort().map((req) => (
                <SelectItem
                  key={req}
                  value={req}
                  disabled={filters.requirements.includes(req)}
                >
                  {req}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className='mt-2 flex flex-wrap gap-2'>
          {filters.requirements.map((req) => (
            <Badge
              key={req}
              variant='secondary'
              className='flex items-center gap-1'
            >
              {req}
              <button
                onClick={() => handleMultiSelectChange('requirements', req)}
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
          Languages Required
        </Label>
        <Select
          onValueChange={(value) =>
            value &&
            !filters.languagesRequired.includes(value) &&
            handleMultiSelectChange('languagesRequired', value)
          }
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Add required languages...' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Common Languages</SelectLabel>
              {allLanguages.sort().map((lang) => (
                <SelectItem
                  key={lang}
                  value={lang}
                  disabled={filters.languagesRequired.includes(lang)}
                >
                  {lang}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className='mt-2 flex flex-wrap gap-2'>
          {filters.languagesRequired.map((lang) => (
            <Badge
              key={lang}
              variant='secondary'
              className='flex items-center gap-1'
            >
              {lang}
              <button
                onClick={() =>
                  handleMultiSelectChange('languagesRequired', lang)
                }
                className='text-xs text-red-500 hover:text-red-700'
              >
                ✕
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className='flex items-center space-x-2'>
        <Checkbox
          id='job-urgent-filter'
          checked={filters.urgentOnly}
          onCheckedChange={(checked) =>
            handleInputChange('urgentOnly', checked)
          }
        />
        <Label htmlFor='job-urgent-filter' className='font-normal text-sm'>
          Show Urgent Postings Only
        </Label>
      </div>
    </div>
  );
};

export default JobFilters;
