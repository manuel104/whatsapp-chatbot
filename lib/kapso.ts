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
  phoneNumberId: string;
  type?: 'text' | 'image' | 'document' | 'interactive' | 'template';
  buttons?: Array<{
    id: string;
    title: string;
  }>;
  templateName?: string;
  templateLanguage?: string;
  templateComponents?: any[];
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
      baseURL: 'https://api.kapso.ai',
      headers: {
        'X-API-Key': this.apiKey,
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
   * Send a text message via WhatsApp using Kapso's Meta API format
   */
  async sendMessage({ to, message, phoneNumberId, type = 'text', buttons, templateName, templateLanguage = 'es', templateComponents }: SendMessageParams): Promise<any> {
    try {
      const endpoint = `/meta/whatsapp/v24.0/${phoneNumberId}/messages`;
      
      let payload: any;
      
      // Template message (for 24h+ window)
      if (type === 'template' && templateName) {
        payload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: templateLanguage
            },
            components: templateComponents || []
          }
        };
      }
      // If buttons are provided, use interactive message type
      else if (buttons && buttons.length > 0) {
        payload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: {
              text: message
            },
            action: {
              buttons: buttons.map(btn => ({
                type: 'reply',
                reply: {
                  id: btn.id,
                  title: btn.title
                }
              }))
            }
          }
        };
      } else {
        // Regular text message
        payload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: {
            body: message
          }
        };
      }
      
      console.log('Sending message to Kapso:');
      console.log('Endpoint:', endpoint);
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      const response = await this.client.post(endpoint, payload);
      
      console.log('Message sent successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error sending message via Kapso:', error.message);
      console.error('Status:', error.response?.status);
      console.error('Error response:', JSON.stringify(error.response?.data, null, 2));
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
   * Send typing indicator (WhatsApp Business API format)
   */
  async sendTypingIndicator(to: string, phoneNumberId: string): Promise<void> {
    try {
      const endpoint = `/meta/whatsapp/v24.0/${phoneNumberId}/messages`;
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
          body: '⏳' // Typing indicator emoji
        }
      };
      
      console.log('Sending typing indicator to:', to);
      await this.client.post(endpoint, payload);
    } catch (error) {
      console.error('Error sending typing indicator:', error);
      // Don't throw - typing indicator is not critical
    }
  }

  /**
   * Send "mark as read" status (WhatsApp Business API format)
   */
  async markMessageAsRead(messageId: string, phoneNumberId: string): Promise<void> {
    try {
      const endpoint = `/meta/whatsapp/v24.0/${phoneNumberId}/messages`;
      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      };
      
      console.log('Marking message as read:', messageId);
      await this.client.post(endpoint, payload);
    } catch (error) {
      console.error('Error marking message as read:', error);
      // Don't throw - read status is not critical
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
