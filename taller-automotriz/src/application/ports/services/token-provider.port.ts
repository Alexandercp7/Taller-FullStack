export interface TokenPayload {
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface TokenProvider {
  sign(payload: Omit<TokenPayload, 'iat' | 'exp'>, expiresIn?: string): string;
  verify(token: string): TokenPayload;
  signRefresh(payload: Omit<TokenPayload, 'iat' | 'exp'>): string;
  verifyRefresh(token: string): TokenPayload;
}
