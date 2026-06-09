import Expo from 'expo-server-sdk';
import { NotificationSender, NotificationMessage } from '../../application/ports/services/notification-sender.port';

export class ExpoPushAdapter implements NotificationSender {
  readonly channel = 'push';
  private expo: Expo;

  constructor() {
    this.expo = new Expo();
  }

  async send(to: string, message: NotificationMessage): Promise<void> {
    if (!Expo.isExpoPushToken(to)) {
      throw new Error(`Token inválido: ${to}`);
    }

    const chunks = this.expo.chunkPushNotifications([
      {
        to,
        title: message.subject,
        body: message.body,
        data: message.data,
      },
    ]);

    for (const chunk of chunks) {
      await this.expo.sendPushNotificationsAsync(chunk);
    }
  }
}
