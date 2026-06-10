import { describe, it, expect } from 'vitest';
import { Client } from '../../../../src/domain/entities/client.entity';
import { ClientTag } from '../../../../src/domain/enums/client-tag.enum';

function buildClient(overrides: Partial<{ tag: ClientTag; email: string | null; notes: string | null }> = {}): Client {
  return new Client(
    'client-1',
    'Juan Pérez',
    '5512345678',
    overrides.email ?? null,
    overrides.tag ?? ClientTag.NEW,
    overrides.notes ?? null,
    new Date('2026-01-01'),
  );
}

describe('Client', () => {
  it('expone los datos iniciales mediante getters', () => {
    const client = buildClient({ email: 'juan@example.com', notes: 'cliente puntual' });

    expect(client.name).toBe('Juan Pérez');
    expect(client.phone).toBe('5512345678');
    expect(client.email).toBe('juan@example.com');
    expect(client.tag).toBe(ClientTag.NEW);
    expect(client.notes).toBe('cliente puntual');
  });

  describe('updateInfo', () => {
    it('actualiza solo los campos provistos', () => {
      const client = buildClient({ email: 'old@example.com', notes: 'nota vieja' });

      client.updateInfo({ name: 'Juan Carlos Pérez' });

      expect(client.name).toBe('Juan Carlos Pérez');
      expect(client.email).toBe('old@example.com');
      expect(client.notes).toBe('nota vieja');
    });

    it('permite limpiar email y notas pasando null', () => {
      const client = buildClient({ email: 'old@example.com', notes: 'nota vieja' });

      client.updateInfo({ email: null, notes: null });

      expect(client.email).toBeNull();
      expect(client.notes).toBeNull();
    });

    it('no modifica nada si no se pasan campos', () => {
      const client = buildClient({ email: 'a@a.com', notes: 'n' });

      client.updateInfo({});

      expect(client.name).toBe('Juan Pérez');
      expect(client.email).toBe('a@a.com');
      expect(client.notes).toBe('n');
    });
  });

  it('updateTag cambia la etiqueta del cliente', () => {
    const client = buildClient({ tag: ClientTag.NEW });

    client.updateTag(ClientTag.FREQUENT);

    expect(client.tag).toBe(ClientTag.FREQUENT);
  });

  it('updatePhone cambia el teléfono', () => {
    const client = buildClient();

    client.updatePhone('5599998888');

    expect(client.phone).toBe('5599998888');
  });
});
