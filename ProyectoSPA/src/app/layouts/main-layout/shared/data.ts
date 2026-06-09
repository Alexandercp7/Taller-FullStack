export interface NavItem {
	title: string;
	url: string;
	icon: string;
	exact?: boolean;
	permission?: string;
}

export interface NavSection {
	label: string;
	items: NavItem[];
}

export const navMainSections: NavSection[] = [
	{
		label: 'Operacion',
		items: [
			{ title: 'Dashboard', url: '/app/dashboard', icon: 'lucideSquareTerminal', exact: true },
			{ title: 'Ordenes de trabajo', url: '/app/ordenes-trabajo', icon: 'lucideBookOpen', permission: 'work-orders.view' },
			{ title: 'Clientes y vehiculos', url: '/app/clientes-vehiculos', icon: 'lucideUsers', permission: 'clients.view' },
			{ title: 'Inventario', url: '/app/inventario', icon: 'lucidePackageSearch', permission: 'inventory.view' },
			{ title: 'Lista de actividades', url: '/app/lista-actividades', icon: 'lucideMap', permission: 'work-orders.view' },
		],
	},
	{
		label: 'Gestion',
		items: [
			{ title: 'Agenda de pagos', url: '/app/agenda-pagos', icon: 'lucideReceiptText', permission: 'finance.view' },
			{ title: 'Proveedores', url: '/app/contactos-proveedores', icon: 'lucideBadgeCheck', permission: 'settings.manage' },
			{ title: 'Lista de precios', url: '/app/lista-precios', icon: 'lucideCreditCard', permission: 'settings.manage' },
			{ title: 'KPIs', url: '/app/kpis', icon: 'lucideChartPie', permission: 'finance.view' },
			{ title: 'Finanzas y reportes', url: '/app/finanzas-reportes', icon: 'lucideSettings2', permission: 'finance.view' },
		],
	},
];

export const navSecondary: never[] = [];
