
'use client';
import { useState } from 'react';
import Image from 'next/image';
import type { ItineraryItem as ItineraryItemType, Facility } from '@/lib/trip';
import type { DayItinerary } from '@/lib/trip';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icons from '@/components/icons';
import RatingStars from '@/components/shared/rating-stars';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { findSpotReplacement } from '@/app/actions/find-spot-replacement';
import { addSpotToBlacklist } from '@/lib/user-preferences';
import { Separator } from '../ui/separator';
import UserRating from '../shared/user-rating';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { ScrollArea } from '../ui/scroll-area';
import { timeToMinutes } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ItineraryItemProps {
  item: ItineraryItemType;
  previousItem?: ItineraryItemType;
  onItemUpdate: (updatedItem: ItineraryItemType) => void;
  onItemDelete: (deletedItemId: string) => void;
  currentItinerary: DayItinerary[];
  dayItinerary: DayItinerary;
}

const facilityIcons: Record<Facility, React.ComponentType<{ className?: string }>> = {
  Restroom: Icons.Bath,
  Water: Icons.GlassWater,
  Parking: Icons.ParkingCircle,
  Food: Icons.Utensils,
  Accessibility: Icons.Accessibility,
};

const typeInfo: Record<ItineraryItemType['type'], { icon: React.ComponentType<{className?: string}>, color: string }> = {
    'Attraction': { icon: Icons.Landmark, color: 'bg-purple-500' },
    'Food': { icon: Icons.Utensils, color: 'bg-orange-500' },
    'Shopping': { icon: Icons.ShoppingBag, color: 'bg-blue-500' },
    'Break': { icon: Icons.Coffee, color: 'bg-amber-600' },
    'Beach': { icon: Icons.Waves, color: 'bg-cyan-500' },
    'Activity': { icon: Icons.Footprints, color: 'bg-lime-500' },
    'Other': { icon: Icons.MapPin, color: 'bg-gray-500' }
};

