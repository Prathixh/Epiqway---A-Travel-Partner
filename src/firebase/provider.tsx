
'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, updateDoc } from 'firebase/firestore';
import { Auth, User } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/firebase/firebase-error-listener';

interface FirebaseContextValue {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const contextValue = useMemo(() => {
    return { firebaseApp, firestore, auth };
  }, [firebaseApp, firestore, auth]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextValue => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useAuth = (): Auth => {
    const { auth } = useFirebase();
    return auth;
}

export const useFirestore = (): Firestore => {
    const { firestore } = useFirebase();
    return firestore;
}

export const useFirebaseApp = (): FirebaseApp => {
    const { firebaseApp } = useFirebase();
    return firebaseApp;
}

export const useDoc = <T>(docRef: any) => {
    // This is a placeholder. The real implementation is in firestore/use-doc.tsx
    return { data: null, isLoading: true, error: null, update: (data: Partial<T>) => {
      if (docRef) {
        updateDoc(docRef, data);
      }
    }};
};
