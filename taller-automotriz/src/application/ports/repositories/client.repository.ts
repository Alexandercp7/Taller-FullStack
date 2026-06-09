import { Client } from '../../../domain/entities/client.entity';

export interface ClientRepository {
  findById(id: string): Promise<Client | null>;
  findByPhone(phone: string): Promise<Client | null>;
  findByNameOrPhone(query: string, page: number, pageSize: number): Promise<{ data: Client[]; total: number }>;
  save(client: Client): Promise<void>;
  delete(id: string): Promise<void>;
  hasActiveOrders(clientId: string): Promise<boolean>;
  countOrders(clientId: string): Promise<number>;
  hasPendingDebt(clientId: string): Promise<boolean>;
}
