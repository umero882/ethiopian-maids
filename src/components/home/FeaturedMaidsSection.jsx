import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MapPin,
  Star,
  Clock,
  ArrowRight,
  Award,
  Eye,
  Heart,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMaidDisplayName } from '@/lib/displayName';

const featuredMaidsData = [
  {
    id: 1,
    name: 'Almaz Tadesse',
    age: 28,
    country: 'Ethiopia',
    experience: '5 years',
    rating: 4.9,
    skills: ['Cleaning', 'Cooking', 'Childcare'],
    languages: ['Amharic', 'English', 'Arabic'],
    verified: true,
    availability: 'Available',
    salary: '$350-450',
    image: '/images/Our featured/1.jpg',
    description:
      'Experienced domestic worker with excellent childcare skills and cooking expertise.',
  },
  {
    id: 2,
    name: 'Hanan Mohammed',
    age: 32,
    country: 'Ethiopia',
    experience: '7 years',
    rating: 4.8,
    skills: ['Cleaning', 'Cooking', 'Elder Care'],
    languages: ['Amharic', 'English'],
    verified: true,
    availability: 'Available',
    salary: '$400-500',
    image: '/images/Our featured/2.png',
    description:
      'Specialized in elder care with extensive experience in household management.',
  },
  {
    id: 3,
    name: 'Meron Bekele',
    age: 25,
    country: 'Ethiopia',
    experience: '3 years',
    rating: 4.7,
    skills: ['Cleaning', 'Laundry', 'Basic Cooking'],
    languages: ['Amharic', 'English'],
    verified: true,
    availability: 'Available',
    salary: '$300-400',
    image: '/images/Our featured/3.png',
    description:
      'Young and energetic with strong attention to detail in household tasks.',
  },
  {
    id: 4,
    name: 'Selamawit Haile',
    age: 30,
    country: 'Ethiopia',
    experience: '6 years',
    rating: 4.9,
    skills: ['Cooking', 'Cleaning', 'Childcare'],
    languages: ['Amharic', 'English', 'Arabic'],
    verified: true,
    availability: 'Available',
    salary: '$380-480',
    image: '/images/Our featured/4.png',
    description:
      'Expert cook with international cuisine experience and childcare certification.',
  },
  {
    id: 5,
    name: 'Tigist Wolde',
    age: 26,
    country: 'Ethiopia',
    experience: '4 years',
    rating: 4.6,
    skills: ['Cleaning', 'Cooking', 'Pet Care'],
    languages: ['Amharic', 'English'],
    verified: true,
    availability: 'Available',
    salary: '$320-420',
    image: '/images/Our featured/5.jpg',
    description:
      'Reliable and trustworthy with special skills in pet care and household organization.',
  },
  {
    id: 6,
    name: 'Bethlehem Assefa',
    age: 29,
    country: 'Ethiopia',
    experience: '5 years',
    rating: 4.8,
    skills: ['Elder Care', 'Cooking', 'Cleaning'],
    languages: ['Amharic', 'English'],
    verified: true,
    availability: 'Available',
    salary: '$360-460',
    image: '/images/Our featured/6.jpg',
    description:
      'Compassionate elder care specialist with excellent cooking and cleaning skills.',
  },
  {
    id: 7,
    name: 'Rahel Tesfaye',
    age: 31,
    country: 'Ethiopia',
    experience: '8 years',
    rating: 4.9,
    skills: ['Cleaning', 'Laundry', 'Ironing'],
    languages: ['Amharic', 'English', 'Arabic'],
    verified: true,
    availability: 'Available',
    salary: '$400-500',
    image: '/images/Our featured/7.jpeg',
    description:
      'Highly experienced with exceptional attention to detail in all household tasks.',
  },
  {
    id: 8,
    name: 'Hiwot Girma',
    age: 27,
    country: 'Ethiopia',
    experience: '4 years',
    rating: 4.7,
    skills: ['Childcare', 'Cooking', 'Tutoring'],
    languages: ['Amharic', 'English'],
    verified: true,
    availability: 'Available',
    salary: '$340-440',
    image: '/images/Our featured/8.jpg',
    description:
      'Dedicated childcare provider with educational background and cooking expertise.',
  },
];

