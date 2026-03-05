
import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const FacilityEnum = z.enum(['Restroom', 'Water', 'Parking', 'Food', 'Accessibility']);

export const ItineraryItemSchema = z.object({
  id: z.string().describe('Unique ID for the itinerary item.'),
  time: z.string().describe('The time for this activity in 12-hour AM/PM format, e.g., "09:00 AM".'),
  duration: z.number().describe('The duration of the activity in minutes.'),
  spotName: z.string().describe('The name of the spot or activity.'),
  address: z.string().describe('The address of the spot.'),
  type: z.enum(['Attraction', 'Food', 'Shopping', 'Break', 'Beach', 'Activity', 'Other']).describe('The type of activity.'),
  rating: z.number().min(1).max(5).describe('A rating from 1 to 5.'),
  crowdLevel: z.enum(['Low', 'Medium', 'High']).describe('The typical crowd level.'),
  description: z.string().describe('A brief, engaging description of the spot (2-3 sentences).'),
  imageId: z.string().describe("A unique, descriptive, URL-friendly ID based on the spot name (e.g., 'eiffel-tower', 'marina-beach')."),
  costAmount: z.number().describe('The estimated cost per person in INR. If cost is variable (like shopping) or free, set to 0.'),
  costDetails: z.string().describe('Details about the cost, e.g., "Entry fee", "Approx. meal cost", or "User preference".'),
  facilities: z.array(FacilityEnum).optional().describe("A list of available facilities, such as 'Restroom', 'Water', 'Parking', 'Food', 'Accessibility'."),
  openingTime: z.string().describe('The opening time of the spot in 12-hour AM/PM format, e.g., "09:00 AM". If it is open 24 hours, use "Open 24 hours".'),
  closingTime: z.string().describe('The closing time of the spot in 12-hour AM/PM format, e.g., "06:00 PM". If it is open 24 hours, use "Open 24 hours".')
});

export const DayItinerarySchema = z.object({
  day: z.number().describe('The day number of the itinerary.'),
  date: z.string().describe('The date for this day\'s plan, in YYYY-MM-DD format.'),
  sunrise: z.string().describe('The sunrise time in 12-hour AM/PM format, e.g., "06:00 AM".'),
  sunset: z.string().describe('The sunset time in 12-hour AM/PM format, e.g., "09:00 PM".'),
  items: z.array(ItineraryItemSchema).describe('A list of itinerary items for the day.'),
});

export const GenerateItineraryInputSchema = z.object({
  destination: z.string().describe('The destination of the trip.'),
  startDate: z.string().describe('The start date of the trip in ISO format.'),
  days: z.number().describe('The number of days for the trip.'),
  blacklistedSpots: z.array(z.string()).optional().describe('A list of spot names that the user dislikes and should not be included in the itinerary.'),
});
export type GenerateItineraryInput = z.infer<typeof GenerateItineraryInputSchema>;

export const GenerateItineraryOutputSchema = z.object({
  itinerary: z.array(DayItinerarySchema).describe('The generated itinerary.'),
  predictedCost: z.number().describe('The total predicted approximate cost for the trip for one person in INR.'),
});
export type GenerateItineraryOutput = z.infer<typeof GenerateItineraryOutputSchema>;


export async function generateItinerary(input: GenerateItineraryInput): Promise<GenerateItineraryOutput> {
  return generateItineraryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateItineraryPrompt',
  input: { schema: GenerateItineraryInputSchema },
  output: { schema: GenerateItineraryOutputSchema },
  prompt: `You are an expert travel agent. Create a detailed, day-by-day itinerary for a trip based on the user's request.

Destination: {{destination}}
Start Date: {{startDate}}
Number of days: {{days}}

{{#if blacklistedSpots}}
Important: The user has previously disliked and blacklisted the following spots. DO NOT include them in the itinerary:
{{#each blacklistedSpots}}
- {{this}}
{{/each}}
{{/if}}

Instructions:
1.  Create a logical and enjoyable itinerary for the specified number of days.
2.  For each day, create a full-day plan from morning to evening. Include a reasonable number of activities but do not leave large gaps in the schedule.
3.  Crucially, plan the spots for each day based on their geographical proximity to each other to minimize travel time.
4.  For each day, include a mix of attractions, dining, and other activities. Be realistic about travel time between spots.
5.  Fill out ALL fields in the output schema, including 'openingTime' and 'closingTime' for each spot.
6.  All times ('time', 'sunrise', 'sunset', 'openingTime', 'closingTime') must be in a 12-hour AM/PM format (e.g., "09:00 AM", "05:30 PM").
7.  Generate unique, URL-friendly IDs for each 'imageId' based on the spot's name (e.g., 'eiffel-tower', 'hyderabad-charminar').
8.  Provide a realistic cost estimate in Indian Rupees (INR) for each itinerary item. If an activity's cost is highly variable (like shopping) or free, set the 'costAmount' to 0 and explain in 'costDetails' (e.g., "User preference").
9.  For the 'facilities' field, determine and list the likely available amenities for each spot from the allowed values: 'Restroom', 'Water', 'Parking', 'Food', 'Accessibility'. For example, a major museum will have all, a street food stall might only have 'Food', and a park might have 'Restroom' and 'Water'.
10. Calculate the total 'predictedCost' in INR for the entire trip for one person based on the itemized costs.
11. The response must be in valid JSON format that adheres to the output schema.`,
});

const generateItineraryFlow = ai.defineFlow(
  {
    name: 'generateItineraryFlow',
    inputSchema: GenerateItineraryInputSchema,
    outputSchema: GenerateItineraryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
