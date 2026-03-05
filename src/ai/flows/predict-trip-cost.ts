
/**
 * @fileOverview A flow to predict the approximate cost of a trip.
 *
 * - predictTripCost - A function that predicts trip cost.
 * - PredictTripCostInput - The input type for the predictTripCost function.
 * - PredictTripCostOutput - The return type for the predictTripCost function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const PredictTripCostInputSchema = z.object({
  destination: z.string().describe('The destination of the trip.'),
  days: z.coerce.number().min(1).describe('The number of days for the trip.'),
});
export type PredictTripCostInput = z.infer<typeof PredictTripCostInputSchema>;

const PredictTripCostOutputSchema = z.object({
  predictedCost: z.number().describe('The predicted approximate cost for the trip for one person in INR.'),
});
export type PredictTripCostOutput = z.infer<typeof PredictTripCostOutputSchema>;

export async function predictTripCost(input: PredictTripCostInput): Promise<PredictTripCostOutput> {
  return predictTripCostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictTripCostPrompt',
  input: { schema: PredictTripCostInputSchema },
  output: { schema: PredictTripCostOutputSchema },
  prompt: `You are an expert travel cost estimator. Based on the user's trip details, predict the approximate total cost for one person in Indian Rupees (INR).

Consider factors like accommodation, food, and activities. Provide a single number as the total estimated cost.

Destination: {{destination}}
Number of days: {{days}}`,
});

const predictTripCostFlow = ai.defineFlow(
  {
    name: 'predictTripCostFlow',
    inputSchema: PredictTripCostInputSchema,
    outputSchema: PredictTripCostOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
