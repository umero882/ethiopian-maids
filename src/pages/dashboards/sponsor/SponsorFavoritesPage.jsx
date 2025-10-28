import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { sponsorService } from '@/services/sponsorService';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Heart,
  Search,
  Loader2,
  X,
  MessageSquare,
  Calendar,
  MapPin,
  Star,
  Trash2,
} from 'lucide-react';
import MaidCard from '@/components/maids/MaidCard';

const SponsorFavoritesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createConversation, setActiveConversation } = useChat();
  const [favorites, setFavorites] = useState([]);
  const [filteredFavorites, setFilteredFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = favorites.filter(fav =>
        fav.maid?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fav.maid?.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fav.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFavorites(filtered);
    } else {
      setFilteredFavorites(favorites);
    }
  }, [searchTerm, favorites]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const { data, error } = await sponsorService.getFavorites();

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load favorites',
          variant: 'destructive',
        });
      } else {
        setFavorites(data || []);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (maidId) => {
    try {
      setRemoving(maidId);
      const { error } = await sponsorService.removeFromFavorites(maidId);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to remove from favorites',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Removed from favorites',
        });
        loadFavorites();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while removing favorite',
        variant: 'destructive',
      });
    } finally {
      setRemoving(null);
    }
  };

  const handleMessageMaid = async (maid) => {
    try {
      // Create or open conversation with the maid
      const conversation = await createConversation(
        maid.id,
        maid.name,
        'maid'
      );

      if (conversation) {
        setActiveConversation(conversation);
        navigate('/chat');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start conversation. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const sectionAnimation = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  });

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='text-center space-y-4'>
          <Loader2 className='h-12 w-12 animate-spin text-purple-600 mx-auto' />
          <p className='text-gray-600'>Loading your favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <motion.div {...sectionAnimation()}>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-3'>
              <Heart className='h-8 w-8 text-pink-600' />
              My Favorites
            </h1>
            <p className='text-gray-600 mt-1'>
              {favorites.length} saved maid{favorites.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link to='/maids'>
            <Button size='lg' className='bg-purple-600 hover:bg-purple-700'>
              <Search className='h-4 w-4 mr-2' />
              Find More Maids
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Search */}
      {favorites.length > 0 && (
        <motion.div {...sectionAnimation(0.1)}>
          <Card>
            <CardContent className='pt-6'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
                <Input
                  placeholder='Search favorites by name, country, or notes...'
                  className='pl-10'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {favorites.length === 0 && (
        <motion.div {...sectionAnimation(0.2)}>
          <Card>
            <CardContent className='pt-12 pb-12'>
              <div className='text-center space-y-4'>
                <Heart className='h-16 w-16 text-gray-300 mx-auto' />
                <div>
                  <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                    No favorites yet
                  </h3>
                  <p className='text-gray-600 mb-6'>
                    Start browsing maids and save your favorites for easy access
                  </p>
                </div>
                <Link to='/maids'>
                  <Button size='lg' className='bg-purple-600 hover:bg-purple-700'>
                    <Search className='h-4 w-4 mr-2' />
                    Browse Maids
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Favorites Grid */}
      {filteredFavorites.length > 0 && (
        <motion.div {...sectionAnimation(0.2)}>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredFavorites.map((favorite, index) => (
              <motion.div
                key={favorite.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className='hover:shadow-xl transition-shadow relative'>
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveFavorite(favorite.maid.id)}
                    disabled={removing === favorite.maid.id}
                    className='absolute top-3 right-3 z-10 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors'
                    title='Remove from favorites'
                  >
                    {removing === favorite.maid.id ? (
                      <Loader2 className='h-4 w-4 text-red-600 animate-spin' />
                    ) : (
                      <X className='h-4 w-4 text-red-600' />
                    )}
                  </button>

                  <CardContent className='pt-6'>
                    {/* Maid Avatar */}
                    <div className='text-center mb-4'>
                      <div className='relative inline-block'>
                        <img
                          src={favorite.maid?.avatar_url || '/images/default-avatar.png'}
                          alt={favorite.maid?.name}
                          className='h-24 w-24 rounded-full object-cover border-4 border-purple-100'
                        />
                        {favorite.maid?.available && (
                          <div className='absolute bottom-0 right-0 h-6 w-6 bg-green-500 rounded-full border-2 border-white'></div>
                        )}
                      </div>
                    </div>

                    {/* Maid Info */}
                    <div className='text-center space-y-2'>
                      <h3 className='text-lg font-semibold text-gray-900'>
                        {favorite.maid?.name || 'Unknown'}
                      </h3>

                      <div className='flex items-center justify-center gap-2 text-sm text-gray-600'>
                        <MapPin className='h-4 w-4' />
                        {favorite.maid?.country || 'N/A'}
                      </div>

                      {favorite.maid?.rating && (
                        <div className='flex items-center justify-center gap-1'>
                          <Star className='h-4 w-4 text-yellow-500 fill-current' />
                          <span className='text-sm font-medium'>
                            {favorite.maid.rating} ({favorite.maid.total_reviews || 0} reviews)
                          </span>
                        </div>
                      )}

                      {favorite.maid?.years_experience && (
                        <Badge variant='secondary'>
                          {favorite.maid.years_experience} years experience
                        </Badge>
                      )}

                      {favorite.maid?.min_salary && (
                        <p className='text-sm text-gray-600'>
                          ${favorite.maid.min_salary} - ${favorite.maid.max_salary || 'N/A'} / month
                        </p>
                      )}
                    </div>

                    {/* Notes */}
                    {favorite.notes && (
                      <div className='mt-4 p-3 bg-blue-50 rounded-lg'>
                        <p className='text-xs text-gray-500 mb-1'>Your Notes:</p>
                        <p className='text-sm text-gray-700'>{favorite.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className='mt-4 flex gap-2'>
                      <Link to={`/maids/${favorite.maid?.id}`} className='flex-1'>
                        <Button variant='outline' size='sm' className='w-full'>
                          View Profile
                        </Button>
                      </Link>
                      <Button
                        variant='outline'
                        size='sm'
                        className='flex-1'
                        onClick={() => handleMessageMaid(favorite.maid)}
                      >
                        <MessageSquare className='h-4 w-4 mr-1' />
                        Message
                      </Button>
                    </div>

                    <Link to={`/dashboard/sponsor/booking/create?maid=${favorite.maid?.id}`}>
                      <Button className='w-full mt-2 bg-purple-600 hover:bg-purple-700'>
                        <Calendar className='h-4 w-4 mr-2' />
                        Book Now
                      </Button>
                    </Link>

                    {/* Saved Date */}
                    <p className='text-xs text-gray-400 text-center mt-3'>
                      Saved {new Date(favorite.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* No Results */}
      {favorites.length > 0 && filteredFavorites.length === 0 && (
        <motion.div {...sectionAnimation(0.2)}>
          <Card>
            <CardContent className='pt-12 pb-12'>
              <div className='text-center space-y-4'>
                <Search className='h-16 w-16 text-gray-300 mx-auto' />
                <div>
                  <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                    No matches found
                  </h3>
                  <p className='text-gray-600'>
                    Try adjusting your search terms
                  </p>
                </div>
                <Button
                  variant='outline'
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default SponsorFavoritesPage;