import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, Globe, Clock, Briefcase, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const HeroSection = () => {
  const navigate = useNavigate();
  const authContext = useAuth();
  const { user, loading } = authContext || {};
  const [hoveredStat, setHoveredStat] = useState(null);

  const stats = [
    {
      id: 'profiles',
      icon: CheckCircle,
      number: '1000+',
      hoverNumber: '1,247',
      label: 'Verified Profiles',
      color: 'text-blue-400',
    },
    {
      id: 'countries',
      icon: Globe,
      number: '6',
      hoverNumber: '6',
      label: 'GCC Countries',
      color: 'text-green-400',
    },
    {
      id: 'time',
      icon: Clock,
      number: '7 days',
      hoverNumber: '5.2 days',
      label: 'Avg. Time to Hire',
      color: 'text-green-400',
    },
  ];

  return (
    <section
      className='relative overflow-hidden bg-cover bg-no-repeat pt-32 md:pt-36 min-h-screen'
      style={{
        backgroundImage:
          'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url("/images/hero-background.png")',
        backgroundPosition: 'center 20%',
        backgroundSize: 'cover',
      }}
      aria-label='Hero section with Ethiopian maid in kitchen background'
    >
      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex items-end min-h-[calc(100vh-8rem)] md:min-h-[calc(100vh-9rem)]'>
        <div className='text-center w-full pb-8 md:pb-16'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className='mt-20 md:mt-32 lg:mt-40'
          >
            <div className='inline-block mb-4'>
              <Badge className='bg-white/20 text-white border-white/30 backdrop-blur-sm'>
                Trusted by 2,000+ Families
              </Badge>
            </div>
            <div className='mb-6'>
              <h1 className='text-4xl md:text-6xl font-bold text-white text-shadow-2xl'>
                Connect Maids & Sponsors
                <span className='block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 drop-shadow-2xl'>
                  Across the GCC
                </span>
              </h1>
            </div>
            <div className='mb-8 max-w-3xl mx-auto'>
              <p className='text-xl text-white font-medium drop-shadow-lg'>
                The premier platform connecting Ethiopian domestic workers with
                families and agencies across Gulf countries.
              </p>
            </div>
            <div className='flex flex-col sm:flex-row gap-4 justify-center mb-12 md:mb-16'>
              {loading ? (
                // Show loading skeleton for buttons
                <>
                  <div className='w-64 h-14 bg-white/20 animate-pulse rounded-lg backdrop-blur-sm'></div>
                  <div className='w-48 h-14 bg-white/20 animate-pulse rounded-lg backdrop-blur-sm'></div>
                </>
              ) : (
                <>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Button
                      size='lg'
                      onClick={() => navigate(user ? '/maids' : '/register')}
                      className='bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-purple-500/25 text-lg font-semibold px-8 py-4 h-auto border-0 backdrop-blur-sm'
                    >
                      {user ? (
                        <>
                          <UserPlus className='mr-2 w-5 h-5' />
                          Browse Maids
                        </>
                      ) : (
                        <>
                          <UserPlus className='mr-2 w-5 h-5' />
                          Get Started Free
                        </>
                      )}
                      <ArrowRight className='ml-2 w-5 h-5 transition-transform group-hover:translate-x-1' />
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Button
                      size='lg'
                      variant='outline'
                      onClick={() => navigate('/jobs')}
                      className='border-2 border-white/80 text-white hover:bg-white hover:text-purple-700 hover:border-white text-lg font-semibold px-8 py-4 h-auto backdrop-blur-sm bg-white/10 shadow-lg hover:shadow-xl transition-all duration-300'
                    >
                      <Briefcase className='mr-2 w-5 h-5' />
                      View Jobs
                      <ArrowRight className='ml-2 w-5 h-5 transition-transform group-hover:translate-x-1' />
                    </Button>
                  </motion.div>
                </>
              )}
            </div>

            {/* Statistics Badges */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl mx-auto mt-8'>
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1 + index * 0.2 }}
                    className='backdrop-blur-sm bg-white/5 rounded-md p-3 text-center border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer'
                    onMouseEnter={() => setHoveredStat(stat.id)}
                    onMouseLeave={() => setHoveredStat(null)}
                  >
                    <div
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/15 mb-2 ${stat.color}`}
                    >
                      <Icon className='w-3 h-3' />
                    </div>
                    <div className='text-lg font-bold text-white mb-1'>
                      {hoveredStat === stat.id ? stat.hoverNumber : stat.number}
                    </div>
                    <div className='text-white/70 text-xs font-medium'>
                      {stat.label}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      <div className='absolute top-32 md:top-40 left-10 animate-float'>
        <div className='w-20 h-20 bg-yellow-400/20 rounded-full blur-xl'></div>
      </div>
      <div
        className='absolute bottom-20 right-10 animate-float'
        style={{ animationDelay: '2s' }}
      >
        <div className='w-32 h-32 bg-purple-400/20 rounded-full blur-xl'></div>
      </div>
    </section>
  );
};

export default HeroSection;
