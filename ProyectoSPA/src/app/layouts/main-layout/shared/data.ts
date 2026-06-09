export interface NavItem {
	title: string;
	url: string;
	icon: string;
	exact?: boolean;
	/** Roles that can see this item. Absent = visible to all authenticated users. */
	roles?: string[];
}

export interface NavSection {
	label: string;
	items: NavItem[];
}

const MANAGEMENT  = ['ADMIN', 'MANAGER'];
const OPERATIONS  = ['ADMIN', 'TECHNICIAN', 'RECEPTIONIST'];
const TECH_ONLY   = ['ADMIN', 'TECHNICIAN'];
const RECEP_ONLY  = ['ADMIN', 'RECEPTIONIST'];

export const navMainSections: NavSection[] = [
	{
		label: 'Operacion',
		items: [
			{ title: 'Dashboard',           url: '/app/dashboard',           icon: 'lucideSquareTerminal', exact: true },
			{ title: 'Ordenes de trabajo',  url: '/app/ordenes-trabajo',     icon: 'lucideBookOpen',       roles: OPERATIONS },
			{ title: 'Clientes y vehiculos',url: '/app/clientes-vehiculos',  icon: 'lucideUsers',          roles: RECEP_ONLY },
			{ title: 'Inventario',          url: '/app/inventario',          icon: 'lucidePackageSearch',  roles: TECH_ONLY },
			{ title: 'Lista de actividades',url: '/app/lista-actividades',   icon: 'lucideMap' },
		],
	},
	{
		label: 'Gestion',
		items: [
			{ title: 'Agenda de pagos',     url: '/app/agenda-pagos',            icon: 'lucideReceiptText', roles: MANAGEMENT },
			{ title: 'Proveedores',         url: '/app/contactos-proveedores',   icon: 'lucideBadgeCheck',  roles: MANAGEMENT },
			{ title: 'Lista de precios',    url: '/app/lista-precios',           icon: 'lucideCreditCard',  roles: MANAGEMENT },
			{ title: 'KPIs',               url: '/app/kpis',                    icon: 'lucideChartPie',    roles: MANAGEMENT },
			{ title: 'Finanzas y reportes', url: '/app/finanzas-reportes',       icon: 'lucideSettings2',   roles: MANAGEMENT },
		],
	},
];

export const navSecondary: never[] = [];
