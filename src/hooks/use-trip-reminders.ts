
'use client';

import { useEffect, useRef } from 'react';
import { Trip } from '@/lib/trip';
import { useNotifications } from './use-notifications';
import { timeToMinutes } from '@/lib/utils';
import { isToday, parseISO } from 'date-fns';

const REMINDER_WINDOW_MINUTES = 15;

const reminderMessages = [
    "Time to get moving! Your next activity is just around the corner.",
    "Adventure awaits! Get ready for your next stop.",
    "Your next place is waiting for you! Get ready to leave.",
    "Don't miss out! It's almost time for your next itinerary item.",
    "Ready for the next part of your journey? It's time to head out!"
];

function getRandomMessage() {
    return reminderMessages[Math.floor(Math.random() * reminderMessages.length)];
}

export function useTripReminders(trip: Trip | null) {
  const { addNotification } = useNotifications();
  const notifiedItemsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!trip) {
      return;
    }
    
    // Reset notified items when trip changes
    notifiedItemsRef.current = new Set();

    const checkReminders = () => {
      const now = new Date();
      
      trip.itinerary.forEach(dayItinerary => {
        // Only check reminders for today's itinerary
        if (!isToday(parseISO(dayItinerary.date))) {
          return;
        }

        dayItinerary.items.forEach(item => {
          if (notifiedItemsRef.current.has(item.id)) {
            return;
          }

          const itemTimeInMinutes = timeToMinutes(item.time);
          const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
          
          const timeDifference = itemTimeInMinutes - currentTimeInMinutes;

          if (timeDifference > 0 && timeDifference <= REMINDER_WINDOW_MINUTES) {
            addNotification({
              title: `Reminder: ${item.spotName}`,
              description: getRandomMessage(),
              type: 'reminder'
            });
            notifiedItemsRef.current.add(item.id);
          }
        });
      });
    };

    // Check reminders every minute
    const intervalId = setInterval(checkReminders, 60 * 1000);

    // Initial check
    checkReminders();

    return () => {
      clearInterval(intervalId);
    };
  }, [trip, addNotification]);
}
