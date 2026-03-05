
'use server';
/**
 * @fileOverview AI Chatbot Assistant to modify itinerary based on simple prompts.
 *
 * - aiChatbotAssistant - A function that handles the chatbot assistant process.
 * - AIChatbotAssistantInput - The input type for the aiChatbotAssistant function.
 * - AIChatbotAssistantOutput - The return type for the aiChatbotAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIChatbotAssistantInputSchema = z.object({
  prompt: z.string().describe('The prompt from the user, e.g., Add a shopping stop.'),
  currentItinerary: z.string().optional().describe('The current itinerary in JSON format.'),
});
export type AIChatbotAssistantInput = z.infer<typeof AIChatbotAssistantInputSchema>;

const AIChatbotAssistantOutputSchema = z.object({
  updatedItinerary: z.string().optional().describe('The updated itinerary in JSON format. This can be empty if no changes are made.'),
  response: z.string().describe('The chatbot response to the user.'),
});
export type AIChatbotAssistantOutput = z.infer<typeof AIChatbotAssistantOutputSchema>;

export async function aiChatbotAssistant(input: AIChatbotAssistantInput): Promise<AIChatbotAssistantOutput> {
  return aiChatbotAssistantFlow(input);
}

const aiChatbotAssistantPrompt = ai.definePrompt({
  name: 'aiChatbotAssistantPrompt',
  input: {schema: AIChatbotAssistantInputSchema},
  output: {schema: AIChatbotAssistantOutputSchema},
  prompt: `You are a travel assistant chatbot that helps users modify their itinerary.

  The user will provide a prompt and optionally their current itinerary. Your primary goal is to understand their intent (add, remove, reorder, or ask a question) and respond helpfully.

  **Instructions:**
  1.  **Analyze the Prompt's Intent**:
      *   First, determine if the user's prompt is related to travel, planning a trip, or modifying an itinerary.
      *   If the prompt is NOT related to travel (e.g., asking about politics, philosophy, or random facts), you MUST decline to answer. In this case, set the 'response' field to a polite message like "I'm a travel assistant and can only help with planning your trips. How can I assist with your itinerary?" and leave the 'updatedItinerary' field empty.
  2.  **Itinerary Modification (If On-Topic)**:
      *   If the user asks to add a spot, consider its type (shopping, restaurant, attraction, etc.) and location when adding it to the itinerary. Always attempt to place it in the most ideal spot, using common sense.
      *   If the user asks to remove a spot, identify it and remove it from the itinerary.
      *   When you modify the itinerary (add, remove, reorder), provide the *entire updated itinerary* in the 'updatedItinerary' JSON field. All times must be in 12-hour AM/PM format (e.g., "02:30 PM").
  3.  **Answering Questions (If On-Topic)**:
      *   If the user asks how to do something, like reordering items, provide a clear, helpful instruction. For example: "You can easily reorder items by dragging and dropping them in the timeline."
      *   Answer any other questions about the trip or the itinerary clearly.
  4.  **No Itinerary Provided**: If the user asks to modify an itinerary but doesn't provide one, create a new sample itinerary based on their prompt and return it.
  5.  **Response Field**: In the 'response' field, provide a conversational and friendly message to the user explaining what you've done or answering their question.

  **Example On-Topic Prompt**: "Can you add a coffee break in the afternoon?"
  **Example On-Topic Response**: "Sure! I've added a coffee break at 4:00 PM. You can see the updated plan in your timeline."

  **Example Off-Topic Prompt**: "What is the capital of France?"
  **Example Off-Topic Response**: "I'm a travel assistant and can only help with planning your trips. How can I assist with your itinerary?"

  Current Itinerary:
  {{#if currentItinerary}}
  {{{currentItinerary}}}
  {{else}}
  No current itinerary.
  {{/if}}

  Prompt: {{{prompt}}}`,
});

const aiChatbotAssistantFlow = ai.defineFlow(
  {
    name: 'aiChatbotAssistantFlow',
    inputSchema: AIChatbotAssistantInputSchema,
    outputSchema: AIChatbotAssistantOutputSchema,
  },
  async input => {
    const {output} = await aiChatbotAssistantPrompt(input);
    return output!;
  }
);
