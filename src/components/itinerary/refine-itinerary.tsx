
'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from '../ui/button';
import Icons from '../icons';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '@/hooks/use-toast';
import { refineItinerary } from '@/app/actions/refine-itinerary-action';
import { DayItinerary, Trip } from '@/lib/trip';
import LoadingSpinner from '@/components/shared/loading-spinner';

const refineFormSchema = z.object({
  mood: z.string().optional(),
  tripMode: z.string().optional(),
});

type RefineFormValues = z.infer<typeof refineFormSchema>;

interface RefineItineraryProps {
    trip: Trip;
    onItineraryUpdate: (updatedItinerary: DayItinerary[]) => void;
}

export default function RefineItinerary({ trip, onItineraryUpdate }: RefineItineraryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<RefineFormValues>({
    resolver: zodResolver(refineFormSchema),
    defaultValues: {
      mood: '',
      tripMode: '',
    },
  });

  async function onSubmit(data: RefineFormValues) {
    setIsLoading(true);
    toast({
      title: 'Refining your itinerary...',
      description: 'The AI is adjusting your plan based on your preferences.',
    });

    try {
      const result = await refineItinerary({
        currentItinerary: trip.itinerary,
        destination: trip.destination,
        preferences: data,
      });

      onItineraryUpdate(result.itinerary);
      
      toast({
        title: '✅ Itinerary Refined!',
        description: result.reasoning,
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to refine itinerary:', error);
      toast({
        variant: 'destructive',
        title: '😕 Oh no! Something went wrong.',
        description: 'We couldn\'t refine your itinerary. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Icons.Filter className="mr-2 h-4 w-4" />
          Refine
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 h-64">
                <DialogHeader>
                    <DialogTitle className="text-center">Refining Itinerary...</DialogTitle>
                </DialogHeader>
                <LoadingSpinner />
                <p className="text-sm text-muted-foreground text-center">Our AI is personalizing your adventure. Please wait.</p>
            </div>
        ) : (
            <>
                <DialogHeader>
                  <DialogTitle>Refine Your Itinerary</DialogTitle>
                  <DialogDescription>
                    Adjust your preferences and let the AI tailor your trip.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-4 py-4">
                      <FormField
                        control={form.control}
                        name="mood"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mood</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a mood" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="aggressive">Aggressive (Trekking, Adventure)</SelectItem>
                                <SelectItem value="gentle">Gentle (Cafes, Beaches)</SelectItem>
                                <SelectItem value="romantic">Romantic (Dinners, Scenic Views)</SelectItem>
                                <SelectItem value="foodie">Foodie (Best Local Food)</SelectItem>
                                <SelectItem value="photography">Photography (Sunrise/Sunset Points)</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tripMode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trip Mode</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a trip mode" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[
                                  'Solo', 'Couple', 'Family', 'Friends', 'Girls Gang', 'Boys Gang', 
                                  'School', 'College', 'Corporate', 'Senior Tours'
                                ].map(mode => <SelectItem key={mode} value={mode.toLowerCase().replace(' ', '-')}>{mode}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                      </DialogClose>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading && <Icons.Loader className="mr-2 h-4 w-4 animate-spin" />}
                        Refine Itinerary
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
            </>
        )}
      </DialogContent>
    </Dialog>
  );
}
