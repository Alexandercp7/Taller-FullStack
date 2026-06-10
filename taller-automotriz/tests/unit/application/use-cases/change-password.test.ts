import { describe, it, expect, beforeEach } from 'vitest';
import { ChangePasswordUseCase } from '../../../../src/application/use-cases/auth/change-password.use-case';
import { InMemoryUserRepository } from '../../../helpers/in-memory-user.repository';
import { FakeHasher } from '../../../helpers/fakes';
import { User } from '../../../../src/domain/entities/user.entity';
import { UserRole } from '../../../../src/domain/enums/user-role.enum';

describe('ChangePasswordUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let useCase: ChangePasswordUseCase;
  const hasher = new FakeHasher();

  beforeEach(async () => {
    const user = new User('user-1', 'Ana', 'ana@example.com', await hasher.hash('old-pass'), UserRole.TECHNICIAN, [], true);
    userRepo = new InMemoryUserRepository([user]);
    useCase = new ChangePasswordUseCase(userRepo, hasher);
  });

  it('actualiza la contraseña cuando la actual es correcta', async () => {
    await useCase.execute({ userId: 'user-1', currentPassword: 'old-pass', newPassword: 'new-pass' });

    const user = await userRepo.findById('user-1');
    expect(user?.passwordHash).toBe('hashed:new-pass');
  });

  it('lanza error si el usuario no existe', async () => {
    await expect(
      useCase.execute({ userId: 'no-existe', currentPassword: 'old-pass', newPassword: 'new-pass' }),
    ).rejects.toThrow('Usuario no encontrado');
  });

  it('lanza error si la contraseña actual es incorrecta', async () => {
    await expect(
      useCase.execute({ userId: 'user-1', currentPassword: 'wrong', newPassword: 'new-pass' }),
    ).rejects.toThrow('Contraseña actual incorrecta');
  });
});
