import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Container } from '../../infrastructure/di/container';

export interface AuthUser {
  id: string;
  role: string;
}

export interface Context {
  req: FastifyRequest;
  res: FastifyReply;
  user: AuthUser | null;
  container: Container;
}

export function createContext(
  container: Container,
): (opts: { req: FastifyRequest; res: FastifyReply }) => Context {
  return ({ req, res }) => {
    let user: AuthUser | null = null;

    try {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const payload = container.tokenProvider.verify(token);
        user = { id: payload.sub, role: payload.role };
      }
    } catch {
      // invalid token → user stays null
    }

    return { req, res, user, container };
  };
}
