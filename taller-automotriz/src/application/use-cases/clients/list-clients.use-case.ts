import { ClientRepository } from '../../ports/repositories/client.repository';
import { Client } from '../../../domain/entities/client.entity';

interface ListClientsInput {
  query?: string;
  page: number;
  pageSize: number;
}

export class ListClientsUseCase {
  constructor(private readonly clientRepo: ClientRepository) {}

  async execute(input: ListClientsInput): Promise<{ data: Client[]; total: number }> {
    return this.clientRepo.findByNameOrPhone(input.query ?? '', input.page, input.pageSize);
  }
}
