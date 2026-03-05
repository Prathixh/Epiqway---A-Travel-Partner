'use server';

import { ai } from '@/ai/genkit';
import { ItineraryItemSchema } from '@/ai/flows/generate-itinerary';
import { z } from 'zod';

const FindSpotReplacementInputSchema = z.object({
  missedSpotName: z.string().describe("The name of the spot the user missed."),
  missedSpotAddress: z.string().describe("The address of the missed spot."),
  missedSpotType: z.string().describe("The type of the missed spot (e.g., Attraction, Food)."),
  currentItinerary: z.string().describe("The user's current itinerary in JSON format to provide context."),
  destination: z.string().describe("The city the user is in."),
});

export async function findSpotReplacement(input: z.infer<typeof FindSpotReplacementInputSchema>) {
  const findSpotPrompt = ai.definePrompt({
    name: 'findSpotReplacementPrompt',
    input: { schema: FindSpotReplacementInputSchema },
    output: { schema: ItineraryItemSchema },
    prompt: `You are a travel assistant. A user has missed a spot on their itinerary and needs an alternative.

    Find a replacement spot that is:
    1.  Similar in type to the missed spot ({{missedSpotType}}).
    2.  Geographically close to the missed spot's location ({{missedSpotAddress}}, {{destination}}).
    3.  Not already in the user's current itinerary.
    
    Current Itinerary Context:
    {{{currentItinerary}}}
    
    Generate a complete ItineraryItem for the suggested replacement, including all fields like ID, cost in INR, description, etc.
    `,
  });

  const { output } = await findSpotPrompt(input);
  return output!;
}
