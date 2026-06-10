import { describe, it, expect, beforeEach } from 'vitest';
import { SearchInventoryUseCase } from '../../../../src/application/use-cases/inventory/search-inventory.use-case';
import { InMemoryInventoryRepository } from '../../../helpers/in-memory-inventory.repository';
import { createTestItem } from '../../../helpers/factories';

describe('SearchInventoryUseCase', () => {
  it('retorna los artículos activos paginados desde el repositorio', async () => {
    const item1 = createTestItem({ id: 'item-1', name: 'Filtro de aceite' });
    const item2 = createTestItem({ id: 'item-2', name: 'Pastillas de freno' });
    const inventoryRepo = new InMemoryInventoryRepository([item1, item2]);
    const useCase = new SearchInventoryUseCase(inventoryRepo);

    const result = await useCase.execute({ page: 1, pageSize: 10 });

    expect(result.total).toBe(2);
    expect(result.data).toHaveLength(2);
  });

  it('retorna vacío si no hay artículos', async () => {
    const inventoryRepo = new InMemoryInventoryRepository([]);
    const useCase = new SearchInventoryUseCase(inventoryRepo);

    const result = await useCase.execute({ page: 1, pageSize: 10 });

    expect(result.total).toBe(0);
    expect(result.data).toEqual([]);
  });
});
