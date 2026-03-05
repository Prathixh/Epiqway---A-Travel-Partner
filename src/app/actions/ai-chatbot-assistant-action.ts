'use server';

import { aiChatbotAssistant as aiChatbotAssistantFlow, AIChatbotAssistantInput, AIChatbotAssistantOutput } from "@/ai/flows/ai-chatbot-assistant";

export async function aiChatbotAssistant(input: AIChatbotAssistantInput): Promise<AIChatbotAssistantOutput> {
    const result = await aiChatbotAssistantFlow(input);
    return result;
}
