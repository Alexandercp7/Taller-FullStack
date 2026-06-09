import { SupplierRepository } from '../../ports/repositories/supplier.repository';

export class DeleteContactUseCase {
  constructor(private readonly supplierRepo: SupplierRepository) {}

  async execute(id: string): Promise<void> {
    const supplier = await this.supplierRepo.findById(id);
    if (!supplier) throw new Error('Contacto no encontrado');
    await this.supplierRepo.delete(id);
  }
}
