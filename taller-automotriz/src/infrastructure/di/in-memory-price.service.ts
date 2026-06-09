import { createId } from '../../shared/identifier';

export interface PriceItem {
  id: string;
  categoriaPrincipal: string;
  sistema?: string;
  familia?: string;
  concepto?: string;
  tamano?: string;
  diametro?: string;
  precioAuto?: string;
  precioCamioneta?: string;
  precioCamion?: string;
  precio?: string;
  activo: boolean;
}

export class InMemoryPriceService {
  private items: PriceItem[] = [];

  list(): PriceItem[] { return this.items.filter(i => i.activo); }

  getById(id: string): PriceItem | null { return this.items.find(i => i.id === id) ?? null; }

  create(input: Omit<PriceItem, 'id' | 'activo'>): PriceItem {
    const item: PriceItem = { ...input, id: createId(), activo: true };
    this.items.push(item);
    return item;
  }

  update(id: string, updates: Partial<Omit<PriceItem, 'id' | 'activo'>>): PriceItem | null {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    this.items[idx] = { ...this.items[idx], ...updates };
    return this.items[idx];
  }

  delete(id: string): boolean {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx === -1) return false;
    this.items[idx].activo = false;
    return true;
  }
}
