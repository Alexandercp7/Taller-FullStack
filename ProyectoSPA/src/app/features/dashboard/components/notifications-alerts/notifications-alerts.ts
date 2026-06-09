import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmCardImports } from '@spartan-ng/helm/card';
import type { NotificationItem } from '../../models/dashboard.models';

@Component({
	selector: 'spartan-notifications-alerts',
	imports: [HlmCardImports, HlmBadgeImports],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './notifications-alerts.html',
	styleUrl: './notifications-alerts.css',
})
export class NotificationsAlertsComponent {
	public readonly items = input.required<NotificationItem[]>();
}