export default function ItineraryItem({ item, previousItem, onItemUpdate, onItemDelete, currentItinerary, dayItinerary }: ItineraryItemProps) {
  const { toast } = useToast();
  const [isFindingReplacement, setIsFindingReplacement] = useState(false);

  const imageData = PlaceHolderImages.find(img => img.id === item.imageId) || {
    imageUrl: `https://picsum.photos/seed/${item.id}/600/400`,
    imageHint: item.type,
  };
  const gmapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.spotName + ", " + item.address)}`;

  const getTravelTime = () => {
    if (!previousItem) return null;
    const prevEndTime = timeToMinutes(previousItem.time) + previousItem.duration;
    const travelTime = timeToMinutes(item.time) - prevEndTime;
    if (travelTime <= 0) return null;
    return travelTime;
  }

  const travelTime = getTravelTime();

  const handleMissedSpot = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFindingReplacement(true);
    toast({
      title: 'Finding a replacement...',
      description: `Searching for an alternative to ${item.spotName}.`,
    });

    try {
      const destination = dayItinerary.items[0].address.split(',').pop()?.trim();
      if (!destination) {
        throw new Error("Could not determine destination from itinerary.");
      }

      const replacement = await findSpotReplacement({
        missedSpotName: item.spotName,
        missedSpotAddress: item.address,
        missedSpotType: item.type,
        currentItinerary: JSON.stringify(currentItinerary),
        destination: destination,
      });
      
      const updatedItem = {
        ...item,
        ...replacement,
        id: item.id, // Keep the original ID to replace it in the list
      };

      onItemUpdate(updatedItem);

      toast({
        title: 'Spot Replaced!',
        description: `${item.spotName} has been replaced with ${replacement.spotName}.`,
      });

    } catch (error) {
      console.error("Failed to find replacement spot:", error);
      toast({
        variant: "destructive",
        title: 'Replacement Failed',
        description: 'Could not find a suitable replacement at this time.',
      });
    } finally {
      setIsFindingReplacement(false);
    }
  };
  
  const handleRatingSubmit = (rating: number) => {
    if (rating <= 2) {
      addSpotToBlacklist(item.spotName);
      toast({
        title: "Feedback Received",
        description: `${item.spotName} has been noted and won't be recommended in future trips.`,
      });
    } else {
       toast({
        title: "Feedback Received",
        description: `Thank you for rating ${item.spotName}!`,
      });
    }
  }

  const crowdColor = {
    Low: 'text-green-500',
    Medium: 'text-yellow-500',
    High: 'text-red-500',
  };
  
  const renderFacilities = (facilities: Facility[] | undefined, context: 'card' | 'dialog') => {
    if (!facilities || facilities.length === 0) return null;
    return (
     <TooltipProvider>
        <div className={cn("flex items-center gap-3", context === 'dialog' && 'flex-wrap')}>
            {facilities.map(facility => {
                const Icon = facilityIcons[facility];
                return (
                    <Tooltip key={facility}>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-muted-foreground">
                                <Icon className="h-4 w-4" />
                                {context === 'dialog' && <span className='text-sm'>{facility}</span>}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{facility}</p>
                        </TooltipContent>
                    </Tooltip>
                );
            })}
        </div>
     </TooltipProvider>
    )
  }

  const TypeIcon = typeInfo[item.type]?.icon || Icons.MapPin;
  const iconColor = typeInfo[item.type]?.color || 'bg-primary';

  return (
    <Dialog>
        <div className="relative flex items-start gap-4">
            <div className="flex flex-col items-center shrink-0 w-12">
                <div className="text-sm font-semibold mb-1">{item.time}</div>
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-primary-foreground ring-8 ring-background z-10", iconColor)}>
                    <TypeIcon className="h-5 w-5" />
                </div>
            </div>
            
            <DialogTrigger asChild>
              <Card className="flex-1 animate-in fade-in-0 zoom-in-95 slide-in-from-left-4 duration-500 cursor-pointer hover:shadow-lg transition-shadow w-full overflow-hidden">
                <div className="flex-1">
                  <CardHeader className="p-4">
                    <CardTitle className="font-headline text-lg">{item.spotName}</CardTitle>
                     <CardDescription className="flex flex-col items-start gap-2 pt-1 text-xs">
                        <span className="flex items-center gap-2">
                           <Icons.MapPin className="h-3 w-3" /> {item.address}
                        </span>
                        {travelTime && previousItem && (
                          <span className="flex items-center gap-2 text-primary font-semibold">
                            <Icons.Clock className="h-3 w-3" /> 
                            Approx. {travelTime} min travel from {previousItem.spotName}
                          </span>
                        )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='p-4 pt-0'>
                     <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                       <div className="flex items-center gap-1" title={`Crowd Level: ${item.crowdLevel}`}>
                         <Icons.Users className={cn("h-3 w-3", crowdColor[item.crowdLevel])} />
                         {item.crowdLevel}
                       </div>
                       <RatingStars rating={item.rating} className="[&_svg]:h-4 [&_svg]:w-4"/>
                       <div className="flex items-center gap-1" title={`Duration: ${item.duration} min`}>
                          <Icons.Clock className="h-3 w-3" /> {item.duration} min
                       </div>
                     </div>
                  </CardContent>
                </div>
              </Card>
            </DialogTrigger>
        </div>

        <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-headline text-3xl">{item.spotName}</DialogTitle>
            <DialogDescription className="flex items-center gap-2 pt-2">
                <Icons.MapPin className="h-4 w-4" /> {item.address}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6">
            <div className="px-6">
              <div className="relative h-64 w-full rounded-lg overflow-hidden mb-4">
                  <Image
                    src={imageData.imageUrl}
                    alt={item.spotName}
                    fill
                    className="object-cover"
                    data-ai-hint={imageData.imageHint}
                  />
              </div>

              {travelTime && previousItem && (
                <div className="mb-4 p-3 rounded-md border bg-muted/50 flex items-center gap-3">
                   <Icons.Clock className="h-5 w-5 text-primary" /> 
                   <div>
                    <p className="font-semibold">Approx. {travelTime} min travel</p>
                    <p className="text-xs text-muted-foreground">from {previousItem.spotName}</p>
                   </div>
                </div>
              )}

              <div className="grid gap-4 pb-4">
                <p>{item.description}</p>
                
                {item.facilities && item.facilities.length > 0 && (
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                      <h4 className="font-semibold mb-3">Facilities &amp; Essentials</h4>
                      {renderFacilities(item.facilities, 'dialog')}
                  </div>
                )}

                 <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Estimated Cost per Person</p>
                            <p className="text-xs text-muted-foreground mt-1">{item.costDetails}</p>
                        </div>
                        <p className="text-2xl font-bold text-primary">
                          {item.costAmount > 0 ? `Rs.${item.costAmount.toLocaleString('en-IN')}` : "Free"}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground p-4 border rounded-lg">
                    <div className="flex items-center gap-2" title="Hours">
                      <Icons.Clock className="h-5 w-5 text-primary" />
                      <div className='flex flex-col'>
                        <span className='font-semibold text-foreground'>Hours</span>
                        <span>{item.openingTime === item.closingTime ? 'Open 24 hours' : `${item.openingTime} – ${item.closingTime}`}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" title={`Crowd Level: ${item.crowdLevel}`}>
                      <Icons.Users className={cn("h-5 w-5", crowdColor[item.crowdLevel])} />
                      <div className='flex flex-col'>
                        <span className='font-semibold text-foreground'>Crowd</span>
                        <span>{item.crowdLevel}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" title="Rating">
                      <Icons.Star className="h-5 w-5 text-amber-400" />
                      <div className='flex flex-col'>
                        <span className='font-semibold text-foreground'>Rating</span>
                        <span>{item.rating.toFixed(1)}/5</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" title={`Duration: ${item.duration} min`}>
                        <Icons.Sparkles className="h-5 w-5 text-cyan-400" />
                        <div className='flex flex-col'>
                          <span className='font-semibold text-foreground'>Duration</span>
                          <span>{item.duration} min</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline">
                        <a href={gmapsLink} target="_blank" rel="noopener noreferrer">
                            <Icons.Map className="mr-2 h-4 w-4" />
                            View on Map
                        </a>
                    </Button>
                     <Button variant="outline" onClick={handleMissedSpot} disabled={isFindingReplacement}>
                        {isFindingReplacement ? <Icons.Loader className="mr-2 h-4 w-4 animate-spin"/> : <Icons.AlertTriangle className="mr-2 h-4 w-4"/>}
                       {isFindingReplacement ? 'Finding...' : 'Missed?'}
                     </Button>
                </div>
                
                <Separator className="my-4" />

                <div className="space-y-2 flex flex-col items-center">
                    <h4 className="font-semibold">Rate this Spot</h4>
                    <p className="text-sm text-muted-foreground text-center">
                        Your feedback helps improve future recommendations.
                    </p>
                    <UserRating onRatingSubmit={handleRatingSubmit} />
                </div>
                
                 <Separator className="my-4" />

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Icons.Trash className="mr-2 h-4 w-4" />
                      Delete Spot
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this spot from your itinerary. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onItemDelete(item.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
  );
}

    