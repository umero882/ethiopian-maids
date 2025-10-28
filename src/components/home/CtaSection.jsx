import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CtaSection = () => {
  const navigate = useNavigate();

  return (
    <section className='py-20 bg-gradient-to-r from-purple-600 to-blue-600'>
      <div className='max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className='text-3xl md:text-4xl font-bold text-white mb-6'>
            Ready to Find Your Perfect Match?
          </h2>
          <p className='text-xl text-purple-100 mb-8'>
            Join thousands of satisfied families and workers who found their
            perfect match through our platform.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button
              size='lg'
              onClick={() => navigate('/register')}
              className='text-lg'
            >
              Register Now
              <ArrowRight className='ml-2 w-5 h-5' />
            </Button>
            <Button
              size='lg'
              variant='outline'
              onClick={() => navigate('/maids')}
              className='border-white text-white hover:bg-white hover:text-purple-700 text-lg'
            >
              Browse Profiles
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaSection;
