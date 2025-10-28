import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Ahmed Al-Rashid',
    location: 'Dubai, UAE',
    text: 'Found the perfect maid for our family through this platform. The process was smooth and professional.',
    rating: 5,
  },
  {
    name: 'Fatima Al-Zahra',
    location: 'Riyadh, Saudi Arabia',
    text: 'As an agency, this platform has helped us connect with more families and grow our business significantly.',
    rating: 5,
  },
  {
    name: 'Maria Santos',
    location: 'Philippines',
    text: 'Got a wonderful job opportunity in Kuwait. The platform made everything easy and transparent.',
    rating: 5,
  },
  {
    name: 'Abdullah Al-Khater',
    location: 'Doha, Qatar',
    text: 'The quality of candidates is exceptional. We hired quickly and efficiently.',
    rating: 5,
  },
  {
    name: 'Noora Al-Jaber',
    location: 'Manama, Bahrain',
    text: 'Reliable and trustworthy platform. Highly recommended for families in Bahrain.',
    rating: 5,
  },
];

const TestimonialsSection = () => {
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  return (
    <section className='py-20 bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-16'>
          <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
            What Our Users Say
          </h2>
          <p className='text-xl text-gray-600'>
            Trusted by thousands across the GCC region
          </p>
        </div>

        <motion.div
          className='flex'
          animate={{
            x: ['0%', '-100%'],
            transition: {
              ease: 'linear',
              duration: 40,
              repeat: Infinity,
            },
          }}
        >
          {duplicatedTestimonials.map((testimonial, index) => (
            <div key={index} className='flex-shrink-0 w-full md:w-1/3 px-4'>
              <Card className='h-full card-hover'>
                <CardContent className='p-6'>
                  <div className='flex mb-4'>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className='w-5 h-5 text-yellow-400 fill-current'
                      />
                    ))}
                  </div>
                  <p className='text-gray-600 mb-6 italic'>
                    "{testimonial.text}"
                  </p>
                  <div>
                    <div className='font-semibold text-gray-900'>
                      {testimonial.name}
                    </div>
                    <div className='text-sm text-gray-500'>
                      {testimonial.location}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
