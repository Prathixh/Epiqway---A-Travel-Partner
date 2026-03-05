
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainSidebar from '@/components/layout/main-sidebar';
import Header from '@/components/layout/header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import ItineraryTimeline from '@/components/itinerary/itinerary-timeline';
import Chatbot from '@/components/chatbot/chatbot';
import { DayItinerary, ItineraryItem as ItineraryItemType, Trip } from '@/lib/trip';
import CreateTrip from '@/components/itinerary/create-trip';
import { GenerateItineraryOutput } from '@/ai/flows/generate-itinerary';
import { OnDragEndResponder } from '@hello-pangea/dnd';
import { useUser, useDoc, useFirestore, useCollection } from '@/firebase';
import { doc, collection, query } from 'firebase/firestore';
import { saveTrip, getActiveTripId, setActiveTrip, clearActiveTrip } from '@/lib/trip-manager';
import { timeToMinutes, minutesToTime } from '@/lib/utils';
import BottomNav from '@/components/layout/bottom-nav';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';
import { useTripReminders } from '@/hooks/use-trip-reminders';


function PlannerPageContent() {
  const { user, status } = useUser();
  const firestore = useFirestore();

  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  
  const activeTripRef = useMemoFirebase(() => {
    if (!user || !activeTripId) return null;
    return doc(firestore, 'users', user.uid, 'trips', activeTripId);
  }, [firestore, user, activeTripId]);

  const { data: activeTrip, update: updateActiveTrip } = useDoc<Trip>(activeTripRef);
  
  useTripReminders(activeTrip);
  
  const tripsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'users', user.uid, 'trips')) : null
  , [firestore, user]);

  const { data: trips } = useCollection<Trip>(tripsQuery);
  
  const [currentDay, setCurrentDay] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const recommendedDestination = searchParams.get('destination');


  useEffect(() => {
    setIsClient(true);
    if (status === 'authenticated') {
      const storedTripId = getActiveTripId();
      if (storedTripId) {
        setActiveTripId(storedTripId);
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleItineraryUpdate = (updatedItinerary: DayItinerary[]) => {
    if (activeTrip) {
      const updatedTrip = { ...activeTrip, itinerary: updatedItinerary };
      updateActiveTrip(updatedTrip);
    }
  };

  const handleTripCreate = async (name: string, details: { destination: string; days: number; startDate: Date; }, itineraryResult: GenerateItineraryOutput) => {
    if (!user) return;
    const newTripData: Omit<Trip, 'id'> = {
      name,
      destination: details.destination,
      startDate: details.startDate.toISOString(),
      days: details.days,
      cost: itineraryResult.predictedCost,
      itinerary: itineraryResult.itinerary,
      status: 'pending'
    };
    
    const tripId = await saveTrip(user.uid, newTripData);
    setActiveTrip(tripId);
    setActiveTripId(tripId);
    setCurrentDay(1);
    router.replace('/planner', undefined);
  };
  
  const handleNewTrip = () => {
    clearActiveTrip();
    setActiveTripId(null);
    router.push('/planner');
  }

  const activeDayItinerary = activeTrip ? activeTrip.itinerary[currentDay - 1] : null;

  const handleDragEnd: OnDragEndResponder = (result) => {
    if (!result.destination || !activeTrip) return;

    const { source, destination } = result;

    const dayNumber = parseInt(destination.droppableId.split('-')[1], 10);
    const dayIndex = activeTrip.itinerary.findIndex(d => d.day === dayNumber);

    if (dayIndex === -1) return;

    const items = Array.from(activeTrip.itinerary[dayIndex].items);
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);

    const updatedItems = items.reduce((acc, item, index) => {
      if (index === 0) {
        acc.push(item);
      } else {
        const prevItem = acc[index - 1];
        const prevEndTime = timeToMinutes(prevItem.time) + prevItem.duration;
        const travelTime = 15; 
        const newStartTime = prevEndTime + travelTime; 
        acc.push({ ...item, time: minutesToTime(newStartTime) });
      }
      return acc;
    }, [] as ItineraryItemType[]);

    const newItinerary = [...activeTrip.itinerary];
    newItinerary[dayIndex] = { ...newItinerary[dayIndex], items: updatedItems };
    handleItineraryUpdate(newItinerary);
  };

  if (status === 'loading' || !isClient) {
    return null; // or a loading spinner
  }

  return (
    <SidebarProvider>
      <MainSidebar trip={activeTrip} onNewTrip={handleNewTrip}/>
      <div className="flex flex-col sm:h-svh sm:overflow-hidden">
        <Header trip={activeTrip} currentDay={currentDay} onDayChange={setCurrentDay} onItineraryUpdate={handleItineraryUpdate}/>
        <SidebarInset className="flex flex-col flex-1 max-h-full overflow-auto pb-16 sm:pb-0">
          {activeTrip && activeDayItinerary ? (
            <>
              <main className="p-4 sm:p-6 md:p-8">
                <ItineraryTimeline 
                  dayItinerary={activeDayItinerary} 
                  onItineraryUpdate={handleItineraryUpdate}
                  currentItinerary={activeTrip.itinerary || []}
                  onDragEnd={handleDragEnd}
                />
              </main>
              <Chatbot activeTrip={activeTrip} />
            </>
          ) : (
             <div className="flex-1 flex flex-col h-full">
              <CreateTrip 
                onTripCreate={handleTripCreate} 
                recommendedDestination={recommendedDestination || undefined} 
                existingTrips={trips || []}
              />
            </div>
          )}
        </SidebarInset>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}


export default function PlannerPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <PlannerPageContent />
        </React.Suspense>
    )
}
