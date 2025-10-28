import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Star, Clock, Heart, MessageCircle, Award, Languages, Calendar } from 'lucide-react';
import { getMaidDisplayName } from '@/lib/displayName';

const MaidCard = ({ maid, index, onContact, onFavorite, onBookNow, user, navigate }) => {
  const displayName = getMaidDisplayName(maid);
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2) || 'M';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card
        className='h-full card-hover border-0 shadow-lg overflow-hidden'
        role='article'
        aria-labelledby={`maid-${maid.id}-name`}
      >
        <CardHeader className='pb-4'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center space-x-3'>
              <Avatar className='w-16 h-16'>
                <AvatarImage src={maid.image} alt={`Photo of ${displayName}`} />
                <AvatarFallback aria-hidden='true'>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle
                  id={`maid-${maid.id}-name`}
                  className='text-lg flex items-center gap-2'
                >
                  {displayName}
                  {maid.verified && (
                    <Award
                      className='w-4 h-4 text-blue-500'
                      aria-label='Verified'
                    />
                  )}
                  {maid.agencyManaged && (
                    <Badge
                      className='bg-purple-100 text-purple-700 border border-purple-200'
                      aria-label='Agency Managed'
                    >
                      Agency
                    </Badge>
                  )}
                </CardTitle>
                <div
                  className='flex items-center text-sm text-gray-500 mt-1'
                  aria-label={`From ${maid.country}, ${maid.age} years old`}
                >
                  <MapPin className='w-4 h-4 mr-1' aria-hidden='true' />
                  {maid.country} • {maid.age} years old
                </div>
              </div>
            </div>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => onFavorite(maid)}
              className='text-gray-400 hover:text-red-500'
              aria-label={`Add ${displayName} to favorites`}
            >
              <Heart className='w-5 h-5' aria-hidden='true' />
            </Button>
          </div>
        </CardHeader>

        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div
              className='flex items-center space-x-1'
              aria-label={`Rated ${maid.rating} stars`}
            >
              <Star
                className='w-4 h-4 text-yellow-400 fill-current'
                aria-hidden='true'
              />
              <span className='font-medium'>{maid.rating}</span>
              <span className='text-gray-500 text-sm'>(reviews)</span>
            </div>
            <div
              className='flex items-center text-sm text-gray-500'
              aria-label={`${maid.experience} of experience`}
            >
              <Clock className='w-4 h-4 mr-1' aria-hidden='true' />
              {maid.experience}
            </div>
          </div>

          <div>
            <p
              className='text-sm font-medium text-gray-700 mb-2'
              id={`skills-${maid.id}`}
            >
              Skills:
            </p>
            <div
              className='flex flex-wrap gap-1'
              aria-labelledby={`skills-${maid.id}`}
            >
              {maid.skills.map((skill, idx) => (
                <Badge key={idx} variant='secondary' className='text-xs'>
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p
              className='text-sm font-medium text-gray-700 mb-2'
              id={`languages-${maid.id}`}
            >
              Languages:
            </p>
            <div
              className='flex items-center text-sm text-gray-600'
              aria-labelledby={`languages-${maid.id}`}
            >
              <Languages className='w-4 h-4 mr-1' aria-hidden='true' />
              {maid.languages.join(', ')}
            </div>
          </div>

          <p className='text-sm text-gray-600 line-clamp-2'>
            {maid.description}
          </p>

          <div className='flex items-center justify-between text-sm'>
            <div>
              <span className='font-medium text-green-600'>
                {maid.salaryDisplay}
              </span>
              <span className='text-gray-500'> /month</span>
            </div>
            <Badge className='bg-green-100 text-green-800'>
              {maid.availability}
            </Badge>
          </div>

          <div className='flex flex-col space-y-2 pt-2'>
            {/* Book Now button - Primary CTA for sponsors */}
            {user?.user_type === 'sponsor' && (
              <Button
                onClick={() => onBookNow(maid)}
                className='w-full bg-purple-600 hover:bg-purple-700'
                aria-label={`Book ${displayName}`}
              >
                <Calendar className='w-4 h-4 mr-2' aria-hidden='true' />
                Book Now
              </Button>
            )}

            <div className='flex space-x-2'>
              <Button
                onClick={() => onContact(maid)}
                variant={user?.user_type === 'sponsor' ? 'outline' : 'default'}
                className='flex-1'
                aria-label={`Contact ${displayName}`}
              >
                <MessageCircle className='w-4 h-4 mr-2' aria-hidden='true' />
                Contact
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  if (!user) {
                    navigate('/register');
                    return;
                  }
                  navigate(`/profile?maidId=${maid.id}`);
                }}
                className='flex-1'
                aria-label={`View ${displayName}'s profile`}
              >
                View Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MaidCard;
