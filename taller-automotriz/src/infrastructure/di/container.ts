import { getPrismaClient } from '../persistence/prisma/prisma.client';
import { getRedis } from '../config/redis';
import { env } from '../config/env';

// Repositories
import { PrismaOrderRepository } from '../persistence/repositories/prisma-order.repository';
import { PrismaClientRepository } from '../persistence/repositories/prisma-client.repository';
import { PrismaVehicleRepository } from '../persistence/repositories/prisma-vehicle.repository';
import { PrismaInventoryRepository } from '../persistence/repositories/prisma-inventory.repository';
import { PrismaStockMovementRepository } from '../persistence/repositories/prisma-stock-movement.repository';
import { PrismaUserRepository } from '../persistence/repositories/prisma-user.repository';
import { PrismaTimelineRepository } from '../persistence/repositories/prisma-timeline.repository';
import { PrismaPhotoRepository } from '../persistence/repositories/prisma-photo.repository';
import { PrismaNoteRepository } from '../persistence/repositories/prisma-note.repository';
import { PrismaCashEntryRepository } from '../persistence/repositories/prisma-cash-entry.repository';
import { PrismaAccountReceivableRepository } from '../persistence/repositories/prisma-account-receivable.repository';
import { PrismaSupplierRepository } from '../persistence/repositories/prisma-supplier.repository';
import { PrismaScheduledPaymentRepository } from '../persistence/repositories/prisma-scheduled-payment.repository';

// Infra
import { PrismaUnitOfWork } from '../persistence/prisma/prisma-unit-of-work';
import { BullMQDomainEventDispatcher } from '../events/bullmq-domain-event-dispatcher';
import { Argon2HasherAdapter } from '../external/argon2-hasher.adapter';
import { JWTTokenProviderAdapter } from '../external/jwt-token-provider.adapter';
import { RedisCacheAdapter } from '../external/redis-cache.adapter';
import { BullMQJobQueueAdapter } from '../queue/bullmq-job-queue.adapter';
import { S3FileStorageAdapter } from '../external/s3-file-storage.adapter';
import { PDFKitGeneratorAdapter } from '../external/pdfkit-generator.adapter';
import { NHTSAVinDecoderAdapter } from '../external/nhtsa-vin-decoder.adapter';

// In-memory services
import { InMemoryKpiService } from './in-memory-kpi.service';
import { InMemoryPriceService } from './in-memory-price.service';
import { InMemoryActivityService } from './in-memory-activity.service';

// Use cases — Auth
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/refresh-token.use-case';
import { ChangePasswordUseCase } from '../../application/use-cases/auth/change-password.use-case';

// Use cases — Users
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case';
import { ListUsersUseCase } from '../../application/use-cases/users/list-users.use-case';
import { AssignPermissionsUseCase } from '../../application/use-cases/users/assign-permissions.use-case';

// Use cases — Orders
import { CreateOrderUseCase } from '../../application/use-cases/orders/create-order.use-case';
import { ListOrdersUseCase } from '../../application/use-cases/orders/list-orders.use-case';
import { GetOrderDetailUseCase } from '../../application/use-cases/orders/get-order-detail.use-case';
import { ChangeOrderStatusUseCase } from '../../application/use-cases/orders/change-order-status.use-case';
import { CloseOrderUseCase } from '../../application/use-cases/orders/close-order.use-case';
import { DeleteOrderUseCase } from '../../application/use-cases/orders/delete-order.use-case';
import { RevertOrderPhaseUseCase } from '../../application/use-cases/orders/revert-order-phase.use-case';
import { ShareOrderPortalUseCase } from '../../application/use-cases/orders/share-order-portal.use-case';
import { AddNoteToOrderUseCase } from '../../application/use-cases/orders/add-note-to-order.use-case';

// Use cases — Reception
import { RegisterIntakeCausesUseCase } from '../../application/use-cases/reception/register-intake-causes.use-case';
import { UploadPhotosUseCase } from '../../application/use-cases/reception/upload-intake-photos.use-case';

