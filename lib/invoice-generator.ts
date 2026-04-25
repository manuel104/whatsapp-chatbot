/**
 * Generador de facturas en PDF y almacenamiento en Google Drive
 */

import PDFDocument from 'pdfkit';
import { google } from 'googleapis';
import { Readable } from 'stream';
import type { CartItem } from '@/types/store';
import { getStoreData } from './google-sheets';

/**
 * Genera una factura en PDF
 */
export async function generateInvoicePDF(
  orderId: string,
  customerName: string,
  customerPhone: string,
  items: CartItem[],
  total: number,
  paymentMethod: string
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const storeData = await getStoreData();
      const { nombre_tienda, direccion, telefono, email, simbolo_moneda } = storeData.storeInfo;
      
      // Crear documento PDF
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      
      // Capturar el PDF en memoria
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      // Encabezado
      doc.fontSize(20).text(nombre_tienda, { align: 'center' });
      doc.fontSize(10).text(direccion, { align: 'center' });
      doc.text(`Tel: ${telefono} | Email: ${email}`, { align: 'center' });
      doc.moveDown();
      
      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
      
      // Información de la factura
      doc.fontSize(16).text('FACTURA DE VENTA', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(10);
      doc.text(`Factura No: ${orderId}`, 50, doc.y);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 400, doc.y - 12);
      doc.moveDown();
      
      // Información del cliente
      doc.fontSize(12).text('DATOS DEL CLIENTE', { underline: true });
      doc.fontSize(10);
      doc.text(`Nombre: ${customerName}`);
      doc.text(`Teléfono: ${customerPhone}`);
      doc.text(`Método de pago: ${paymentMethod}`);
      doc.moveDown();
      
      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
      
      // Tabla de productos
      doc.fontSize(12).text('DETALLE DE PRODUCTOS', { underline: true });
      doc.moveDown(0.5);
      
      // Encabezados de tabla
      const tableTop = doc.y;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Producto', 50, tableTop);
      doc.text('Cant.', 300, tableTop);
      doc.text('Precio Unit.', 360, tableTop);
      doc.text('Subtotal', 470, tableTop);
      
      // Línea debajo de encabezados
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
      
      // Productos
      doc.font('Helvetica');
      let yPosition = tableTop + 25;
      
      items.forEach((item) => {
        const subtotal = item.price * item.quantity;
        
        doc.text(item.product_name, 50, yPosition, { width: 240 });
        doc.text(item.quantity.toString(), 300, yPosition);
        doc.text(`${simbolo_moneda}${item.price.toLocaleString()}`, 360, yPosition);
        doc.text(`${simbolo_moneda}${subtotal.toLocaleString()}`, 470, yPosition);
        
        yPosition += 25;
      });
      
      // Línea antes del total
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 15;
      
      // Total
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('TOTAL:', 360, yPosition);
      doc.text(`${simbolo_moneda}${total.toLocaleString()}`, 470, yPosition);
      
      doc.moveDown(2);
      
      // Pie de página
      doc.fontSize(8).font('Helvetica');
      doc.text('Gracias por su compra', { align: 'center' });
      doc.text(`Factura generada el ${new Date().toLocaleString('es-CO')}`, { align: 'center' });
      
      // Finalizar PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Sube un archivo PDF a Google Drive
 */
export async function uploadToGoogleDrive(
  pdfBuffer: Buffer,
  fileName: string
): Promise<string> {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });
    
    // Crear un stream desde el buffer
    const bufferStream = new Readable();
    bufferStream.push(pdfBuffer);
    bufferStream.push(null);
    
    // Subir archivo
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: 'application/pdf',
      },
      media: {
        mimeType: 'application/pdf',
        body: bufferStream,
      },
      fields: 'id, webViewLink, webContentLink',
    });
    
    const fileId = response.data.id;
    
    // Hacer el archivo público (opcional)
    await drive.permissions.create({
      fileId: fileId!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
    
    // Obtener link de descarga
    const file = await drive.files.get({
      fileId: fileId!,
      fields: 'webContentLink',
    });
    
    console.log(`File uploaded to Google Drive: ${fileId}`);
    return file.data.webContentLink || `https://drive.google.com/file/d/${fileId}/view`;
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
    console.log(`Generating invoice for order ${orderId}`);
    
    // Generar PDF
    const pdfBuffer = await generateInvoicePDF(
      orderId,
      customerName,
      customerPhone,
      items,
      total,
      paymentMethod
    );
    
    console.log(`PDF generated, size: ${pdfBuffer.length} bytes`);
    
    // Subir a Google Drive
    const fileName = `Factura_${orderId}_${Date.now()}.pdf`;
    const driveUrl = await uploadToGoogleDrive(pdfBuffer, fileName);
    
    console.log(`Invoice uploaded to Drive: ${driveUrl}`);
    
    return driveUrl;
  } catch (error) {
    console.error('Error generating and uploading invoice:', error);
    throw error;
  }
}

// Made with Bob
