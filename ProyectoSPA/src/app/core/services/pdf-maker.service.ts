import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Provides a small wrapper around jsPDF and autoTable for PDF exports.
 */
@Injectable({ providedIn: 'root' })
export class PdfMakerService {
  /** Creates a portrait A4 PDF document. */
  create(): jsPDF {
    return new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  }

  /** Adds a styled table to an existing PDF document. */
  addTable(doc: jsPDF, options: Parameters<typeof autoTable>[1]): void {
    autoTable(doc, options);
  }
}
