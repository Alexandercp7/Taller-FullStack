import { Routes } from '@angular/router';
import { authGuard, loggedOutGuard, permissionGuard } from './core/auth/auth.guards';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'login',
	},
	{
		path: 'login',
		canActivate: [loggedOutGuard],
		loadComponent: () => import('./layouts/auth-layout'),
	},
	{
		path: 'settings',
		pathMatch: 'full',
		redirectTo: 'app/settings',
	},
	{
		path: 'app',
		canActivate: [authGuard],
		loadComponent: () => import('./layouts/main-layout'),
		children: [
			{
				path: '',
				pathMatch: 'full',
				redirectTo: 'dashboard',
			},
			{
				path: 'dashboard',
				loadComponent: () => import('./features/dashboard').then((m) => m.DashboardComponent),
			},
			{
				path: 'clientes-vehiculos',
				canActivate: [permissionGuard('clients.view')],
				loadComponent: () => import('./features/clients-vehicles').then((m) => m.ClientsVehiclesPageComponent),
			},
			{
				path: 'clientes-vehiculos/:id',
				canActivate: [permissionGuard('clients.view')],
				loadComponent: () => import('./features/clients-vehicles').then((m) => m.ClientDetailPageComponent),
			},
			{
				path: 'inventario',
				canActivate: [permissionGuard('inventory.view')],
				loadComponent: () => import('./features/inventory').then((m) => m.InventoryPageComponent),
			},
			{
				path: 'agenda-pagos',
				canActivate: [permissionGuard('finance.view')],
				loadComponent: () => import('./features/payments-agenda').then((m) => m.PaymentsAgendaPage),
			},
			{
				path: 'contactos-proveedores',
				canActivate: [permissionGuard('settings.manage')],
				loadComponent: () => import('./features/contacts').then((m) => m.ContactsPageComponent),
			},
			{
				path: 'lista-actividades',
				canActivate: [permissionGuard('work-orders.view')],
				loadComponent: () => import('./features/activities').then((m) => m.ActivitiesPageComponent),
			},
			{
				path: 'lista-precios',
				canActivate: [permissionGuard('settings.manage')],
				loadComponent: () => import('./features/prices').then((m) => m.PricesPageComponent),
			},
			{
				path: 'kpis',
				canActivate: [permissionGuard('finance.view')],
				loadComponent: () => import('./features/kpis').then((m) => m.KpisDashboardComponent),
			},
			{
				path: 'finanzas-reportes',
				canActivate: [permissionGuard('finance.view')],
				loadComponent: () => import('./features/finanzas').then((m) => m.FinancesPageComponent),
			},
			{
				path: 'ordenes-trabajo',
				canActivate: [permissionGuard('work-orders.view')],
				loadComponent: () => import('./features/work-orders').then((m) => m.WorkOrdersPageComponent),
			},
			{
				path: 'ordenes-trabajo/:id',
				canActivate: [permissionGuard('work-orders.view')],
				loadComponent: () => import('./features/work-orders').then((m) => m.WorkOrderDetailPageComponent),
			},
			{
				path: 'settings',
				loadComponent: () => import('./features/settings').then((m) => m.SettingsPageComponent),
			},
		],
	},
	{
		path: 'portal',
		loadComponent: () => import('./layouts/portal-layout'),
		children: [
			{
				path: '',
				pathMatch: 'full',
				loadComponent: () => import('./features/client-portal').then((m) => m.PortalLookupPage),
			},
			{
				path: ':token',
				loadComponent: () => import('./features/client-portal').then((m) => m.PortalOrderDetailPage),
			},
		],
	},
	{ path: '**', redirectTo: 'login' },
];
