import argon2 from 'argon2';
import { Hasher } from '../../application/ports/services/hasher.port';

export class Argon2HasherAdapter implements Hasher {
  async hash(plain: string): Promise<string> {
    return argon2.hash(plain);
  }

  async verify(plain: string, hashed: string): Promise<boolean> {
    return argon2.verify(hashed, plain);
  }
}
