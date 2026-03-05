
'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Notification {
  id: number;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'alert' | 'reminder' | 'info';
}

const mockNotifications: Notification[] = [
    {
        id: 1,
        title: "Time to leave for Marina Beach",
        description: "Leave now to reach by 05:00 AM. Estimated travel time is 25 minutes.",
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        read: false,
        type: 'reminder'
    },
    {
        id: 2,
        title: "Upcoming Destination: Murugan Idli",
        description: "Your next stop for breakfast is just 15 minutes away after the beach.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
        read: true,
        type: 'info'
    },
    {
        id: 3,
        title: "Traffic Alert on your route",
        description: "Heavy traffic reported near Anna Salai. Your route has been updated.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        read: true,
        type: 'alert'
    }
];


const NOTIFICATIONS_STORAGE_KEY = 'epiqway_notifications';

const listeners: Array<(notifications: Notification[]) => void> = [];
let memoryState: Notification[] = [];

function emitChange() {
  listeners.forEach(listener => listener(memoryState));
}

function useNotificationStore() {
    const setState = useState(memoryState)[1];

    useEffect(() => {
        // Load from localStorage on mount
        const storedState = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (storedState) {
            try {
                memoryState = JSON.parse(storedState);
            } catch (e) {
                memoryState = mockNotifications;
            }
            emitChange();
        } else {
            // Initialize with mock data if nothing is in storage
            memoryState = mockNotifications;
            emitChange();
        }

        listeners.push(setState);
        return () => {
            const index = listeners.indexOf(setState);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }, []);

    const updateState = (newState: Notification[]) => {
        memoryState = newState;
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(memoryState));
        emitChange();
    };

    const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const existingNotification = memoryState.find(
            (n) => n.title === notification.title && n.description === notification.description
        );
        if (existingNotification) return;

        const newNotification: Notification = {
            ...notification,
            id: Date.now(),
            timestamp: new Date().toISOString(),
            read: false,
        };
        updateState([newNotification, ...memoryState]);
    };

    const markAsRead = (id: number) => {
        const updated = memoryState.map(n => n.id === id ? { ...n, read: true } : n);
        updateState(updated);
    };
    
    const markAllAsRead = () => {
        const updated = memoryState.map(n => ({...n, read: true}));
        updateState(updated);
    }
    
    const clearAllNotifications = () => {
        updateState([]);
    }

    return { notifications: memoryState, addNotification, markAsRead, markAllAsRead, clearAllNotifications };
}

// Custom hook to be used in components
export function useNotifications() {
    const { notifications, addNotification, markAsRead, markAllAsRead, clearAllNotifications } = useNotificationStore();
    
    const unreadCount = notifications.filter(n => !n.read).length;

    return { notifications, addNotification, markAsRead, markAllAsRead, unreadCount, clearAllNotifications };
}
