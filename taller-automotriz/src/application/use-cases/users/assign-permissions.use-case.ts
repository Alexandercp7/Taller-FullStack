import { UserRepository } from '../../ports/repositories/user.repository';

interface AssignPermissionsInput {
  userId: string;
  permissions: string[];
}

export class AssignPermissionsUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: AssignPermissionsInput): Promise<void> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) throw new Error('Usuario no encontrado');
    user.setPermissions(input.permissions);
    await this.userRepo.save(user);
  }
}
