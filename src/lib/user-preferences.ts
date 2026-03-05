'use client';

const BLACKLIST_STORAGE_KEY = 'epiqway_blacklisted_spots';

/**
 * Retrieves the list of blacklisted spots from local storage.
 */
export function getBlacklistedSpots(): string[] {
  if (typeof window === 'undefined') return [];
  const spotsJson = localStorage.getItem(BLACKLIST_STORAGE_KEY);
  return spotsJson ? JSON.parse(spotsJson) : [];
}

/**
 * Adds a spot to the blacklist in local storage.
 * Prevents duplicate entries.
 * @param spotName The name of the spot to blacklist.
 */
export function addSpotToBlacklist(spotName: string): void {
  if (typeof window === 'undefined') return;
  let blacklistedSpots = getBlacklistedSpots();
  if (!blacklistedSpots.includes(spotName)) {
    blacklistedSpots.push(spotName);
    localStorage.setItem(BLACKLIST_STORAGE_KEY, JSON.stringify(blacklistedSpots));
  }
}
