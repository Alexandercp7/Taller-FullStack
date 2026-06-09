import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import type { Contact } from '../models/contact.model';

interface ContactApi {
  id: number;
  nombre: string;
  rfc: string;
  empresa: string;
  telefono: string;
  correo: string;
  dias_pago: number;
  limite_credito: number;
  politica_descuentos: string;
  productos: { id: number; nombre: string; cantidad?: number }[] | null;
  etiquetas: string[] | null;
}

interface Paginated<T> { data: T[] }

@Injectable({ providedIn: 'root' })
export class ContactsService {
  private readonly _http = inject(HttpClient);
  private readonly _contacts = signal<Contact[]>([]);

  constructor() { this.loadAll(); }

  private loadAll(): void {
    this._http.get<Paginated<ContactApi>>('/api/v1/contacts?per_page=100').subscribe({
      next: (res) => this._contacts.set(res.data.map(this.map)),
    });
  }

  private map(item: ContactApi): Contact {
    return {
      id: String(item.id),
      nombre: item.nombre,
      rfc: item.rfc ?? '',
      telefono: item.telefono ?? '',
      correo: item.correo ?? '',
      empresa: item.empresa ?? '',
      condicionesDeCreditoL: {
        diasPago: item.dias_pago ?? 0,
        limiteCredito: item.limite_credito ?? 0,
        politicaDescuentos: item.politica_descuentos ?? '',
      },
      productosQueSurten: (item.productos ?? []).map(p => ({
        id: String(p.id),
        nombre: p.nombre,
        cantidad: p.cantidad,
      })),
      etiquetas: item.etiquetas ?? [],
    };
  }

  getContacts() { return this._contacts(); }

  getContactById(id: string): Contact | undefined {
    return this._contacts().find(c => c.id === id);
  }

  addContact(contact: Contact) {
    if (!contact.nombre?.trim()) return;
    const body = this.toBody(contact);
    // Optimistic add with temp id
    const temp = { ...contact };
    this._contacts.update(list => [...list, temp]);
    this._http.post<{ data: ContactApi }>('/api/v1/contacts', body).subscribe({
      next: (res) => {
        const real = this.map(res.data);
        this._contacts.update(list => list.map(c => c.id === temp.id ? real : c));
      },
      error: () => {
        this._contacts.update(list => list.filter(c => c.id !== temp.id));
      },
    });
  }

  updateContact(id: string, update: Partial<Contact>) {
    this._contacts.update(list => list.map(c => c.id === id ? { ...c, ...update } : c));
    const current = this._contacts().find(c => c.id === id);
    if (current) this._http.put(`/api/v1/contacts/${id}`, this.toBody({ ...current, ...update })).subscribe();
  }

  deleteContact(id: string) {
    this._contacts.update(list => list.filter(c => c.id !== id));
    this._http.delete(`/api/v1/contacts/${id}`).subscribe();
  }

  generateContactWithId(contact: Omit<Contact, 'id'>): Contact {
    return { ...contact, id: `CONT-${Date.now().toString().slice(-6)}` };
  }

  getAllTags(): string[] {
    const tags = new Set<string>();
    this._contacts().forEach(c => c.etiquetas.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }

  addTag(_tag: string): void {}

  private toBody(c: Contact) {
    return {
      nombre: c.nombre,
      rfc: c.rfc,
      empresa: c.empresa,
      telefono: c.telefono,
      correo: c.correo,
      dias_pago: c.condicionesDeCreditoL.diasPago,
      limite_credito: c.condicionesDeCreditoL.limiteCredito,
      politica_descuentos: c.condicionesDeCreditoL.politicaDescuentos,
    };
  }
}
