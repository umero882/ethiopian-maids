import React, { useState, useEffect } from 'react';
import { getPosts } from '@/services/blogService';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import CreatePostForm from './CreatePostForm';
import PostCard from './PostCard';

const BlogFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch initial posts when component mounts
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async (pageToFetch = 1) => {
    try {
      if (pageToFetch === 1) {
        setIsLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Fetch posts from the service
      const response = getPosts(pageToFetch);

      // Update state based on response
      if (pageToFetch === 1) {
        setPosts(response.posts);
      } else {
        setPosts((prevPosts) => [...prevPosts, ...response.posts]);
      }

      // Check if there are more posts to load
      setHasMore(response.hasMore);
      setPage(pageToFetch);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts(1);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchPosts(page + 1);
    }
  };

  // Handle adding a new post to the feed
  const handlePostCreated = (newPost) => {
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  };

  // Handle updating a post in the feed
  const handlePostUpdated = (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
  };

  // Handle deleting a post from the feed
  const handlePostDeleted = (postId) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
  };

  // Handle adding a shared post to the feed
  const handlePostShared = (sharedPost) => {
    setPosts((prevPosts) => [sharedPost, ...prevPosts]);
  };

  return (
    <div className='w-full max-w-3xl mx-auto'>
      {/* Create post form */}
      {user && <CreatePostForm onPostCreated={handlePostCreated} />}

      {/* Refresh button */}
      <div className='flex justify-end mb-4'>
        <Button
          variant='ghost'
          size='sm'
          onClick={handleRefresh}
          disabled={isLoading || refreshing}
          className='gap-2 text-gray-500 hover:text-gray-700'
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Posts feed */}
      {isLoading ? (
        <Card className='p-10 flex justify-center items-center'>
          <div className='text-center'>
            <Loader2 className='h-8 w-8 animate-spin text-primary mx-auto mb-4' />
            <p className='text-gray-500'>Loading community posts...</p>
          </div>
        </Card>
      ) : posts.length > 0 ? (
        <div className='space-y-6'>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPostUpdated={handlePostUpdated}
              onPostDeleted={handlePostDeleted}
              onPostShared={handlePostShared}
            />
          ))}

          {/* Load more button */}
          {hasMore && (
            <div className='text-center py-4'>
              <Button
                variant='outline'
                onClick={handleLoadMore}
                disabled={loadingMore}
                className='gap-2'
              >
                {loadingMore && <Loader2 className='h-4 w-4 animate-spin' />}
                <span>
                  {loadingMore ? 'Loading more...' : 'Load more posts'}
                </span>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card className='py-10 text-center text-gray-500'>
          <div className='max-w-md mx-auto px-4'>
            <h3 className='text-lg font-medium mb-2'>No posts yet</h3>
            <p className='mb-4'>
              Be the first to create a post in the community!
            </p>
            {!user && (
              <p className='text-sm'>
                Sign in to post and interact with the community.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default BlogFeed;
