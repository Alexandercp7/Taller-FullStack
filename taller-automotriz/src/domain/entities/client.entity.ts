import { ClientTag } from '../enums/client-tag.enum';

export class Client {
  constructor(
    public readonly id: string,
    private _name: string,
    private _phone: string,
    private _email: string | null,
    private _tag: ClientTag,
    private _notes: string | null,
    public readonly createdAt: Date,
  ) {}

  get name(): string { return this._name; }
  get phone(): string { return this._phone; }
  get email(): string | null { return this._email; }
  get tag(): ClientTag { return this._tag; }
  get notes(): string | null { return this._notes; }

  updateInfo(data: { name?: string; email?: string | null; notes?: string | null }): void {
    if (data.name !== undefined) this._name = data.name;
    if (data.email !== undefined) this._email = data.email;
    if (data.notes !== undefined) this._notes = data.notes;
  }

  updateTag(tag: ClientTag): void {
    this._tag = tag;
  }

  updatePhone(phone: string): void {
    this._phone = phone;
  }
}
