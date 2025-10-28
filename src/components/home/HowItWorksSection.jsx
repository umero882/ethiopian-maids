import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Users,
  Award,
  UserPlus,
  Search,
  MessageCircle,
  FileCheck,
  CreditCard,
  Plane,
  Heart,
  Shield,
  Clock,
  Star,
  ArrowRight,
  PlayCircle,
  Target,
  Zap,
  Globe,
  Phone,
} from 'lucide-react';

// Sponsor (Family) Journey
const sponsorSteps = [
  {
    step: '1',
    title: 'Create Account & Verify',
    description:
      'Register as a sponsor family, upload required documents, and complete identity verification',
    detailedSteps: [
      'Sign up with email and phone',
      'Upload Emirates ID/Iqama',
      'Provide family information',
      'Complete background verification',
    ],
    icon: UserPlus,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    duration: '24-48 hours',
    status: 'verification',
  },
  {
    step: '2',
    title: 'Browse & Filter Workers',
    description:
      'Search through 1,247+ verified Ethiopian domestic workers using advanced filters',
    detailedSteps: [
      'Use smart search filters',
      'View detailed profiles',
      'Check skills and experience',
      'Review background reports',
    ],
    icon: Search,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
    duration: '1-3 days',
    status: 'browsing',
  },
  {
    step: '3',
    title: 'Connect & Interview',
    description:
      'Contact preferred candidates through our secure messaging system and conduct interviews',
    detailedSteps: [
      'Send connection requests',
      'Schedule video interviews',
      'Discuss requirements',
      'Check references',
    ],
    icon: MessageCircle,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    duration: '2-5 days',
    status: 'interviewing',
  },
  {
    step: '4',
    title: 'Finalize & Process',
    description:
      'Complete hiring paperwork, process visa applications, and arrange travel',
    detailedSteps: [
      'Sign employment contract',
      'Process visa application',
      'Arrange medical tests',
      'Book travel arrangements',
    ],
    icon: FileCheck,
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
    duration: '1-2 weeks',
    status: 'processing',
  },
];

// Worker Journey
const workerSteps = [
  {
    step: '1',
    title: 'Register & Complete Profile',
    description:
      'Create your profile with skills, experience, and upload required documents',
    detailedSteps: [
      'Complete registration form',
      'Upload passport and photos',
      'Add skills and experience',
      'Submit for verification',
    ],
    icon: UserPlus,
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    duration: '1-2 days',
    status: 'registration',
  },
  {
    step: '2',
    title: 'Verification & Approval',
    description:
      'Our team verifies your documents, conducts background checks, and approves your profile',
    detailedSteps: [
      'Document verification',
      'Background screening',
      'Skills assessment',
      'Profile approval',
    ],
    icon: Shield,
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'bg-teal-50',
    iconColor: 'text-teal-600',
    duration: '2-3 days',
    status: 'verification',
  },
  {
    step: '3',
    title: 'Get Matched & Interviewed',
    description:
      'Receive job opportunities from verified families and participate in interviews',
    detailedSteps: [
      'Receive job matches',
      'Review family profiles',
      'Attend video interviews',
      'Negotiate terms',
    ],
    icon: Target,
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-rose-50',
    iconColor: 'text-rose-600',
    duration: '1-2 weeks',
    status: 'matching',
  },
  {
    step: '4',
    title: 'Travel & Start Work',
    description:
      'Complete final preparations, travel to your destination, and begin your new job',
    detailedSteps: [
      'Complete medical tests',
      'Receive visa approval',
      'Travel arrangements',
      'Start employment',
    ],
    icon: Plane,
    color: 'from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    duration: '1-2 weeks',
    status: 'deployment',
  },
];

// Process highlights
const processHighlights = [
  {
    icon: Clock,
    title: '8 Days Average',
    description: 'From application to job offer',
    color: 'text-blue-600',
  },
  {
    icon: Shield,
    title: '100% Verified',
    description: 'All profiles thoroughly screened',
    color: 'text-green-600',
  },
  {
    icon: Star,
    title: '97% Success Rate',
    description: 'Successful job placements',
    color: 'text-yellow-600',
  },
  {
    icon: Phone,
    title: '24/7 Support',
    description: 'Assistance throughout the process',
    color: 'text-purple-600',
  },
];

