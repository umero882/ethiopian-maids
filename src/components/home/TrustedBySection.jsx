import React from 'react';
import { motion } from 'framer-motion';

const TrustedBySection = () => {
  const trustedLogos = [
    {
      name: 'Bahrain Ministry of Labour',
      src: '/images/trusted by/bh-mol.png.png',
      alt: 'Bahrain Ministry of Labour',
    },
    {
      name: 'Ethiopia Ministry of Labour',
      src: '/images/trusted by/et-mol.png.png',
      alt: 'Ethiopia Ministry of Labour',
    },
    {
      name: 'Saudi Arabia Ministry of Labour',
      src: '/images/trusted by/ksa-mol.png',
      alt: 'Saudi Arabia Ministry of Labour',
    },
    {
      name: 'Oman Ministry of Labour',
      src: '/images/trusted by/om-mol.png.png',
      alt: 'Oman Ministry of Labour',
    },
    {
      name: 'Qatar Ministry of Labour',
      src: '/images/trusted by/qa-mol.png',
      alt: 'Qatar Ministry of Labour',
    },
    {
      name: 'UAE Ministry of Labour',
      src: '/images/trusted by/uae-mol.png',
      alt: 'UAE Ministry of Labour',
    },
  ];

  // Duplicate the logos array to create seamless infinite scroll
  const duplicatedLogos = [...trustedLogos, ...trustedLogos];

  return (
    <section className='py-12 bg-white border-t border-gray-100'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-8'>
          <h2 className='text-2xl font-semibold text-gray-800 mb-2'>
            Trusted by Government Agencies
          </h2>
          <p className='text-gray-600'>
            Officially recognized and partnered with labor ministries across the
            GCC
          </p>
        </div>

        {/* Infinite Scrolling Container */}
        <div className='relative overflow-hidden'>
          <div className='flex space-x-12'>
            <motion.div
              className='flex space-x-12 shrink-0'
              animate={{
                x: ['0%', '-50%'],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: 20,
                  ease: 'linear',
                },
              }}
            >
              {duplicatedLogos.map((logo, index) => (
                <div
                  key={`${logo.name}-${index}`}
                  className='flex items-center justify-center h-16 w-32 transition-all duration-300 hover:scale-110 cursor-pointer'
                >
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    className='max-h-12 max-w-28 object-contain transition-transform duration-300'
                    loading='lazy'
                  />
                </div>
              ))}
            </motion.div>
          </div>

          {/* Gradient overlays for smooth fade effect */}
          <div className='absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-white to-transparent pointer-events-none z-10'></div>
          <div className='absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-white to-transparent pointer-events-none z-10'></div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBySection;
