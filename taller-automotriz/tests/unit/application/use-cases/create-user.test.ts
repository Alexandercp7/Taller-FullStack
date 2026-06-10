import { describe, it, expect, beforeEach } from 'vitest';
import { CreateUserUseCase } from '../../../../src/application/use-cases/users/create-user.use-case';
import { InMemoryUserRepository } from '../../../helpers/in-memory-user.repository';
import { FakeHasher } from '../../../helpers/fakes';
import { User } from '../../../../src/domain/entities/user.entity';
import { UserRole } from '../../../../src/domain/enums/user-role.enum';

describe('CreateUserUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let hasher: FakeHasher;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    hasher = new FakeHasher();
    useCase = new CreateUserUseCase(userRepo, hasher);
  });

  it('crea un usuario nuevo con la contraseña hasheada y queda activo', async () => {
    const result = await useCase.execute({
      name: 'Carlos Pérez',
      email: 'carlos@example.com',
      password: 'secret123',
      role: UserRole.TECHNICIAN,
    });

    const saved = await userRepo.findById(result.id);
    expect(saved).not.toBeNull();
    expect(saved?.passwordHash).toBe('hashed:secret123');
    expect(saved?.role).toBe(UserRole.TECHNICIAN);
    expect(saved?.isActive).toBe(true);
    expect(saved?.permissions).toEqual([]);
  });

  it('asigna permisos cuando se proporcionan', async () => {
    const result = await useCase.execute({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'pass123',
      role: UserRole.ADMIN,
      permissions: ['orders:read', 'orders:write'],
    });

    const saved = await userRepo.findById(result.id);
    expect(saved?.permissions).toEqual(['orders:read', 'orders:write']);
  });

  it('lanza error si ya existe un usuario con el mismo email', async () => {
    const existing = new User('user-1', 'Existente', 'duplicado@example.com', 'hash', UserRole.ADMIN, [], true);
    userRepo = new InMemoryUserRepository([existing]);
    useCase = new CreateUserUseCase(userRepo, hasher);

    await expect(
      useCase.execute({ name: 'Otro', email: 'duplicado@example.com', password: 'x', role: UserRole.TECHNICIAN }),
    ).rejects.toThrow('Ya existe un usuario con ese email');
  });
});
