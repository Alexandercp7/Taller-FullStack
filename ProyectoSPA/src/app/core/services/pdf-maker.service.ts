import { Injectable } from '@angular/core';
import type jsPDF from 'jspdf';
import type autoTable from 'jspdf-autotable';

@Injectable({ providedIn: 'root' })
export class PdfMakerService {
  async create(): Promise<jsPDF> {
    const { default: JsPDF } = await import('jspdf');
    return new JsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  }

  async addTable(doc: jsPDF, options: Parameters<typeof autoTable>[1]): Promise<void> {
    const { default: autoTableFn } = await import('jspdf-autotable');
    autoTableFn(doc, options);
  }
}
