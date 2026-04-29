import { NextRequest, NextResponse } from 'next/server';
import { getKapsoClient } from '@/lib/kapso';
import { generateAIResponse, extractTextFromImage } from '@/lib/ai';
import {
  getOrCreateConversation,
  startNewConversation,
  addMessage,
  getConversationHistory,
  initDatabase,
  getCart,
  addToCart,
  clearCart,
  getCartTotal,
  createPendingOrder,
  getPendingOrder,
  updateOrderStatus,
  markOrderAsNotified
} from '@/lib/db';
import { getStoreData, searchProducts, getProductsByCategory, recordSale, updateSaleStatus } from '@/lib/google-sheets';
import {
  detectIntent,
  generateMainMenu,
  formatProductList,
  formatCart,
  processAddToCart,
  getMainMenuButtons,
  getCategoryButtons,
  getCartButtons,
  getPaymentButtons
} from '@/lib/store-helpers';
import {
  notifyAdminNewOrder,
  notifyCustomerOrderStatus,
  parseAdminResponse,
  isAdminPhone
} from '@/lib/admin-notifications';
import {
  sendPendingOrdersList,
  parseAdminCommand,
  sendAdminHelp,
  generateAdminMenu,
  getAdminMenuButtons
} from '@/lib/admin-helpers';
import { generateAndUploadInvoice } from '@/lib/invoice-generator';

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
    let imageMediaId: string | undefined;
    let hasImage = false;
    
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
      
      // Handle text, interactive button responses, and images
      if (type === 'text') {
        text = messages.text?.body || '';
      } else if (type === 'interactive') {
        // Button response
        const buttonReply = messages.interactive?.button_reply;
        text = buttonReply?.id || buttonReply?.title || '';
        console.log(`Button clicked: ${text}`);
      } else if (type === 'image') {
        // Image message - extract media ID and caption
        imageMediaId = messages.image?.id;
        text = messages.image?.caption || 'Imagen recibida';
        hasImage = true;
        console.log(`Image received with media ID: ${imageMediaId}`);
      } else {
        text = '';
      }
      
      console.log(`Message type: ${type}, from: ${from}, phone_number_id: ${phoneNumberId}`);
      
      if (!phoneNumberId) {
        console.error('Missing phone_number_id in webhook payload');
        return NextResponse.json({ status: 'error', message: 'Missing phone_number_id' }, { status: 400 });
      }
      
      // Process text, interactive, and image messages
      if ((type !== 'text' && type !== 'interactive' && type !== 'image') || (!text && !hasImage)) {
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

    // Handle image messages with OCR
    if (hasImage && imageMediaId) {
      console.log('Processing image message with OCR...');
      
      try {
        // Send typing indicator
        await kapsoClient.sendTypingIndicator(from, phoneNumberId);
        
        // Download the image
        console.log('Downloading image from WhatsApp...');
        const imageDataUrl = await kapsoClient.downloadMedia(imageMediaId, phoneNumberId);
        
        // Extract text from image using OCR
        console.log('Extracting text from image...');
        const extractedText = await extractTextFromImage(imageDataUrl);
        
        // Get or create conversation
        const conversation = await getOrCreateConversation(from, contactName);
        
        // Save user message (image caption or default text)
        await addMessage(conversation.id, from, 'user', `[Imagen] ${text}`);
        
        // Format response with extracted text
        const responseText = `📸 *Texto extraído de la imagen:*\n\n${extractedText}`;
        
        // Send response
        await kapsoClient.sendMessage({
          to: from,
          message: responseText,
          phoneNumberId: phoneNumberId,
        });
        
        // Save bot response
        await addMessage(conversation.id, from, 'assistant', responseText);
        
        console.log('OCR processing completed successfully');
        return NextResponse.json({
          status: 'success',
          action: 'ocr_processed',
          extractedText
        });
        
      } catch (error) {
        console.error('Error processing image with OCR:', error);
        
        // Send error message to user
        await kapsoClient.sendMessage({
          to: from,
          message: '❌ Lo siento, hubo un error al procesar la imagen. Por favor, intenta de nuevo.',
          phoneNumberId: phoneNumberId,
        });
        
        return NextResponse.json({
          status: 'error',
          message: 'OCR processing failed'
        }, { status: 500 });
      }
    }

    // Load store data
    const storeData = await getStoreData();
    
    // Check if this is an admin message
    const isAdmin = await isAdminPhone(from);
    if (isAdmin) {
      console.log('Admin detected:', from);
      
      // Check for admin commands first (PEDIDOS, AYUDA, etc.)
      const adminCommand = parseAdminCommand(text);
      
      if (adminCommand.command === 'LIST_PENDING') {
        await sendPendingOrdersList(from, phoneNumberId);
        return NextResponse.json({ status: 'success', action: 'list_pending_orders' });
      }
      
      if (adminCommand.command === 'HELP') {
        await sendAdminHelp(from, phoneNumberId);
        return NextResponse.json({ status: 'success', action: 'admin_help' });
      }
      
      // Check for admin button presses
      const command = text.toLowerCase().trim();
      if (command === 'admin_pedidos') {
        await sendPendingOrdersList(from, phoneNumberId);
        return NextResponse.json({ status: 'success', action: 'list_pending_orders' });
      }
      
      if (command === 'admin_ayuda') {
        await sendAdminHelp(from, phoneNumberId);
        return NextResponse.json({ status: 'success', action: 'admin_help' });
      }
      
      // Check for approve/reject button presses (approve_ORD123 or reject_ORD123)
      if (command.startsWith('approve_') || command.startsWith('reject_')) {
        const action = command.startsWith('approve_') ? 'APPROVE' : 'REJECT';
        const orderId = command.replace('approve_', '').replace('reject_', '');
        
        console.log(`Admin button pressed: ${action} for order ${orderId}`);
        
        // Get the pending order
        const order = await getPendingOrder(orderId);
        
        if (!order) {
          await kapsoClient.sendMessage({
            to: from,
            message: `❌ No se encontró el pedido ${orderId}`,
            phoneNumberId: phoneNumberId,
          });
          return NextResponse.json({ status: 'success', action: 'order_not_found' });
        }
        
        if (order.status !== 'PENDING') {
          await kapsoClient.sendMessage({
            to: from,
            message: `⚠️ El pedido ${orderId} ya fue procesado (${order.status})`,
            phoneNumberId: phoneNumberId,
          });
          return NextResponse.json({ status: 'success', action: 'order_already_processed' });
        }
        
        // Update order status
        const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        await updateOrderStatus(orderId, newStatus);
        
        // If approved, generate invoice first
        let invoiceUrl = '';
        if (newStatus === 'APPROVED') {
          try {
            // Generate invoice PDF and upload to Google Drive
            console.log('Generating invoice...');
            invoiceUrl = await generateAndUploadInvoice(
              orderId,
              order.contact_name,
              order.phone_number,
              order.items,
              order.total,
              order.payment_method
            );
            console.log('Invoice generated:', invoiceUrl);
            
            // Update sale status in Google Sheets to COMPLETADA with invoice URL
            await updateSaleStatus(orderId, 'COMPLETADA', invoiceUrl);
            console.log(`Sale ${orderId} updated to COMPLETADA in Google Sheets`);
          } catch (error) {
            console.error('Error generating/uploading invoice:', error);
            // Continue even if invoice fails
          }
        } else {
          // If rejected, update sale status in Google Sheets
          try {
            await updateSaleStatus(orderId, 'RECHAZADA');
            console.log(`Sale ${orderId} updated to RECHAZADA in Google Sheets`);
          } catch (error) {
            console.error('Error updating rejected sale status:', error);
          }
        }
        
        // Confirm to admin with SI/NO + ORDER_ID format
        const confirmMessage = newStatus === 'APPROVED'
          ? `✅ SI ${orderId}

Pedido APROBADO

El cliente ha sido notificado.
La venta fue registrada.
${invoiceUrl ? `Factura generada y enviada.` : 'Factura enviada al cliente.'}`
          : `❌ NO ${orderId}

Pedido RECHAZADO

El cliente ha sido notificado.`;
        
        await kapsoClient.sendMessage({
          to: from,
          message: confirmMessage,
          phoneNumberId: phoneNumberId,
        });
        
        return NextResponse.json({ status: 'success', action: 'order_processed_via_button', newStatus, invoiceUrl });
      }
      
      // Check for admin response (SI/NO + ORDER_ID) - mantener compatibilidad con texto
      const adminResponse = parseAdminResponse(text);
      
      if (adminResponse.action && adminResponse.orderId) {
        // Get the pending order
        const order = await getPendingOrder(adminResponse.orderId);
        
        if (!order) {
          await kapsoClient.sendMessage({
            to: from,
            message: `❌ No se encontró el pedido ${adminResponse.orderId}`,
            phoneNumberId: phoneNumberId,
          });
          return NextResponse.json({ status: 'success', action: 'order_not_found' });
        }
        
        if (order.status !== 'PENDING') {
          await kapsoClient.sendMessage({
            to: from,
            message: `⚠️ El pedido ${adminResponse.orderId} ya fue procesado (${order.status})`,
            phoneNumberId: phoneNumberId,
          });
          return NextResponse.json({ status: 'success', action: 'order_already_processed' });
        }
        
        // Update order status
        const newStatus = adminResponse.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        await updateOrderStatus(adminResponse.orderId, newStatus);
        
        // If approved, generate invoice first
        let invoiceUrl = '';
        if (newStatus === 'APPROVED') {
          try {
            // Generate invoice PDF and upload to Google Drive
            console.log('Generating invoice...');
            invoiceUrl = await generateAndUploadInvoice(
              adminResponse.orderId,
              order.contact_name,
              order.phone_number,
              order.items,
              order.total,
              order.payment_method
            );
            console.log('Invoice generated:', invoiceUrl);
            
            // Update sale status in Google Sheets to COMPLETADA with invoice URL
            await updateSaleStatus(adminResponse.orderId, 'COMPLETADA', invoiceUrl);
            console.log(`Sale ${adminResponse.orderId} updated to COMPLETADA in Google Sheets`);
          } catch (error) {
            console.error('Error generating/uploading invoice:', error);
            // Continue even if invoice fails
          }
        } else {
          // If rejected, update sale status in Google Sheets
          try {
            await updateSaleStatus(adminResponse.orderId, 'RECHAZADA');
            console.log(`Sale ${adminResponse.orderId} updated to RECHAZADA in Google Sheets`);
          } catch (error) {
            console.error('Error updating rejected sale status:', error);
          }
        }
        
        // Notify customer with invoice URL if approved
        await notifyCustomerOrderStatus(
          order.phone_number,
          order.contact_name,
          adminResponse.orderId,
          newStatus,
          phoneNumberId,
          invoiceUrl || undefined
        );
        
        // Confirm to admin with SI/NO + ORDER_ID format
        const confirmMessage = newStatus === 'APPROVED'
          ? `✅ SI ${adminResponse.orderId}

Pedido APROBADO

El cliente ha sido notificado.
La venta fue registrada.
${invoiceUrl ? `Factura generada y enviada.` : 'Factura enviada al cliente.'}`
          : `❌ NO ${adminResponse.orderId}

Pedido RECHAZADO

El cliente ha sido notificado.`;
        
        await kapsoClient.sendMessage({
          to: from,
          message: confirmMessage,
          phoneNumberId: phoneNumberId,
        });
        
        return NextResponse.json({ status: 'success', action: 'order_processed', newStatus, invoiceUrl });
      }
      
      // If admin sends any other message (not a command), show admin menu
      console.log('Admin sent generic message, showing admin menu');
      const adminMenuText = await generateAdminMenu(contactName);
      const adminButtons = getAdminMenuButtons();
      
      await kapsoClient.sendMessage({
        to: from,
        message: adminMenuText,
        phoneNumberId: phoneNumberId,
        buttons: adminButtons
      });
      
      return NextResponse.json({ status: 'success', action: 'show_admin_menu' });
    }
    
    // Check for commands (both / commands and button IDs)
    const command = text.toLowerCase().trim();
    
    // Handle store-specific button commands
    if (command === 'ver_productos' || command === 'menu' || command === 'inicio') {
      // Get or create conversation to save the interaction
      const conversation = await getOrCreateConversation(from, contactName);
      
      // Save user action
      await addMessage(conversation.id, from, 'user', text);
      
      // Generate menu WITHOUT greeting (includeGreeting = false)
      // Only include greeting if it's a new conversation
      const menuText = generateMainMenu(storeData, conversation.contactName, conversation.isNew);
      const buttons = getMainMenuButtons(storeData);
      
      await kapsoClient.sendMessage({
        to: from,
        message: menuText,
        phoneNumberId: phoneNumberId,
        buttons: buttons.slice(0, 3) // WhatsApp limit: 3 buttons
      });
      
      // Save bot response
      await addMessage(conversation.id, from, 'assistant', menuText);
      
      return NextResponse.json({ status: 'success', action: 'show_menu' });
    }
    
    if (command === 'ver_carrito') {
      const conversation = await getOrCreateConversation(from, contactName);
      
      // Save user action
      await addMessage(conversation.id, from, 'user', text);
      
      const cartItems = await getCart(conversation.id);
      const cartText = formatCart(cartItems, storeData);
      const buttons = cartItems.length > 0 ? getCartButtons() : [];
      
      await kapsoClient.sendMessage({
        to: from,
        message: cartText,
        phoneNumberId: phoneNumberId,
        buttons: buttons.slice(0, 3)
      });
      
      // Save bot response
      await addMessage(conversation.id, from, 'assistant', cartText);
      
      return NextResponse.json({ status: 'success', action: 'show_cart' });
    }
    
    if (command === 'vaciar_carrito') {
      const conversation = await getOrCreateConversation(from, contactName);
      
      // Save user action
      await addMessage(conversation.id, from, 'user', text);
      
      await clearCart(conversation.id);
      
      const responseText = '🗑️ Carrito vaciado';
      await kapsoClient.sendMessage({
        to: from,
        message: responseText,
        phoneNumberId: phoneNumberId,
      });
      
      // Save bot response
      await addMessage(conversation.id, from, 'assistant', responseText);
      
      return NextResponse.json({ status: 'success', action: 'clear_cart' });
    }
    
    if (command.startsWith('cat_')) {
      const conversation = await getOrCreateConversation(from, contactName);
      
      // Save user action
      await addMessage(conversation.id, from, 'user', text);
      
      const category = command.replace('cat_', '');
      const products = await getProductsByCategory(category);
      const productsText = formatProductList(products, storeData);
      
      const responseText = `📦 *${category.toUpperCase()}*\n\n${productsText}\n\n💡 Para agregar: "agregar P001"`;
      await kapsoClient.sendMessage({
        to: from,
        message: responseText,
        phoneNumberId: phoneNumberId,
      });
      
      // Save bot response
      await addMessage(conversation.id, from, 'assistant', responseText);
      
      return NextResponse.json({ status: 'success', action: 'show_category' });
    }
    
    if (command.startsWith('pago_')) {
      const conversation = await getOrCreateConversation(from, contactName);
      
      // Save user action
      await addMessage(conversation.id, from, 'user', text);
      
      const paymentId = command.replace('pago_', '');
      const paymentMethod = storeData.paymentMethods.find(p => p.id === paymentId);
      
      if (paymentMethod) {
        // Get cart items and total
        const cartItems = await getCart(conversation.id);
        const total = await getCartTotal(conversation.id);
        
        // Check if payment method requires admin confirmation
        const requiresConfirmation = ['nequi', 'bancolombia', 'efectivo'].includes(paymentId.toLowerCase());
        
        if (requiresConfirmation && cartItems.length > 0) {
          // Create pending order in database
          const orderId = await createPendingOrder(
            conversation.id,
            from,
            conversation.contactName || 'Cliente',
            cartItems,
            total,
            paymentMethod.nombre
          );
          
          // Record pending sale in Google Sheets with the orderId
          const productsString = cartItems.map(item => `${item.product_id}x${item.quantity}`).join(',');
          await recordSale({
            id_venta: orderId, // ← Use orderId as sale ID
            fecha: new Date().toISOString(),
            cliente_tel: from,
            cliente_nombre: conversation.contactName || 'Cliente',
            productos: productsString,
            total: total,
            estado: 'PENDIENTE',
            factura_url: '', // Will be added when approved
          });
          
          console.log(`Pending sale recorded in Google Sheets with ID: ${orderId}`);
          
          // Notify admin
          await notifyAdminNewOrder(
            orderId,
            from,
            conversation.contactName || 'Cliente',
            cartItems,
            total,
            paymentMethod.nombre,
            phoneNumberId
          );
          
          // Mark as notified
          await markOrderAsNotified(orderId);
          
          // Clear cart
          await clearCart(conversation.id);
          
          const responseText = `✅ *Pedido Recibido*

Tu pedido *${orderId}* ha sido recibido y está pendiente de confirmación.

💳 *Método de pago:* ${paymentMethod.nombre}
💰 *Total:* ${storeData.storeInfo.simbolo_moneda}${total.toLocaleString()}

📋 *Instrucciones:*
${paymentMethod.instrucciones}

⏳ Un administrador revisará tu pedido y te confirmará en breve.

¡Gracias por tu compra! 🎉`;
          
          await kapsoClient.sendMessage({
            to: from,
            message: responseText,
            phoneNumberId: phoneNumberId,
          });
          
          // Save bot response
          await addMessage(conversation.id, from, 'assistant', responseText);
        } else {
          // Payment method doesn't require confirmation or cart is empty
          const responseText = `💳 *${paymentMethod.nombre}*\n\n${paymentMethod.instrucciones}`;
          await kapsoClient.sendMessage({
            to: from,
            message: responseText,
            phoneNumberId: phoneNumberId,
          });
          
          // Save bot response
          await addMessage(conversation.id, from, 'assistant', responseText);
        }
      }
      
      return NextResponse.json({ status: 'success', action: 'show_payment' });
    }
    
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
        // Show help - WITH buttons
        const response = `🤖 *Comandos disponibles:*

📱 *Tienda:*
• Ver productos
• Ver carrito
• Buscar [producto]
• Agregar [código]

💬 *General:*
• /nueva - Nueva conversación
• /ayuda - Esta ayuda`;
        
        console.log('Sending help message with buttons');
        
        try {
          await kapsoClient.sendMessage({
            to: from,
            message: response,
            phoneNumberId: phoneNumberId,
            buttons: [
              { id: 'ver_productos', title: '🛍️ Productos' },
              { id: 'ver_carrito', title: '🛒 Carrito' },
              { id: 'nueva_conversacion', title: '✨ Nueva' }
            ]
          });
          console.log('Help message sent successfully with buttons');
        } catch (error) {
          console.error('Error sending help message with buttons:', error);
          // Fallback: send without buttons
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

    // Detect user intent
    const intent = detectIntent(text);
    console.log('Detected intent:', intent.intent);
    
    // Handle specific intents
    if (intent.intent === 'menu') {
      const menuText = generateMainMenu(storeData);
      const buttons = getMainMenuButtons(storeData);
      
      await kapsoClient.sendMessage({
        to: from,
        message: menuText,
        phoneNumberId: phoneNumberId,
        buttons: buttons.slice(0, 3)
      });
      
      return NextResponse.json({ status: 'success', action: 'show_menu' });
    }
    
    if (intent.intent === 'view_cart') {
      const cartItems = await getCart(conversationId);
      const cartText = formatCart(cartItems, storeData);
      const buttons = cartItems.length > 0 ? getCartButtons() : [];
      
      await kapsoClient.sendMessage({
        to: from,
        message: cartText,
        phoneNumberId: phoneNumberId,
        buttons: buttons.slice(0, 3)
      });
      
      return NextResponse.json({ status: 'success', action: 'show_cart' });
    }
    
    if (intent.intent === 'add_to_cart') {
      await kapsoClient.sendTypingIndicator(from, phoneNumberId);
      
      const result = await processAddToCart(text, conversationId, from);
      
      await kapsoClient.sendMessage({
        to: from,
        message: result.message,
        phoneNumberId: phoneNumberId,
        buttons: result.success ? [
          { id: 'ver_carrito', title: '🛒 Ver carrito' },
          { id: 'seguir_comprando', title: '🛍️ Seguir' }
        ] : undefined
      });
      
      return NextResponse.json({ status: 'success', action: 'add_to_cart' });
    }
    
    if (intent.intent === 'search' && intent.data?.query) {
      await kapsoClient.sendTypingIndicator(from, phoneNumberId);
      
      const products = await searchProducts(intent.data.query);
      const productsText = formatProductList(products, storeData);
      
      await kapsoClient.sendMessage({
        to: from,
        message: `🔍 *Resultados para "${intent.data.query}"*\n\n${productsText}\n\n💡 Para agregar: "agregar P001"`,
        phoneNumberId: phoneNumberId,
      });
      
      return NextResponse.json({ status: 'success', action: 'search' });
    }
    
    if (intent.intent === 'category' && intent.data?.category) {
      await kapsoClient.sendTypingIndicator(from, phoneNumberId);
      
      const products = await getProductsByCategory(intent.data.category);
      const productsText = formatProductList(products, storeData);
      
      await kapsoClient.sendMessage({
        to: from,
        message: `📦 *${intent.data.category.toUpperCase()}*\n\n${productsText}\n\n💡 Para agregar: "agregar P001"`,
        phoneNumberId: phoneNumberId,
      });
      
      return NextResponse.json({ status: 'success', action: 'show_category' });
    }
    
    if (intent.intent === 'checkout') {
      const cartItems = await getCart(conversationId);
      
      if (cartItems.length === 0) {
        await kapsoClient.sendMessage({
          to: from,
          message: storeData.messages.carrito_vacio,
          phoneNumberId: phoneNumberId,
        });
        return NextResponse.json({ status: 'success', action: 'empty_cart' });
      }
      
      const cartText = formatCart(cartItems, storeData);
      const buttons = getPaymentButtons(storeData);
      
      await kapsoClient.sendMessage({
        to: from,
        message: `${cartText}\n\n${storeData.messages.selecciona_pago}`,
        phoneNumberId: phoneNumberId,
        buttons: buttons.slice(0, 3)
      });
      
      return NextResponse.json({ status: 'success', action: 'checkout' });
    }

    // Send typing indicator to show the bot is processing
    await kapsoClient.sendTypingIndicator(from, phoneNumberId);
    console.log('Typing indicator sent');

    // Get conversation history from database (last 10 messages)
    const history = await getConversationHistory(conversationId, 10);

    // Build enhanced system message with store context
    let systemMessage = `Eres un asistente de ventas para ${storeData.storeInfo.nombre_tienda}.

INFORMACIÓN DE LA TIENDA:
- Horario: ${storeData.storeInfo.horario}
- Envío gratis desde: ${storeData.storeInfo.simbolo_moneda}${storeData.storeInfo.envio_gratis_min.toLocaleString()}
- Tiempo de entrega: ${storeData.storeInfo.tiempo_entrega}

PRODUCTOS DISPONIBLES:
${storeData.products.slice(0, 10).map(p => `- ${p.nombre} (${p.id}): ${storeData.storeInfo.simbolo_moneda}${p.precio.toLocaleString()}`).join('\n')}

INSTRUCCIONES:
- Ayuda al cliente a encontrar productos
- Responde preguntas sobre la tienda
- Sé amigable, profesional y conciso
- Si el cliente busca un producto, sugiere opciones relevantes
- Para agregar al carrito, el cliente debe escribir "agregar [código]"
`;

    // Add greeting for new conversations or reactivated sessions
    if (isNewConversation) {
      if (wasInactive) {
        // Session reactivated after inactivity
        systemMessage += savedContactName
          ? `\n\nLa sesión anterior expiró. Esta es una nueva conversación. El nombre del usuario es "${savedContactName}". Agradece brevemente por volver y responde su pregunta.`
          : '\n\nLa sesión anterior expiró. Esta es una nueva conversación. Agradece brevemente por volver y responde su pregunta.';
      } else {
        // Brand new conversation - first message from user
        systemMessage += savedContactName
          ? `\n\nEsta es una nueva conversación. El nombre del usuario es "${savedContactName}". Saluda brevemente usando su nombre y responde su pregunta.`
          : '\n\nEsta es una nueva conversación. Saluda brevemente y responde su pregunta.';
      }
    } else if (savedContactName) {
      // Ongoing conversation - NO greeting, just use name naturally
      systemMessage += `\n\nEl nombre del usuario es "${savedContactName}". NO saludes de nuevo. Responde usando su nombre naturalmente cuando sea apropiado.`;
    } else {
      // Ongoing conversation without name
      systemMessage += '\n\nConversación en curso. NO saludes de nuevo. Responde directamente.';
    }

    // Generate AI response
    let aiResponse = await generateAIResponse({
      message: text,
      conversationHistory: history,
      systemPrompt: systemMessage,
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
