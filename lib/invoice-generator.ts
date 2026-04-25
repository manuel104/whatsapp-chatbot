/**
 * Generador de facturas en PDF
 * Usa jsPDF para compatibilidad con entornos serverless
 */

import { jsPDF } from 'jspdf';
import { google } from 'googleapis';
import { Readable } from 'stream';
import type { CartItem } from '@/types/store';
import { getStoreData } from './google-sheets';

/**
 * Genera un PDF de factura usando jsPDF
 */
export async function generateInvoicePDF(
  orderId: string,
  customerName: string,
  customerPhone: string,
  items: CartItem[],
  total: number,
  paymentMethod: string
): Promise<Buffer> {
  try {
    console.log('Generating invoice for order', orderId);
    
    // Obtener información de la tienda
    const storeData = await getStoreData();
    const { nombre_tienda, direccion, telefono, email, simbolo_moneda } = storeData.storeInfo;
    
    // Crear documento PDF
    const doc = new jsPDF();
    
    let yPos = 20;
    
    // Encabezado de la tienda
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(nombre_tienda, 105, yPos, { align: 'center' });
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(direccion, 105, yPos, { align: 'center' });
    yPos += 5;
    doc.text(`Tel: ${telefono} | Email: ${email}`, 105, yPos, { align: 'center' });
    yPos += 15;
    
    // Línea separadora
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    // Título de factura
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA DE VENTA', 105, yPos, { align: 'center' });
    yPos += 10;
    
    // Información de la factura
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Factura No: ${orderId}`, 20, yPos);
    yPos += 6;
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 20, yPos);
    yPos += 10;
    
    // Datos del cliente
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE', 20, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${customerName}`, 20, yPos);
    yPos += 6;
    doc.text(`Teléfono: ${customerPhone}`, 20, yPos);
    yPos += 6;
    doc.text(`Método de pago: ${paymentMethod}`, 20, yPos);
    yPos += 10;
    
    // Línea separadora
    doc.line(20, yPos, 190, yPos);
    yPos += 8;
    
    // Encabezado de tabla de productos
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE PRODUCTOS', 20, yPos);
    yPos += 8;
    
    // Tabla de productos
    doc.setFont('helvetica', 'bold');
    doc.text('Producto', 20, yPos);
    doc.text('Cant.', 120, yPos);
    doc.text('Precio Unit.', 140, yPos);
    doc.text('Subtotal', 170, yPos);
    yPos += 6;
    
    doc.line(20, yPos, 190, yPos);
    yPos += 6;
    
    // Items
    doc.setFont('helvetica', 'normal');
    items.forEach(item => {
      const productName = item.product_name.length > 30 
        ? item.product_name.substring(0, 30) + '...' 
        : item.product_name;
      
      doc.text(productName, 20, yPos);
      doc.text(item.quantity.toString(), 120, yPos);
      doc.text(`${simbolo_moneda}${item.price.toLocaleString()}`, 140, yPos);
      doc.text(`${simbolo_moneda}${(item.price * item.quantity).toLocaleString()}`, 170, yPos);
      yPos += 6;
    });
    
    yPos += 4;
    doc.line(20, yPos, 190, yPos);
    yPos += 8;
    
    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', 140, yPos);
    doc.text(`${simbolo_moneda}${total.toLocaleString()}`, 170, yPos);
    yPos += 15;
    
    // Pie de página
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Gracias por su compra', 105, yPos, { align: 'center' });
    yPos += 6;
    doc.setFontSize(8);
    doc.text(`Factura generada el ${new Date().toLocaleString('es-CO')}`, 105, yPos, { align: 'center' });
    
    // Convertir a buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    console.log('Invoice PDF generated successfully');
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw error;
  }
}

/**
 * Sube el PDF a Google Drive y retorna el link público
 */
export async function uploadToGoogleDrive(
  pdfBuffer: Buffer,
  fileName: string
): Promise<string> {
  try {
    console.log('Uploading invoice to Google Drive:', fileName);
    
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    
    const drive = google.drive({ version: 'v3', auth });
    
    // Crear archivo en Drive
    const fileMetadata = {
      name: fileName,
      mimeType: 'application/pdf',
    };
    
    // Convertir Buffer a Stream para Google Drive API
    const bufferStream = Readable.from(pdfBuffer);
    
    const media = {
      mimeType: 'application/pdf',
      body: bufferStream,
    };
    
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });
    
    const fileId = file.data.id;
    
    if (!fileId) {
      throw new Error('Failed to get file ID from Google Drive');
    }
    
    // Hacer el archivo público
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
    
    // Generar link de descarga
    const fileUrl = `https://drive.google.com/file/d/${fileId}/view`;
    
    console.log('Invoice uploaded successfully:', fileUrl);
    return fileUrl;
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
}

/**
 * Genera factura y la sube a Google Drive
 */
export async function generateAndUploadInvoice(
  orderId: string,
  customerName: string,
  customerPhone: string,
  items: CartItem[],
  total: number,
  paymentMethod: string
): Promise<string> {
  try {
    // Generar PDF
    const pdfBuffer = await generateInvoicePDF(
      orderId,
      customerName,
      customerPhone,
      items,
      total,
      paymentMethod
    );
    
    // Nombre del archivo
    const fileName = `Factura_${orderId}_${Date.now()}.pdf`;
    
    // Subir a Google Drive
    const fileUrl = await uploadToGoogleDrive(pdfBuffer, fileName);
    
    return fileUrl;
  } catch (error) {
    console.error('Error generating and uploading invoice:', error);
    throw error;
  }
}

// Made with Bob
