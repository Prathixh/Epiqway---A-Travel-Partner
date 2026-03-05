
/**
 * @fileOverview A dynamic AI replanning tool that monitors weather and traffic and automatically replans the user's itinerary if delays are detected.
 *
 * - dynamicAiReplanningTool - A function that handles the dynamic replanning process.
 * - DynamicAiReplanningToolInput - The input type for the dynamicAiReplanningTool function.
 * - DynamicAiReplanningToolOutput - The return type for the dynamicAiReplanningTool function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DynamicAiReplanningToolInputSchema = z.object({
  currentItinerary: z
    .string()
    .describe('The current itinerary in JSON format. Include spot names, times, and locations.'),
  weatherConditions: z
    .string()
    .describe('The current weather conditions at each location in the itinerary.'),
  trafficConditions: z
    .string()
    .describe('The current traffic conditions between each location in the itinerary.'),
  userPreferences: z
    .string()
    .describe(
      'The user preferences including interests, age group, and trip mode in JSON format.'
    ),
});
export type DynamicAiReplanningToolInput = z.infer<typeof DynamicAiReplanningToolInputSchema>;

const DynamicAiReplanningToolOutputSchema = z.object({
  updatedItinerary: z
    .string()
    .describe('The updated itinerary in JSON format, optimized for current conditions.'),
  reasoning: z
    .string()
    .describe('The AI reasoning for the changes made to the itinerary.'),
});
export type DynamicAiReplanningToolOutput = z.infer<typeof DynamicAiReplanningToolOutputSchema>;

export async function dynamicAiReplanningTool(
  input: DynamicAiReplanningToolInput
): Promise<DynamicAiReplanningToolOutput> {
  return dynamicAiReplanningToolFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dynamicAiReplanningToolPrompt',
  input: {schema: DynamicAiReplanningToolInputSchema},
  output: {schema: DynamicAiReplanningToolOutputSchema},
  prompt: `You are a smart travel assistant that replans itineraries based on current weather and traffic conditions, and user preferences.

Current Itinerary:
{{currentItinerary}}

Weather Conditions:
{{weatherConditions}}

Traffic Conditions:
{{trafficConditions}}

User Preferences:
{{userPreferences}}

Based on the information above, update the itinerary to avoid delays and optimize for the user's preferences.
Explain the changes you made and the reasoning behind them in the "reasoning" output field.

Return the updated itinerary in JSON format in the "updatedItinerary" output field.`,
});

const dynamicAiReplanningToolFlow = ai.defineFlow(
  {
    name: 'dynamicAiReplanningToolFlow',
    inputSchema: DynamicAiReplanningToolInputSchema,
    outputSchema: DynamicAiReplanningToolOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
