import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/databaseClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Users,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Globe,
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const MaidOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [subscription, setSubscription] = useState({ status: 'free', plan: 'free' });

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }

      try {

        // Fetch maid profile from database
        const { data: maidProfileData, error: maidError } = await supabase
          .from('maid_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (maidError && maidError.code !== 'PGRST116') {
          console.error('Error fetching maid profile:', maidError);
        }

        let profileData;
        if (maidProfileData) {
          // Transform database data to match dashboard expectations
          profileData = {
            id: maidProfileData.id,
            name: maidProfileData.full_name || user.name || 'New Maid',
            age: calculateAge(maidProfileData.date_of_birth) || 'Not specified',
            country: maidProfileData.nationality || user.country || 'Not specified',
            religion: maidProfileData.religion || 'Not specified',
            languages: Array.isArray(maidProfileData.languages) ? maidProfileData.languages : [],
            education: maidProfileData.education_level || 'Not specified',
            image: maidProfileData.profile_photo_url || maidProfileData.primary_image_processed_url || '/images/default-avatar.png',
            experience: maidProfileData.experience_years ? `${maidProfileData.experience_years} years` : 'Not specified',
            experienceDetails: maidProfileData.about_me || 'No experience details provided',
            visaStatus: maidProfileData.current_visa_status || 'Not specified',
            availability: maidProfileData.availability_status || 'Not specified',
            salaryRange: maidProfileData.preferred_salary_min ?
              `${maidProfileData.preferred_salary_min} ${maidProfileData.preferred_currency || 'USD'}` :
              'Not specified',
            description: maidProfileData.about_me || 'No description provided',
            skills: Array.isArray(maidProfileData.skills) ? maidProfileData.skills : [],
            verificationStatus: {
              email: true, // Email is verified during registration
              phone: user.registration_complete || false,
              documents: maidProfileData.medical_certificate_valid && maidProfileData.police_clearance_valid,
            },
            approvalStatus: maidProfileData.verification_status || 'pending_verification',
            lastUpdated: maidProfileData.updated_at || maidProfileData.created_at,
            livingArrangement:
              maidProfileData.live_in_preference === undefined || maidProfileData.live_in_preference === null
                ? 'Not specified'
                : maidProfileData.live_in_preference
                ? 'Live-in'
                : 'Live-out',
            contractPreference: maidProfileData.contract_duration_preference || 'Not specified',
            hasPhoto: !!maidProfileData.profile_photo_url,
            currency: maidProfileData.preferred_currency || 'USD',
          };

          setProfile(profileData);
        } else {
          // No maid profile exists yet - create a basic one from user data
          const basicProfile = {
            id: user.id,
            name: user.name || 'New Maid',
            age: 'Not specified',
            country: user.country || 'Not specified',
            religion: 'Not specified',
            languages: [],
            education: 'Not specified',
            image: '/images/default-avatar.png',
            experience: 'Not specified',
            experienceDetails: 'Please complete your profile to add experience details',
            visaStatus: 'Not specified',
            availability: 'Not specified',
            salaryRange: 'Not specified',
            description: 'Please complete your profile',
            skills: [],
            verificationStatus: {
              email: true,
              phone: user.registration_complete || false,
              documents: false,
            },
            approvalStatus: 'pending_verification',
            lastUpdated: new Date().toISOString(),
            livingArrangement: 'Not specified',
            contractPreference: 'Not specified',
            hasPhoto: false,
            currency: 'USD',
          };

          setProfile(basicProfile);
        }

        // Fetch bookings for this maid
        const { data: bookingData, error: bookingError } = await supabase
          .from('booking_requests')
          .select('*')
          .eq('maid_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (bookingError) {
          console.error('Error fetching bookings:', bookingError);
          setBookings([]);
        } else {
          setBookings(bookingData || []);
        }

        // Fetch notifications for this user
        const { data: notificationData, error: notificationError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (notificationError) {
          console.error('Error fetching notifications:', notificationError);
          setNotifications([]);
        } else {
          setNotifications(notificationData || []);
        }

        // Fetch subscription data
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (subscriptionError) {
          console.error('Error fetching subscription:', subscriptionError);
          setSubscription({ status: 'free', plan: 'free' });
        } else if (subscriptionData && subscriptionData.length > 0) {
          setSubscription(subscriptionData[0]);
        } else {
          setSubscription({ status: 'free', plan: 'free' });
        }

      } catch (error) {
        console.error('Error fetching maid dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Helper function to calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const getProfileCompleteness = () => {
    if (!profile) return 0;

    const fields = [
      profile.name && profile.name !== 'New Maid',
      profile.age && profile.age !== 'Not specified',
      profile.country && profile.country !== 'Not specified',
      profile.experience && profile.experience !== 'Not specified',
      profile.skills && profile.skills.length > 0,
      profile.languages && profile.languages.length > 0,
      profile.description && profile.description !== 'Please complete your profile',
      profile.verificationStatus.email,
      profile.verificationStatus.phone,
    ];

    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const getUnreadNotificationsCount = () => {
    return notifications.filter((notification) => !notification.read).length;
  };

  const sectionAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4'></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-800'>Dashboard Overview</h1>
          <p className='text-gray-600'>Welcome back, {profile?.name || user?.name || 'User'}!</p>
        </div>
        <Button
          className='gap-2'
          onClick={() => navigate(user?.registration_complete ? '/dashboard/maid/profile' : '/complete-profile')}
        >
          <Plus className='h-4 w-4' />
          Complete Profile
        </Button>
      </div>

      {/* Profile Photo Hint */}
      {profile && profile.hasPhoto === false && (
        <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-3 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <AlertTriangle className='h-4 w-4 text-yellow-700' />
            <p className='text-sm text-yellow-800'>
              Add a profile photo to boost your visibility and build trust with employers.
            </p>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => navigate(user?.registration_complete ? '/dashboard/maid/profile' : '/complete-profile')}
          >
            Add Photo
          </Button>
        </div>
      )}

      {/* Languages Hint */}
      {profile && Array.isArray(profile.languages) && profile.languages.length === 0 && (
        <div className='rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Globe className='h-4 w-4 text-blue-700' />
            <p className='text-sm text-blue-800'>
              Add languages you speak so employers can find you more easily.
            </p>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => navigate(user?.registration_complete ? '/dashboard/maid/profile' : '/complete-profile')}
          >
            Add Languages
          </Button>
        </div>
      )}

      {/* Skills Hint */}
      {profile && Array.isArray(profile.skills) && profile.skills.length === 0 && (
        <div className='rounded-lg border border-indigo-200 bg-indigo-50 p-3 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Star className='h-4 w-4 text-indigo-700' />
            <p className='text-sm text-indigo-800'>
              Add your key skills to stand out to employers.
            </p>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => navigate(user?.registration_complete ? '/dashboard/maid/profile' : '/complete-profile')}
          >
            Add Skills
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <motion.div {...sectionAnimation}>
          <Card className='border-0 shadow-md'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Profile Status</p>
                  <p className='text-2xl font-bold text-gray-800'>
                    {getProfileCompleteness()}%
                  </p>
                </div>
                <div className='bg-purple-100 p-3 rounded-full'>
                  <Users className='h-6 w-6 text-purple-600' />
                </div>
              </div>
              <Progress value={getProfileCompleteness()} className='mt-2' />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...sectionAnimation} transition={{ delay: 0.1 }}>
          <Card className='border-0 shadow-md'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Pending Bookings</p>
                  <p className='text-2xl font-bold text-gray-800'>
                    {bookings.filter(b => b.status === 'pending').length}
                  </p>
                </div>
                <div className='bg-blue-100 p-3 rounded-full'>
                  <Calendar className='h-6 w-6 text-blue-600' />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...sectionAnimation} transition={{ delay: 0.2 }}>
          <Card className='border-0 shadow-md'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Rating</p>
                  <p className='text-2xl font-bold text-gray-800'>4.8/5</p>
                </div>
                <div className='bg-yellow-100 p-3 rounded-full'>
                  <Star className='h-6 w-6 text-yellow-600' />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...sectionAnimation} transition={{ delay: 0.3 }}>
          <Card className='border-0 shadow-md'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>Notifications</p>
                  <p className='text-2xl font-bold text-gray-800'>
                    {getUnreadNotificationsCount()}
                  </p>
                </div>
                <div className='bg-green-100 p-3 rounded-full'>
                  <TrendingUp className='h-6 w-6 text-green-600' />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* At a Glance */}
        <motion.div {...sectionAnimation} transition={{ delay: 0.35 }}>
          <Card className='border-0 shadow-lg'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle>At a Glance</CardTitle>
                  <CardDescription>Quick view of your current status</CardDescription>
                </div>
                <Button variant='outline' size='sm' onClick={() => navigate('/dashboard/maid/profile')}>
                  Update
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='space-y-1'>
                  <p className='text-xs uppercase tracking-wide text-gray-500'>Visa Status</p>
                  <p className='text-sm font-medium text-gray-800'>{profile?.visaStatus || 'Not specified'}</p>
                </div>
                <div className='space-y-1'>
                  <p className='text-xs uppercase tracking-wide text-gray-500'>Availability</p>
                  <p className='text-sm font-medium text-gray-800'>{profile?.availability || 'Not specified'}</p>
                </div>
                <div className='space-y-1'>
                  <p className='text-xs uppercase tracking-wide text-gray-500'>Top Skills</p>
                  <div className='flex flex-wrap gap-2'>
                    {(profile?.skills || []).slice(0, 3).map((skill, idx) => (
                      <Badge key={idx} variant='secondary' className='bg-indigo-100 text-indigo-800'>
                        {skill}
                      </Badge>
                    ))}
                    {(profile?.skills || []).length === 0 && (
                      <span className='text-sm text-gray-400'>No skills added</span>
                    )}
                  </div>
                </div>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                <div className='space-y-1 md:col-span-2'>
                  <p className='text-xs uppercase tracking-wide text-gray-500'>Top Languages</p>
                  <div className='flex flex-wrap gap-2'>
                    {(profile?.languages || []).slice(0, 3).map((lang, idx) => (
                      <Badge key={idx} variant='secondary' className='bg-blue-100 text-blue-800'>
                        {lang}
                      </Badge>
                    ))}
                    {(profile?.languages || []).length === 0 && (
                      <span className='text-sm text-gray-400'>No languages added</span>
                    )}
                  </div>
                </div>
                <div className='space-y-1'>
                  <p className='text-xs uppercase tracking-wide text-gray-500'>Living</p>
                  <div>
                    <Badge variant='secondary' className='bg-emerald-100 text-emerald-800'>
                      {profile?.livingArrangement || 'Not specified'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                <div className='space-y-1'>
                  <p className='text-xs uppercase tracking-wide text-gray-500'>Salary</p>
                  <p className='text-sm font-medium text-gray-800'>
                    {profile?.salaryRange && profile?.salaryRange !== 'Not specified'
                      ? profile.salaryRange
                      : 'Not specified'}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-xs uppercase tracking-wide text-gray-500'>Contract</p>
                  <p className='text-sm font-medium text-gray-800'>{profile?.contractPreference || 'Not specified'}</p>
                </div>
                <div className='space-y-1'>
                  <p className='text-xs uppercase tracking-wide text-gray-500'>Photo</p>
                  {profile?.hasPhoto ? (
                    <Badge variant='secondary' className='bg-green-100 text-green-800'>Set</Badge>
                  ) : (
                    <Badge variant='destructive' className='bg-yellow-100 text-yellow-800 border-yellow-300'>Missing</Badge>
                  )}
                </div>
              </div>
              <div className='flex justify-end mt-3'>
                <p className='text-xs text-gray-400'>
                  Last updated: {profile?.lastUpdated ? format(new Date(profile.lastUpdated), 'MMM d, yyyy') : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        {/* Recent Bookings */}
        <motion.div {...sectionAnimation} transition={{ delay: 0.4 }}>
          <Card className='border-0 shadow-lg'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription>Your latest booking requests</CardDescription>
                </div>
                <Button variant='outline' size='sm' onClick={() => navigate('/dashboard/maid/bookings')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {bookings.length > 0 ? (
                <div className='space-y-3'>
                  {bookings.slice(0, 3).map((booking, index) => (
                    <div key={index} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                      <div>
                        <p className='font-medium text-sm'>
                          {booking.job_type || 'Booking Request'}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {booking.created_at && format(new Date(booking.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge
                        variant={
                          booking.status === 'pending'
                            ? 'outline'
                            : booking.status === 'accepted'
                              ? 'default'
                              : 'destructive'
                        }
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-6'>
                  <Calendar className='h-12 w-12 text-gray-300 mx-auto mb-3' />
                  <p className='text-gray-500'>No bookings yet</p>
                  <p className='text-sm text-gray-400'>Complete your profile to start receiving bookings</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Status */}
        <motion.div {...sectionAnimation} transition={{ delay: 0.5 }}>
          <Card className='border-0 shadow-lg'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle>Profile Status</CardTitle>
                  <CardDescription>Complete your profile to get more visibility</CardDescription>
                </div>
                <Button variant='outline' size='sm' onClick={() => navigate('/dashboard/maid/profile')}>
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle className={`h-4 w-4 ${profile?.verificationStatus?.email ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className='text-sm'>Email Verified</span>
                  </div>
                  <Badge variant={profile?.verificationStatus?.email ? 'default' : 'outline'}>
                    {profile?.verificationStatus?.email ? 'Done' : 'Pending'}
                  </Badge>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle className={`h-4 w-4 ${profile?.verificationStatus?.phone ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className='text-sm'>Phone Verified</span>
                  </div>
                  <Badge variant={profile?.verificationStatus?.phone ? 'default' : 'outline'}>
                    {profile?.verificationStatus?.phone ? 'Done' : 'Pending'}
                  </Badge>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle className={`h-4 w-4 ${profile?.verificationStatus?.documents ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className='text-sm'>Documents Verified</span>
                  </div>
                  <Badge variant={profile?.verificationStatus?.documents ? 'default' : 'outline'}>
                    {profile?.verificationStatus?.documents ? 'Done' : 'Pending'}
                  </Badge>
                </div>

                <div className='pt-2 border-t'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>Overall Progress</span>
                    <span className='text-sm font-bold'>{getProfileCompleteness()}%</span>
                  </div>
                  <Progress value={getProfileCompleteness()} className='mt-2' />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Notifications */}
      <motion.div {...sectionAnimation} transition={{ delay: 0.6 }}>
        <Card className='border-0 shadow-lg'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>Recent Notifications</CardTitle>
                <CardDescription>Stay updated with your latest activity</CardDescription>
              </div>
              <Button variant='outline' size='sm' onClick={() => navigate('/dashboard/maid/notifications')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className='space-y-3'>
                {notifications.slice(0, 3).map((notification, index) => (
                  <div key={index} className='flex items-start gap-3 p-3 bg-gray-50 rounded-lg'>
                    <div className={`p-1 rounded-full ${!notification.read ? 'bg-blue-500' : 'bg-gray-300'}`}>
                      <div className='w-2 h-2 rounded-full bg-white'></div>
                    </div>
                    <div className='flex-1'>
                      <p className='font-medium text-sm'>{notification.title || 'Notification'}</p>
                      <p className='text-xs text-gray-600 mt-1'>
                        {notification.message || 'No message content'}
                      </p>
                      <p className='text-xs text-gray-400 mt-1'>
                        {notification.created_at && format(new Date(notification.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-6'>
                <Clock className='h-12 w-12 text-gray-300 mx-auto mb-3' />
                <p className='text-gray-500'>No notifications yet</p>
                <p className='text-sm text-gray-400'>We'll notify you when something important happens</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default MaidOverview;
