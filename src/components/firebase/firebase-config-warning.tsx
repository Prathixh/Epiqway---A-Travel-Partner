
'use client';

import React from 'react';
import { firebaseConfig } from '@/firebase/config';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Icons from '@/components/icons';

const isFirebaseConfigured = () => {
  return (
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.startsWith('REPLACE_WITH_YOUR')
  );
};

export function FirebaseConfigWarning() {
  if (isFirebaseConfigured()) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] p-4">
        <Alert variant="destructive" className="max-w-4xl mx-auto shadow-lg">
        <Icons.AlertTriangle className="h-4 w-4" />
        <AlertTitle>Firebase Not Configured</AlertTitle>
        <AlertDescription>
            Your application is not connected to Firebase, and data will not be saved. Please create a Firebase project, then copy your configuration into{' '}
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
            src/firebase/config.ts
            </code>
            .
        </AlertDescription>
        </Alert>
    </div>
  );
}
