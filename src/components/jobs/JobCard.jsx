import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  Home,
  Calendar,
  Users,
  Star,
  Building,
  Tag,
  Globe,
  Award,
  CheckCircle,
  User,
} from 'lucide-react';

const JobCard = ({ job, index, onApply, onSave, user, navigate }) => {
  return (
    <motion.div
      key={job.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className='h-full card-hover border-0 shadow-lg overflow-hidden'>
        <CardHeader className='pb-4'>
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-2 flex-wrap'>
                <CardTitle className='text-xl'>{job.title}</CardTitle>
                {job.urgent && (
                  <Badge className='bg-red-100 text-red-800'>Urgent</Badge>
                )}
                {job.verified && (
                  <Badge className='bg-blue-100 text-blue-800'>Verified</Badge>
                )}
              </div>

              {/* Sponsor Name with Avatar */}
              <div className='flex items-center gap-2 text-gray-600 mb-2'>
                <Avatar className='h-8 w-8 border-2 border-gray-200'>
                  <AvatarImage
                    src={job.sponsor?.avatar_url}
                    alt={job.employer || job.sponsor_name || 'Sponsor'}
                  />
                  <AvatarFallback className='bg-purple-100 text-purple-600'>
                    <User className='h-4 w-4' />
                  </AvatarFallback>
                </Avatar>
                <div className='flex items-center gap-1.5 flex-wrap'>
                  <span className='font-medium'>{job.employer || job.sponsor_name || 'Sponsor'}</span>
                  {job.sponsor?.verification_status === 'verified' && (
                    <Badge className='bg-blue-100 text-blue-800 flex items-center gap-1 text-xs px-1.5 py-0'>
                      <CheckCircle className='w-3 h-3' />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className='flex items-center text-gray-500 mb-2'>
                <MapPin className='w-4 h-4 mr-1' />
                <span>{job.location || `${job.city || ''}, ${job.country || ''}`}</span>
              </div>

              {/* Address */}
              {job.address && (
                <div className='flex items-center text-gray-500 text-sm mb-2'>
                  <MapPin className='w-4 h-4 mr-1' />
                  <span className='line-clamp-1'>{job.address}</span>
                </div>
              )}

              {/* Job Category */}
              {(job.job_category || job.category || job.jobType) && (
                <div className='flex items-center text-gray-500'>
                  <Tag className='w-4 h-4 mr-1' />
                  <span className='text-sm'>{job.job_category || job.category || job.jobType}</span>
                </div>
              )}
            </div>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => onSave(job)}
              className='text-gray-400 hover:text-yellow-500'
            >
              <Star className='w-5 h-5' />
            </Button>
          </div>
        </CardHeader>

        <CardContent className='space-y-4'>
          {/* Key Information Grid */}
          <div className='grid grid-cols-2 gap-3 text-sm'>
            <div className='flex items-center'>
              <DollarSign className='w-4 h-4 mr-2 text-green-500' />
              <span className='font-medium'>{job.salaryDisplay || `${job.salary_min || 'N/A'}-${job.salary_max || 'N/A'} ${job.currency || 'USD'}`}/mo</span>
            </div>
            <div className='flex items-center'>
              <Clock className='w-4 h-4 mr-2 text-blue-500' />
              <span>{job.experience || job.experience_required || 'Any'}</span>
            </div>
            <div className='flex items-center'>
              <Home className='w-4 h-4 mr-2 text-purple-500' />
              <span>{job.accommodation || (job.live_in_required ? 'Live-in' : 'Live-out')}</span>
            </div>
            <div className='flex items-center'>
              <Users className='w-4 h-4 mr-2 text-orange-500' />
              <span>Family: {job.familySize || job.family_size || job.household_size || 'N/A'}</span>
            </div>
          </div>

          {/* Preferred Nationality */}
          {(job.preferred_nationality || job.nationality || job.nationalityPreference) && (
            <div className='flex items-start gap-2'>
              <Globe className='w-4 h-4 mt-0.5 text-indigo-500 flex-shrink-0' />
              <div className='flex-1'>
                <p className='text-xs font-medium text-gray-700 mb-1'>Preferred Nationality:</p>
                <div className='flex flex-wrap gap-1'>
                  {(Array.isArray(job.preferred_nationality)
                    ? job.preferred_nationality
                    : [job.preferred_nationality || job.nationality || job.nationalityPreference]
                  ).map((nat, idx) => (
                    <Badge key={idx} variant='secondary' className='text-xs bg-indigo-50 text-indigo-700 border-indigo-200'>
                      {nat}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Requirements */}
          {(job.requirements || job.required_skills || []).length > 0 && (
            <div className='flex items-start gap-2'>
              <CheckCircle className='w-4 h-4 mt-0.5 text-green-500 flex-shrink-0' />
              <div className='flex-1'>
                <p className='text-xs font-medium text-gray-700 mb-1'>Requirements:</p>
                <div className='flex flex-wrap gap-1'>
                  {(job.requirements || job.required_skills || []).map((req, idx) => (
                    <Badge key={idx} variant='secondary' className='text-xs bg-green-50 text-green-700 border-green-200'>
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {job.description && (
            <p className='text-sm text-gray-600 line-clamp-2 pl-6'>
              {job.description}
            </p>
          )}

          {/* Benefits */}
          {(job.benefits || job.additional_benefits || []).length > 0 && (
            <div className='flex items-start gap-2'>
              <Award className='w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0' />
              <div className='flex-1'>
                <p className='text-xs font-medium text-gray-700 mb-1'>Benefits:</p>
                <div className='flex flex-wrap gap-1'>
                  {(job.benefits || job.additional_benefits || []).map((benefit, idx) => (
                    <Badge
                      key={idx}
                      variant='outline'
                      className='text-xs border-purple-300 text-purple-700 bg-purple-50'
                    >
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Posted Date */}
          <div className='flex items-center text-xs text-gray-500 pt-2 border-t'>
            <Calendar className='w-4 h-4 mr-1' />
            <span>Posted {job.postedDate || (job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Recently')}</span>
          </div>

          <div className='flex space-x-2 pt-2'>
            <Button onClick={() => onApply(job)} className='flex-1'>
              Apply Now
            </Button>
            <Button
              variant='outline'
              onClick={() => navigate(`/jobs/${job.id}`)}
              className='flex-1'
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default JobCard;
