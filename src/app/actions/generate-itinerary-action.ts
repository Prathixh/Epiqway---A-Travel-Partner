
'use server';

import { generateItinerary as generateItineraryFlow, GenerateItineraryInput, GenerateItineraryOutput } from "@/ai/flows/generate-itinerary";

export async function generateItinerary(input: GenerateItineraryInput): Promise<GenerateItineraryOutput> {
    const result = await generateItineraryFlow(input);
    return result;
}
