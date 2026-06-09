import jwt from 'jsonwebtoken';
import { TokenProvider, TokenPayload } from '../../application/ports/services/token-provider.port';
import { env } from '../config/env';

export class JWTTokenProviderAdapter implements TokenProvider {
  constructor(private readonly secret: string) {}

  sign(payload: Omit<TokenPayload, 'iat' | 'exp'>, expiresIn = env.JWT_EXPIRES_IN): string {
    return jwt.sign(payload, this.secret, { expiresIn } as jwt.SignOptions);
  }

  verify(token: string): TokenPayload {
    return jwt.verify(token, this.secret) as TokenPayload;
  }

  signRefresh(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.secret + '_refresh', {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  verifyRefresh(token: string): TokenPayload {
    return jwt.verify(token, this.secret + '_refresh') as TokenPayload;
  }
}
