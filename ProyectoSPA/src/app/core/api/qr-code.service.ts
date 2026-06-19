import { Injectable } from '@angular/core';
import type { QRCodeConfig } from 'beautiful-qr-code';

/**
 * Generates QR code image URLs for shareable links.
 */
@Injectable({ providedIn: 'root' })
export class QrCodeService {
  private readonly _baseUrl = 'https://api.qrserver.com/v1/create-qr-code/';

  getQrUrl(data: string, size = 200, options: { color?: string; background?: string; margin?: number } = {}): string {
    const encoded = encodeURIComponent(data);
    const color = this.normalizeHex(options.color ?? '#111827');
    const background = this.normalizeHex(options.background ?? '#ffffff');
    const margin = options.margin ?? 12;
    return `${this._baseUrl}?size=${size}x${size}&format=svg&ecc=H&margin=${margin}&color=${color}&bgcolor=${background}&data=${encoded}`;
  }

  private normalizeHex(value: string): string {
    return value.replace('#', '');
  }

  async getStyledQrDataUrl(data: string, options: Partial<QRCodeConfig> = {}): Promise<string> {
    const { QRCodeStyling } = await import('beautiful-qr-code');
    const qrCode = new QRCodeStyling({
      data,
      type: 'svg',
      errorCorrectionLevel: 'H',
      radius: 0.9,
      padding: 2,
      foregroundColor: '#111827',
      backgroundColor: 'transparent',
      ...options,
    });
    const svg = await qrCode.getSVG();
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }
}