// Use cases — Inventory
import { AssignPartToOrderUseCase } from '../../application/use-cases/inventory/assign-part-to-order.use-case';
import { CreateInventoryItemUseCase } from '../../application/use-cases/inventory/create-inventory-item.use-case';
import { SearchInventoryUseCase } from '../../application/use-cases/inventory/search-inventory.use-case';
import { RegisterStockMovementUseCase } from '../../application/use-cases/inventory/register-stock-movement.use-case';
import { UpdateInventoryItemUseCase } from '../../application/use-cases/inventory/update-inventory-item.use-case';
import { DeleteInventoryItemUseCase } from '../../application/use-cases/inventory/delete-inventory-item.use-case';
import { GetMovementHistoryUseCase } from '../../application/use-cases/inventory/get-movement-history.use-case';

// Use cases — Quotation
import { CalculateQuoteTotalUseCase } from '../../application/use-cases/quotation/calculate-quote-total.use-case';
import { GenerateQuotePDFUseCase } from '../../application/use-cases/quotation/generate-quote-pdf.use-case';

// Use cases — Clients
import { ListClientsUseCase } from '../../application/use-cases/clients/list-clients.use-case';
import { CreateClientUseCase } from '../../application/use-cases/clients/create-client.use-case';
import { DeleteClientUseCase } from '../../application/use-cases/clients/delete-client.use-case';
import { UpsertClientUseCase } from '../../application/use-cases/clients/upsert-client.use-case';
import { GetClientDetailUseCase } from '../../application/use-cases/clients/get-client-detail.use-case';

// Use cases — Vehicles
import { ListVehiclesUseCase } from '../../application/use-cases/vehicles/list-vehicles.use-case';
import { CreateVehicleUseCase } from '../../application/use-cases/vehicles/create-vehicle.use-case';
import { UpdateVehicleUseCase } from '../../application/use-cases/vehicles/update-vehicle.use-case';
import { DeleteVehicleUseCase } from '../../application/use-cases/vehicles/delete-vehicle.use-case';
import { DecodeVinUseCase } from '../../application/use-cases/vehicles/decode-vin.use-case';
import { CheckRecallsUseCase } from '../../application/use-cases/vehicles/check-recalls.use-case';

// Use cases — Finance
import { RegisterCashEntryUseCase } from '../../application/use-cases/finance/register-cash-entry.use-case';
import { RegisterARPaymentUseCase } from '../../application/use-cases/finance/register-ar-payment.use-case';
import { GetFinancialReportsUseCase } from '../../application/use-cases/finance/get-financial-reports.use-case';
import { ListCashEntriesUseCase } from '../../application/use-cases/finance/list-cash-entries.use-case';
import { ListAccountsReceivableUseCase } from '../../application/use-cases/finance/list-accounts-receivable.use-case';
import { GetComparativeReportUseCase } from '../../application/use-cases/finance/get-comparative-report.use-case';

// Use cases — Contacts
import { ListContactsUseCase } from '../../application/use-cases/contacts/list-contacts.use-case';
import { CreateContactUseCase } from '../../application/use-cases/contacts/create-contact.use-case';
import { UpdateContactUseCase } from '../../application/use-cases/contacts/update-contact.use-case';
import { DeleteContactUseCase } from '../../application/use-cases/contacts/delete-contact.use-case';

// Use cases — Scheduled Payments
import { ListScheduledPaymentsUseCase } from '../../application/use-cases/payments/list-scheduled-payments.use-case';
import { CreateScheduledPaymentUseCase } from '../../application/use-cases/payments/create-scheduled-payment.use-case';
import { UpdateScheduledPaymentUseCase } from '../../application/use-cases/payments/update-scheduled-payment.use-case';
import { DeleteScheduledPaymentUseCase } from '../../application/use-cases/payments/delete-scheduled-payment.use-case';

// Use cases — Quality / Tasks / KPIs / Portal
import { SubmitSurveyUseCase } from '../../application/use-cases/quality/submit-survey.use-case';
import { ManageTasksUseCase } from '../../application/use-cases/tasks/manage-tasks.use-case';
import { GetKPIsUseCase } from '../../application/use-cases/kpis/get-kpis.use-case';
import { GetOrderByTokenUseCase } from '../../application/use-cases/portal/get-order-by-token.use-case';

// Stub repos not yet implemented with Prisma
class StubQuoteRepository {
  async findById() { return null; }
  async findByOrderId() { return []; }
  async save() {}
  async delete() {}
}

class StubPriceListRepository {
  async findById() { return null; }
  async findAll() { return []; }
  async findByVehicleType() { return []; }
  async save() {}
  async delete() {}
}

