
'use client';

import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icons from '@/components/icons';
import DaySelector from '@/components/itinerary/day-selector';
import { Trip, DayItinerary } from '@/lib/trip';
import RefineItinerary from '../itinerary/refine-itinerary';
import NotificationBell from '../notifications/notification-bell';

interface HeaderProps {
  trip: Trip | null;
  currentDay: number;
  onDayChange: (day: number) => void;
  onItineraryUpdate: (updatedItinerary: DayItinerary[]) => void;
}

export default function Header({ trip, currentDay, onDayChange, onItineraryUpdate }: HeaderProps) {
  const { toast } = useToast();
  
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <SidebarTrigger className="md:hidden" />
      {trip ? (
         <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <h1 className="hidden md:block text-lg font-semibold font-headline">{trip.name}</h1>
                <DaySelector
                    totalDays={trip.days}
                    currentDay={currentDay}
                    onDayChange={onDayChange}
                />
            </div>

            <div className="flex items-center gap-2">
                <RefineItinerary trip={trip} onItineraryUpdate={onItineraryUpdate} />
                <NotificationBell />
            </div>
         </div>
      ) : (
        <div className="flex w-full items-center">
            <div className="flex-1"></div>
            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold font-headline">epiqway</h1>
            </div>
            <div className="flex flex-1 justify-end">
              <NotificationBell />
            </div>
        </div>
      )}
    </header>
  );
}
