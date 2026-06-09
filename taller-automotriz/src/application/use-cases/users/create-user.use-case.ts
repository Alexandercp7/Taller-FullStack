import { UserRepository } from '../../ports/repositories/user.repository';
import { Hasher } from '../../ports/services/hasher.port';
import { User } from '../../../domain/entities/user.entity';
import { UserRole } from '../../../domain/enums/user-role.enum';
import { createId } from '../../../shared/identifier';

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  permissions?: string[];
}

export class CreateUserUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly hasher: Hasher,
  ) {}

  async execute(input: CreateUserInput): Promise<{ id: string }> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) throw new Error('Ya existe un usuario con ese email');

    const passwordHash = await this.hasher.hash(input.password);
    const user = new User(
      createId(),
      input.name,
      input.email,
      passwordHash,
      input.role,
      input.permissions ?? [],
      true,
    );

    await this.userRepo.save(user);
    return { id: user.id };
  }
}
