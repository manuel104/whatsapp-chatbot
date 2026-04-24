import { neon } from '@neondatabase/serverless';

// Initialize Neon client
const sql = neon(process.env.DATABASE_URL || '');

export interface Message {
  id: number;
  conversation_id: string;
  phone_number: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: Date;
}

export interface Conversation {
  id: string;
  phone_number: string;
  started_at: Date;
  last_message_at: Date;
  message_count: number;
}

/**
 * Initialize database tables
 */
export async function initDatabase() {
  try {
    // Create conversations table
    await sql`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        phone_number TEXT NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        message_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true
      )
    `;

    // Create messages table
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        phone_number TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create index for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_conversations_phone 
      ON conversations(phone_number, is_active)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation 
      ON messages(conversation_id, created_at)
    `;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Get or create active conversation for a phone number
 * Returns conversation ID and whether it's new
 * Automatically closes conversations inactive for more than 1 hour
 */
export async function getOrCreateConversation(phoneNumber: string): Promise<{ id: string; isNew: boolean; wasInactive: boolean }> {
  try {
    // Session timeout: 10 minutes for testing (change to 60 * 60 * 1000 for 1 hour in production)
    const SESSION_TIMEOUT = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes
    
    // Check for active conversation
    const result = await sql`
      SELECT id, message_count, last_message_at FROM conversations
      WHERE phone_number = ${phoneNumber} AND is_active = true
      ORDER BY last_message_at DESC
      LIMIT 1
    `;

    if (result.length > 0) {
      const lastMessageAt = new Date(result[0].last_message_at);
      const isInactive = lastMessageAt < SESSION_TIMEOUT;
      
      // If conversation is inactive (>10 minutes), close it and create new one
      if (isInactive) {
        console.log(`Conversation ${result[0].id} inactive for >10 minutes, closing and creating new one`);
        
        await sql`
          UPDATE conversations
          SET is_active = false
          WHERE id = ${result[0].id}
        `;
        
        // Create new conversation
        const conversationId = `conv_${phoneNumber}_${Date.now()}`;
        await sql`
          INSERT INTO conversations (id, phone_number)
          VALUES (${conversationId}, ${phoneNumber})
        `;
        
        return { id: conversationId, isNew: true, wasInactive: true };
      }
      
      return {
        id: result[0].id,
        isNew: result[0].message_count === 0,
        wasInactive: false
      };
    }

    // Create new conversation
    const conversationId = `conv_${phoneNumber}_${Date.now()}`;
    await sql`
      INSERT INTO conversations (id, phone_number)
      VALUES (${conversationId}, ${phoneNumber})
    `;

    return { id: conversationId, isNew: true, wasInactive: false };
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    throw error;
  }
}

/**
 * Start a new conversation (deletes current one and creates new)
 */
export async function startNewConversation(phoneNumber: string): Promise<string> {
  try {
    // Delete all active conversations and their messages for this phone number
    await sql`
      DELETE FROM conversations
      WHERE phone_number = ${phoneNumber} AND is_active = true
    `;

    // Create new conversation
    const conversationId = `conv_${phoneNumber}_${Date.now()}`;
    await sql`
      INSERT INTO conversations (id, phone_number)
      VALUES (${conversationId}, ${phoneNumber})
    `;

    console.log(`Started new conversation ${conversationId} for ${phoneNumber} (previous deleted)`);
    return conversationId;
  } catch (error) {
    console.error('Error starting new conversation:', error);
    throw error;
  }
}

/**
 * Add message to conversation
 */
export async function addMessage(
  conversationId: string,
  phoneNumber: string,
  role: 'user' | 'assistant' | 'system',
  content: string
): Promise<void> {
  try {
    // Insert message
    await sql`
      INSERT INTO messages (conversation_id, phone_number, role, content)
      VALUES (${conversationId}, ${phoneNumber}, ${role}, ${content})
    `;

    // Update conversation last_message_at and message_count
    await sql`
      UPDATE conversations 
      SET last_message_at = CURRENT_TIMESTAMP,
          message_count = message_count + 1
      WHERE id = ${conversationId}
    `;
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
}

/**
 * Get conversation history (last N messages)
 */
export async function getConversationHistory(
  conversationId: string,
  limit: number = 10
): Promise<Array<{ role: 'user' | 'assistant' | 'system'; content: string }>> {
  try {
    const result = await sql`
      SELECT role, content 
      FROM messages 
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    // Reverse to get chronological order
    return result.reverse().map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content
    }));
  } catch (error) {
    console.error('Error getting conversation history:', error);
    throw error;
  }
}


// Made with Bob