const HowItWorksSection = () => {
  const [activeTab, setActiveTab] = useState('sponsors');
  const [hoveredStep, setHoveredStep] = useState(null);

  const currentSteps = activeTab === 'sponsors' ? sponsorSteps : workerSteps;

  return (
    <section className='py-24 bg-gradient-to-br from-gray-50 via-white to-purple-50 relative overflow-hidden'>
      {/* Background Pattern */}
      <div className='absolute inset-0 opacity-5'>
        <div className='absolute top-0 right-1/4 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl'></div>
        <div className='absolute bottom-0 left-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl'></div>
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
            <PlayCircle className='w-5 h-5 text-purple-600 mr-2' />
            <span className='text-purple-700 font-semibold text-sm'>
              Step-by-Step Process
            </span>
          </div>
          <h2 className='text-4xl md:text-5xl font-bold text-gray-900 mb-6'>
            How It{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600'>
              Works
            </span>
          </h2>
          <p className='text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed'>
            Our streamlined process makes it easy for families to find trusted
            Ethiopian domestic workers and for workers to secure meaningful
            employment opportunities across the GCC.
          </p>
        </motion.div>

        {/* Tab Selector */}
        <motion.div
          className='flex justify-center mb-16'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className='bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200/50'>
            <button
              onClick={() => setActiveTab('sponsors')}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'sponsors'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Users className='w-5 h-5 inline mr-2' />
              For Sponsor Families
            </button>
            <button
              onClick={() => setActiveTab('workers')}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'workers'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Heart className='w-5 h-5 inline mr-2' />
              For Ethiopian Workers
            </button>
          </div>
        </motion.div>

        {/* Steps Grid */}
        <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20'>
          {currentSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={`${activeTab}-${step.step}`}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  type: 'spring',
                  stiffness: 100,
                }}
                viewport={{ once: true }}
                className='relative group'
                onMouseEnter={() => setHoveredStep(`${activeTab}-${step.step}`)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                {/* Connection Line */}
                {index < currentSteps.length - 1 && (
                  <div className='hidden lg:block absolute top-16 left-full w-8 h-0.5 bg-gradient-to-r from-gray-300 to-transparent z-0'></div>
                )}

                <div
                  className={`
                  relative p-8 rounded-2xl border border-gray-200/50
                  bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl
                  transition-all duration-500 cursor-pointer overflow-hidden
                  ${hoveredStep === `${activeTab}-${step.step}` ? 'transform scale-105 -translate-y-2' : ''}
                `}
                >
                  {/* Background Gradient Overlay */}
                  <div
                    className={`
                    absolute inset-0 bg-gradient-to-br ${step.color} opacity-0
                    group-hover:opacity-5 transition-opacity duration-500
                  `}
                  ></div>

                  {/* Step Number & Icon */}
                  <div className='relative mb-6'>
                    <div
                      className={`
                      inline-flex items-center justify-center w-16 h-16
                      rounded-2xl ${step.bgColor} mb-4 group-hover:scale-110
                      transition-transform duration-300
                    `}
                    >
                      <Icon className={`w-8 h-8 ${step.iconColor}`} />
                    </div>
                    <div className='absolute -top-2 -right-2'>
                      <div
                        className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
                        bg-gradient-to-r ${step.color} shadow-lg
                      `}
                      >
                        {step.step}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className='text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors'>
                    {step.title}
                  </h3>
                  <p className='text-gray-600 text-sm leading-relaxed mb-4 group-hover:text-gray-700 transition-colors'>
                    {step.description}
                  </p>

                  {/* Duration Badge */}
                  <div
                    className={`
                    inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                    ${step.bgColor} ${step.iconColor} border border-current/20 mb-4
                  `}
                  >
                    <Clock className='w-3 h-3 mr-1' />
                    {step.duration}
                  </div>

                  {/* Detailed Steps */}
                  {hoveredStep === `${activeTab}-${step.step}` && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className='space-y-2'
                    >
                      {step.detailedSteps.map((detailStep, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className='flex items-center text-xs text-gray-600'
                        >
                          <CheckCircle className='w-3 h-3 text-green-500 mr-2 flex-shrink-0' />
                          <span>{detailStep}</span>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {/* Hover Effect Indicator */}
                  {hoveredStep === `${activeTab}-${step.step}` && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${step.color} rounded-full`}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Process Highlights */}
        <motion.div
          className='mb-16'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className='text-center mb-12'>
            <h3 className='text-2xl font-bold text-gray-800 mb-4'>
              Why Our Process Works
            </h3>
            <p className='text-gray-600 max-w-2xl mx-auto'>
              Our proven methodology ensures successful matches with
              industry-leading metrics
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {processHighlights.map((highlight, index) => {
              const Icon = highlight.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className='text-center p-6 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200/50 hover:bg-white/80 hover:shadow-lg transition-all duration-300'
                >
                  <div className='inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 mb-4'>
                    <Icon className={`w-6 h-6 ${highlight.color}`} />
                  </div>
                  <div className='text-2xl font-bold text-gray-900 mb-2'>
                    {highlight.title}
                  </div>
                  <div className='text-sm text-gray-600'>
                    {highlight.description}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          className='text-center mt-12'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <div className='inline-flex items-center justify-center gap-2 text-gray-600 text-sm'>
            <Globe className='w-4 h-4' />
            <span>Available across all 6 GCC countries</span>
            <span className='mx-2'>•</span>
            <Zap className='w-4 h-4' />
            <span>Average 8-day placement time</span>
            <span className='mx-2'>•</span>
            <Shield className='w-4 h-4' />
            <span>100% verified profiles</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
