
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Icons from '@/components/icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { generateItinerary } from '@/app/actions/generate-itinerary-action.ts';
import type { GenerateItineraryOutput } from '@/ai/flows/generate-itinerary';
import { useToast } from '@/hooks/use-toast';
import { getBlacklistedSpots } from '@/lib/user-preferences';
import { Trip } from '@/lib/trip';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import LoadingSpinner from '../shared/loading-spinner';

const formSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  startDate: z.date({
    required_error: 'A start date is required.',
  }),
  days: z.coerce.number().min(1, 'At least one day is required'),
  name: z.string().min(1, 'Trip name is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateTripProps {
  onTripCreate: (name: string, details: Omit<FormValues, 'name'>, itinerary: GenerateItineraryOutput) => void;
  recommendedDestination?: string;
  existingTrips: Trip[];
}

export default function CreateTrip({ onTripCreate, recommendedDestination, existingTrips }: CreateTripProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [isDateConflict, setIsDateConflict] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const dates = existingTrips.flatMap(trip => {
      const tripDates = [];
      const startDate = new Date(trip.startDate);
      for (let i = 0; i < trip.days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        tripDates.push(date);
      }
      return tripDates;
    });
    setBookedDates(dates);
  }, [existingTrips]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destination: recommendedDestination || '',
      days: 1,
      name: '',
    },
  });

  const destination = form.watch('destination');
  const days = form.watch('days');
  const startDate = form.watch('startDate');

  useEffect(() => {
    if (startDate) {
      const conflict = bookedDates.some(bookedDate => isSameDay(bookedDate, startDate));
      setIsDateConflict(conflict);
    } else {
      setIsDateConflict(false);
    }
  }, [startDate, bookedDates]);

  // Autofill trip name
  React.useEffect(() => {
    if (destination && days) {
      form.setValue('name', `${destination} Trip - ${days} day${days > 1 ? 's' : ''}`);
    } else {
      form.setValue('name', '');
    }
  }, [destination, days, form]);
  
  React.useEffect(() => {
    if (recommendedDestination) {
      form.setValue('destination', recommendedDestination);
    }
  }, [recommendedDestination, form]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (isDateConflict) {
      toast({
        variant: 'destructive',
        title: 'Date Conflict',
        description: 'You already have a trip planned on this date. Please choose a different date.',
      });
      return;
    }
    setIsLoading(true);
    toast({
      title: '🚀 Generating your epiq trip...',
      description: 'Our AI is crafting the perfect itinerary for you. This might take a moment.',
    });

    try {
      const { name, ...tripDetails } = data;
      const blacklistedSpots = getBlacklistedSpots();
      const result = await generateItinerary({
        ...tripDetails,
        startDate: data.startDate.toISOString(),
        blacklistedSpots,
      });
      onTripCreate(data.name, tripDetails, result);
       toast({
        title: '✅ Your trip is ready!',
        description: `We've planned an amazing trip to ${data.destination} for you.`,
      });
    } catch (error) {
      console.error('Failed to generate itinerary:', error);
      toast({
        variant: 'destructive',
        title: '😕 Oh no! Something went wrong.',
        description: 'We couldn\'t generate your itinerary. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <div className="flex flex-col items-center justify-center text-center">
              <div className="loader"></div>
              <h2 className="text-xl font-semibold mt-4">Creating Your Trip...</h2>
              <p className="text-gray-500">Please wait while our AI plans your adventure.</p>
          </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full bg-background p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground sm:text-4xl">
            Create Your Next Adventure
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Tell us about your trip, and our AI will craft a personalized itinerary just for you.
          </p>
        </div>
        
        <Card className="shadow-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="p-6 space-y-6">
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination</FormLabel>
                      <div className="relative">
                        <Icons.MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <FormControl>
                          <Input placeholder="e.g., Hyderabad, India" {...field} className="pl-10" />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Travel</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'w-full pl-3 text-left font-normal h-11',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <Icons.Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0,0,0,0))
                              }
                              initialFocus
                              booked={bookedDates}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How many days?</FormLabel>
                         <div className="relative">
                           <Icons.Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <FormControl>
                              <Input type="number" min="1" {...field} className="pl-10"/>
                            </FormControl>
                         </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trip Name</FormLabel>
                        <div className="relative">
                          <Icons.Plane className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <FormControl>
                            <Input placeholder="My Awesome Trip" {...field} className="pl-10" />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {isDateConflict && (
                    <Alert variant="destructive">
                      <Icons.AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Date Conflict</AlertTitle>
                      <AlertDescription>
                        You already have a trip scheduled for this date. Please select another date.
                      </AlertDescription>
                    </Alert>
                  )}
              </CardContent>
              <CardFooter className="bg-muted/50 p-4 border-t">
                <Button type="submit" className="w-full" size="lg" disabled={isLoading || isDateConflict}>
                  {isLoading && <Icons.Loader className="mr-2 animate-spin" />}
                  {isLoading ? 'Creating Your Trip...' : 'Create Trip & View Itinerary'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
