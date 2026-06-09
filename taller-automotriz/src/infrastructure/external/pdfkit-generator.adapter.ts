import PDFDocument from 'pdfkit';
import { PDFGenerator } from '../../application/ports/services/pdf-generator.port';
import { WorkOrder } from '../../domain/entities/work-order.entity';
import { Quote } from '../../domain/entities/quote.entity';

export class PDFKitGeneratorAdapter implements PDFGenerator {
  async generateQuotePDF(order: WorkOrder, quote: Quote, clientName: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text('COTIZACIÓN', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Orden: ${order.code}`);
      doc.text(`Cliente: ${clientName}`);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`);
      doc.moveDown();

      doc.text(`Problema reportado: ${order.problem}`);
      doc.moveDown();

      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      doc.fontSize(10);
      doc.text(`Subtotal: ${quote.subtotal.toString()}`);
      doc.text(`IVA (16%): ${quote.tax.toString()}`);
      doc.fontSize(12).text(`Total: ${quote.total.toString()}`, { bold: true });

      doc.end();
    });
  }
}
