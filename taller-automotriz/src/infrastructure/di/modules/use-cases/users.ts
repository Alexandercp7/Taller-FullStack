import { CreateUserUseCase } from '../../../../application/use-cases/users/create-user.use-case';
import { ListUsersUseCase } from '../../../../application/use-cases/users/list-users.use-case';
import { AssignPermissionsUseCase } from '../../../../application/use-cases/users/assign-permissions.use-case';
import type { Repos } from '../repositories';
import type { Infra } from '../infra';

export function buildUserUseCases(repos: Repos, infra: Infra) {
  const { userRepo } = repos;
  const { hasher } = infra;
  return {
    createUser: new CreateUserUseCase(userRepo, hasher),
    listUsers: new ListUsersUseCase(userRepo),
    assignPermissions: new AssignPermissionsUseCase(userRepo),
  };
}
