import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Users,
  Briefcase,
  Shield,
  Globe,
  CheckCircle,
  Clock,
  Star,
  Award,
  Zap,
  Heart,
  UserCheck,
  FileCheck,
  Phone,
  MessageCircle,
  Lock,
  TrendingUp,
} from 'lucide-react';

// Primary features - main value propositions
const primaryFeatures = [
  {
    id: 'verified-workers',
    icon: UserCheck,
    title: 'Verified Ethiopian Workers',
    description:
      'Thoroughly screened and certified Ethiopian domestic workers with verified backgrounds, skills assessments, and health clearances.',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    stats: '1,247+ Verified',
    benefits: [
      'Background checks',
      'Skills verification',
      'Health clearance',
      'Reference validation',
    ],
  },
  {
    id: 'trusted-agencies',
    icon: Shield,
    title: 'Licensed Recruitment Agencies',
    description:
      'Partner with 127+ certified agencies operating legally in Ethiopia and GCC countries with full compliance and transparency.',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
    stats: '127+ Agencies',
    benefits: [
      'Legal compliance',
      'Government licensed',
      'Transparent fees',
      'Ethical practices',
    ],
  },
  {
    id: 'gcc-coverage',
    icon: Globe,
    title: 'Complete GCC Coverage',
    description:
      'Serving all 6 Gulf Cooperation Council countries with localized support, regulations knowledge, and cultural understanding.',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    stats: '6 Countries',
    benefits: [
      'UAE, Saudi, Kuwait',
      'Qatar, Bahrain, Oman',
      'Local regulations',
      'Cultural support',
    ],
  },
  {
    id: 'smart-matching',
    icon: Zap,
    title: 'AI-Powered Matching',
    description:
      'Advanced matching algorithm considers skills, experience, language, and family preferences for perfect compatibility.',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
    stats: '97% Success Rate',
    benefits: [
      'Skills matching',
      'Language compatibility',
      'Experience level',
      'Family preferences',
    ],
  },
  {
    id: 'fast-placement',
    icon: Clock,
    title: 'Rapid Placement Process',
    description:
      'Average 8-day placement time from application to job offer with streamlined visa processing and documentation.',
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    stats: '8 Days Average',
    benefits: [
      'Quick processing',
      'Visa assistance',
      'Document support',
      'Fast approvals',
    ],
  },
  {
    id: 'satisfaction-guarantee',
    icon: Star,
    title: 'Satisfaction Guarantee',
    description:
      '97% family satisfaction rate with comprehensive support, replacement guarantee, and ongoing relationship management.',
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    stats: '97% Satisfaction',
    benefits: [
      'Replacement guarantee',
      '24/7 support',
      'Ongoing mediation',
      'Quality assurance',
    ],
  },
];

// Secondary features - additional benefits
const secondaryFeatures = [
  {
    id: 'secure-platform',
    icon: Lock,
    title: 'Secure & Private',
    description:
      'Bank-level security with encrypted data and privacy protection',
    color: 'from-gray-500 to-slate-500',
  },
  {
    id: 'multilingual-support',
    icon: MessageCircle,
    title: 'Multilingual Support',
    description: 'Support in English, Arabic, Amharic, and Tigrinya languages',
    color: 'from-teal-500 to-cyan-500',
  },
  {
    id: '24-7-support',
    icon: Phone,
    title: '24/7 Customer Support',
    description: 'Round-the-clock assistance for all your needs and concerns',
    color: 'from-rose-500 to-pink-500',
  },
  {
    id: 'transparent-pricing',
    icon: FileCheck,
    title: 'Transparent Pricing',
    description: 'No hidden fees, clear pricing structure, and value for money',
    color: 'from-emerald-500 to-green-500',
  },
];