const FeaturedMaidsSection = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  // Duplicate the maids array to create seamless infinite scroll
  const duplicatedMaids = [...featuredMaidsData, ...featuredMaidsData];

  const handleViewProfile = (maidId) => {
    navigate(`/maids?highlight=${maidId}`);
  };

  const handleViewAllMaids = () => {
    navigate('/maids');
  };

  return (
    <section className='py-20 bg-gradient-to-br from-gray-50 via-white to-purple-50 overflow-hidden'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <motion.div
          className='text-center mb-16'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className='inline-flex items-center justify-center px-4 py-2 bg-purple-100 rounded-full mb-6'>
            <Award className='w-5 h-5 text-purple-600 mr-2' />
            <span className='text-purple-700 font-semibold text-sm'>
              Premium Profiles
            </span>
          </div>
          <h2 className='text-4xl md:text-5xl font-bold text-gray-900 mb-6'>
            Meet Our{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600'>
              Featured Maids
            </span>
          </h2>
          <p className='text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed'>
            Handpicked, verified professionals with exceptional skills and
            experience, ready to become trusted members of your family.
          </p>
        </motion.div>

        {/* Infinite Scrolling Carousel Container */}
        <div
          className='relative overflow-hidden'
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Cards Container */}
          <div className='overflow-hidden'>
            <motion.div
              className='flex gap-6'
              animate={
                isHovered
                  ? {}
                  : {
                      x: ['0%', '-50%'],
                    }
              }
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: 40,
                  ease: 'linear',
                },
              }}
            >
              {duplicatedMaids.map((maid, index) => (
                <motion.div
                  key={`${maid.id}-${index}`}
                  className='flex-shrink-0 w-80 md:w-96'
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: (index % featuredMaidsData.length) * 0.1,
                  }}
                  viewport={{ once: true }}
                >
                  <Card
                    className='h-full bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group cursor-pointer'
                    onMouseEnter={() => setHoveredCard(maid.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() => handleViewProfile(maid.id)}
                  >
                    {/* Image Section */}
                    <div className='relative overflow-hidden'>
                      <div className='aspect-[4/5] relative'>
                        <img
                          src={maid.image}
                          alt={`${getMaidDisplayName(maid)} - Professional domestic worker`}
                          className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-110'
                          loading='lazy'
                        />
                        <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

                        {/* Overlay Content */}
                        <AnimatePresence>
                          {hoveredCard === maid.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 20 }}
                              className='absolute bottom-4 left-4 right-4'
                            >
                              <Button
                                size='sm'
                                className='w-full bg-white/90 text-gray-900 hover:bg-white backdrop-blur-sm'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewProfile(maid.id);
                                }}
                              >
                                <Eye className='w-4 h-4 mr-2' />
                                View Profile
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Status Badges */}
                        <div className='absolute top-4 left-4 flex flex-col gap-2'>
                          {maid.verified && (
                            <Badge className='bg-green-500/90 text-white border-0 backdrop-blur-sm'>
                              <Award className='w-3 h-3 mr-1' />
                              Verified
                            </Badge>
                          )}
                          <Badge className='bg-blue-500/90 text-white border-0 backdrop-blur-sm'>
                            {maid.availability}
                          </Badge>
                        </div>

                        {/* Favorite Button */}
                        <button
                          className='absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500'
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle favorite functionality
                          }}
                          aria-label={`Add ${getMaidDisplayName(maid)} to favorites`}
                        >
                          <Heart className='w-4 h-4 text-gray-600 hover:text-red-500 transition-colors' />
                        </button>
                      </div>
                    </div>

                    {/* Card Content */}
                    <CardContent className='p-6 space-y-4'>
                      {/* Name and Rating */}
                      <div className='flex items-start justify-between'>
                        <div>
                          <h3 className='text-xl font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors'>
                            {getMaidDisplayName(maid)}
                          </h3>
                          <div className='flex items-center text-sm text-gray-500 mb-2'>
                            <MapPin className='w-4 h-4 mr-1 text-purple-500' />
                            {maid.country} • {maid.age} years old
                          </div>
                        </div>
                        <div className='flex items-center bg-yellow-50 px-2 py-1 rounded-full'>
                          <Star className='w-4 h-4 text-yellow-400 fill-current mr-1' />
                          <span className='text-sm font-semibold text-gray-700'>
                            {maid.rating}
                          </span>
                        </div>
                      </div>

                      {/* Experience and Salary */}
                      <div className='flex items-center justify-between text-sm'>
                        <div className='flex items-center text-gray-600'>
                          <Clock className='w-4 h-4 mr-1 text-purple-500' />
                          {maid.experience} experience
                        </div>
                        <div className='font-semibold text-green-600'>
                          {maid.salary}/month
                        </div>
                      </div>

                      {/* Description */}
                      <p className='text-gray-600 text-sm leading-relaxed line-clamp-2'>
                        {maid.description}
                      </p>

                      {/* Skills */}
                      <div className='space-y-2'>
                        <h4 className='text-sm font-semibold text-gray-700'>
                          Top Skills
                        </h4>
                        <div className='flex flex-wrap gap-1'>
                          {maid.skills.slice(0, 3).map((skill, skillIndex) => (
                            <Badge
                              key={skillIndex}
                              variant='secondary'
                              className='text-xs bg-purple-50 text-purple-700 hover:bg-purple-100'
                            >
                              {skill}
                            </Badge>
                          ))}
                          {maid.skills.length > 3 && (
                            <Badge variant='outline' className='text-xs'>
                              +{maid.skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Languages */}
                      <div className='flex items-center text-sm text-gray-600'>
                        <span className='font-medium mr-2'>Languages:</span>
                        <span>{maid.languages.join(', ')}</span>
                      </div>

                      {/* Action Button */}
                      <Button
                        className='w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProfile(maid.id);
                        }}
                      >
                        View Full Profile
                        <ArrowRight className='w-4 h-4 ml-2' />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Call to Action */}
        <motion.div
          className='text-center mt-16'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Button
            size='lg'
            onClick={handleViewAllMaids}
            className='bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105'
          >
            Browse All Maids
            <ArrowRight className='w-5 h-5 ml-2' />
          </Button>
          <p className='text-gray-600 mt-4 text-sm'>
            Discover over 1,000+ verified domestic workers ready to join your
            family
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedMaidsSection;
