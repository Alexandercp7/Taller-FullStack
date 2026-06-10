import { describe, it, expect } from 'vitest';
import { User } from '../../../../src/domain/entities/user.entity';
import { UserRole } from '../../../../src/domain/enums/user-role.enum';

function buildUser(overrides: Partial<{ role: UserRole; permissions: string[]; isActive: boolean }> = {}): User {
  return new User(
    'user-1',
    'Ana Gómez',
    'ana@example.com',
    '$hashed$password',
    overrides.role ?? UserRole.TECHNICIAN,
    overrides.permissions ?? [],
    overrides.isActive ?? true,
  );
}

describe('User', () => {
  it('expone los datos iniciales mediante getters', () => {
    const user = buildUser({ permissions: ['orders:read'] });

    expect(user.name).toBe('Ana Gómez');
    expect(user.email).toBe('ana@example.com');
    expect(user.passwordHash).toBe('$hashed$password');
    expect(user.role).toBe(UserRole.TECHNICIAN);
    expect(user.permissions).toEqual(['orders:read']);
    expect(user.isActive).toBe(true);
  });

  it('permissions retorna una copia del arreglo (no la referencia interna)', () => {
    const user = buildUser({ permissions: ['orders:read'] });

    const perms = user.permissions;
    perms.push('orders:write');

    expect(user.permissions).toEqual(['orders:read']);
  });

  describe('hasPermission', () => {
    it('un ADMIN tiene todos los permisos sin importar la lista', () => {
      const user = buildUser({ role: UserRole.ADMIN, permissions: [] });

      expect(user.hasPermission('orders:write')).toBe(true);
    });

    it('un usuario no-admin solo tiene los permisos asignados', () => {
      const user = buildUser({ role: UserRole.TECHNICIAN, permissions: ['orders:read'] });

      expect(user.hasPermission('orders:read')).toBe(true);
      expect(user.hasPermission('orders:write')).toBe(false);
    });
  });

  it('setPermissions reemplaza la lista de permisos', () => {
    const user = buildUser({ permissions: ['orders:read'] });

    user.setPermissions(['orders:write', 'orders:delete']);

    expect(user.permissions).toEqual(['orders:write', 'orders:delete']);
  });

  it('updatePassword reemplaza el hash de contraseña', () => {
    const user = buildUser();

    user.updatePassword('$new$hash');

    expect(user.passwordHash).toBe('$new$hash');
  });

  describe('updateProfile', () => {
    it('actualiza solo los campos provistos', () => {
      const user = buildUser();

      user.updateProfile({ name: 'Ana María Gómez' });

      expect(user.name).toBe('Ana María Gómez');
      expect(user.email).toBe('ana@example.com');
    });

    it('actualiza el email si se provee', () => {
      const user = buildUser();

      user.updateProfile({ email: 'nuevo@example.com' });

      expect(user.email).toBe('nuevo@example.com');
    });
  });

  it('deactivate marca al usuario como inactivo', () => {
    const user = buildUser({ isActive: true });

    user.deactivate();

    expect(user.isActive).toBe(false);
  });

  it('activate marca al usuario como activo', () => {
    const user = buildUser({ isActive: false });

    user.activate();

    expect(user.isActive).toBe(true);
  });
});
