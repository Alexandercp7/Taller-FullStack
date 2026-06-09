import { router } from './trpc';
import { createAuthRouter } from '../routers/auth.router';
import { createOrdersRouter } from '../routers/orders.router';
import { createInventoryRouter } from '../routers/inventory.router';
import { createClientsRouter } from '../routers/clients.router';
import { createFinanceRouter } from '../routers/finance.router';
import { createReceptionRouter } from '../routers/reception.router';
import { createPortalRouter } from '../routers/portal.router';
import { createTasksRouter } from '../routers/tasks.router';
import { createVehiclesRouter } from '../routers/vehicles.router';
import { createUsersRouter } from '../routers/users.router';
import { createKpisRouter } from '../routers/kpis.router';
import { createPricesRouter } from '../routers/prices.router';
import { createContactsRouter } from '../routers/contacts.router';
import { createActivitiesRouter } from '../routers/activities.router';
import { createPaymentsAgendaRouter } from '../routers/payments-agenda.router';
import type { Container } from '../../infrastructure/di/container';

export function createAppRouter(container: Container) {
  return router({
    auth: createAuthRouter(container),
    orders: createOrdersRouter(container),
    inventory: createInventoryRouter(container),
    clients: createClientsRouter(container),
    finance: createFinanceRouter(container),
    reception: createReceptionRouter(container),
    portal: createPortalRouter(container),
    tasks: createTasksRouter(container),
    vehicles: createVehiclesRouter(container),
    users: createUsersRouter(container),
    kpis: createKpisRouter(container),
    prices: createPricesRouter(container),
    contacts: createContactsRouter(container),
    activities: createActivitiesRouter(container),
    paymentsAgenda: createPaymentsAgendaRouter(container),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
