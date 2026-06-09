import { Injectable } from '@angular/core';

/**
 * Generates QR code image URLs for shareable links.
 */
@Injectable({ providedIn: 'root' })
export class QrCodeService {
  private readonly _baseUrl = 'https://api.qrserver.com/v1/create-qr-code/';

  getQrUrl(data: string, size = 200): string {
    const encoded = encodeURIComponent(data);
    return `${this._baseUrl}?size=${size}x${size}&data=${encoded}`;
  }
}
