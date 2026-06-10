import { UserRepository } from '../../src/application/ports/repositories/user.repository';
import { User } from '../../src/domain/entities/user.entity';

export class InMemoryUserRepository implements UserRepository {
  private store: User[];

  constructor(initial: User[] = []) {
    this.store = [...initial];
  }

  async findById(id: string): Promise<User | null> {
    return this.store.find((u) => u.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.store.find((u) => u.email === email) ?? null;
  }

  async findAll(): Promise<User[]> {
    return [...this.store];
  }

  async save(user: User): Promise<void> {
    const idx = this.store.findIndex((u) => u.id === user.id);
    if (idx >= 0) this.store[idx] = user;
    else this.store.push(user);
  }

  async delete(id: string): Promise<void> {
    this.store = this.store.filter((u) => u.id !== id);
  }
}
