import { describe, it, expect } from 'vitest';
import { ClientTagger } from '../../../../src/domain/services/client-tagger.service';
import { ClientTag } from '../../../../src/domain/enums/client-tag.enum';

describe('ClientTagger', () => {
  it('retorna WITH_DEBT si el cliente tiene deuda pendiente, sin importar el número de órdenes', () => {
    const tag = ClientTagger.determineTag({ totalOrders: 10, hasPendingDebt: true });

    expect(tag).toBe(ClientTag.WITH_DEBT);
  });

  it('retorna FREQUENT si tiene 3 o más órdenes y no tiene deuda', () => {
    const tag = ClientTagger.determineTag({ totalOrders: 3, hasPendingDebt: false });

    expect(tag).toBe(ClientTag.FREQUENT);
  });

  it('retorna FREQUENT si tiene más de 3 órdenes y no tiene deuda', () => {
    const tag = ClientTagger.determineTag({ totalOrders: 7, hasPendingDebt: false });

    expect(tag).toBe(ClientTag.FREQUENT);
  });

  it('retorna NEW si tiene menos de 3 órdenes y no tiene deuda', () => {
    const tag = ClientTagger.determineTag({ totalOrders: 1, hasPendingDebt: false });

    expect(tag).toBe(ClientTag.NEW);
  });

  it('retorna NEW si no tiene órdenes ni deuda', () => {
    const tag = ClientTagger.determineTag({ totalOrders: 0, hasPendingDebt: false });

    expect(tag).toBe(ClientTag.NEW);
  });
});
