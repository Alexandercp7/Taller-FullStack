export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';

export interface WorkOrderItem {
	id: string;
	client: string;
	assignee: string;
	dueDate: string;
	priorityLabel: string;
	priorityVariant: BadgeVariant;
	statusLabel: string;
	statusVariant: BadgeVariant;
}

export interface NotificationItem {
	id: string;
	title: string;
	message: string;
	timeLabel: string;
	severityLabel: string;
	severityVariant: BadgeVariant;
}

export interface FinancialSummaryItem {
	id: string;
	title: string;
	amount: string;
	changeLabel: string;
	changeVariant: BadgeVariant;
	footnote: string;
}

export interface QuickAccessItem {
	id: string;
	title: string;
	description: string;
	icon: string;
	route: string;
}

export interface DashboardMockData {
	recentWorkOrders: WorkOrderItem[];
	notifications: NotificationItem[];
	financialSummary: FinancialSummaryItem[];
	quickAccess: QuickAccessItem[];
}
