import { describe, it, expect, beforeEach } from 'vitest';
import { LoginUseCase } from '../../../../src/application/use-cases/auth/login.use-case';
import { InMemoryUserRepository } from '../../../helpers/in-memory-user.repository';
import { FakeHasher, FakeTokenProvider } from '../../../helpers/fakes';
import { User } from '../../../../src/domain/entities/user.entity';
import { UserRole } from '../../../../src/domain/enums/user-role.enum';

describe('LoginUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let useCase: LoginUseCase;

  beforeEach(async () => {
    const hasher = new FakeHasher();
    const user = new User(
      'user-1',
      'Ana Gómez',
      'ana@example.com',
      await hasher.hash('secret123'),
      UserRole.ADMIN,
      ['orders:read'],
      true,
    );
    userRepo = new InMemoryUserRepository([user]);
    useCase = new LoginUseCase(userRepo, hasher, new FakeTokenProvider());
  });

  it('retorna tokens y datos del usuario con credenciales válidas', async () => {
    const result = await useCase.execute({ email: 'ana@example.com', password: 'secret123' });

    expect(result.accessToken).toBe('access:user-1:ADMIN');
    expect(result.refreshToken).toBe('refresh:user-1:ADMIN');
    expect(result.user).toEqual({
      id: 'user-1',
      name: 'Ana Gómez',
      email: 'ana@example.com',
      role: UserRole.ADMIN,
      permissions: ['orders:read'],
    });
  });

  it('lanza error si el usuario no existe', async () => {
    await expect(useCase.execute({ email: 'no-existe@example.com', password: 'secret123' })).rejects.toThrow(
      'Credenciales inválidas',
    );
  });

  it('lanza error si la contraseña es incorrecta', async () => {
    await expect(useCase.execute({ email: 'ana@example.com', password: 'wrong' })).rejects.toThrow(
      'Credenciales inválidas',
    );
  });

  it('lanza error si el usuario está inactivo', async () => {
    const hasher = new FakeHasher();
    const inactiveUser = new User(
      'user-2',
      'Inactivo',
      'inactivo@example.com',
      await hasher.hash('secret123'),
      UserRole.TECHNICIAN,
      [],
      false,
    );
    userRepo = new InMemoryUserRepository([inactiveUser]);
    useCase = new LoginUseCase(userRepo, hasher, new FakeTokenProvider());

    await expect(useCase.execute({ email: 'inactivo@example.com', password: 'secret123' })).rejects.toThrow(
      'Credenciales inválidas',
    );
  });
});
