import { Injectable, signal } from '@angular/core';
import { Payment } from '../../features/payments-agenda/models/payment.model';

declare var google: any;

// Reemplaza este valor con tu Client ID de Google Cloud Console
// Pasos: console.cloud.google.com → APIs → Credenciales → OAuth 2.0 → Aplicación Web
// Origenes JS autorizados: http://localhost:4200
const GOOGLE_CLIENT_ID = '80705178944-jgg86i7fbjogq5rpo960r3ftkehoicua.apps.googleusercontent.com';
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

/**
 * Coordinates Google Calendar OAuth and event export for payment reminders.
 */
@Injectable({ providedIn: 'root' })
export class GoogleCalendarService {
  private tokenClient: any = null;
  private accessToken: string | null = null;
  private resolveAuth: ((token: string) => void) | null = null;
  private rejectAuth: ((err: Error) => void) | null = null;

  readonly isAuthenticated = signal(false);

  /** Loads Google Identity Services on demand. */
  private loadGisScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.accounts) {
        resolve();
        return;
      }
      const existing = document.getElementById('gis-script');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        return;
      }
      const script = document.createElement('script');
      script.id = 'gis-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  /** Initializes the GIS token client once the SDK is available. */
  private async initialize(): Promise<void> {
    await this.loadGisScript();
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: CALENDAR_SCOPE,
      callback: (response: any) => {
        if (response.error) {
          this.rejectAuth?.(new Error(response.error));
          this.resolveAuth = null;
          this.rejectAuth = null;
          return;
        }
        if (response.access_token) {
          this.accessToken = response.access_token;
          this.isAuthenticated.set(true);
          this.resolveAuth?.(response.access_token);
          this.resolveAuth = null;
          this.rejectAuth = null;
        }
      },
    });
  }

  /** Ensures the user has a valid Google access token. */
  private async ensureAuthenticated(): Promise<string> {
    if (this.accessToken) return this.accessToken;

    if (!this.tokenClient) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.resolveAuth = resolve;
      this.rejectAuth = reject;
      this.tokenClient.requestAccessToken({ prompt: '' });
    });
  }

  /** Exports a single payment reminder into Google Calendar. */
  async exportPayment(payment: Payment): Promise<void> {
    const token = await this.ensureAuthenticated();
    await this.createEvent(token, payment);
  }

  /** Exports all pending payments and returns a success/failure summary. */
  async exportAllPendingPayments(payments: Payment[]): Promise<{ success: number; failed: number }> {
    const token = await this.ensureAuthenticated();
    const pending = payments.filter(p => p.estado !== 'Pagado');
    let success = 0;
    let failed = 0;

    for (const payment of pending) {
      try {
        await this.createEvent(token, payment);
        success++;
      } catch {
        failed++;
      }
    }

    return { success, failed };
  }

  /** Creates the calendar event payload and posts it to Google Calendar. */
  private async createEvent(token: string, payment: Payment): Promise<void> {
    const monto = payment.montoPresupuestado.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const description = [
      `Categoría: ${payment.categoria}`,
      `Tipo: ${payment.tipo}`,
      `Monto presupuestado: $${monto}`,
      payment.notas ? `Notas: ${payment.notas}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const event = {
      summary: `💳 Pago: ${payment.concepto}`,
      description,
      start: { date: payment.fechaVencimiento },
      end: { date: payment.fechaVencimiento },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 * 24 * 3 },
          { method: 'popup', minutes: 60 * 24 },
        ],
      },
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        this.accessToken = null;
        this.isAuthenticated.set(false);
      }
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message ?? `Error HTTP ${response.status}`);
    }
  }

  /** Revokes the current Google token and clears local authentication state. */
  signOut(): void {
    if (this.accessToken) {
      google.accounts.oauth2.revoke(this.accessToken, () => {});
    }
    this.accessToken = null;
    this.isAuthenticated.set(false);
  }
}
