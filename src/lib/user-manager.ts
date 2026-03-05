
'use client';

// This file is now deprecated in favor of Firebase Authentication.
// The functions are no longer used but are kept for reference during transition.

export interface User {
  name: string;
  email: string;
  avatar?: string;
}

/**
 * @deprecated Use Firebase Authentication instead.
 */
export function saveUser(user: User): void {
  console.warn("saveUser is deprecated. Use Firebase Auth.");
}

/**
 * @deprecated Use the `useUser` hook from '@/firebase' instead.
 */
export function getUser(): User | null {
  console.warn("getUser is deprecated. Use `useUser` hook.");
  return null;
}

/**
 * @deprecated Use Firebase Authentication's signOut method.
 */
export function clearUser(): void {
  console.warn("clearUser is deprecated. Use Firebase signOut.");
}
