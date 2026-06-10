import { describe, it, expect, beforeEach } from 'vitest';
import { CreateOrderUseCase } from '../../../../src/application/use-cases/orders/create-order.use-case';
import { InMemoryOrderRepository } from '../../../helpers/in-memory-order.repository';
import { InMemoryClientRepository } from '../../../helpers/in-memory-client.repository';
import { InMemoryVehicleRepository } from '../../../helpers/in-memory-vehicle.repository';
import { FakeUnitOfWork, FakeTimelineRepository } from '../../../helpers/fakes';
import { createTestClient, createTestVehicle } from '../../../helpers/factories';
import { Priority } from '../../../../src/domain/enums/priority.enum';
import { OrderType } from '../../../../src/domain/enums/order-type.enum';

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let orderRepo: InMemoryOrderRepository;
  let clientRepo: InMemoryClientRepository;
  let vehicleRepo: InMemoryVehicleRepository;
  let timelineRepo: FakeTimelineRepository;

  beforeEach(() => {
    const client = createTestClient({ id: 'client-1' });
    const vehicle = createTestVehicle({ id: 'vehicle-1', clientId: 'client-1' });

    orderRepo = new InMemoryOrderRepository([]);
    clientRepo = new InMemoryClientRepository([client]);
    vehicleRepo = new InMemoryVehicleRepository([vehicle]);
    timelineRepo = new FakeTimelineRepository();

    useCase = new CreateOrderUseCase(orderRepo, clientRepo, vehicleRepo, timelineRepo, new FakeUnitOfWork());
  });

  it('crea una orden y retorna id y código', async () => {
    const result = await useCase.execute({
      clientId: 'client-1',
      vehicleId: 'vehicle-1',
      technicianId: 'tech-1',
      createdById: 'user-1',
      problem: 'Ruido en motor',
      scheduledAt: new Date('2026-06-10'),
    });

    expect(result.id).toBeTruthy();
    expect(result.code).toMatch(/^WO-\d{4}$/);

    const saved = await orderRepo.findById(result.id);
    expect(saved).not.toBeNull();
    expect(saved?.problem).toBe('Ruido en motor');
    expect(saved?.priority).toBe(Priority.MEDIUM);
    expect(saved?.type).toBe(OrderType.NORMAL);
  });

  it('registra una entrada en la línea de tiempo al crear la orden', async () => {
    await useCase.execute({
      clientId: 'client-1',
      vehicleId: 'vehicle-1',
      technicianId: 'tech-1',
      createdById: 'user-1',
      problem: 'Ruido en motor',
      scheduledAt: new Date('2026-06-10'),
    });

    expect(timelineRepo.entries).toHaveLength(1);
    expect(timelineRepo.entries[0].event).toBe('order_created');
  });

  it('usa prioridad y tipo provistos cuando se especifican', async () => {
    const result = await useCase.execute({
      clientId: 'client-1',
      vehicleId: 'vehicle-1',
      technicianId: 'tech-1',
      createdById: 'user-1',
      problem: 'Servicio express',
      priority: Priority.HIGH,
      type: OrderType.EXPRESS,
      scheduledAt: new Date('2026-06-10'),
    });

    const saved = await orderRepo.findById(result.id);
    expect(saved?.priority).toBe(Priority.HIGH);
    expect(saved?.type).toBe(OrderType.EXPRESS);
  });

  it('lanza error si el cliente no existe', async () => {
    await expect(
      useCase.execute({
        clientId: 'no-existe',
        vehicleId: 'vehicle-1',
        technicianId: 'tech-1',
        createdById: 'user-1',
        problem: 'Ruido',
        scheduledAt: new Date('2026-06-10'),
      }),
    ).rejects.toThrow('Cliente no encontrado');
  });

  it('lanza error si el vehículo no existe', async () => {
    await expect(
      useCase.execute({
        clientId: 'client-1',
        vehicleId: 'no-existe',
        technicianId: 'tech-1',
        createdById: 'user-1',
        problem: 'Ruido',
        scheduledAt: new Date('2026-06-10'),
      }),
    ).rejects.toThrow('Vehículo no encontrado');
  });

  it('lanza error si el vehículo no pertenece al cliente', async () => {
    const otherVehicle = createTestVehicle({ id: 'vehicle-2', clientId: 'otro-cliente' });
    vehicleRepo = new InMemoryVehicleRepository([otherVehicle]);
    useCase = new CreateOrderUseCase(orderRepo, clientRepo, vehicleRepo, timelineRepo, new FakeUnitOfWork());

    await expect(
      useCase.execute({
        clientId: 'client-1',
        vehicleId: 'vehicle-2',
        technicianId: 'tech-1',
        createdById: 'user-1',
        problem: 'Ruido',
        scheduledAt: new Date('2026-06-10'),
      }),
    ).rejects.toThrow('El vehículo no pertenece al cliente');
  });
});
