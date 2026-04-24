import { NextRequest, NextResponse } from 'next/server';
import { getKapsoClient } from '@/lib/kapso';
import { generateAIResponse } from '@/lib/ai';
import {
  getOrCreateConversation,
  startNewConversation,
  addMessage,
  getConversationHistory,
  initDatabase
} from '@/lib/db';

// Store processed message IDs to prevent duplicates (expires after 5 minutes)
const processedMessages = new Map<string, number>();
const MESSAGE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Initialize database on first load
let dbInitialized = false;

// Clean up old processed messages periodically
setInterval(() => {
  const now = Date.now();
  for (const [messageId, timestamp] of processedMessages.entries()) {
    if (now - timestamp > MESSAGE_EXPIRY_MS) {
      processedMessages.delete(messageId);
    }
  }
}, 60000); // Clean every minute

export async function POST(request: NextRequest) {
  try {
    // Get webhook signature for verification
    const signature = request.headers.get('x-kapso-signature') || '';
    const body = await request.text();
    
    // Log for debugging
    console.log('Received webhook request');
    console.log('Signature header:', signature);
    console.log('Body:', body.substring(0, 200)); // Log first 200 chars
    
    // Parse webhook payload first
    const payload = JSON.parse(body);
    
    // Verify webhook authenticity (skip if no signature provided for testing)
    if (signature) {
      const kapsoClient = getKapsoClient();
      if (!kapsoClient.verifyWebhook(signature, body)) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
      console.log('Webhook signature verified');
    } else {
      console.warn('No signature provided, skipping verification (not recommended for production)');
    }
    
    // Get Kapso client
    const kapsoClient = getKapsoClient();
    
    let from: string;
    let text: string;
    let messageId: string;
    let phoneNumberId: string;
    let contactName: string | undefined;
    
    // Handle WhatsApp Business API format (Meta/Facebook)
    if (payload.object === 'whatsapp_business_account') {
      console.log('Processing WhatsApp Business API webhook');
      
      // Extract message from WhatsApp Business API format
      const entry = payload.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages?.[0];
      const metadata = value?.metadata;
      const contacts = value?.contacts?.[0];
      
      if (!messages) {
        console.log('No messages in payload');
        return NextResponse.json({ status: 'no_messages' });
      }
      
      from = messages.from;
      messageId = messages.id;
      phoneNumberId = metadata?.phone_number_id || '';
      const type = messages.type;
      
      // Extract contact name from profile
      contactName = contacts?.profile?.name;
      if (contactName) {
        console.log(`Contact name from WhatsApp profile: ${contactName}`);
      }
      
      // Handle both text messages and interactive button responses
      if (type === 'text') {
        text = messages.text?.body || '';
      } else if (type === 'interactive') {
        // Button response
        const buttonReply = messages.interactive?.button_reply;
        text = buttonReply?.id || buttonReply?.title || '';
        console.log(`Button clicked: ${text}`);
      } else {
        text = '';
      }
      
      console.log(`Message type: ${type}, from: ${from}, phone_number_id: ${phoneNumberId}`);
      
      if (!phoneNumberId) {
        console.error('Missing phone_number_id in webhook payload');
        return NextResponse.json({ status: 'error', message: 'Missing phone_number_id' }, { status: 400 });
      }
      
      // Only process text and interactive messages
      if ((type !== 'text' && type !== 'interactive') || !text) {
        console.log(`Ignoring message of type: ${type}`);
        return NextResponse.json({ status: 'ignored' });
      }
    } else {
      // Handle old Kapso format (fallback) - not supported anymore
      console.error('Old Kapso format not supported. Please use WhatsApp Business API format.');
      return NextResponse.json({
        status: 'error',
        message: 'Unsupported webhook format'
      }, { status: 400 });
    }

    // Check if message was already processed (prevent duplicates)
    if (processedMessages.has(messageId)) {
      console.log(`Message ${messageId} already processed, skipping duplicate`);
      return NextResponse.json({ status: 'duplicate', messageId });
    }
    
    // Mark message as processed
    processedMessages.set(messageId, Date.now());
    
    console.log(`Received message from ${from}: ${text}`);

    // Initialize database if not done yet
    if (!dbInitialized) {
      await initDatabase();
      dbInitialized = true;
    }

    // Check for commands (both / commands and button IDs)
    const command = text.toLowerCase().trim();
    
    if (text.startsWith('/') || command === 'nueva_conversacion' || command === 'ver_ayuda') {
      
      if (command === '/nueva' || command === '/new' || command === 'nueva_conversacion') {
        // Start new conversation - NO BUTTONS
        const conversationId = await startNewConversation(from, contactName);
        const greeting = contactName ? `✨ Nueva conversación iniciada, ${contactName}. ¿En qué puedo ayudarte?` : '✨ Nueva conversación iniciada. ¿En qué puedo ayudarte?';
        
        await kapsoClient.sendMessage({
          to: from,
          message: greeting,
          phoneNumberId: phoneNumberId,
          // No buttons for new conversation response
        });
        
        console.log(`Started new conversation ${conversationId} for ${from}`);
        return NextResponse.json({ status: 'success', action: 'new_conversation' });
      }
      
      if (command === '/ayuda' || command === '/help' || command === 'ver_ayuda') {
        // Show help - WITH Nueva conversación button
        const response = `🤖 *Comandos disponibles:*

/nueva - Iniciar nueva conversación
/ayuda - Mostrar esta ayuda

💬 Simplemente escribe tu mensaje para chatear conmigo.`;
        
        console.log('Sending help message with button');
        console.log('Response length:', response.length);
        
        try {
          await kapsoClient.sendMessage({
            to: from,
            message: response,
            phoneNumberId: phoneNumberId,
            buttons: [
              { id: 'nueva_conversacion', title: 'Nueva' }
            ]
          });
          console.log('Help message sent successfully with button');
        } catch (error) {
          console.error('Error sending help message with button:', error);
          // Fallback: send without button
          await kapsoClient.sendMessage({
            to: from,
            message: response,
            phoneNumberId: phoneNumberId,
          });
        }
        
        return NextResponse.json({ status: 'success', action: 'show_help' });
      }
    }

    // Get or create conversation
    const conversation = await getOrCreateConversation(from, contactName);
    const conversationId = conversation.id;
    const isNewConversation = conversation.isNew;
    const wasInactive = conversation.wasInactive;
    const savedContactName = conversation.contactName;
    
    console.log(`Using conversation ${conversationId} for ${from} (new: ${isNewConversation}, wasInactive: ${wasInactive}, name: ${savedContactName})`);

    // Send typing indicator to show the bot is processing
    await kapsoClient.sendTypingIndicator(from, phoneNumberId);
    console.log('Typing indicator sent');

    // Get conversation history from database (last 10 messages)
    const history = await getConversationHistory(conversationId, 10);

    // Add greeting for new conversations or reactivated sessions
    let systemMessage = '';
    if (isNewConversation) {
      if (wasInactive) {
        // Session reactivated after inactivity
        systemMessage = savedContactName
          ? `La sesión anterior expiró por inactividad (más de 10 minutos). Esta es una nueva conversación. El nombre del usuario es "${savedContactName}". IMPORTANTE: Agradece brevemente al usuario por volver a contactar usando su nombre, y luego responde directamente a su pregunta de forma amigable y profesional. NO des un saludo largo, ve directo al punto.`
          : 'La sesión anterior expiró por inactividad (más de 10 minutos). Esta es una nueva conversación. IMPORTANTE: Agradece brevemente al usuario por volver a contactar y luego responde directamente a su pregunta de forma amigable y profesional. NO des un saludo largo, ve directo al punto.';
      } else {
        // Brand new conversation - first message from user
        systemMessage = savedContactName
          ? `Esta es una nueva conversación. El nombre del usuario es "${savedContactName}". IMPORTANTE: Saluda brevemente al usuario usando su nombre, preséntate como un asistente útil, y luego responde directamente a su pregunta. Sé amigable pero conciso en el saludo.`
          : 'Esta es una nueva conversación. IMPORTANTE: Saluda brevemente al usuario, preséntate como un asistente útil, y luego responde directamente a su pregunta. Sé amigable pero conciso en el saludo.';
      }
    } else if (savedContactName) {
      // Ongoing conversation - NO greeting, just use name naturally
      systemMessage = `El nombre del usuario es "${savedContactName}". NO saludes de nuevo. Simplemente responde a su pregunta de forma amigable y profesional, usando su nombre naturalmente cuando sea apropiado (por ejemplo: "Claro ${savedContactName}, con gusto te ayudo con eso...").`;
    } else {
      // Ongoing conversation without name
      systemMessage = 'Conversación en curso. NO saludes de nuevo. Simplemente responde a la pregunta del usuario de forma amigable y profesional.';
    }

    // Generate AI response
    let aiResponse = await generateAIResponse({
      message: text,
      conversationHistory: history,
      systemPrompt: systemMessage || 'Eres un asistente útil de WhatsApp. Responde de manera amigable, concisa y profesional en español.',
    });

    // Save user message and AI response to database
    await addMessage(conversationId, from, 'user', text);
    await addMessage(conversationId, from, 'assistant', aiResponse);

    // Split long messages (WhatsApp limit: 1024 chars for interactive messages with buttons)
    const MAX_LENGTH_WITH_BUTTONS = 1024;
    const MAX_LENGTH_WITHOUT_BUTTONS = 4096; // WhatsApp text message limit
    const shouldShowHelpButton = !isNewConversation && history.length > 4;

    if (aiResponse.length > MAX_LENGTH_WITH_BUTTONS && shouldShowHelpButton) {
      // Split message into chunks
      const chunks: string[] = [];
      let remaining = aiResponse;
      
      while (remaining.length > 0) {
        if (remaining.length <= MAX_LENGTH_WITH_BUTTONS) {
          chunks.push(remaining);
          break;
        }
        
        // Find a good breaking point (paragraph, sentence, or word)
        let breakPoint = MAX_LENGTH_WITH_BUTTONS;
        const lastParagraph = remaining.lastIndexOf('\n\n', breakPoint);
        const lastNewline = remaining.lastIndexOf('\n', breakPoint);
        const lastPeriod = remaining.lastIndexOf('. ', breakPoint);
        const lastSpace = remaining.lastIndexOf(' ', breakPoint);
        
        if (lastParagraph > MAX_LENGTH_WITH_BUTTONS * 0.7) {
          breakPoint = lastParagraph + 2;
        } else if (lastNewline > MAX_LENGTH_WITH_BUTTONS * 0.7) {
          breakPoint = lastNewline + 1;
        } else if (lastPeriod > MAX_LENGTH_WITH_BUTTONS * 0.7) {
          breakPoint = lastPeriod + 2;
        } else if (lastSpace > MAX_LENGTH_WITH_BUTTONS * 0.7) {
          breakPoint = lastSpace + 1;
        }
        
        chunks.push(remaining.substring(0, breakPoint).trim());
        remaining = remaining.substring(breakPoint).trim();
      }
      
      // Send all chunks except the last one without buttons
      for (let i = 0; i < chunks.length - 1; i++) {
        await kapsoClient.sendMessage({
          to: from,
          message: chunks[i],
          phoneNumberId: phoneNumberId,
        });
        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Send last chunk with button
      await kapsoClient.sendMessage({
        to: from,
        message: chunks[chunks.length - 1],
        phoneNumberId: phoneNumberId,
        buttons: [{ id: 'ver_ayuda', title: '❓ Ayuda' }]
      });
    } else {
      // Send single message
      await kapsoClient.sendMessage({
        to: from,
        message: aiResponse,
        phoneNumberId: phoneNumberId,
        buttons: shouldShowHelpButton ? [
          { id: 'ver_ayuda', title: '❓ Ayuda' }
        ] : undefined
      });
    }

    console.log(`Sent response to ${from}: ${aiResponse.substring(0, 100)}...`);

    return NextResponse.json({
      status: 'success',
      messageId,
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook verification (if Kapso requires it)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verify token matches
  if (mode === 'subscribe' && token === process.env.KAPSO_WEBHOOK_SECRET) {
    console.log('Webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json(
    { error: 'Verification failed' },
    { status: 403 }
  );
}

// Made with Bob
