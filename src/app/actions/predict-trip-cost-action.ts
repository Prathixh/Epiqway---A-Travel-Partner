'use server';

import { predictTripCost as predictTripCostFlow, PredictTripCostInput, PredictTripCostOutput } from "@/ai/flows/predict-trip-cost";

export async function predictTripCost(input: PredictTripCostInput): Promise<PredictTripCostOutput> {
    const result = await predictTripCostFlow(input);
    return result;
}
