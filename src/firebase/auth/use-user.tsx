
'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from './auth';
import { useFirebase } from '@/firebase/provider';
import type { User, Auth } from 'firebase/auth';

export type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'authenticated'; user: User }
  | { status: 'unauthenticated'; user: null };

export const useUser = (): AuthState => {
  const [userState, setUserState] = useState<AuthState>({
    status: 'loading',
    user: null,
  });

  let auth: Auth | null;
  try {
    ({ auth } = useFirebase());
  } catch (e) {
    auth = null;
  }
  
  useEffect(() => {
    if (!auth) {
        setUserState({ status: 'unauthenticated', user: null });
        return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserState({ status: 'authenticated', user });
      } else {
        setUserState({ status: 'unauthenticated', user: null });
      }
    });

    return () => unsubscribe();
  }, [auth]);

  return userState;
};
