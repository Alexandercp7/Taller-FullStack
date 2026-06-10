import { describe, it, expect } from 'vitest';
import { ChecklistItem, calculateChecklistProgress } from '../../../../src/domain/entities/checklist.entity';

function buildItem(id: string, checked: boolean): ChecklistItem {
  return new ChecklistItem(id, 'order-1', `Item ${id}`, checked, 'DIAGNOSIS');
}

describe('ChecklistItem', () => {
  it('expone los datos iniciales mediante getters', () => {
    const item = buildItem('1', false);

    expect(item.label).toBe('Item 1');
    expect(item.checked).toBe(false);
    expect(item.phase).toBe('DIAGNOSIS');
  });

  it('toggle invierte el estado checked', () => {
    const item = buildItem('1', false);

    item.toggle();
    expect(item.checked).toBe(true);

    item.toggle();
    expect(item.checked).toBe(false);
  });

  it('check marca el item como completado', () => {
    const item = buildItem('1', false);

    item.check();

    expect(item.checked).toBe(true);
  });

  it('uncheck desmarca el item', () => {
    const item = buildItem('1', true);

    item.uncheck();

    expect(item.checked).toBe(false);
  });
});

describe('calculateChecklistProgress', () => {
  it('retorna 0 si la lista está vacía', () => {
    expect(calculateChecklistProgress([])).toBe(0);
  });

  it('retorna 0 si ningún item está marcado', () => {
    const items = [buildItem('1', false), buildItem('2', false)];

    expect(calculateChecklistProgress(items)).toBe(0);
  });

  it('retorna 100 si todos los items están marcados', () => {
    const items = [buildItem('1', true), buildItem('2', true)];

    expect(calculateChecklistProgress(items)).toBe(100);
  });

  it('redondea el porcentaje cuando no es exacto', () => {
    const items = [buildItem('1', true), buildItem('2', false), buildItem('3', false)];

    expect(calculateChecklistProgress(items)).toBe(33);
  });
});
