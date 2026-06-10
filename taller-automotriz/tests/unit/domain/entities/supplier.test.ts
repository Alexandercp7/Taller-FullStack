import { describe, it, expect } from 'vitest';
import { Supplier } from '../../../../src/domain/entities/supplier.entity';

function buildSupplier(overrides: Partial<{ isActive: boolean }> = {}): Supplier {
  return new Supplier(
    'supplier-1',
    'Refacciones del Norte',
    'Carlos López',
    '5512345678',
    'contacto@refnorte.com',
    'Proveedor confiable',
    overrides.isActive ?? true,
  );
}

describe('Supplier', () => {
  it('expone los datos iniciales mediante getters', () => {
    const supplier = buildSupplier();

    expect(supplier.name).toBe('Refacciones del Norte');
    expect(supplier.contact).toBe('Carlos López');
    expect(supplier.phone).toBe('5512345678');
    expect(supplier.email).toBe('contacto@refnorte.com');
    expect(supplier.notes).toBe('Proveedor confiable');
    expect(supplier.isActive).toBe(true);
  });

  describe('update', () => {
    it('actualiza solo los campos provistos', () => {
      const supplier = buildSupplier();

      supplier.update({ name: 'Refacciones del Sur' });

      expect(supplier.name).toBe('Refacciones del Sur');
      expect(supplier.contact).toBe('Carlos López');
    });

    it('permite limpiar campos opcionales con null', () => {
      const supplier = buildSupplier();

      supplier.update({ contact: null, phone: null, email: null, notes: null });

      expect(supplier.contact).toBeNull();
      expect(supplier.phone).toBeNull();
      expect(supplier.email).toBeNull();
      expect(supplier.notes).toBeNull();
    });
  });

  it('deactivate marca al proveedor como inactivo', () => {
    const supplier = buildSupplier({ isActive: true });

    supplier.deactivate();

    expect(supplier.isActive).toBe(false);
  });

  it('activate marca al proveedor como activo', () => {
    const supplier = buildSupplier({ isActive: false });

    supplier.activate();

    expect(supplier.isActive).toBe(true);
  });
});
