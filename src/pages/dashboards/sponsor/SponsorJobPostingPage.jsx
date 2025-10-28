import React from 'react';
import SEO from '@/components/global/SEO';
import JobPostingForm from '@/components/jobs/JobPostingForm';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const SponsorJobPostingPage = () => {
  return (
    <div className='space-y-6'>
      <SEO
        title='Post a Job | Sponsor Dashboard | Ethiopian Maids'
        description='Create a new job posting to find the perfect domestic worker for your home'
      />

      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Post a New Job</h1>
          <p className='text-gray-600 mt-2'>
            Fill out the form below to create a job posting and start receiving applications from qualified candidates
          </p>
        </div>
        <Button variant='outline' as Child>
          <Link to='/dashboard/sponsor/jobs'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Jobs
          </Link>
        </Button>
      </div>

      <JobPostingForm />
    </div>
  );
};

export default SponsorJobPostingPage;
