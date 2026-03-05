
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icons from '@/components/icons';
import ChatMessage from './chat-message';
import { aiChatbotAssistant } from '@/app/actions/ai-chatbot-assistant-action';
import { AIChatbotAssistantInput } from '@/ai/flows/ai-chatbot-assistant';
import { Trip } from '@/lib/trip';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  prompt: z.string().min(1, 'Message cannot be empty'),
});

type FormValues = z.infer<typeof formSchema>;

interface Message {
  role: 'user' | 'bot';
  content: string;
}

interface ChatbotProps {
    activeTrip: Trip | null;
}

export default function Chatbot({ activeTrip }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: "Hello! How can I help you plan your trip? You can ask me to add, remove, or suggest changes to your itinerary." },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const userMessage: Message = { role: 'user', content: data.prompt };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    form.reset();

    try {
      const input: AIChatbotAssistantInput = {
        prompt: data.prompt,
        currentItinerary: activeTrip ? JSON.stringify(activeTrip.itinerary) : undefined,
      };
      const result = await aiChatbotAssistant(input);
      const botMessage: Message = { role: 'bot', content: result.response };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage: Message = { role: 'bot', content: "Sorry, I'm having trouble connecting. Please try again later." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  return (
     <div className="fixed bottom-20 right-4 z-50 md:bottom-4">
      {isOpen ? (
        <Card className="w-[350px] h-[500px] flex flex-col shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-headline">
              <Icons.Bot />
              AI Assistant
            </CardTitle>
             <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <Icons.X className="h-4 w-4" />
             </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <ChatMessage key={index} role={msg.role} content={msg.content} />
                ))}
                {isLoading && <ChatMessage role="bot" content="" isLoading />}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full items-center space-x-2">
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Add a shopping stop..." {...field} disabled={isLoading} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" size="icon" disabled={isLoading}>
                  <Icons.Send className="h-4 w-4" />
                </Button>
              </form>
            </Form>
          </CardFooter>
        </Card>
      ) : (
        <Button
          size="lg"
          className="rounded-full w-16 h-16 shadow-2xl"
          onClick={() => setIsOpen(true)}
        >
          <Icons.Bot className="w-8 h-8" />
        </Button>
      )}
    </div>
  );
}
