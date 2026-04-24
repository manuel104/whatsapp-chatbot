import { NextRequest, NextResponse } from 'next/server';
import { getKapsoClient } from '@/lib/kapso';
import { generateAIResponse } from '@/lib/ai';

// Store conversation history in memory (for production, use a database)
const conversationHistory = new Map<string, Array<{ role: 'user' | 'assistant'; content: string }>>();

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
    
    // Handle WhatsApp Business API format (Meta/Facebook)
    if (payload.object === 'whatsapp_business_account') {
      console.log('Processing WhatsApp Business API webhook');
      
      // Extract message from WhatsApp Business API format
      const entry = payload.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages?.[0];
      
      if (!messages) {
        console.log('No messages in payload');
        return NextResponse.json({ status: 'no_messages' });
      }
      
      from = messages.from;
      messageId = messages.id;
      const type = messages.type;
      text = messages.text?.body || '';
      
      console.log(`Message type: ${type}, from: ${from}`);
      
      // Only process text messages
      if (type !== 'text' || !text) {
        console.log(`Ignoring non-text message of type: ${type}`);
        return NextResponse.json({ status: 'ignored' });
      }
    } else {
      // Handle old Kapso format (fallback)
      from = payload.from;
      text = payload.text;
      messageId = payload.messageId;
      const type = payload.type;
      
      if (type !== 'text' || !text) {
        return NextResponse.json({ status: 'ignored' });
      }
    }

    console.log(`Received message from ${from}: ${text}`);

    // Send typing indicator
    await kapsoClient.sendTypingIndicator(from);

    // Mark message as read
    await kapsoClient.markAsRead(messageId);

    // Get or initialize conversation history for this user
    let history = conversationHistory.get(from) || [];
    
    // Limit history to last 10 messages to avoid token limits
    if (history.length > 10) {
      history = history.slice(-10);
    }

    // Generate AI response
    const aiResponse = await generateAIResponse({
      message: text,
      conversationHistory: history,
    });

    // Update conversation history
    history.push(
      { role: 'user', content: text },
      { role: 'assistant', content: aiResponse }
    );
    conversationHistory.set(from, history);

    // Send response back via Kapso
    await kapsoClient.sendMessage({
      to: from,
      message: aiResponse,
    });

    console.log(`Sent response to ${from}: ${aiResponse}`);

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
