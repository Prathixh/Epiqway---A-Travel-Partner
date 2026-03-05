
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MainSidebar from '@/components/layout/main-sidebar';
import Header from '@/components/layout/header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { clearActiveTrip } from '@/lib/trip-manager';
import Icons from '@/components/icons';
import { isPast } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import BottomNav from '@/components/layout/bottom-nav';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Trip } from '@/lib/trip';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';
import TripCard from '@/components/trip/trip-card';

export default function ManageTripsPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const tripsQuery = useMemoFirebase(() => 
    user && firestore ? query(collection(firestore, 'users', user.uid, 'trips')) : null
  , [firestore, user]);

  const { data: trips } = useCollection<Trip>(tripsQuery);
  
  const handleNewTrip = () => {
    clearActiveTrip();
    router.push('/planner');
  }

  const bookingOptions = [
      { name: 'Flights', icon: Icons.Plane, url: 'https://www.google.com/flights', description: 'Find the best deals on flights.' },
      { name: 'Hotels', icon: Icons.BedDouble, url: 'https://www.booking.com', description: 'Book your perfect stay.' },
      { name: 'Trains', icon: Icons.Train, url: 'https://www.makemytrip.com/railways/', description: 'Reserve train tickets easily.' },
      { name: 'Buses', icon: Icons.Bus, url: 'https://www.redbus.in', description: 'Book bus tickets instantly.' },
  ];

  const renderTripList = (tripList: Trip[], title: string) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold font-headline mb-4">{title}</h2>
      {tripList.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tripList.map(trip => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <p className="text-lg text-muted-foreground italic">No {title.toLowerCase()} found.</p>
      )}
    </div>
  );

  const upcomingTrips = trips ? trips.filter(trip => trip.status !== 'completed' && !(isPast(new Date(trip.startDate)) && trip.status === 'pending')) : [];
  const pastTrips = trips ? trips.filter(trip => trip.status === 'completed') : [];
  const missedTrips = trips ? trips.filter(trip => isPast(new Date(trip.startDate)) && trip.status === 'pending') : [];

  return (
    <SidebarProvider>
      <MainSidebar trip={null} onNewTrip={handleNewTrip} />
      <div className="flex flex-col sm:h-svh sm:overflow-hidden">
        <Header trip={null} currentDay={1} onDayChange={() => {}} onItineraryUpdate={() => {}}/>
        <SidebarInset className="max-h-full overflow-auto pb-16 sm:pb-0">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold font-headline">Manage Your Trips</h1>
                <div className="flex items-center gap-2 self-end sm:self-center">
                     <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Icons.Ticket className="mr-2"/>
                                Bookings
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Make a Booking</DialogTitle>
                                <DialogDescription>
                                    Select a category to book your travel and stay. You will be redirected to a third-party website.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                                {bookingOptions.map(option => {
                                    const Icon = option.icon;
                                    return (
                                        <a key={option.name} href={option.url} target="_blank" rel="noopener noreferrer">
                                            <Card className="hover:bg-accent hover:shadow-md transition-all">
                                                <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                                                    <Icon className="h-8 w-8 text-primary" />
                                                    <div>
                                                        <CardTitle className="text-base">{option.name}</CardTitle>
                                                        <CardDescription className="text-xs">{option.description}</CardDescription>
                                                    </div>
                                                </CardHeader>
                                            </Card>
                                        </a>
                                    )
                                })}
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Button onClick={handleNewTrip}>
                        <Icons.Plus className="mr-2"/>
                        New Trip
                    </Button>
                </div>
            </div>
            {trips && trips.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <Icons.Map className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Trips Yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        You haven't created any trips. Get started by creating a new one.
                    </p>
                </div>
            ) : (
                <>
                    {renderTripList(upcomingTrips, 'Upcoming & Ongoing Trips')}
                    {renderTripList(pastTrips, 'Past Trips')}
                    {renderTripList(missedTrips, 'Missed Trips')}
                </>
            )}
          </div>
        </SidebarInset>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
