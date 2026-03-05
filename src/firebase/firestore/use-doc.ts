
'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
  update: (data: Partial<Omit<T, 'id'>>) => Promise<void>;
  isWriting: boolean;
  writeError: Error | null;
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * Handles nullable references.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedDocRef or BAD THINGS WILL HAPPEN
 * use useMemoFirebase to memoize it per React guidence. Also make sure that its dependencies are stable
 * references
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {DocumentReference<DocumentData> | null | undefined} docRef -
 * The Firestore DocumentReference. Waits if null/undefined.
 * @returns {UseDocResult<T>} Object with data, loading/error states, and an update function.
 */
export function useDoc<T = any>(
  memoizedDocRef: (DocumentReference<DocumentData> & {__memo?: boolean}) | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [writeError, setWriteError] = useState<Error | null>(null);

  useEffect(() => {
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: memoizedDocRef.path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedDocRef]);

  const update = async (updateData: Partial<Omit<T, 'id'>>) => {
    if (!memoizedDocRef) {
      const err = new Error("Document reference is not provided for update.");
      setWriteError(err);
      throw err;
    }
    
    setIsWriting(true);
    setWriteError(null);

    try {
      await updateDoc(memoizedDocRef, updateData);
    } catch (error: any) {
      setWriteError(error);
      const permissionError = new FirestorePermissionError({
        path: memoizedDocRef.path,
        operation: 'update',
        requestResourceData: updateData,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw permissionError;
    } finally {
      setIsWriting(false);
    }
  };

  if(memoizedDocRef && !memoizedDocRef.__memo) {
    throw new Error(`Document reference for path "${memoizedDocRef.path}" was not properly memoized using useMemoFirebase. This will cause infinite re-renders.`);
  }

  return { data, isLoading, error, update, isWriting, writeError };
}
