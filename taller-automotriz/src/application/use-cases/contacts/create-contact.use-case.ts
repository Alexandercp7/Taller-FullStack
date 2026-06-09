import { SupplierRepository } from '../../ports/repositories/supplier.repository';
import { Supplier } from '../../../domain/entities/supplier.entity';
import { createId } from '../../../shared/identifier';

interface CreateContactInput {
  nombre: string;
  empresa?: string;
  telefono?: string;
  correo?: string;
  rfc?: string;
  notes?: string;
  diasPago?: number;
  limiteCredito?: number;
  politicaDescuentos?: string;
}

export class CreateContactUseCase {
  constructor(private readonly supplierRepo: SupplierRepository) {}

  async execute(input: CreateContactInput): Promise<{ id: string }> {
    const supplier = new Supplier(
      createId(),
      input.nombre,
      input.empresa ?? null,
      input.telefono ?? null,
      input.correo ?? null,
      input.notes ?? null,
      true,
    );
    await this.supplierRepo.save(supplier);
    return { id: supplier.id };
  }
}
