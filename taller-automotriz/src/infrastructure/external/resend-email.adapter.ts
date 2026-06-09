import { Resend } from 'resend';
import { NotificationSender, NotificationMessage } from '../../application/ports/services/notification-sender.port';
import { env } from '../config/env';

export class ResendEmailAdapter implements NotificationSender {
  readonly channel = 'email';
  private resend: Resend;

  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY);
  }

  async send(to: string, message: NotificationMessage): Promise<void> {
    await this.resend.emails.send({
      from: env.RESEND_FROM,
      to,
      subject: message.subject ?? 'Notificación - Taller Automotriz',
      text: message.body,
    });
  }
}
