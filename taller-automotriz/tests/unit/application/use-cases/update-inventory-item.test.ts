import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateInventoryItemUseCase } from '../../../../src/application/use-cases/inventory/update-inventory-item.use-case';
import { InMemoryInventoryRepository } from '../../../helpers/in-memory-inventory.repository';
import { createTestItem } from '../../../helpers/factories';
import { InventoryType } from '../../../../src/domain/enums/inventory-type.enum';

describe('UpdateInventoryItemUseCase', () => {
  let useCase: UpdateInventoryItemUseCase;
  let inventoryRepo: InMemoryInventoryRepository;

  beforeEach(() => {
    const item = createTestItem({ id: 'item-1', name: 'Filtro de aceite' });
    inventoryRepo = new InMemoryInventoryRepository([item]);
    useCase = new UpdateInventoryItemUseCase(inventoryRepo);
  });

  it('actualiza la información básica del artículo', async () => {
    await useCase.execute({ itemId: 'item-1', name: 'Filtro de aceite premium', type: InventoryType.SALE_PART });

    const item = await inventoryRepo.findById('item-1');
    expect(item?.name).toBe('Filtro de aceite premium');
  });

  it('actualiza precios de compra y venta cuando se proveen', async () => {
    await useCase.execute({ itemId: 'item-1', purchasePrice: 60, salePrice: 130 });

    const item = await inventoryRepo.findById('item-1');
    expect(item?.purchasePrice.amount).toBe(60);
    expect(item?.salePrice.amount).toBe(130);
  });

  it('no modifica los precios si no se proveen', async () => {
    const before = await inventoryRepo.findById('item-1');
    const purchaseBefore = before!.purchasePrice.amount;
    const saleBefore = before!.salePrice.amount;

    await useCase.execute({ itemId: 'item-1', name: 'Solo cambia el nombre' });

    const item = await inventoryRepo.findById('item-1');
    expect(item?.purchasePrice.amount).toBe(purchaseBefore);
    expect(item?.salePrice.amount).toBe(saleBefore);
  });

  it('actualiza solo el precio de compra manteniendo el de venta', async () => {
    const before = await inventoryRepo.findById('item-1');
    const saleBefore = before!.salePrice.amount;

    await useCase.execute({ itemId: 'item-1', purchasePrice: 75 });

    const item = await inventoryRepo.findById('item-1');
    expect(item?.purchasePrice.amount).toBe(75);
    expect(item?.salePrice.amount).toBe(saleBefore);
  });

  it('lanza error si el artículo no existe', async () => {
    await expect(useCase.execute({ itemId: 'no-existe', name: 'X' })).rejects.toThrow('Artículo no encontrado');
  });
});
