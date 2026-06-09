import { Injectable, signal } from '@angular/core';
import { toast } from '@spartan-ng/brain/sonner';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface Notification {
	id: string;
	message: string;
	type: NotificationType;
	timestamp: Date;
}

/**
 * Manages in-app toast notifications and a small local notification log.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
	private readonly _notifications = signal<Notification[]>([]);
	public readonly notifications = this._notifications.asReadonly();

	/** Shows a success notification. */
	public success(message: string): void {
		this.addNotification(message, 'success');
		toast.success(message);
	}

	/** Shows an informational notification. */
	public info(message: string): void {
		this.addNotification(message, 'info');
		toast.info(message);
	}

	/** Shows a warning notification. */
	public warning(message: string): void {
		this.addNotification(message, 'warning');
		toast.warning(message);
	}

	/** Shows an error notification. */
	public error(message: string): void {
		this.addNotification(message, 'error');
		toast.error(message);
	}

	/** Stores the notification in the local reactive history. */
	private addNotification(message: string, type: NotificationType): void {
		const notification: Notification = {
			id: `notif-${Date.now()}`,
			message,
			type,
			timestamp: new Date(),
		};
		this._notifications.update((notifs) => [notification, ...notifs].slice(0, 20));
	}

	/** Clears the notification history. */
	public clearNotifications(): void {
		this._notifications.set([]);
	}
}
