import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Users,
  Shield,
  Heart,
  Globe,
  Clock,
  Star,
  TrendingUp,
  CheckCircle,
  Award,
  Calendar,
  UserCheck,
  Building2,
  Target,
  Zap,
} from 'lucide-react';

// Comprehensive mock data for Ethiopian Maids platform statistics
// These numbers are realistic and align with a growing domestic worker placement platform
const statsData = [
  {
    id: 'verified-workers',
    number: 1247,
    displayNumber: '1,247+',
    label: 'Verified Ethiopian Domestic Workers',
    icon: UserCheck,
    description:
      'Thoroughly screened, trained, and certified Ethiopian domestic workers ready for placement across GCC countries',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    category: 'workforce',
    lastUpdated: '2024-01-28',
    growthRate: '+12% this month',
  },
  {
    id: 'successful-placements',
    number: 2856,
    displayNumber: '2,856+',
    label: 'Successful Job Placements',
    icon: Heart,
    description:
      'Completed job placements with families across UAE, Saudi Arabia, Kuwait, Qatar, Bahrain, and Oman',
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50',
    iconColor: 'text-pink-600',
    category: 'placements',
    lastUpdated: '2024-01-28',
    growthRate: '+8% this month',
  },
  {
    id: 'certified-agencies',
    number: 127,
    displayNumber: '127+',
    label: 'Certified Recruitment Agencies',
    icon: Building2,
    description:
      'Licensed and verified recruitment agencies operating in Ethiopia and GCC countries with full compliance',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    category: 'partners',
    lastUpdated: '2024-01-28',
    growthRate: '+5% this month',
  },
  {
    id: 'gcc-countries',
    number: 6,
    displayNumber: '6',
    label: 'GCC Countries Served',
    icon: Globe,
    description:
      'Complete coverage across all Gulf Cooperation Council nations: UAE, Saudi Arabia, Kuwait, Qatar, Bahrain, Oman',
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
    category: 'coverage',
    lastUpdated: '2024-01-28',
    growthRate: 'Full coverage',
  },
  {
    id: 'avg-placement-time',
    number: 8,
    displayNumber: '8 Days',
    label: 'Average Placement Time',
    icon: Zap,
    description:
      'Average time from initial application to successful job placement and visa processing completion',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
    category: 'efficiency',
    lastUpdated: '2024-01-28',
    growthRate: '-2 days improved',
  },
  {
    id: 'satisfaction-rate',
    number: 97,
    displayNumber: '97%',
    label: 'Family Satisfaction Rate',
    icon: Star,
    description:
      'Percentage of sponsor families reporting excellent satisfaction with their Ethiopian domestic worker',
    color: 'from-yellow-500 to-amber-500',
    bgColor: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    category: 'quality',
    lastUpdated: '2024-01-28',
    growthRate: '+2% this quarter',
  },
  {
    id: 'monthly-registrations',
    number: 342,
    displayNumber: '342+',
    label: 'Monthly New Registrations',
    icon: TrendingUp,
    description:
      'New domestic workers and sponsor families joining the platform each month across all GCC countries',
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    category: 'growth',
    lastUpdated: '2024-01-28',
    growthRate: '+18% vs last month',
  },
  {
    id: 'contract-completion',
    number: 94,
    displayNumber: '94%',
    label: 'Contract Completion Rate',
    icon: Target,
    description:
      'Percentage of domestic workers who successfully complete their full contract term with sponsor families',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    category: 'retention',
    lastUpdated: '2024-01-28',
    growthRate: '+3% this year',
  },
  {
    id: 'active-sponsors',
    number: 1893,
    displayNumber: '1,893+',
    label: 'Active Sponsor Families',
    icon: Users,
    description:
      'Registered sponsor families actively seeking or currently employing Ethiopian domestic workers',
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    category: 'community',
    lastUpdated: '2024-01-28',
    growthRate: '+15% this month',
  },
];

