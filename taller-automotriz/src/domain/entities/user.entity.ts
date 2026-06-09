import { UserRole } from '../enums/user-role.enum';

export class User {
  constructor(
    public readonly id: string,
    private _name: string,
    private _email: string,
    private _passwordHash: string,
    private _role: UserRole,
    private _permissions: string[],
    private _isActive: boolean,
  ) {}

  get name(): string { return this._name; }
  get email(): string { return this._email; }
  get passwordHash(): string { return this._passwordHash; }
  get role(): UserRole { return this._role; }
  get permissions(): string[] { return [...this._permissions]; }
  get isActive(): boolean { return this._isActive; }

  hasPermission(permission: string): boolean {
    if (this._role === UserRole.ADMIN) return true;
    return this._permissions.includes(permission);
  }

  setPermissions(permissions: string[]): void {
    this._permissions = permissions;
  }

  updatePassword(newHash: string): void {
    this._passwordHash = newHash;
  }

  updateProfile(data: { name?: string; email?: string }): void {
    if (data.name !== undefined) this._name = data.name;
    if (data.email !== undefined) this._email = data.email;
  }

  deactivate(): void {
    this._isActive = false;
  }

  activate(): void {
    this._isActive = true;
  }
}
