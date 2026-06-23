import { PrismaOrderRepository } from '../../persistence/repositories/prisma-order.repository';
import { PrismaClientRepository } from '../../persistence/repositories/prisma-client.repository';
import { PrismaVehicleRepository } from '../../persistence/repositories/prisma-vehicle.repository';
import { PrismaInventoryRepository } from '../../persistence/repositories/prisma-inventory.repository';
import { PrismaStockMovementRepository } from '../../persistence/repositories/prisma-stock-movement.repository';
import { PrismaUserRepository } from '../../persistence/repositories/prisma-user.repository';
import { PrismaTimelineRepository } from '../../persistence/repositories/prisma-timeline.repository';
import { PrismaPhotoRepository } from '../../persistence/repositories/prisma-photo.repository';
import { PrismaNoteRepository } from '../../persistence/repositories/prisma-note.repository';
import { PrismaCashEntryRepository } from '../../persistence/repositories/prisma-cash-entry.repository';
import { PrismaAccountReceivableRepository } from '../../persistence/repositories/prisma-account-receivable.repository';
import { PrismaSupplierRepository } from '../../persistence/repositories/prisma-supplier.repository';
import { PrismaScheduledPaymentRepository } from '../../persistence/repositories/prisma-scheduled-payment.repository';
import type { Infra } from './infra';

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

export function buildRepositories(infra: Infra) {
  const { prisma, unitOfWork } = infra;

  return {
    // Transactional (receive unitOfWork as Prisma provider)
    orderRepo: new PrismaOrderRepository(unitOfWork),
    timelineRepo: new PrismaTimelineRepository(unitOfWork),
    arRepo: new PrismaAccountReceivableRepository(unitOfWork),

    // Non-transactional (receive prisma directly)
    clientRepo: new PrismaClientRepository(prisma),
    vehicleRepo: new PrismaVehicleRepository(prisma),
    inventoryRepo: new PrismaInventoryRepository(prisma),
    stockMovementRepo: new PrismaStockMovementRepository(prisma),
    userRepo: new PrismaUserRepository(prisma),
    photoRepo: new PrismaPhotoRepository(prisma),
    noteRepo: new PrismaNoteRepository(prisma),
    cashEntryRepo: new PrismaCashEntryRepository(prisma),
    supplierRepo: new PrismaSupplierRepository(prisma),
    scheduledPaymentRepo: new PrismaScheduledPaymentRepository(prisma),

    // Stubs (no Prisma table yet)
    apRepo: new StubAccountPayableRepository() as any,
    quoteRepo: new StubQuoteRepository() as any,
    priceListRepo: new StubPriceListRepository() as any,
    checklistRepo: new StubChecklistRepository() as any,
    surveyRepo: new StubSurveyRepository() as any,
    taskRepo: new StubTaskRepository() as any,
    recallChecker: new StubRecallChecker() as any,
  };
}

export type Repos = ReturnType<typeof buildRepositories>;