const FeaturesSection = () => {
  const [hoveredFeature, setHoveredFeature] = useState(null);

  return (
    <section className='py-24 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden'>
      {/* Background Pattern */}
      <div className='absolute inset-0 opacity-5'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl'></div>
        <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl'></div>
      </div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <motion.div
          className='text-center mb-20'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className='inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full mb-6'>
            <Award className='w-5 h-5 text-purple-600 mr-2' />
            <span className='text-purple-700 font-semibold text-sm'>
              Platform Advantages
            </span>
          </div>
          <h2 className='text-4xl md:text-5xl font-bold text-gray-900 mb-6'>
            Why Choose{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600'>
              Our Platform?
            </span>
          </h2>
          <p className='text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed'>
            We provide the most comprehensive, secure, and efficient platform
            for connecting Ethiopian domestic workers with families across the
            GCC region. Our commitment to excellence, transparency, and cultural
            understanding sets us apart.
          </p>
        </motion.div>

        {/* Primary Features Grid */}
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20'>
          {primaryFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.id}
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
                onMouseEnter={() => setHoveredFeature(feature.id)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <Card
                  className={`
                  h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500
                  bg-white/80 backdrop-blur-sm overflow-hidden cursor-pointer
                  ${hoveredFeature === feature.id ? 'transform scale-105 -translate-y-2' : ''}
                `}
                >
                  {/* Background Gradient Overlay */}
                  <div
                    className={`
                    absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0
                    group-hover:opacity-5 transition-opacity duration-500
                  `}
                  ></div>

                  {/* Stats Badge */}
                  <div className='absolute top-4 right-4'>
                    <div
                      className={`
                      px-3 py-1 rounded-full text-xs font-medium
                      ${feature.bgColor} ${feature.iconColor} border border-current/20
                    `}
                    >
                      {feature.stats}
                    </div>
                  </div>

                  <CardHeader className='text-center pb-4'>
                    <div
                      className={`
                      inline-flex items-center justify-center w-16 h-16
                      rounded-2xl ${feature.bgColor} mb-6 mx-auto
                      group-hover:scale-110 transition-transform duration-300
                    `}
                    >
                      <Icon className={`w-8 h-8 ${feature.iconColor}`} />
                    </div>
                    <CardTitle className='text-xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors'>
                      {feature.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className='pt-0'>
                    <CardDescription className='text-center text-gray-600 mb-6 leading-relaxed'>
                      {feature.description}
                    </CardDescription>

                    {/* Benefits List */}
                    <div className='space-y-2'>
                      {feature.benefits.map((benefit, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.1 }}
                          className='flex items-center text-sm text-gray-600'
                        >
                          <CheckCircle className='w-4 h-4 text-green-500 mr-2 flex-shrink-0' />
                          <span>{benefit}</span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>

                  {/* Hover Effect Indicator */}
                  {hoveredFeature === feature.id && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${feature.color}`}
                    />
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Secondary Features */}
        <motion.div
          className='mb-16'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className='text-center mb-12'>
            <h3 className='text-2xl font-bold text-gray-800 mb-4'>
              Additional Platform Benefits
            </h3>
            <p className='text-gray-600 max-w-2xl mx-auto'>
              Beyond our core features, we provide comprehensive support and
              services to ensure your success
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {secondaryFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className='text-center p-6 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200/50 hover:bg-white/80 hover:shadow-lg transition-all duration-300'
                >
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}
                  >
                    <Icon className='w-6 h-6 text-white' />
                  </div>
                  <h4 className='text-lg font-semibold text-gray-900 mb-2'>
                    {feature.title}
                  </h4>
                  <p className='text-sm text-gray-600'>{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          className='text-center p-8 rounded-2xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className='flex flex-col md:flex-row items-center justify-center gap-8 text-center'>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                <CheckCircle className='w-6 h-6 text-green-600' />
              </div>
              <div>
                <div className='text-lg font-bold text-gray-900'>
                  Government Licensed
                </div>
                <div className='text-sm text-gray-600'>
                  Fully compliant operations
                </div>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                <Shield className='w-6 h-6 text-blue-600' />
              </div>
              <div>
                <div className='text-lg font-bold text-gray-900'>
                  Secure Platform
                </div>
                <div className='text-sm text-gray-600'>Bank-level security</div>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center'>
                <Heart className='w-6 h-6 text-purple-600' />
              </div>
              <div>
                <div className='text-lg font-bold text-gray-900'>
                  Ethical Practices
                </div>
                <div className='text-sm text-gray-600'>
                  Fair treatment guaranteed
                </div>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center'>
                <TrendingUp className='w-6 h-6 text-orange-600' />
              </div>
              <div>
                <div className='text-lg font-bold text-gray-900'>
                  Proven Results
                </div>
                <div className='text-sm text-gray-600'>
                  2,856+ successful placements
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
