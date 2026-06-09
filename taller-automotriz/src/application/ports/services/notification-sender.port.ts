export interface NotificationMessage {
  subject?: string;
  body: string;
  templateId?: string;
  data?: Record<string, unknown>;
}

export interface NotificationSender {
  send(to: string, message: NotificationMessage): Promise<void>;
  readonly channel: string;
}
