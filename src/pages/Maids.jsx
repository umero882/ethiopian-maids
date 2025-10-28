import React, { useState, useEffect, useMemo, useCallback } from 'react';
import SEO from '@/components/global/SEO';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { sponsorService } from '@/services/sponsorService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MaidCard from '@/components/maids/MaidCard';
import BookingRequestDialog from '@/components/maids/BookingRequestDialog';
import { getMaidDisplayName } from '@/lib/displayName';
import MaidCardSkeleton from '@/components/maids/MaidCardSkeleton';
import MaidFilters from '@/components/maids/MaidFilters';
import NoMaidsFound from '@/components/maids/NoMaidsFound';
import FilterSheet from '@/components/shared/FilterSheet';
import { getSalaryString } from '@/lib/currencyUtils';
import { Pagination, usePagination } from '@/components/ui/pagination';
import {
  Search,
  Filter as FilterIcon,
  Star,
  Bell,
  ThumbsUp,
  ArrowUpDown,
} from 'lucide-react';
import { mockMaidsData } from '@/data/mockMaids.js';
import { useDebounce } from 'use-debounce';
import { maidService } from '@/services/maidService';
import useLocalStorage from '@/hooks/useLocalStorage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Maids = () => {
  const { user } = useAuth();
  const { createConversation, setActiveConversation } = useChat();
  const navigate = useNavigate();
  const [searchInputValue, setSearchInputValue] = useState('');
  const [searchTerm] = useDebounce(searchInputValue, 300);
  const [maids, setMaids] = useState([]);
  const [sortBy, setSortBy] = useState('bestMatch');
  const [isLoading, setIsLoading] = useState(true);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedMaid, setSelectedMaid] = useState(null);

  const initialFilters = {
    country: 'all',
    experience: 'all',
    ageRange: [18, 65],
    visaStatus: 'all',
    serviceType: [],
    accommodationType: 'all',
    skills: [],
    languages: [],
  };
  // Use localStorage to persist filter settings
  const [filters, setFilters] = useLocalStorage('maidFilters', initialFilters);

  // Pagination setup
  const {
    currentPage,
    itemsPerPage,
    totalPages,
    handlePageChange,
    handleItemsPerPageChange,
    resetPagination,
  } = usePagination({
    initialPage: 1,
    initialItemsPerPage: 20,
    totalItems: 0, // Will be updated after filtering
  });

  const allSkills = useMemo(() => {
    const skillsSet = new Set();
    maids.forEach((maid) => {
      if (maid.skills && Array.isArray(maid.skills)) {
        maid.skills.forEach((skill) => skillsSet.add(skill));
      }
    });
    return Array.from(skillsSet);
  }, [maids]);

  const allLanguages = useMemo(() => {
    const langSet = new Set();
    maids.forEach((maid) => {
      if (maid.languages && Array.isArray(maid.languages)) {
        maid.languages.forEach((lang) => langSet.add(lang));
      }
    });
    return Array.from(langSet);
  }, [maids]);

  useEffect(() => {
    const fetchMaids = async () => {
      setIsLoading(true);
      const { data, error } = await maidService.getMaids();

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load maids. Please try again.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const displayCurrencyCountry = user?.country || 'UAE';
      const updatedMaids = data.map((maid) => ({
        ...maid,
        agencyManaged:
          maid.agencyManaged ||
          !!maid.agency_id ||
          maid.is_agency_managed === true,
        salaryDisplay: getSalaryString(
          maid.country,
          maid.salaryRange,
          displayCurrencyCountry
        ),
      }));

      setMaids(updatedMaids);
      setIsLoading(false);
    };

    fetchMaids();
  }, [user]);

  const applyAllFilters = () => {
    // This function is mostly for the FilterSheet to trigger a re-render if needed.
    // The actual filtering logic is in filteredMaids memo.
    toast({
      title: 'Filters Applied',
      description: 'Your search results have been updated.',
    });
  };

  const clearAllFilters = () => {
    setSearchInputValue('');
    setFilters(initialFilters);
    toast({
      title: 'Filters Cleared',
      description: 'Showing all domestic workers.',
    });
  };

  // Optimized filter functions
  const applySearchFilter = useCallback((maids, searchTerm) => {
    if (!searchTerm) return maids;
    const safeSearchTerm = searchTerm.toLowerCase();
    return maids.filter((maid) => {
      if (!maid) return false;

      const displayName = getMaidDisplayName(maid);
      const safeName = displayName.toLowerCase();
      const safeDescription =
        maid.description && typeof maid.description === 'string'
          ? maid.description.toLowerCase()
          : '';

      const skillsMatch =
        Array.isArray(maid.skills) &&
        maid.skills.some(
          (skill) =>
            skill &&
            typeof skill === 'string' &&
            skill.toLowerCase().includes(safeSearchTerm)
        );

      return (
        safeName.includes(safeSearchTerm) ||
        skillsMatch ||
        safeDescription.includes(safeSearchTerm)
      );
    });
  }, []);

  const applyCountryFilter = useCallback((maids, country) => {
    if (country === 'all') return maids;
    return maids.filter((maid) => maid.country === country);
  }, []);

  const applyExperienceFilter = useCallback((maids, experience) => {
    if (experience === 'all') return maids;

    const expParts = experience.split('-');
    if (expParts.length === 2) {
      // e.g. "1-3"
      const minExp = parseInt(expParts[0]);
      const maxExp = parseInt(expParts[1]);
      return maids.filter(
        (maid) =>
          parseInt(maid.experience) >= minExp &&
          parseInt(maid.experience) <= maxExp
      );
    } else if (experience.includes('+')) {
      // e.g. "5+"
      const minExp = parseInt(experience.replace('+', ''));
      return maids.filter((maid) => parseInt(maid.experience) >= minExp);
    } else {
      // e.g. "0-1"
      const maxExp = parseInt(experience.split('-')[1]);
      if (!isNaN(maxExp)) {
        return maids.filter((maid) => parseInt(maid.experience) <= maxExp);
      } else {
        // "0-1" case
        return maids.filter(
          (maid) =>
            parseInt(maid.experience) >= 0 && parseInt(maid.experience) <= 1
        );
      }
    }
  }, []);

  const applyAgeRangeFilter = useCallback((maids, ageRange) => {
    return maids.filter(
      (maid) => maid.age >= ageRange[0] && maid.age <= ageRange[1]
    );
  }, []);

  const applyVisaStatusFilter = useCallback((maids, visaStatus) => {
    if (visaStatus === 'all') return maids;
    return maids.filter((maid) => maid.visaStatus === visaStatus);
  }, []);

  const applyServiceTypeFilter = useCallback((maids, serviceType) => {
    if (serviceType.length === 0) return maids;
    return maids.filter((maid) =>
      serviceType.every((st) => maid.serviceType.includes(st))
    );
  }, []);

  const applyAccommodationTypeFilter = useCallback(
    (maids, accommodationType) => {
      if (accommodationType === 'all') return maids;
      return maids.filter(
        (maid) => maid.accommodationType === accommodationType
      );
    },
    []
  );

  const applySkillsFilter = useCallback((maids, skills) => {
    if (skills.length === 0) return maids;
    return maids.filter((maid) =>
      skills.every((skill) => maid.skills.includes(skill))
    );
  }, []);

  const applyLanguagesFilter = useCallback((maids, languages) => {
    if (languages.length === 0) return maids;
    return maids.filter((maid) =>
      languages.every((lang) => maid.languages.includes(lang))
    );
  }, []);

  const applySorting = useCallback((maids, sortBy, searchTerm, filters) => {
    if (sortBy === 'bestMatch') {
      return maids.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        // Higher rating = better match
        scoreA += (a.rating || 0) * 2;
        scoreB += (b.rating || 0) * 2;
        // More experience = better match (up to a point)
        scoreA += Math.min(parseInt(a.experience) || 0, 10);
        scoreB += Math.min(parseInt(b.experience) || 0, 10);
        // Verified = better match
        if (a.verified) scoreA += 5;
        if (b.verified) scoreB += 5;
        // Matching skills from search term
        if (searchTerm) {
          filters.skills.forEach((skill) => {
            if (a.skills.includes(skill)) scoreA += 3;
            if (b.skills.includes(skill)) scoreB += 3;
          });
        }
        return scoreB - scoreA; // Higher score first
      });
    } else if (sortBy === 'rating') {
      return maids.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'experience') {
      return maids.sort(
        (a, b) => (parseInt(b.experience) || 0) - (parseInt(a.experience) || 0)
      );
    } else if (sortBy === 'newest') {
      // Assuming higher ID means newer, or add a 'dateAdded' field
      return maids.sort((a, b) => b.id - a.id);
    }
    return maids;
  }, []);

  const filteredMaids = useMemo(() => {
    let result = [...maids];

    // Apply each filter sequentially
    result = applySearchFilter(result, searchTerm);
    result = applyCountryFilter(result, filters.country);
    result = applyExperienceFilter(result, filters.experience);
    result = applyAgeRangeFilter(result, filters.ageRange);
    result = applyVisaStatusFilter(result, filters.visaStatus);
    result = applyServiceTypeFilter(result, filters.serviceType);
    result = applyAccommodationTypeFilter(result, filters.accommodationType);
    result = applySkillsFilter(result, filters.skills);
    result = applyLanguagesFilter(result, filters.languages);

    // Apply sorting
    result = applySorting(result, sortBy, searchTerm, filters);

    return result;
  }, [
    maids,
    searchTerm,
    filters,
    sortBy,
    applySearchFilter,
    applyCountryFilter,
    applyExperienceFilter,
    applyAgeRangeFilter,
    applyVisaStatusFilter,
    applyServiceTypeFilter,
    applyAccommodationTypeFilter,
    applySkillsFilter,
    applyLanguagesFilter,
    applySorting,
  ]);

  // Reset to page 1 when filters or search changes
  useEffect(() => {
    resetPagination();
  }, [searchTerm, filters, sortBy, resetPagination]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Update total pages when filtered results change
  const actualTotalPages = Math.ceil(filteredMaids.length / itemsPerPage);

  // Get paginated subset of filtered maids
  const paginatedMaids = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredMaids.slice(startIndex, endIndex);
  }, [filteredMaids, currentPage, itemsPerPage]);

  const handleContact = async (maid) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please register or login to contact maids.',
        variant: 'destructive',
      });
      navigate('/register');
      return;
    }

    try {
      // Create or open conversation with the maid
      const conversation = await createConversation(
        maid.id,
        getMaidDisplayName(maid),
        'maid'
      );

      if (conversation) {
        setActiveConversation(conversation);
        navigate('/chat');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start conversation. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleFavorite = async (maid) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please register or login to save favorites.',
        variant: 'destructive',
      });
      navigate('/register');
      return;
    }

    if (user.user_type !== 'sponsor') {
      toast({
        title: 'Access Restricted',
        description: 'Only sponsors can save favorites.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await sponsorService.addToFavorites(maid.id, '');

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to add to favorites. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Added to Favorites',
        description: `${getMaidDisplayName(maid)} has been added to your favorites.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleBookNow = (maid) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please register or login to book maids.',
        variant: 'destructive',
      });
      navigate('/register');
      return;
    }

    if (user.user_type !== 'sponsor') {
      toast({
        title: 'Access Restricted',
        description: 'Only sponsors can book maids. Please register as a sponsor.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedMaid(maid);
    setBookingDialogOpen(true);
  };

  const handleSaveSearch = () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please register or login to save searches.',
        variant: 'destructive',
      });
      navigate('/register');
      return;
    }

    toast({
      title: 'Coming Soon',
      description: 'Save search and alert functionality will be available soon. Stay tuned!',
    });
  };

  const seo = useMemo(
    () => ({
      title: 'Find Maids | Ethiopian Maids',
      description:
        'Browse verified Ethiopian domestic workers across GCC countries. Filter by experience, skills, languages, and more.',
      canonical:
        typeof window !== 'undefined'
          ? `${window.location.origin}/maids`
          : undefined,
      openGraph: {
        title: 'Find Maids | Ethiopian Maids',
        description:
          'Discover experienced live-in and live-out maids, nannies, and housekeepers across the GCC.',
        url:
          typeof window !== 'undefined'
            ? `${window.location.origin}/maids`
            : undefined,
        image: '/images/og-default.png',
      },
    }),
    []
  );

  const breadcrumbJsonLd = useMemo(() => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://ethiopian-maids.example';
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
          name: 'Maids',
          item: origin + '/maids',
        },
      ],
    };
  }, []);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8'>
      <SEO {...seo} jsonLd={breadcrumbJsonLd} />
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='text-center mb-12'
        >
          <h1 className='text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-4'>
            Find Your Perfect{' '}
            <span className='whitespace-nowrap'>Domestic Worker</span>
          </h1>
          <p className='text-lg md:text-xl text-gray-700 max-w-3xl mx-auto'>
            Utilize our advanced filters and AI-powered matching to connect with
            ideal candidates.
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
                Refine Your Search
              </h3>
              <MaidFilters
                filters={filters}
                setFilters={setFilters}
                allSkills={allSkills}
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
                    placeholder='Search by name, skills, or keywords...'
                    value={searchInputValue}
                    onChange={(e) => setSearchInputValue(e.target.value)}
                    className='pl-10 h-12 text-base'
                    aria-label='Search for maids by name, skills, or keywords'
                  />
                </div>
                <div className='flex gap-2 w-full sm:w-auto'>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className='h-12 w-full sm:w-[180px]'>
                      <ArrowUpDown className='w-4 h-4 mr-2 text-gray-500' />
                      <SelectValue placeholder='Sort by' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='bestMatch'>
                        <ThumbsUp className='w-4 h-4 mr-2 inline-block text-purple-500' />
                        Best Match
                      </SelectItem>
                      <SelectItem value='rating'>
                        <Star className='w-4 h-4 mr-2 inline-block text-yellow-500' />
                        Rating
                      </SelectItem>
                      <SelectItem value='experience'>
                        <FilterIcon className='w-4 h-4 mr-2 inline-block text-blue-500' />
                        Experience
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
                    <MaidFilters
                      filters={filters}
                      setFilters={setFilters}
                      allSkills={allSkills}
                      allLanguages={allLanguages}
                    />
                  </FilterSheet>
                </div>
              </div>
              <div className='mt-4 flex flex-col sm:flex-row justify-between items-center gap-2'>
                <p className='text-sm text-gray-600'>
                  Showing {filteredMaids.length} of {maids.length} domestic
                  workers.
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
              {isLoading ? (
                <div className='grid md:grid-cols-2 xl:grid-cols-3 gap-6'>
                  {Array(6)
                    .fill(0)
                    .map((_, i) => (
                      <MaidCardSkeleton key={i} />
                    ))}
                </div>
              ) : filteredMaids.length > 0 ? (
                <>
                  <div className='grid md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8'>
                    {paginatedMaids.map((maid, index) => (
                      <MaidCard
                        key={maid.id}
                        maid={maid}
                        index={index}
                        onContact={handleContact}
                        onFavorite={handleFavorite}
                        onBookNow={handleBookNow}
                        user={user}
                        navigate={navigate}
                      />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={actualTotalPages}
                    totalItems={filteredMaids.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    itemsPerPageOptions={[12, 20, 40, 60]}
                  />
                </>
              ) : (
                <NoMaidsFound onClearFilters={clearAllFilters} />
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Booking Request Dialog */}
      <BookingRequestDialog
        open={bookingDialogOpen}
        onClose={() => {
          setBookingDialogOpen(false);
          setSelectedMaid(null);
        }}
        maid={selectedMaid}
      />
    </div>
  );
};

export default Maids;
