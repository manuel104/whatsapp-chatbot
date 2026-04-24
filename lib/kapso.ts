import axios, { AxiosInstance } from 'axios';

interface KapsoMessage {
  from: string;
  to: string;
  text: string;
  timestamp: number;
  messageId: string;
}

interface SendMessageParams {
  to: string;
  message: string;
  type?: 'text' | 'image' | 'document';
}

class KapsoClient {
  private client: AxiosInstance;
  private apiKey: string;
  private webhookSecret: string;

  constructor() {
    this.apiKey = process.env.KAPSO_API_KEY || '';
    this.webhookSecret = process.env.KAPSO_WEBHOOK_SECRET || '';
    
    if (!this.apiKey) {
      throw new Error('KAPSO_API_KEY is not configured');
    }

    this.client = axios.create({
      baseURL: process.env.KAPSO_API_URL || 'https://api.kapso.com',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  /**
   * Verify webhook signature for security
   */
  verifyWebhook(signature: string, payload: string): boolean {
    // Implement signature verification based on Kapso's documentation
    // This is a placeholder - adjust according to Kapso's actual verification method
    return signature === this.webhookSecret;
  }

  /**
   * Send a text message via WhatsApp using WhatsApp Business API format
   */
  async sendMessage({ to, message, type = 'text' }: SendMessageParams): Promise<any> {
    try {
      // WhatsApp Business API format
      const response = await this.client.post('/v1/messages', {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: message
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error sending message via Kapso:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.client.post('/v1/messages/read', {
        messageId,
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(to: string): Promise<void> {
    try {
      await this.client.post('/v1/messages/typing', {
        to,
        typing: true,
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }
}

// Singleton instance
let kapsoClient: KapsoClient | null = null;

export function getKapsoClient(): KapsoClient {
  if (!kapsoClient) {
    kapsoClient = new KapsoClient();
  }
  return kapsoClient;
}

export type { KapsoMessage, SendMessageParams };

// Made with Bob
