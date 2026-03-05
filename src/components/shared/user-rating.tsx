'use client';
import { useState } from 'react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import Icons from '../icons';

interface UserRatingProps {
  onRatingSubmit: (rating: number) => void;
  maxRating?: number;
}

export default function UserRating({ onRatingSubmit, maxRating = 5 }: UserRatingProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const handleRatingClick = (rate: number) => {
    setRating(rate);
    onRatingSubmit(rate);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {[...Array(maxRating)].map((_, i) => {
          const rate = i + 1;
          return (
            <Button
              key={rate}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onMouseEnter={() => setHoverRating(rate)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => handleRatingClick(rate)}
            >
              <Icons.Star
                className={cn(
                  'h-6 w-6 transition-colors',
                  rate <= (hoverRating || rating)
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-gray-300 fill-gray-300'
                )}
              />
            </Button>
          );
        })}
      </div>
      {rating > 0 && <p className="text-sm text-muted-foreground">You rated {rating} out of 5.</p>}
    </div>
  );
}
