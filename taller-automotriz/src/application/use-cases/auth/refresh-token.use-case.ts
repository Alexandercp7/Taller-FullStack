import { UserRepository } from '../../ports/repositories/user.repository';
import { TokenProvider } from '../../ports/services/token-provider.port';

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async execute(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = this.tokenProvider.verifyRefresh(refreshToken);

    const user = await this.userRepo.findById(payload.sub);
    if (!user || !user.isActive) throw new Error('Usuario no encontrado o inactivo');

    const newPayload = { sub: user.id, role: user.role };
    return {
      accessToken: this.tokenProvider.sign(newPayload),
      refreshToken: this.tokenProvider.signRefresh(newPayload),
    };
  }
}
