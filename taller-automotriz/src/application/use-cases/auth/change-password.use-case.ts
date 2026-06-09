import { UserRepository } from '../../ports/repositories/user.repository';
import { Hasher } from '../../ports/services/hasher.port';

interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly hasher: Hasher,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) throw new Error('Usuario no encontrado');

    const valid = await this.hasher.verify(input.currentPassword, user.passwordHash);
    if (!valid) throw new Error('Contraseña actual incorrecta');

    const newHash = await this.hasher.hash(input.newPassword);
    user.updatePassword(newHash);
    await this.userRepo.save(user);
  }
}
