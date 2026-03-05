'use server';

import { refineItinerary as refineItineraryFlow, RefineItineraryInput, RefineItineraryOutput } from "@/ai/flows/refine-itinerary";

export async function refineItinerary(input: RefineItineraryInput): Promise<RefineItineraryOutput> {
    const result = await refineItineraryFlow(input);
    return result;
}
