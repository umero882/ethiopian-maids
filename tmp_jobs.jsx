import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import {
  Search,
  Filter as FilterIcon,
  Star,
  Bell,
  ThumbsUp,
  ArrowUpDown,
} from 'lucide-react';
import JobCard from '@/components/jobs/JobCard';
import JobFilters from '@/components/jobs/JobFilters';
import NoResults from '@/components/jobs/NoResults';
import FilterSheet from '@/components/shared/FilterSheet';
import { getSalaryString } from '@/lib/currencyUtils';
import { getJobs } from '@/services/jobService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SEO from '@/components/global/SEO';

const Jobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState([]);
  const [sortBy, setSortBy] = useState('bestMatch');

  const initialFilters = {
    country: 'all',
    jobType: 'all',
    accommodation: 'all',
    visaStatusRequired: 'all',
    serviceType: [],
    requirements: [],
    languagesRequired: [],
    urgentOnly: false,
  };
  const [filters, setFilters] = useState(initialFilters);

  const allRequirements = useMemo(() => {
    const reqSet = new Set();
    jobs.forEach((job) =>
      (job.requirements || []).forEach((req) => reqSet.add(req))
    );
    return Array.from(reqSet);
  }, [jobs]);

  const allLanguages = useMemo(() => {
    const langSet = new Set();
    jobs.forEach((job) =>
      (job.languagesRequired || job.languages_required || []).forEach((lang) =>
        langSet.add(lang)
      )
    );
    return Array.from(langSet);
  }, [jobs]);

  const loadJobs = async () => {
    const loaded = await getJobs({
      filters,
      searchTerm,
      sortBy,
      getSalaryString,
    });
    setJobs(loaded);
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const applyAllFilters = async () => {
    await loadJobs();
    toast({ title: 'Filters Applied', description: 'Your results were updated.' });
  };

  const clearAllFilters = async () => {
    setSearchTerm('');
    setFilters(initialFilters);
    await loadJobs();
    toast({ title: 'Filters Cleared', description: 'Showing all job opportunities.' });
  };

  const filteredJobs = useMemo(() => {
    let tempJobs = [...jobs];

    if (searchTerm) {
      tempJobs = tempJobs.filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.employer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.requirements.some((req) =>
            req.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.country !== 'all') {
      tempJobs = tempJobs.filter((job) => job.country === filters.country);
    }
    if (filters.jobType !== 'all') {
      tempJobs = tempJobs.filter((job) => job.jobType === filters.jobType);
    }
    if (filters.accommodation !== 'all') {
      tempJobs = tempJobs.filter(
        (job) => job.accommodation === filters.accommodation
      );
    }
    if (filters.visaStatusRequired !== 'all') {
      tempJobs = tempJobs.filter((job) =>
        job.visaStatusRequired.includes(filters.visaStatusRequired)
      );
    }
    if (filters.serviceType.length > 0) {
      tempJobs = tempJobs.filter((job) =>
        filters.serviceType.every((st) => job.serviceType.includes(st))
      );
    }
    if (filters.requirements.length > 0) {
      tempJobs = tempJobs.filter((job) =>
        filters.requirements.every((req) => job.requirements.includes(req))
      );
    }
    if (filters.languagesRequired.length > 0) {
      tempJobs = tempJobs.filter((job) =>
        filters.languagesRequired.every((lang) =>
          job.languagesRequired.includes(lang)
        )
      );
    }
    if (filters.urgentOnly) {
      tempJobs = tempJobs.filter((job) => job.urgent);
    }

    // AI-Powered Matching Simulation / Sorting
    if (sortBy === 'bestMatch') {
      tempJobs.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        if (a.urgent) scoreA += 5;
        if (b.urgent) scoreB += 5;
        if (a.verified) scoreA += 3;
        if (b.verified) scoreB += 3;
        // Simple salary score (higher is better, crude)
        const salaryA = parseFloat(a.salaryRange.split('-')[0]);
        const salaryB = parseFloat(b.salaryRange.split('-')[0]);
        if (!isNaN(salaryA)) scoreA += salaryA / 100;
        if (!isNaN(salaryB)) scoreB += salaryB / 100;

        // Matching requirements from search term
        if (searchTerm) {
          filters.requirements.forEach((req) => {
            if (a.requirements.includes(req)) scoreA += 2;
            if (b.requirements.includes(req)) scoreB += 2;
          });
        }
        return scoreB - scoreA;
      });
    } else if (sortBy === 'salaryHighToLow') {
      tempJobs.sort((a, b) => {
        const salaryA = parseFloat(
          a.salaryRange.split('-')[1] || a.salaryRange.split('-')[0]
        );
        const salaryB = parseFloat(
          b.salaryRange.split('-')[1] || b.salaryRange.split('-')[0]
        );
        return (salaryB || 0) - (salaryA || 0);
      });
    } else if (sortBy === 'salaryLowToHigh') {
      tempJobs.sort((a, b) => {
        const salaryA = parseFloat(a.salaryRange.split('-')[0]);
        const salaryB = parseFloat(b.salaryRange.split('-')[0]);
        return (salaryA || 0) - (salaryB || 0);
      });
    } else if (sortBy === 'newest') {
      // Assuming higher ID means newer, or add a 'dateAdded' field
      tempJobs.sort((a, b) => b.id - a.id); // Simplistic, replace with actual date logic if available
    }

    return tempJobs;
  }, [jobs, searchTerm, filters, sortBy]);

  const handleApply = (job) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please register or login to apply for jobs.',
        variant: 'destructive',
      });
      navigate('/register');
      return;
    }
    toast({
      title: '🚧 Feature In Progress',
      description: `Apply for ${job.title} is coming soon!`,
    });
  };

  const handleSaveJob = (job) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please register or login to save jobs.',
        variant: 'destructive',
      });
      navigate('/register');
      return;
    }
    toast({
      title: '🚧 Feature In Progress',
      description: `${job.title} saving is coming soon!`,
    });
  };

  const handleSaveSearch = () => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
      description: 'Save search criteria and get alerts for new job matches.',
    });
  };

  const seo = useMemo(() => ({
    title: 'Find Jobs | Ethiopian Maids',
    description:
      'Explore curated job opportunities for Ethiopian domestic workers across GCC countries. Filter by country, job type, language, and more.',
    canonical: typeof window !== 'undefined' ? `${window.location.origin}/jobs` : undefined,
    openGraph: {
      title: 'Find Jobs | Ethiopian Maids',
      description:
        'Discover live-in and live-out roles, nanny and housekeeping positions, and more across the GCC.',
      url: typeof window !== 'undefined' ? `${window.location.origin}/jobs` : undefined,
      image: '/images/og-default.png',
    },
  }), []);

  const jobsJsonLd = useMemo(() => {
    return (jobs || []).slice(0, 25).map((job) => {
      const salaryMin = job.salary_min ?? job.salaryRange?.min;
      const salaryMax = job.salary_max ?? job.salaryRange?.max;
      const currency = job.currency || 'USD';
      const addressLocality = job.location || '';
      const addressCountry = job.country || '';
      return {
        '@context': 'https://schema.org/',
        '@type': 'JobPosting',
        title: job.title,
        description: job.description,
        datePosted: job.created_at || new Date().toISOString(),
        employmentType: job.job_type || 'FULL_TIME',
        hiringOrganization: {
          '@type': 'Organization',
          name: job.employer,
        },
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality,
            addressCountry,
          },
        },
        baseSalary: salaryMin
          ? {
              '@type': 'MonetaryAmount',
              currency,
              value: {
                '@type': 'QuantitativeValue',
                minValue: Number(salaryMin),
                maxValue: salaryMax ? Number(salaryMax) : undefined,
                unitText: 'MONTH',
              },
            }
          : undefined,
      };
    });
  }, [jobs]);

  const breadcrumbJsonLd = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ethiopian-maids.example';
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: origin + '/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Jobs',
          item: origin + '/jobs',
        },
      ],
    };
  }, []);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8'>
      <SEO {...seo} jsonLd={[...jobsJsonLd, breadcrumbJsonLd]} />
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='text-center mb-12'
        >
          <h1 className='text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-4'>
            Find Your Next{' '}
            <span className='whitespace-nowrap'>Opportunity</span>
          </h1>
          <p className='text-lg md:text-xl text-gray-700 max-w-3xl mx-auto'>
            Explore diverse job openings with verified families and agencies.
            Advanced filters help you find the perfect role.
          </p>
        </motion.div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className='hidden lg:block lg:col-span-3'
          >
            <div className='sticky top-24 space-y-6 p-6 bg-white rounded-xl shadow-xl'>
              <h3 className='text-xl font-semibold text-gray-800 border-b pb-3 mb-4'>
                Filter Job Openings
              </h3>
              <JobFilters
                filters={filters}
                setFilters={setFilters}
                allRequirements={allRequirements}
                allLanguages={allLanguages}
              />
              <Button
                onClick={clearAllFilters}
                variant='outline'
                className='w-full mt-4'
              >
                Clear All Filters
              </Button>
            </div>
          </motion.div>

          <div className='lg:col-span-9'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className='bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-8'
            >
              <div className='flex flex-col sm:flex-row gap-4 items-center'>
                <div className='relative flex-grow w-full sm:w-auto'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                  <Input
                    placeholder='Search by title, employer, or keywords...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10 h-12 text-base'
                  />
                </div>
                <div className='flex gap-2 w-full sm:w-auto'>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className='h-12 w-full sm:w-[200px]'>
                      <ArrowUpDown className='w-4 h-4 mr-2 text-gray-500' />
                      <SelectValue placeholder='Sort by' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='bestMatch'>
                        <ThumbsUp className='w-4 h-4 mr-2 inline-block text-purple-500' />
                        Best Match
                      </SelectItem>
                      <SelectItem value='salaryHighToLow'>
                        Salary: High to Low
                      </SelectItem>
                      <SelectItem value='salaryLowToHigh'>
                        Salary: Low to High
                      </SelectItem>
                      <SelectItem value='newest'>
                        <Bell className='w-4 h-4 mr-2 inline-block text-green-500' />
                        Newest
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FilterSheet
                    onApplyFilters={applyAllFilters}
                    onClearFilters={clearAllFilters}
                  >
                    <JobFilters
                      filters={filters}
                      setFilters={setFilters}
                      allRequirements={allRequirements}
                      allLanguages={allLanguages}
                    />
                  </FilterSheet>
                </div>
              </div>
              <div className='mt-4 flex flex-col sm:flex-row justify-between items-center gap-2'>
                <p className='text-sm text-gray-600'>
                  Showing {filteredJobs.length} of {jobs.length} job
                  opportunities.
                  {sortBy === 'bestMatch' && (
                    <Badge
                      variant='secondary'
                      className='ml-2 bg-purple-100 text-purple-700'
                    >
                      AI Matched
                    </Badge>
                  )}
                </p>
                <Button
                  onClick={handleSaveSearch}
                  variant='ghost'
                  size='sm'
                  className='text-purple-600 hover:bg-purple-50'
                >
                  <Bell className='w-4 h-4 mr-2' />
                  Save Search & Get Alerts
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {filteredJobs.length > 0 ? (
                <div className='grid lg:grid-cols-2 gap-6'>
                  {filteredJobs.map((job, index) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      index={index}
                      onApply={handleApply}
                      onSave={handleSaveJob}
                      user={user}
                      navigate={navigate}
                    />
                  ))}
                </div>
              ) : (
                <NoResults onClearFilters={clearAllFilters} />
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jobs;
