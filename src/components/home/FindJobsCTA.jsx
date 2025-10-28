import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Briefcase, ArrowRight } from 'lucide-react';

const FindJobsCTA = () => {
  const navigate = useNavigate();

  return (
    <section className='bg-gradient-to-r from-purple-600 to-blue-600 py-16 md:py-20'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className='bg-white rounded-2xl shadow-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between'
        >
          <div className='flex items-center mb-6 md:mb-0'>
            <div className='rounded-xl p-3 bg-gradient-to-br from-purple-100 to-blue-100 text-purple-700 mr-4'>
              <Briefcase className='w-7 h-7' />
            </div>
            <div>
              <h2 className='text-2xl md:text-3xl font-bold text-gray-900'>
                Find Jobs Matching Your Skills
              </h2>
              <p className='text-gray-600 mt-1'>
                Explore curated opportunities across GCC countries.
              </p>
            </div>
          </div>
          <div>
            <Button
              size='lg'
              className='bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
              onClick={() => navigate('/jobs')}
            >
              Browse Jobs
              <ArrowRight className='ml-2 w-5 h-5' />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FindJobsCTA;
