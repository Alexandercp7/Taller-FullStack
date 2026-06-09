import twilio from 'twilio';
import { NotificationSender, NotificationMessage } from '../../application/ports/services/notification-sender.port';
import { env } from '../config/env';

export class TwilioWhatsAppAdapter implements NotificationSender {
  readonly channel = 'whatsapp';
  private client: twilio.Twilio;

  constructor() {
    this.client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  }

  async send(to: string, message: NotificationMessage): Promise<void> {
    const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    await this.client.messages.create({
      body: message.body,
      from: env.TWILIO_WHATSAPP_FROM,
      to: toNumber,
    });
  }
}
