import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ProfileCompletionBanner from '@/components/ProfileCompletionBanner';
import {
  MaidBrowsingGuard,
  JobPostingGuard,
} from '@/components/ProfileCompletionGuard';
import { toast } from '@/components/ui/use-toast';
import { NoSearchResultsEmptyState } from '@/components/ui/EmptyState';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  SlidersHorizontal,
  Briefcase,
  CreditCard,
  Star,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
  Edit,
  XCircle,
  Eye,
  Loader2,
  Plus,
} from 'lucide-react';
import MaidCard from '@/components/maids/MaidCard';
import SEO from '@/components/global/SEO';
import { sponsorService } from '@/services/sponsorService';

const SponsorDashboard = () => {
  const seo = useMemo(
    () => ({
      title: 'Sponsor Dashboard | Ethiopian Maids',
      description:
        'Find candidates, manage bookings and invoices, and get tailored recommendations.',
      canonical:
        typeof window !== 'undefined'
          ? `${window.location.origin}/dashboard/sponsor`
          : undefined,
      openGraph: {
        title: 'Sponsor Dashboard | Ethiopian Maids',
        description:
          'Personalized dashboard for sponsors to manage searches and bookings.',
        url:
          typeof window !== 'undefined'
            ? `${window.location.origin}/dashboard/sponsor`
            : undefined,
        image: '/images/og-default.png',
      },
    }),
    []
  );
  const [bookings, setBookings] = useState([]);
  const [recommendedMaids, setRecommendedMaids] = useState([]);
  const [quickSearchResults, setQuickSearchResults] = useState([]);
  const [quickSearchTerm, setQuickSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalFavorites: 0,
    activeBookings: 0
  });
  const carouselRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load data in parallel
      const [statsResult, recommendedResult, bookingsResult] = await Promise.all([
        sponsorService.getDashboardStats(),
        sponsorService.getRecommendedMaids(6),
        sponsorService.getBookings()
      ]);

      // Handle stats
      if (statsResult.error) {
        console.error('Error loading stats:', statsResult.error);
      } else if (statsResult.data) {
        setStats(statsResult.data);
      }

      // Handle recommended maids
      if (recommendedResult.error) {
        console.error('Error loading recommended maids:', recommendedResult.error);
      } else if (recommendedResult.data) {
        setRecommendedMaids(recommendedResult.data);
      }

      // Handle bookings
      if (bookingsResult.error) {
        console.error('Error loading bookings:', bookingsResult.error);
      } else if (bookingsResult.data) {
        // Transform bookings to match UI structure
        const transformedBookings = bookingsResult.data.slice(0, 5).map(booking => ({
          id: booking.id,
          maidName: booking.maid?.name || 'Unknown',
          serviceType: booking.service_type || 'N/A',
          status: booking.status
        }));
        setBookings(transformedBookings);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data. Please refresh the page.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = useCallback((term) => {
    setQuickSearchTerm(term);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!term.trim()) {
      setQuickSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await sponsorService.searchMaids({
          searchText: term,
          limit: 6
        });

        if (error) {
          console.error('Search error:', error);
          toast({
            title: 'Search Failed',
            description: 'Failed to search for maids. Please try again.',
            variant: 'destructive'
          });
          setQuickSearchResults([]);
        } else {
          setQuickSearchResults(data || []);
        }
      } catch (error) {
        console.error('Search exception:', error);
        setQuickSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);


  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const sectionAnimation = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: delay },
  });

  // Show loading state
  if (loading) {
    return (
      <div className='space-y-8'>
        <SEO {...seo} />
        <ProfileCompletionBanner variant='default' className='mb-6' />
        <div className='flex items-center justify-center py-20'>
          <div className='text-center space-y-4'>
            <Loader2 className='h-12 w-12 animate-spin text-purple-600 mx-auto' />
            <p className='text-gray-600'>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      <SEO {...seo} />
      {/* Profile Completion Banner */}
      <ProfileCompletionBanner
        variant='default'
        className='mb-6'
      />

      {/* Dashboard Stats Cards */}
      <motion.div {...sectionAnimation()}>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <Card className='shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100'>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-blue-600'>Total Bookings</p>
                    <p className='text-3xl font-bold text-blue-900'>{stats.totalBookings}</p>
                  </div>
                  <Briefcase className='h-12 w-12 text-blue-500 opacity-50' />
                </div>
              </CardContent>
            </Card>

            <Card className='shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100'>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-purple-600'>Active Bookings</p>
                    <p className='text-3xl font-bold text-purple-900'>{stats.activeBookings}</p>
                  </div>
                  <Star className='h-12 w-12 text-purple-500 opacity-50' />
                </div>
              </CardContent>
            </Card>

            <Card className='shadow-lg border-0 bg-gradient-to-br from-pink-50 to-pink-100'>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-pink-600'>Saved Favorites</p>
                    <p className='text-3xl font-bold text-pink-900'>{stats.totalFavorites}</p>
                  </div>
                  <ThumbsUp className='h-12 w-12 text-pink-500 opacity-50' />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

      {/* Quick Actions Navigation */}
      <motion.div {...sectionAnimation(0.1)}>
        <h2 className='text-xl font-semibold text-gray-800 mb-4'>Quick Actions</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
          <Link to='/maids'>
            <Card className='hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-300'>
              <CardContent className='pt-6 pb-6'>
                <div className='text-center space-y-2'>
                  <Search className='h-10 w-10 text-purple-600 mx-auto' />
                  <h3 className='font-semibold text-gray-900'>Find Maids</h3>
                  <p className='text-sm text-gray-600'>Search for domestic workers</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to='/dashboard/sponsor/jobs/new'>
            <Card className='hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-orange-300'>
              <CardContent className='pt-6 pb-6'>
                <div className='text-center space-y-2'>
                  <Plus className='h-10 w-10 text-orange-600 mx-auto' />
                  <h3 className='font-semibold text-gray-900'>Post a Job</h3>
                  <p className='text-sm text-gray-600'>Create new job posting</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to='/dashboard/sponsor/favorites'>
            <Card className='hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-pink-300'>
              <CardContent className='pt-6 pb-6'>
                <div className='text-center space-y-2'>
                  <ThumbsUp className='h-10 w-10 text-pink-600 mx-auto' />
                  <h3 className='font-semibold text-gray-900'>My Favorites</h3>
                  <p className='text-sm text-gray-600'>{stats.totalFavorites} saved maids</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to='/dashboard/sponsor/bookings'>
            <Card className='hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300'>
              <CardContent className='pt-6 pb-6'>
                <div className='text-center space-y-2'>
                  <Briefcase className='h-10 w-10 text-blue-600 mx-auto' />
                  <h3 className='font-semibold text-gray-900'>My Bookings</h3>
                  <p className='text-sm text-gray-600'>{stats.totalBookings} total bookings</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to='/dashboard/sponsor/profile'>
            <Card className='hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-300'>
              <CardContent className='pt-6 pb-6'>
                <div className='text-center space-y-2'>
                  <Edit className='h-10 w-10 text-green-600 mx-auto' />
                  <h3 className='font-semibold text-gray-900'>Edit Profile</h3>
                  <p className='text-sm text-gray-600'>Update your information</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </motion.div>

      <motion.div {...sectionAnimation(0.2)}>
        <Card className='shadow-xl border-0'>
          <CardHeader>
            <CardTitle className='text-2xl font-semibold text-gray-800 flex items-center'>
              <Search className='mr-3 text-purple-600' />
              Find Your Ideal Maid
            </CardTitle>
            <CardDescription>
              Use quick search or advanced filters to discover candidates.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='flex flex-col sm:flex-row gap-4'>
              <div className='relative flex-grow'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                <Input
                  placeholder='Quick search by name, skill, or country...'
                  className='pl-10 pr-10 h-12 text-base'
                  value={quickSearchTerm}
                  onChange={(e) => handleQuickSearch(e.target.value)}
                  disabled={searchLoading}
                />
                {searchLoading && (
                  <Loader2 className='absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-600 w-5 h-5 animate-spin' />
                )}
              </div>
              <MaidBrowsingGuard>
                <Button
                  asChild
                  size='lg'
                  className='bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all'
                >
                  <Link to='/maids'>
                    <SlidersHorizontal className='mr-2 h-5 w-5' /> Advanced
                    Search & Filters
                  </Link>
                </Button>
              </MaidBrowsingGuard>
            </div>
            {quickSearchTerm && quickSearchResults.length > 0 && (
              <div className='border-t pt-4 mt-4'>
                <h4 className='text-sm font-semibold text-gray-600 mb-2'>
                  Quick Results ({quickSearchResults.length}):
                </h4>
                <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {quickSearchResults.map((maid, index) => (
                    <motion.div
                      key={maid.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <MaidCard
                        maid={maid}
                        onContact={() => {}}
                        onFavorite={() => {}}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            {quickSearchTerm && quickSearchResults.length === 0 && (
              <NoSearchResultsEmptyState
                searchTerm={quickSearchTerm}
                description="Try different search terms or browse all available maids."
                action={{
                  label: "Browse All Maids",
                  href: "/maids",
                  variant: "outline"
                }}
                size="small"
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {recommendedMaids.length > 0 && (
        <motion.div {...sectionAnimation(0.3)}>
          <Card className='shadow-xl border-0'>
            <CardHeader className='flex flex-row items-center justify-between'>
              <div>
                <CardTitle className='text-2xl font-semibold text-gray-800 flex items-center'>
                  <ThumbsUp className='mr-3 text-purple-600' /> Recommended For
                  You
                </CardTitle>
                <CardDescription>
                  AI-powered suggestions based on your preferences.
                </CardDescription>
              </div>
              <div className='flex space-x-2'>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => scrollCarousel('left')}
                >
                  <ChevronLeft className='h-5 w-5' />
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => scrollCarousel('right')}
                >
                  <ChevronRight className='h-5 w-5' />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div
                ref={carouselRef}
                className='flex overflow-x-auto space-x-6 pb-4 scrollbar-hide'
              >
                {recommendedMaids.map((maid, index) => (
                  <motion.div
                    key={maid.id}
                    className='min-w-[300px] md:min-w-[320px]'
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <MaidCard
                      maid={maid}
                      onContact={() => {}}
                      onFavorite={() => {}}
                    />
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div {...sectionAnimation(0.4)}>
        <Card className='shadow-lg border-0'>
          <CardHeader className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-2xl font-semibold text-gray-800 flex items-center'>
                <Briefcase className='mr-3 text-purple-600' />
                My Bookings
              </CardTitle>
              <CardDescription>
                Overview of your recent maid engagements.
              </CardDescription>
            </div>
            <Button asChild variant='outline'>
              <Link to='/dashboard/sponsor/bookings'>View All Bookings</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Maid Name</TableHead>
                  <TableHead className='hidden md:table-cell'>
                    Service Type
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className='text-center py-8'>
                      <div className='text-gray-500'>
                        <Briefcase className='h-12 w-12 mx-auto mb-2 opacity-30' />
                        <p className='font-medium'>No bookings yet</p>
                        <p className='text-sm'>Start by searching for a maid to hire</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking) => (
                    <TableRow
                      key={booking.id}
                      className='hover:bg-gray-50 transition-colors'
                    >
                      <TableCell className='font-medium text-gray-700'>
                        {booking.maidName}
                      </TableCell>
                      <TableCell className='hidden md:table-cell text-gray-600'>
                        {booking.serviceType}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            booking.status === 'active'
                              ? 'default'
                              : booking.status === 'pending_start'
                                ? 'outline'
                                : 'secondary'
                          }
                          className={
                            booking.status === 'active'
                              ? 'bg-green-500 text-white'
                              : booking.status === 'pending_start'
                                ? 'border-yellow-500 text-yellow-600'
                                : 'bg-gray-200 text-gray-700'
                          }
                        >
                          {booking.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right space-x-1'>
                        <Button variant='ghost' size='sm' asChild>
                          <a href={`/dashboard/sponsor/bookings?bookingId=${booking.id}`}>
                            <Eye className='h-4 w-4 mr-1' />
                            Details
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
};

export default SponsorDashboard;