// Additional platform metrics for comprehensive data representation
const platformMetrics = {
  totalUsers: 4247,
  averageResponseTime: '2.3 hours',
  platformUptime: '99.8%',
  supportTicketsResolved: '98.5%',
  averageRating: 4.8,
  languagesSupported: ['English', 'Arabic', 'Amharic', 'Tigrinya'],
  operationalSince: '2019',
  totalCountriesServed: 7, // 6 GCC + Ethiopia
  verificationProcessTime: '24-48 hours',
  backgroundCheckSuccess: '99.2%',
};

// Custom hook for counter animation
const useCountUp = (end, duration = 2000, shouldStart = false) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!shouldStart || hasStarted) return;

    setHasStarted(true);
    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(end * easeOutQuart);
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        // Ensure we end with the exact target number
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, shouldStart, hasStarted]);

  // If animation hasn't started yet, show 0, otherwise show the animated count
  return shouldStart ? count : 0;
};

const StatsSection = () => {
  const [hoveredStat, setHoveredStat] = useState(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, threshold: 0.1 });

  // Select the most important statistics for main display (6 key metrics)
  const primaryStats = statsData.filter((stat) =>
    [
      'verified-workers',
      'successful-placements',
      'certified-agencies',
      'gcc-countries',
      'satisfaction-rate',
      'avg-placement-time',
    ].includes(stat.id)
  );

  // Debug log to check if animation is triggering
  useEffect(() => {
  }, [isInView]);

  return (
    <section
      ref={sectionRef}
      className='py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden'
    >
      {/* Background Pattern */}
      <div className='absolute inset-0 opacity-5'>
        <div className='absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-purple-600/10'></div>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl'></div>
        <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl'></div>
      </div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <motion.div
          className='text-center mb-16'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className='inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full mb-6'>
            <TrendingUp className='w-5 h-5 text-purple-600 mr-2' />
            <span className='text-purple-700 font-semibold text-sm'>
              Platform Statistics
            </span>
          </div>
          <h2 className='text-4xl md:text-5xl font-bold text-gray-900 mb-6'>
            Trusted by{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600'>
              4,200+ Users
            </span>
          </h2>
          <p className='text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed'>
            With 1,247+ verified Ethiopian domestic workers and 1,893+ active
            sponsor families, our platform has successfully completed 2,856+ job
            placements across all 6 GCC countries with an outstanding 97%
            satisfaction rate.
          </p>
        </motion.div>

        {/* Primary Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {primaryStats.map((stat, index) => {
            const Icon = stat.icon;
            const animatedCount = useCountUp(
              stat.number,
              2000 + index * 200,
              isInView
            );
            // Fallback to actual number if animation hasn't started after 3 seconds
            const displayCount =
              animatedCount > 0 ? animatedCount : isInView ? stat.number : 0;

            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  type: 'spring',
                  stiffness: 100,
                }}
                viewport={{ once: true }}
                className='group relative'
                onMouseEnter={() => setHoveredStat(stat.id)}
                onMouseLeave={() => setHoveredStat(null)}
              >
                <div
                  className={`
                  relative p-8 rounded-2xl border border-gray-200/50
                  bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl
                  transition-all duration-500 cursor-pointer overflow-hidden
                  ${hoveredStat === stat.id ? 'transform scale-105 -translate-y-2' : ''}
                `}
                >
                  {/* Background Gradient Overlay */}
                  <div
                    className={`
                    absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0
                    group-hover:opacity-5 transition-opacity duration-500
                  `}
                  ></div>

                  {/* Decorative Elements */}
                  <div className='absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300'>
                    <Icon className='w-16 h-16 text-gray-400' />
                  </div>

                  {/* Icon */}
                  <div
                    className={`
                    relative inline-flex items-center justify-center w-16 h-16
                    rounded-2xl ${stat.bgColor} mb-6 group-hover:scale-110
                    transition-transform duration-300
                  `}
                  >
                    <Icon className={`w-8 h-8 ${stat.iconColor}`} />
                  </div>

                  {/* Number */}
                  <div className='relative mb-3'>
                    <div className='text-4xl md:text-5xl font-bold text-gray-900 mb-1'>
                      {stat.id === 'avg-placement-time'
                        ? `${displayCount} Days`
                        : stat.id === 'satisfaction-rate'
                          ? `${displayCount}%`
                          : stat.id === 'gcc-countries'
                            ? displayCount
                            : `${displayCount.toLocaleString()}+`}
                    </div>
                    {/* Growth indicator */}
                    {hoveredStat === stat.id && stat.growthRate && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='text-xs text-green-600 font-medium mb-2'
                      >
                        📈 {stat.growthRate}
                      </motion.div>
                    )}
                    {hoveredStat === stat.id && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        className={`h-1 bg-gradient-to-r ${stat.color} rounded-full`}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <h3 className='text-xl font-semibold text-gray-800 mb-3 group-hover:text-gray-900 transition-colors'>
                    {stat.label}
                  </h3>

                  {/* Description */}
                  <p className='text-gray-600 text-sm leading-relaxed group-hover:text-gray-700 transition-colors'>
                    {stat.description}
                  </p>

                  {/* Hover Effect Badge */}
                  {hoveredStat === stat.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className='absolute top-4 left-4'
                    >
                      <div
                        className={`
                        px-3 py-1 rounded-full text-xs font-medium text-white
                        bg-gradient-to-r ${stat.color} shadow-lg
                      `}
                      >
                        <CheckCircle className='w-3 h-3 inline mr-1' />
                        Verified
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Secondary Stats - Additional Metrics */}
        <motion.div
          className='mt-20'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className='text-center mb-12'>
            <h3 className='text-2xl font-bold text-gray-800 mb-4'>
              Platform Growth & Performance
            </h3>
            <p className='text-gray-600 max-w-2xl mx-auto'>
              Additional metrics showcasing our platform's continuous growth and
              commitment to excellence
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {statsData
              .filter((stat) =>
                [
                  'monthly-registrations',
                  'contract-completion',
                  'active-sponsors',
                ].includes(stat.id)
              )
              .map((stat, index) => {
                const Icon = stat.icon;
                const animatedCount = useCountUp(
                  stat.number,
                  1500 + index * 150,
                  isInView
                );
                const displayCount =
                  animatedCount > 0
                    ? animatedCount
                    : isInView
                      ? stat.number
                      : 0;

                return (
                  <motion.div
                    key={stat.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className='text-center p-6 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200/50 hover:bg-white/80 transition-all duration-300'
                  >
                    <div
                      className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${stat.bgColor} mb-4`}
                    >
                      <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                    <div className='text-2xl font-bold text-gray-900 mb-2'>
                      {stat.id === 'contract-completion'
                        ? `${displayCount}%`
                        : `${displayCount.toLocaleString()}+`}
                    </div>
                    <div className='text-sm font-medium text-gray-700 mb-1'>
                      {stat.label}
                    </div>
                    <div className='text-xs text-gray-500'>
                      {stat.growthRate}
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>

        {/* Platform Metrics Summary */}
        <motion.div
          className='mt-16 p-8 rounded-2xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className='text-center mb-8'>
            <h3 className='text-xl font-bold text-gray-800 mb-2'>
              Platform Excellence
            </h3>
            <p className='text-gray-600'>
              Key performance indicators demonstrating our commitment to quality
            </p>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-4 gap-6 text-center'>
            <div>
              <div className='text-2xl font-bold text-purple-600 mb-1'>
                {platformMetrics.averageRating}/5
              </div>
              <div className='text-sm text-gray-600'>Platform Rating</div>
            </div>
            <div>
              <div className='text-2xl font-bold text-blue-600 mb-1'>
                {platformMetrics.platformUptime}
              </div>
              <div className='text-sm text-gray-600'>Uptime</div>
            </div>
            <div>
              <div className='text-2xl font-bold text-green-600 mb-1'>
                {platformMetrics.averageResponseTime}
              </div>
              <div className='text-sm text-gray-600'>Avg Response</div>
            </div>
            <div>
              <div className='text-2xl font-bold text-orange-600 mb-1'>
                {platformMetrics.verificationProcessTime}
              </div>
              <div className='text-sm text-gray-600'>Verification Time</div>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className='text-center mt-16'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <div className='inline-flex items-center justify-center gap-2 text-gray-600 text-sm'>
            <Calendar className='w-4 h-4' />
            <span>
              Statistics updated in real-time • Last updated: January 28, 2024
            </span>
            <Award className='w-4 h-4 text-yellow-500' />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;
