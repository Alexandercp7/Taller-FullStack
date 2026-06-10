import { describe, it, expect, beforeEach } from 'vitest';
import { AssignPermissionsUseCase } from '../../../../src/application/use-cases/users/assign-permissions.use-case';
import { InMemoryUserRepository } from '../../../helpers/in-memory-user.repository';
import { User } from '../../../../src/domain/entities/user.entity';
import { UserRole } from '../../../../src/domain/enums/user-role.enum';

describe('AssignPermissionsUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let useCase: AssignPermissionsUseCase;

  beforeEach(() => {
    const user = new User('user-1', 'Ana', 'ana@example.com', 'hash', UserRole.TECHNICIAN, ['orders:read'], true);
    userRepo = new InMemoryUserRepository([user]);
    useCase = new AssignPermissionsUseCase(userRepo);
  });

  it('reemplaza la lista de permisos del usuario', async () => {
    await useCase.execute({ userId: 'user-1', permissions: ['orders:write', 'inventory:read'] });

    const saved = await userRepo.findById('user-1');
    expect(saved?.permissions).toEqual(['orders:write', 'inventory:read']);
  });

  it('permite vaciar los permisos del usuario', async () => {
    await useCase.execute({ userId: 'user-1', permissions: [] });

    const saved = await userRepo.findById('user-1');
    expect(saved?.permissions).toEqual([]);
  });

  it('lanza error si el usuario no existe', async () => {
    await expect(useCase.execute({ userId: 'no-existe', permissions: ['orders:read'] })).rejects.toThrow(
      'Usuario no encontrado',
    );
  });
});
