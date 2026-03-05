
'use client';
import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

interface InternalQuery extends Query {
  _query: {
    path: {
      canonicalString: () => string;
    };
  };
}

export function useCollection<T = any>(
  query: Query<DocumentData> | CollectionReference<DocumentData> | null | undefined
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!query) {
      setData(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);

    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot) => {
        const results = snapshot.docs.map(doc => ({ ...(doc.data() as T), id: doc.id }));
        setData(results);
        setIsLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        const path = query.type === 'collection'
          ? (query as CollectionReference).path
          : (query as unknown as InternalQuery)._query.path.canonicalString();

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, isLoading, error };
}
