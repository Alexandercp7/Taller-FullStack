import { describe, it, expect, beforeEach } from 'vitest';
import { RegisterStockMovementUseCase } from '../../../../src/application/use-cases/inventory/register-stock-movement.use-case';
import { InMemoryInventoryRepository } from '../../../helpers/in-memory-inventory.repository';
import { FakeStockMovementRepository, FakeUnitOfWork } from '../../../helpers/fakes';
import { createTestItem } from '../../../helpers/factories';
import { MovementType } from '../../../../src/domain/enums/movement-type.enum';

describe('RegisterStockMovementUseCase', () => {
  let useCase: RegisterStockMovementUseCase;
  let inventoryRepo: InMemoryInventoryRepository;
  let stockMovementRepo: FakeStockMovementRepository;

  beforeEach(() => {
    const item = createTestItem({ id: 'item-1', stock: 10, minStock: 2 });
    inventoryRepo = new InMemoryInventoryRepository([item]);
    stockMovementRepo = new FakeStockMovementRepository();

    useCase = new RegisterStockMovementUseCase(inventoryRepo, stockMovementRepo, new FakeUnitOfWork());
  });

  it('registra una entrada y aumenta el stock', async () => {
    await useCase.execute({ itemId: 'item-1', type: MovementType.ENTRY, quantity: 5, userId: 'user-1' });

    const item = await inventoryRepo.findById('item-1');
    expect(item?.stock).toBe(15);
    expect(stockMovementRepo.movements).toHaveLength(1);
    expect(stockMovementRepo.movements[0].type).toBe(MovementType.ENTRY);
  });

  it('registra una salida y disminuye el stock', async () => {
    await useCase.execute({ itemId: 'item-1', type: MovementType.EXIT, quantity: 3, userId: 'user-1' });

    const item = await inventoryRepo.findById('item-1');
    expect(item?.stock).toBe(7);
    expect(stockMovementRepo.movements[0].type).toBe(MovementType.EXIT);
  });

  it('registra un ajuste sumando la cantidad al stock actual', async () => {
    await useCase.execute({ itemId: 'item-1', type: MovementType.ADJUSTMENT, quantity: -4, userId: 'user-1', reason: 'Conteo físico' });

    const item = await inventoryRepo.findById('item-1');
    expect(item?.stock).toBe(6);
    expect(stockMovementRepo.movements[0].type).toBe(MovementType.EXIT);
    expect(stockMovementRepo.movements[0].reason).toBe('Conteo físico');
  });

  it('limpia los eventos de dominio del item después de procesar', async () => {
    const item = createTestItem({ id: 'item-2', stock: 3, minStock: 5 });
    inventoryRepo = new InMemoryInventoryRepository([item]);
    useCase = new RegisterStockMovementUseCase(inventoryRepo, stockMovementRepo, new FakeUnitOfWork());

    await useCase.execute({ itemId: 'item-2', type: MovementType.EXIT, quantity: 2, userId: 'user-1' });

    const updated = await inventoryRepo.findById('item-2');
    expect(updated?.domainEvents).toHaveLength(0);
  });

  it('lanza error si el artículo no existe', async () => {
    await expect(
      useCase.execute({ itemId: 'no-existe', type: MovementType.ENTRY, quantity: 1, userId: 'user-1' }),
    ).rejects.toThrow('Artículo no encontrado');
  });

  it('lanza error si la salida excede el stock disponible', async () => {
    await expect(
      useCase.execute({ itemId: 'item-1', type: MovementType.EXIT, quantity: 100, userId: 'user-1' }),
    ).rejects.toThrow();
  });
});
