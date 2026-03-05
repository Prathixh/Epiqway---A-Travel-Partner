
'use client';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';
import { auth, firestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export const signUp = async (email: string, password: string, displayName: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  await updateProfile(user, { displayName });

  const userRef = doc(firestore, 'users', user.uid);
  const userData = {
    uid: user.uid,
    email: user.email,
    name: displayName,
    avatar: user.photoURL || '',
  };

  setDoc(userRef, userData, { merge: true }).catch((serverError) => {
    const permissionError = new FirestorePermissionError({
      path: userRef.path,
      operation: 'create',
      requestResourceData: userData,
    });
    errorEmitter.emit('permission-error', permissionError);
  });

  return userCredential;
};

export const signIn = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signOut = () => {
  return firebaseSignOut(auth);
};

export const sendPasswordReset = (email: string) => {
    return sendPasswordResetEmail(auth, email);
};

export const reauthenticateAndChangePassword = async (currentPassword: string, newPassword: string) => {
    const user = auth.currentUser;
    if (!user || !user.email) {
        throw new Error("No user is signed in or user has no email.");
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    
    // Re-authenticate the user
    await reauthenticateWithCredential(user, credential);
    
    // If re-authentication is successful, update the password
    await updatePassword(user, newPassword);
};


export const updateUserProfile = async (profile: { displayName?: string, photoURL?: string }) => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user is signed in to update profile.");

    await updateProfile(user, profile);

    const userRef = doc(firestore, 'users', user.uid);
    const userData: {name?: string; avatar?: string;} = {};
    if (profile.displayName) userData.name = profile.displayName;
    if (profile.photoURL) userData.avatar = profile.photoURL;

    setDoc(userRef, userData, { merge: true }).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: userData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
};

export { onAuthStateChanged };

    
