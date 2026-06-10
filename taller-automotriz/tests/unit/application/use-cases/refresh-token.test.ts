import { describe, it, expect, beforeEach } from 'vitest';
import { RefreshTokenUseCase } from '../../../../src/application/use-cases/auth/refresh-token.use-case';
import { InMemoryUserRepository } from '../../../helpers/in-memory-user.repository';
import { FakeTokenProvider } from '../../../helpers/fakes';
import { User } from '../../../../src/domain/entities/user.entity';
import { UserRole } from '../../../../src/domain/enums/user-role.enum';

describe('RefreshTokenUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let useCase: RefreshTokenUseCase;
  const tokenProvider = new FakeTokenProvider();

  beforeEach(() => {
    const user = new User('user-1', 'Ana', 'ana@example.com', '$hash$', UserRole.ADMIN, [], true);
    userRepo = new InMemoryUserRepository([user]);
    useCase = new RefreshTokenUseCase(userRepo, tokenProvider);
  });

  it('genera nuevos tokens si el refresh token y el usuario son válidos', async () => {
    const refreshToken = tokenProvider.signRefresh({ sub: 'user-1', role: UserRole.ADMIN });

    const result = await useCase.execute(refreshToken);

    expect(result.accessToken).toBe('access:user-1:ADMIN');
    expect(result.refreshToken).toBe('refresh:user-1:ADMIN');
  });

  it('lanza error si el usuario no existe', async () => {
    const refreshToken = tokenProvider.signRefresh({ sub: 'no-existe', role: UserRole.ADMIN });

    await expect(useCase.execute(refreshToken)).rejects.toThrow('Usuario no encontrado o inactivo');
  });

  it('lanza error si el usuario está inactivo', async () => {
    const inactiveUser = new User('user-2', 'Inactivo', 'inactivo@example.com', '$hash$', UserRole.TECHNICIAN, [], false);
    userRepo = new InMemoryUserRepository([inactiveUser]);
    useCase = new RefreshTokenUseCase(userRepo, tokenProvider);

    const refreshToken = tokenProvider.signRefresh({ sub: 'user-2', role: UserRole.TECHNICIAN });

    await expect(useCase.execute(refreshToken)).rejects.toThrow('Usuario no encontrado o inactivo');
  });
});
