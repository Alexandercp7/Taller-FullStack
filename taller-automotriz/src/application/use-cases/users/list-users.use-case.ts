import { UserRepository } from '../../ports/repositories/user.repository';

export class ListUsersUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(): Promise<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    permissions: string[];
  }>> {
    const users = await this.userRepo.findAll();
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      permissions: u.permissions,
    }));
  }
}
