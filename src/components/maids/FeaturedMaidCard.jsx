import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getMaidDisplayName } from '@/lib/displayName';

const FeaturedMaidCard = ({ maid }) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate(`/maids?highlight=${maid.id}`);
  };

  const displayName = getMaidDisplayName(maid);

  return (
    <motion.div
      className='flex-shrink-0 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 p-2 cursor-pointer'
      whileHover={{ scale: 1.03 }}
      onClick={handleNavigate}
    >
      <Card className='overflow-hidden h-full card-hover border-0 shadow-lg group flex flex-col text-center'>
        <div className='pt-6 pb-3 bg-gradient-to-b from-purple-50 via-slate-50 to-white'>
          <Avatar className='w-28 h-28 md:w-32 md:h-32 rounded-full mx-auto border-4 border-white shadow-lg hover:shadow-xl transition-shadow duration-300'>
            <AvatarImage src={maid.image} alt={displayName} className='object-cover' />
            <AvatarFallback className='text-3xl bg-gray-200 text-gray-500'>
              {displayName
                .split(' ')
                .filter(Boolean)
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        <CardContent className='p-4 flex flex-col items-center flex-grow'>
          <h3 className='text-xl font-semibold text-gray-800 mt-2'>{displayName}</h3>
          <div className='flex items-center text-sm text-gray-500 mb-3'>
            <MapPin className='w-4 h-4 mr-1 text-purple-600' />
            {maid.country}
          </div>
          <p className='text-xs text-gray-600 mb-4 line-clamp-2 flex-grow min-h-[32px]'>
            {maid.experience} experience. Skills:{' '}
            {maid.skills.slice(0, 2).join(', ')}...
          </p>
          <Button
            variant='outline'
            className='w-full text-sm mt-auto border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white transition-colors duration-300'
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate();
            }}
          >
            View Profile <ArrowRight className='ml-2 w-4 h-4' />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FeaturedMaidCard;