class StubChecklistRepository {
  async findByOrderId() { return []; }
  async save() {}
  async saveMany() {}
  async toggle() {}
  async delete() {}
}

class StubSurveyRepository {
  async findByOrderId() { return null; }
  async save(data: any) { return { ...data, id: 'stub', submittedAt: new Date() }; }
}

class StubRecallChecker {
  async check() { return []; }
}

class StubAccountPayableRepository {
  async findById() { return null; }
  async findBySupplierId() { return []; }
  async findOverdue() { return []; }
  async save() {}
  async savePayment() {}
}

class StubTaskRepository {
  async findById() { return null; }
  async findByFilters() { return { data: [], total: 0, page: 1, pageSize: 20 }; }
  async save() {}
  async delete() {}
}

export function createContainer() {
  const prisma = getPrismaClient();
  const redis = getRedis();

  // Core services (initialized first — used by UnitOfWork)
   const hasher = new Argon2HasherAdapter();
  const tokenProvider = new JWTTokenProviderAdapter(env.JWT_SECRET);
  const cache = new RedisCacheAdapter(redis);
  const jobQueue = new BullMQJobQueueAdapter(redis);
  const dispatcher = new BullMQDomainEventDispatcher(jobQueue);

  // UoW — handles transactional repos + post-commit event dispatch
  const unitOfWork = new PrismaUnitOfWork(prisma, dispatcher);

  // Transactional repositories (receive unitOfWork as Prisma provider)
  const orderRepo = new PrismaOrderRepository(unitOfWork);
  const timelineRepo = new PrismaTimelineRepository(unitOfWork);
  const arRepo = new PrismaAccountReceivableRepository(unitOfWork);

  // Non-transactional repositories (receive prisma directly)
  const clientRepo = new PrismaClientRepository(prisma);
  const vehicleRepo = new PrismaVehicleRepository(prisma);
  const inventoryRepo = new PrismaInventoryRepository(prisma);
  const stockMovementRepo = new PrismaStockMovementRepository(prisma);
  const userRepo = new PrismaUserRepository(prisma);
  const photoRepo = new PrismaPhotoRepository(prisma);
  const noteRepo = new PrismaNoteRepository(prisma);
  const cashEntryRepo = new PrismaCashEntryRepository(prisma);
  const supplierRepo = new PrismaSupplierRepository(prisma);
  const scheduledPaymentRepo = new PrismaScheduledPaymentRepository(prisma);

  // Stub repositories (no Prisma table yet)
  const apRepo = new StubAccountPayableRepository() as any;
  const quoteRepo = new StubQuoteRepository() as any;
  const priceListRepo = new StubPriceListRepository() as any;
  const checklistRepo = new StubChecklistRepository() as any;
  const surveyRepo = new StubSurveyRepository() as any;
  const taskRepo = new StubTaskRepository() as any;
  const recallChecker = new StubRecallChecker() as any;

  // External adapters
  const fileStorage = new S3FileStorageAdapter();
  const pdfGenerator = new PDFKitGeneratorAdapter();
  const vinDecoder = new NHTSAVinDecoderAdapter(cache);

  // In-memory singletons for features without DB tables yet
  const kpiService = new InMemoryKpiService();
  const priceService = new InMemoryPriceService();
  const activityService = new InMemoryActivityService();

  // Use cases
  const useCases = {
    // Auth
    login: new LoginUseCase(userRepo, hasher, tokenProvider),
    refreshToken: new RefreshTokenUseCase(userRepo, tokenProvider),
    changePassword: new ChangePasswordUseCase(userRepo, hasher),

    // Users
    createUser: new CreateUserUseCase(userRepo, hasher),
    listUsers: new ListUsersUseCase(userRepo),
    assignPermissions: new AssignPermissionsUseCase(userRepo),

    // Orders
    addNoteToOrder: new AddNoteToOrderUseCase(orderRepo, noteRepo),
    createOrder: new CreateOrderUseCase(orderRepo, clientRepo, vehicleRepo, timelineRepo, unitOfWork),
    listOrders: new ListOrdersUseCase(orderRepo),
    getOrderDetail: new GetOrderDetailUseCase(orderRepo, timelineRepo, noteRepo, photoRepo, checklistRepo),
    changeOrderStatus: new ChangeOrderStatusUseCase(orderRepo, timelineRepo, dispatcher),
    closeOrder: new CloseOrderUseCase(orderRepo, clientRepo, arRepo, timelineRepo, unitOfWork),
    deleteOrder: new DeleteOrderUseCase(orderRepo),
    revertOrderPhase: new RevertOrderPhaseUseCase(orderRepo, timelineRepo),
    shareOrderPortal: new ShareOrderPortalUseCase(orderRepo),

    // Reception
    registerIntakeCauses: new RegisterIntakeCausesUseCase(orderRepo, timelineRepo),
    uploadPhotos: new UploadPhotosUseCase(photoRepo, fileStorage),

    // Inventory
    assignPartToOrder: new AssignPartToOrderUseCase(orderRepo, inventoryRepo, stockMovementRepo, timelineRepo, unitOfWork),
    createInventoryItem: new CreateInventoryItemUseCase(inventoryRepo),
    searchInventory: new SearchInventoryUseCase(inventoryRepo),
    registerStockMovement: new RegisterStockMovementUseCase(inventoryRepo, stockMovementRepo, unitOfWork),
    updateInventoryItem: new UpdateInventoryItemUseCase(inventoryRepo),
    deleteInventoryItem: new DeleteInventoryItemUseCase(inventoryRepo),
    getMovementHistory: new GetMovementHistoryUseCase(inventoryRepo, stockMovementRepo),

    // Quotation
    calculateQuoteTotal: new CalculateQuoteTotalUseCase(quoteRepo, inventoryRepo, priceListRepo),
    generateQuotePDF: new GenerateQuotePDFUseCase(orderRepo, quoteRepo, clientRepo, pdfGenerator, fileStorage),

    // Clients
    listClients: new ListClientsUseCase(clientRepo),
    createClient: new CreateClientUseCase(clientRepo),
    deleteClient: new DeleteClientUseCase(clientRepo),
    upsertClient: new UpsertClientUseCase(clientRepo),
    getClientDetail: new GetClientDetailUseCase(clientRepo, vehicleRepo, orderRepo),

    // Vehicles
    listVehicles: new ListVehiclesUseCase(vehicleRepo),
    createVehicle: new CreateVehicleUseCase(vehicleRepo),
    updateVehicle: new UpdateVehicleUseCase(vehicleRepo),
    deleteVehicle: new DeleteVehicleUseCase(vehicleRepo),
    decodeVin: new DecodeVinUseCase(vehicleRepo, vinDecoder),
    checkRecalls: new CheckRecallsUseCase(recallChecker),

    // Finance
    registerCashEntry: new RegisterCashEntryUseCase(cashEntryRepo),
    registerARPayment: new RegisterARPaymentUseCase(arRepo, cashEntryRepo, unitOfWork),
    getFinancialReports: new GetFinancialReportsUseCase(cashEntryRepo, arRepo, apRepo),
    listCashEntries: new ListCashEntriesUseCase(cashEntryRepo),
    listAccountsReceivable: new ListAccountsReceivableUseCase(arRepo),
    getComparativeReport: new GetComparativeReportUseCase(cashEntryRepo),

    // Contacts (Suppliers)
    listContacts: new ListContactsUseCase(supplierRepo),
    createContact: new CreateContactUseCase(supplierRepo),
    updateContact: new UpdateContactUseCase(supplierRepo),
    deleteContact: new DeleteContactUseCase(supplierRepo),

    // Scheduled Payments
    listScheduledPayments: new ListScheduledPaymentsUseCase(scheduledPaymentRepo),
    createScheduledPayment: new CreateScheduledPaymentUseCase(scheduledPaymentRepo),
    updateScheduledPayment: new UpdateScheduledPaymentUseCase(scheduledPaymentRepo),
    deleteScheduledPayment: new DeleteScheduledPaymentUseCase(scheduledPaymentRepo),

    // Quality
    submitSurvey: new SubmitSurveyUseCase(surveyRepo, orderRepo),

    // Tasks
    manageTasks: new ManageTasksUseCase(taskRepo),

    // KPIs (financial — computed from DB)
    getKPIs: new GetKPIsUseCase(orderRepo, cashEntryRepo, inventoryRepo),

    // Portal
    getOrderByToken: new GetOrderByTokenUseCase(orderRepo, timelineRepo, photoRepo),
  };

  return {
    useCases,
    prisma,
    tokenProvider,
    kpiService,
    priceService,
    activityService,
  };
}

export type Container = ReturnType<typeof createContainer>;
