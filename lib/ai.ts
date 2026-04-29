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
  imageUrl?: string; // URL de la imagen para análisis OCR
}

/**
 * Generate AI response using Vercel AI SDK
 */
export async function generateAIResponse({
  message,
  conversationHistory = [],
  systemPrompt = 'Eres un asistente útil de WhatsApp. Responde de manera amigable, concisa y profesional en español.',
  imageUrl,
}: GenerateResponseParams): Promise<string> {
  try {
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
    ];

    // Si hay una imagen, crear mensaje con contenido multimodal
    if (imageUrl) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: message },
          { type: 'image', image: imageUrl }
        ]
      });
    } else {
      messages.push({ role: 'user', content: message });
    }

    const { text } = await generateText({
      model: openrouter('nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'),
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
 * Extract text from image using OCR (Optical Character Recognition)
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  try {
    const systemPrompt = `Eres un experto en OCR (reconocimiento óptico de caracteres).
Tu tarea es extraer TODO el texto visible en la imagen, incluyendo texto escrito a mano o impreso.

INSTRUCCIONES:
- Extrae TODO el texto que veas en la imagen
- Mantén el formato y estructura del texto original
- Si hay texto escrito a mano, haz tu mejor esfuerzo para interpretarlo
- Si no hay texto en la imagen, responde: "No se detectó texto en la imagen"
- NO agregues comentarios adicionales, solo el texto extraído`;

    const { text } = await generateText({
      model: openrouter('nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'),
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extrae todo el texto de esta imagen:' },
            { type: 'image', image: imageUrl }
          ]
        }
      ],
      temperature: 0.3, // Baja temperatura para mayor precisión
    });

    return text;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error('Failed to extract text from image');
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
