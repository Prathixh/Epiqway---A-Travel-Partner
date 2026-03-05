import { cn } from "@/lib/utils";
import Icons from "../icons";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  className?: string;
}

export default function RatingStars({ rating, maxRating = 5, className }: RatingStarsProps) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = maxRating - fullStars - (halfStar ? 1 : 0);

  return (
    <div className={cn("flex items-center gap-0.5 text-amber-500", className)}>
      {[...Array(fullStars)].map((_, i) => (
        <Icons.Star key={`full-${i}`} className="h-5 w-5 fill-current" />
      ))}
      {halfStar && <Icons.StarHalf key="half" className="h-5 w-5 fill-current" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Icons.Star key={`empty-${i}`} className="h-5 w-5 text-gray-300 fill-current" />
      ))}
    </div>
  );
}
