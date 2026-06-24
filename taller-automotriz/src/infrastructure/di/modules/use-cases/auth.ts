import { LoginUseCase } from '../../../../application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from '../../../../application/use-cases/auth/refresh-token.use-case';
import { ChangePasswordUseCase } from '../../../../application/use-cases/auth/change-password.use-case';
import type { Repos } from '../repositories';
import type { Infra } from '../infra';

export function buildAuthUseCases(repos: Repos, infra: Infra) {
  const { userRepo } = repos;
  const { hasher, tokenProvider } = infra;
  return {
    login: new LoginUseCase(userRepo, hasher, tokenProvider),
    refreshToken: new RefreshTokenUseCase(userRepo, tokenProvider),
    changePassword: new ChangePasswordUseCase(userRepo, hasher),
  };
}
