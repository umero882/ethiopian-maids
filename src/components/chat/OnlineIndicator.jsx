import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * OnlineIndicator Component
 *
 * Displays a small green dot to indicate when a user is online.
 * Can be positioned absolutely or inline.
 *
 * @param {boolean} isOnline - Whether the user is currently online
 * @param {string} size - Size variant: 'sm', 'md', 'lg'
 * @param {string} position - Position variant: 'absolute', 'inline'
 * @param {string} className - Additional CSS classes
 */
const OnlineIndicator = ({
  isOnline = false,
  size = 'md',
  position = 'absolute',
  className = ''
}) => {
  if (!isOnline) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const positionClasses = {
    absolute: 'absolute bottom-0 right-0',
    inline: 'inline-block',
  };

  return (
    <div
      className={cn(
        positionClasses[position],
        'flex items-center justify-center',
        className
      )}
      aria-label="Online"
    >
      <Circle
        className={cn(
          sizeClasses[size],
          'fill-green-500 text-green-500'
        )}
      />
      <span
        className={cn(
          sizeClasses[size],
          'absolute animate-ping rounded-full bg-green-400 opacity-75'
        )}
      />
    </div>
  );
};

export default OnlineIndicator;
