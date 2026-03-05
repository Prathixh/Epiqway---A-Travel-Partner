import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a time string (e.g., "09:00 AM", "05:30 PM") to minutes from midnight.
 */
export function timeToMinutes(timeStr: string): number {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (modifier === 'PM' && hours < 12) {
    hours += 12;
  }
  if (modifier === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}


/**
 * Converts minutes from midnight to a 12-hour AM/PM time string.
 */
export function minutesToTime(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const modifier = hours24 >= 12 ? 'PM' : 'AM';

  const paddedHours = hours12.toString().padStart(2, '0');
  const paddedMinutes = minutes.toString().padStart(2, '0');

  return `${paddedHours}:${paddedMinutes} ${modifier}`;
}
