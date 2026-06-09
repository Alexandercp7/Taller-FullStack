import { SupplierRepository } from '../../ports/repositories/supplier.repository';

export class ListContactsUseCase {
  constructor(private readonly supplierRepo: SupplierRepository) {}

  async execute() {
    const suppliers = await this.supplierRepo.findAll();
    return suppliers.map((s) => ({
      id: s.id,
      nombre: s.name,
      empresa: s.name,
      telefono: s.phone ?? '',
      correo: s.email ?? '',
      rfc: '',
      contact: s.contact ?? '',
      notes: s.notes ?? '',
      isActive: s.isActive,
    }));
  }
}
