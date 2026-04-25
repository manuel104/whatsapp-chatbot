import { neon } from '@neondatabase/serverless';
import type { CartItem } from '@/types/store';

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
  contact_name?: string;
  started_at: Date;
  last_message_at: Date;
  message_count: number;
}

export interface Cart {
  id: number;
  conversation_id: string;
  phone_number: string;
  items: CartItem[];
  created_at: Date;
  updated_at: Date;
  expires_at: Date;
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
        contact_name TEXT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        message_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true
      )
    `;

    // Add contact_name column if it doesn't exist (migration for existing tables)
    try {
      await sql`
        ALTER TABLE conversations
        ADD COLUMN IF NOT EXISTS contact_name TEXT
      `;
      console.log('Migration: contact_name column added/verified');
    } catch (migrationError) {
      // Column might already exist, ignore error
      console.log('Migration: contact_name column already exists or error:', migrationError);
    }

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

    // Create carts table
    await sql`
      CREATE TABLE IF NOT EXISTS carts (
        id SERIAL PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        phone_number TEXT NOT NULL,
        items JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        UNIQUE(conversation_id)
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

    await sql`
      CREATE INDEX IF NOT EXISTS idx_carts_conversation
      ON carts(conversation_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_carts_expires
      ON carts(expires_at)
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
export async function getOrCreateConversation(phoneNumber: string, contactName?: string): Promise<{ id: string; isNew: boolean; wasInactive: boolean; contactName?: string }> {
  try {
    // Session timeout: 10 minutes for testing (change to 60 * 60 * 1000 for 1 hour in production)
    const SESSION_TIMEOUT = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes
    
    // Check for active conversation
    const result = await sql`
      SELECT id, message_count, last_message_at, contact_name FROM conversations
      WHERE phone_number = ${phoneNumber} AND is_active = true
      ORDER BY last_message_at DESC
      LIMIT 1
    `;

    if (result.length > 0) {
      const lastMessageAt = new Date(result[0].last_message_at);
      const isInactive = lastMessageAt < SESSION_TIMEOUT;
      
      // Update contact name if provided and different
      if (contactName && contactName !== result[0].contact_name) {
        await sql`
          UPDATE conversations
          SET contact_name = ${contactName}
          WHERE id = ${result[0].id}
        `;
      }
      
      // If conversation is inactive (>10 minutes), delete it and create new one
      if (isInactive) {
        console.log(`Conversation ${result[0].id} inactive for >10 minutes, deleting and creating new one`);
        
        await sql`
          DELETE FROM conversations
          WHERE id = ${result[0].id}
        `;
        
        // Create new conversation
        const conversationId = `conv_${phoneNumber}_${Date.now()}`;
        await sql`
          INSERT INTO conversations (id, phone_number, contact_name)
          VALUES (${conversationId}, ${phoneNumber}, ${contactName})
        `;
        
        return { id: conversationId, isNew: true, wasInactive: true, contactName };
      }
      
      return {
        id: result[0].id,
        isNew: result[0].message_count === 0,
        wasInactive: false,
        contactName: result[0].contact_name || contactName
      };
    }

    // Create new conversation
    const conversationId = `conv_${phoneNumber}_${Date.now()}`;
    await sql`
      INSERT INTO conversations (id, phone_number, contact_name)
      VALUES (${conversationId}, ${phoneNumber}, ${contactName})
    `;

    return { id: conversationId, isNew: true, wasInactive: false, contactName };
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    throw error;
  }
}

/**
 * Start a new conversation (deletes current one and creates new)
 */
export async function startNewConversation(phoneNumber: string, contactName?: string): Promise<string> {
  try {
    // Delete all active conversations and their messages for this phone number
    await sql`
      DELETE FROM conversations
      WHERE phone_number = ${phoneNumber} AND is_active = true
    `;

    // Create new conversation
    const conversationId = `conv_${phoneNumber}_${Date.now()}`;
    await sql`
      INSERT INTO conversations (id, phone_number, contact_name)
      VALUES (${conversationId}, ${phoneNumber}, ${contactName})
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


/**
 * Get cart for a conversation
 */
export async function getCart(conversationId: string): Promise<CartItem[]> {
  try {
    const result = await sql`
      SELECT items FROM carts
      WHERE conversation_id = ${conversationId}
      AND expires_at > CURRENT_TIMESTAMP
    `;

    if (result.length === 0) {
      return [];
    }

    return result[0].items as CartItem[];
  } catch (error) {
    console.error('Error getting cart:', error);
    throw error;
  }
}

/**
 * Add item to cart
 */
export async function addToCart(
  conversationId: string,
  phoneNumber: string,
  item: CartItem,
  expirationMinutes: number = 30
): Promise<void> {
  try {
    // Get current cart
    const currentItems = await getCart(conversationId);
    
    // Check if item already exists
    const existingItemIndex = currentItems.findIndex(i => i.product_id === item.product_id);
    
    let updatedItems: CartItem[];
    if (existingItemIndex >= 0) {
      // Update quantity
      updatedItems = [...currentItems];
      updatedItems[existingItemIndex].quantity += item.quantity;
    } else {
      // Add new item
      updatedItems = [...currentItems, item];
    }

    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    // Upsert cart
    await sql`
      INSERT INTO carts (conversation_id, phone_number, items, expires_at)
      VALUES (${conversationId}, ${phoneNumber}, ${JSON.stringify(updatedItems)}, ${expiresAt})
      ON CONFLICT (conversation_id)
      DO UPDATE SET
        items = ${JSON.stringify(updatedItems)},
        updated_at = CURRENT_TIMESTAMP,
        expires_at = ${expiresAt}
    `;

    console.log(`Added ${item.quantity}x ${item.product_name} to cart for ${conversationId}`);
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

/**
 * Update item quantity in cart
 */
export async function updateCartItemQuantity(
  conversationId: string,
  productId: string,
  quantity: number
): Promise<void> {
  try {
    const currentItems = await getCart(conversationId);
    
    let updatedItems: CartItem[];
    if (quantity <= 0) {
      // Remove item
      updatedItems = currentItems.filter(i => i.product_id !== productId);
    } else {
      // Update quantity
      updatedItems = currentItems.map(i =>
        i.product_id === productId ? { ...i, quantity } : i
      );
    }

    await sql`
      UPDATE carts
      SET items = ${JSON.stringify(updatedItems)},
          updated_at = CURRENT_TIMESTAMP
      WHERE conversation_id = ${conversationId}
    `;

    console.log(`Updated cart item ${productId} quantity to ${quantity}`);
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(
  conversationId: string,
  productId: string
): Promise<void> {
  try {
    await updateCartItemQuantity(conversationId, productId, 0);
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
}

/**
 * Clear cart
 */
export async function clearCart(conversationId: string): Promise<void> {
  try {
    await sql`
      DELETE FROM carts
      WHERE conversation_id = ${conversationId}
    `;

    console.log(`Cleared cart for ${conversationId}`);
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
}

/**
 * Get cart total
 */
export async function getCartTotal(conversationId: string): Promise<number> {
  try {
    const items = await getCart(conversationId);
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  } catch (error) {
    console.error('Error calculating cart total:', error);
    throw error;
  }
}

/**
 * Clean expired carts (run periodically)
 */
export async function cleanExpiredCarts(): Promise<number> {
  try {
    const result = await sql`
      DELETE FROM carts
      WHERE expires_at < CURRENT_TIMESTAMP
    `;

    const deletedCount = result.length;
    if (deletedCount > 0) {
      console.log(`Cleaned ${deletedCount} expired carts`);
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning expired carts:', error);
    throw error;
  }
}


// Made with Bob