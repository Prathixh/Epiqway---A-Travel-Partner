
'use client';
import { collection, deleteDoc, doc, getDocs, setDoc, writeBatch, addDoc, updateDoc } from 'firebase/firestore';
import { Trip } from './trip';
import { firestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const ACTIVE_TRIP_ID_KEY = 'epiqway_active_trip_id';

export async function saveTrip(userId: string, tripData: Omit<Trip, 'id'> | Trip, tripId?: string): Promise<string> {
    if (tripId) {
        // We are updating an existing trip
        const tripRef = doc(firestore, 'users', userId, 'trips', tripId);
        const tripWithId = { ...tripData, id: tripId };
        
        await setDoc(tripRef, tripWithId, { merge: true }).catch((serverError) => {
            const permissionError = new FirestorePermissionError({
              path: tripRef.path,
              operation: 'update',
              requestResourceData: tripWithId,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });
        return tripId;
    } else {
        // We are creating a new trip
        const tripsCollectionRef = collection(firestore, 'users', userId, 'trips');
        try {
            const docRef = await addDoc(tripsCollectionRef, tripData);
            // Now update the document with its own ID
            await updateDoc(docRef, { id: docRef.id });
            return docRef.id;
        } catch (serverError: any) {
            const permissionError = new FirestorePermissionError({
              path: tripsCollectionRef.path,
              operation: 'create',
              requestResourceData: tripData,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        }
    }
}


export function deleteTrip(userId: string, tripId: string): void {
  const tripRef = doc(firestore, 'users', userId, 'trips', tripId);
  deleteDoc(tripRef).catch((serverError) => {
    const permissionError = new FirestorePermissionError({
      path: tripRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
  });

  if (getActiveTripId() === tripId) {
    clearActiveTrip();
  }
}

export async function deleteAllUserTrips(userId: string): Promise<void> {
    if (!firestore) return;
    const tripsCollectionRef = collection(firestore, 'users', userId, 'trips');
    const querySnapshot = await getDocs(tripsCollectionRef);
    
    const batch = writeBatch(firestore);
    querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
    });
    
    await batch.commit();
    clearActiveTrip();
}


export function setActiveTrip(tripId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACTIVE_TRIP_ID_KEY, tripId);
  }
}

export function getActiveTripId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_TRIP_ID_KEY);
}

export function clearActiveTrip(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACTIVE_TRIP_ID_KEY);
  }
}
