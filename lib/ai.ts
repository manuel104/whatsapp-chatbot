import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, streamText } from 'ai';

// Initialize OpenRouter with API key
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GenerateResponseParams {
  message: string;
  conversationHistory?: ChatMessage[];
  systemPrompt?: string;
}

/**
 * Generate AI response using Vercel AI SDK
 */
export async function generateAIResponse({
  message,
  conversationHistory = [],
  systemPrompt = 'Eres un asistente útil de WhatsApp. Responde de manera amigable, concisa y profesional en español.',
}: GenerateResponseParams): Promise<string> {
  try {
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message },
    ];

    const { text } = await generateText({
      model: openrouter('tencent/hy3-preview:free'),
      messages,
      temperature: 0.7,
    });

    return text;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate AI response');
  }
}

/**
 * Generate streaming AI response (for future use with real-time updates)
 */
export async function generateStreamingResponse({
  message,
  conversationHistory = [],
  systemPrompt = 'Eres un asistente útil de WhatsApp. Responde de manera amigable, concisa y profesional en español.',
}: GenerateResponseParams) {
  try {
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message },
    ];

    const result = await streamText({
      model: openrouter('openai/gpt-4o-mini'),
      messages,
      temperature: 0.7,
    });

    return result.textStream;
  } catch (error) {
    console.error('Error generating streaming response:', error);
    throw new Error('Failed to generate streaming response');
  }
}

/**
 * Validate OpenRouter API key configuration
 */
export function validateAIConfig(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

/**
 * Get available models from OpenRouter
 * Popular models you can use:
 * - openai/gpt-4o-mini (fast, cheap)
 * - openai/gpt-4o (most capable)
 * - anthropic/claude-3.5-sonnet (excellent reasoning)
 * - google/gemini-pro-1.5 (large context)
 * - meta-llama/llama-3.1-70b-instruct (open source)
 */
export const AVAILABLE_MODELS = {
  GPT4_MINI: 'openai/gpt-4o-mini',
  GPT4: 'openai/gpt-4o',
  CLAUDE_SONNET: 'anthropic/claude-3.5-sonnet',
  GEMINI_PRO: 'google/gemini-pro-1.5',
  LLAMA_70B: 'meta-llama/llama-3.1-70b-instruct',
} as const;

export type { ChatMessage, GenerateResponseParams };

// Made with Bob
