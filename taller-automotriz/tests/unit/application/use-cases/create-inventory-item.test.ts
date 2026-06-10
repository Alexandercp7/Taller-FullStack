import { describe, it, expect, beforeEach } from 'vitest';
import { CreateInventoryItemUseCase } from '../../../../src/application/use-cases/inventory/create-inventory-item.use-case';
import { InMemoryInventoryRepository } from '../../../helpers/in-memory-inventory.repository';
import { InventoryType } from '../../../../src/domain/enums/inventory-type.enum';

describe('CreateInventoryItemUseCase', () => {
  let useCase: CreateInventoryItemUseCase;
  let inventoryRepo: InMemoryInventoryRepository;

  beforeEach(() => {
    inventoryRepo = new InMemoryInventoryRepository([]);
    useCase = new CreateInventoryItemUseCase(inventoryRepo);
  });

  it('crea un artículo con valores por defecto cuando no se proveen', async () => {
    const result = await useCase.execute({
      name: 'Filtro de aire',
      type: InventoryType.SALE_PART,
      purchasePrice: 50,
      salePrice: 100,
    });

    const item = await inventoryRepo.findById(result.id);
    expect(item).not.toBeNull();
    expect(item?.name).toBe('Filtro de aire');
    expect(item?.stock).toBe(0);
    expect(item?.minStock).toBe(0);
    expect(item?.purchasePrice.amount).toBe(50);
    expect(item?.salePrice.amount).toBe(100);
    expect(item?.isActive).toBe(true);
    expect(item?.description).toBeNull();
    expect(item?.sku).toBeNull();
  });

  it('crea un artículo con todos los campos opcionales', async () => {
    const result = await useCase.execute({
      name: 'Pastillas de freno',
      description: 'Juego delantero',
      sku: 'BRK-001',
      type: InventoryType.SALE_PART,
      stock: 20,
      minStock: 5,
      purchasePrice: 200,
      salePrice: 350,
      supplierId: 'supplier-1',
      location: 'Estante A1',
    });

    const item = await inventoryRepo.findById(result.id);
    expect(item?.description).toBe('Juego delantero');
    expect(item?.sku).toBe('BRK-001');
    expect(item?.stock).toBe(20);
    expect(item?.minStock).toBe(5);
    expect(item?.supplierId).toBe('supplier-1');
    expect(item?.location).toBe('Estante A1');
  });
});
