import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BlogFeed from '@/components/blog/BlogFeed';

const Blog = () => {
  const { user } = useAuth();

  return (
    <div className='bg-gray-50 min-h-screen pb-12'>
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-gray-900'>Community Feed</h1>
          <p className='text-gray-600 mt-2'>
            Connect with other members of the Ethio-Maids community. Share your
            experiences, ask questions, and provide support.
          </p>
        </div>

        <div className='max-w-3xl mx-auto'>
          <BlogFeed />
        </div>
      </div>
    </div>
  );
};

export default Blog;
