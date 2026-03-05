
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { DayItinerarySchema } from './generate-itinerary';

export const RefineItineraryInputSchema = z.object({
  currentItinerary: z.array(DayItinerarySchema).describe("The user's current itinerary."),
  destination: z.string().describe('The destination of the trip.'),
  preferences: z.object({
    mood: z.string().optional().describe('The desired mood for the trip (e.g., Aggressive, Gentle, Romantic, Foodie).'),
    tripMode: z.string().optional().describe('The type of travel group (e.g., Solo, Couple, Family).'),
  }),
});
export type RefineItineraryInput = z.infer<typeof RefineItineraryInputSchema>;

export const RefineItineraryOutputSchema = z.object({
  itinerary: z.array(DayItinerarySchema).describe('The refined itinerary.'),
  reasoning: z.string().describe('A brief explanation of the changes made.'),
});
export type RefineItineraryOutput = z.infer<typeof RefineItineraryOutputSchema>;


export async function refineItinerary(input: RefineItineraryInput): Promise<RefineItineraryOutput> {
  return refineItineraryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'refineItineraryPrompt',
  input: { schema: z.object({ ...RefineItineraryInputSchema.shape, currentItinerary: z.string() })},
  output: { schema: RefineItineraryOutputSchema },
  prompt: `You are an expert travel agent who specializes in refining existing itineraries based on user preferences.

You will be given a current itinerary for a trip to {{destination}} and a set of new preferences. Your task is to modify the itinerary to better match these preferences.

Current Itinerary:
{{{currentItinerary}}}

User Preferences:
- Mood: {{preferences.mood}}
- Trip Mode: {{preferences.tripMode}}

Instructions:
1.  **Analyze Preferences**: Carefully analyze the user's 'mood' and 'tripMode'.
    *   If 'mood' is 'Foodie', you MUST replace at least one non-food spot with a highly-rated, famous local restaurant or food street.
    *   If 'mood' is 'Romantic', you MUST add scenic viewpoints, suggest a candlelight dinner, or replace a generic spot with a more intimate one.
    *   If 'mood' is 'Aggressive', you MUST add adventure sports, trekking, or fast-paced activities.
    *   If 'tripMode' is 'Family', ensure activities are kid-friendly. Replace late-night clubs or strenuous hikes with parks, museums, or family restaurants.
2.  **Modify the Itinerary**:
    *   Review the current itinerary and identify at least one spot or activity that does NOT align with the new preferences.
    *   Find a suitable replacement for the misaligned spot. The replacement MUST be in the same city ({{destination}}) and should fit logically into the schedule, considering travel time and geography.
    *   You can replace items, reorder items, or adjust timings to make the plan more logical. Do not add or remove days.
3.  **Output Format**:
    *   You MUST return a complete, valid JSON object that conforms to the output schema. All fields must be filled.
    *   In the 'reasoning' field, provide a short (1-2 sentences) and clear explanation of what you changed and why it matches the user's preferences. For example: "I replaced the history museum with a water park to better suit a family trip, and swapped a cafe for a highly-rated local restaurant for the 'Foodie' mood."
4.  **No-Change Scenario**: If the itinerary already perfectly matches the preferences, you can return it as-is with a reasoning like "The itinerary already aligns well with your preferences."
5.  **Maintain Structure**: The number of days in the itinerary must remain the same.`,
});

const refineItineraryFlow = ai.defineFlow(
  {
    name: 'refineItineraryFlow',
    inputSchema: RefineItineraryInputSchema,
    outputSchema: RefineItineraryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt({
      ...input,
      currentItinerary: JSON.stringify(input.currentItinerary),
    });
    return output!;
  }
);
