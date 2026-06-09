import { UserRepository } from '../../ports/repositories/user.repository';
import { Hasher } from '../../ports/services/hasher.port';
import { TokenProvider } from '../../ports/services/token-provider.port';

interface LoginInput {
  email: string;
  password: string;
}

interface LoginOutput {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

export class LoginUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly hasher: Hasher,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user || !user.isActive) {
      throw new Error('Credenciales inválidas');
    }

    const valid = await this.hasher.verify(input.password, user.passwordHash);
    if (!valid) throw new Error('Credenciales inválidas');

    const payload = { sub: user.id, role: user.role };
    const accessToken = this.tokenProvider.sign(payload);
    const refreshToken = this.tokenProvider.signRefresh(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
    };
  }
}
