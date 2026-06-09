export class Supplier {
  constructor(
    public readonly id: string,
    private _name: string,
    private _contact: string | null,
    private _phone: string | null,
    private _email: string | null,
    private _notes: string | null,
    private _isActive: boolean,
  ) {}

  get name(): string { return this._name; }
  get contact(): string | null { return this._contact; }
  get phone(): string | null { return this._phone; }
  get email(): string | null { return this._email; }
  get notes(): string | null { return this._notes; }
  get isActive(): boolean { return this._isActive; }

  update(data: {
    name?: string;
    contact?: string | null;
    phone?: string | null;
    email?: string | null;
    notes?: string | null;
  }): void {
    if (data.name !== undefined) this._name = data.name;
    if (data.contact !== undefined) this._contact = data.contact;
    if (data.phone !== undefined) this._phone = data.phone;
    if (data.email !== undefined) this._email = data.email;
    if (data.notes !== undefined) this._notes = data.notes;
  }

  deactivate(): void { this._isActive = false; }
  activate(): void { this._isActive = true; }
}
