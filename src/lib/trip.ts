
export type Facility = 'Restroom' | 'Water' | 'Parking' | 'Food' | 'Accessibility';

export interface ItineraryItem {
  id: string;
  time: string;
  duration: number; // in minutes
  spotName: string;
  address: string;
  type: 'Attraction' | 'Food' | 'Shopping' | 'Break' | 'Beach' | 'Activity' | 'Other';
  rating: number;
  crowdLevel: 'Low' | 'Medium' | 'High';
  description: string;
  imageId: string;
  costAmount: number; // INR per person
  costDetails: string; // e.g., "Entry fee", "User preference"
  facilities?: Facility[];
  openingTime: string;
  closingTime: string;
}

export interface DayItinerary {
  day: number;
  date: string;
  sunrise: string;
  sunset: string;
  items: ItineraryItem[];
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  days: number;
  cost: number;
  itinerary: DayItinerary[];
  status: 'pending' | 'ongoing' | 'completed';
}

export interface Expense {
    id: string;
    tripId: string;
    category: 'Food' | 'Transport' | 'Accommodation' | 'Activities' | 'Shopping' | 'Other';
    amount: number;
    description?: string;
    billDate: string;
}
