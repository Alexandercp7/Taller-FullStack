import { SupplierRepository } from '../../ports/repositories/supplier.repository';

interface UpdateContactInput {
  id: string;
  nombre?: string;
  empresa?: string;
  telefono?: string;
  correo?: string;
  notes?: string;
}

export class UpdateContactUseCase {
  constructor(private readonly supplierRepo: SupplierRepository) {}

  async execute(input: UpdateContactInput): Promise<void> {
    const supplier = await this.supplierRepo.findById(input.id);
    if (!supplier) throw new Error('Contacto no encontrado');
    supplier.update({
      name: input.nombre,
      contact: input.empresa,
      phone: input.telefono,
      email: input.correo,
      notes: input.notes,
    });
    await this.supplierRepo.save(supplier);
  }
}
