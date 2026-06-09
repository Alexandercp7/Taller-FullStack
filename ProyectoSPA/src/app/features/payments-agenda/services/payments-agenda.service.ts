import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import type { Payment } from '../models/payment.model';

interface PaymentApi {
  id: number;
  concepto: string;
  tipo: string;
  categoria: string;
  fecha_vencimiento: string;
  monto_presupuestado: number;
  monto_pagado: number;
  estado: string;
  comprobante_url: string | null;
  notas: string | null;
}

interface Paginated<T> { data: T[] }

@Injectable({ providedIn: 'root' })
export class PaymentsAgendaService {
  private readonly _http = inject(HttpClient);
  private readonly _payments = signal<Payment[]>([]);

  constructor() { this.loadAll(); }

  private loadAll(): void {
    this._http.get<Paginated<PaymentApi>>('/api/v1/payments-agenda?per_page=100').subscribe({
      next: (res) => this._payments.set(res.data.map(this.map)),
    });
  }

  private map(item: PaymentApi): Payment {
    return {
      id: String(item.id),
      concepto: item.concepto,
      tipo: item.tipo as Payment['tipo'],
      categoria: item.categoria as Payment['categoria'],
      fechaVencimiento: item.fecha_vencimiento,
      estado: item.estado as Payment['estado'],
      montoPresupuestado: Number(item.monto_presupuestado),
      montoPagado: Number(item.monto_pagado),
      comprobanteUrl: item.comprobante_url ?? undefined,
      notas: item.notas ?? undefined,
    };
  }

  getPayments() { return this._payments(); }

  addPayment(payment: Payment) {
    const body = {
      concepto: payment.concepto,
      tipo: payment.tipo,
      categoria: payment.categoria,
      fecha_vencimiento: payment.fechaVencimiento,
      monto_presupuestado: payment.montoPresupuestado,
      monto_pagado: payment.montoPagado,
      notas: payment.notas,
    };
    this._http.post<{ data: PaymentApi }>('/api/v1/payments-agenda', body).subscribe({
      next: (res) => this._payments.update(list => [...list, this.map(res.data)]),
    });
  }

  updatePayment(id: string, update: Partial<Payment>) {
    this._payments.update(list => list.map(p => p.id === id ? { ...p, ...update } : p));
    const body: Record<string, unknown> = {};
    if (update.concepto) body['concepto'] = update.concepto;
    if (update.tipo) body['tipo'] = update.tipo;
    if (update.categoria) body['categoria'] = update.categoria;
    if (update.fechaVencimiento) body['fecha_vencimiento'] = update.fechaVencimiento;
    if (update.montoPresupuestado !== undefined) body['monto_presupuestado'] = update.montoPresupuestado;
    if (update.montoPagado !== undefined) body['monto_pagado'] = update.montoPagado;
    if (update.notas !== undefined) body['notas'] = update.notas;
    if (update.estado !== undefined) body['estado'] = update.estado;
    this._http.put(`/api/v1/payments-agenda/${id}`, body).subscribe();
  }

  deletePayment(id: string) {
    this._payments.update(list => list.filter(p => p.id !== id));
  }

  generatePaymentWithId(payment: Omit<Payment, 'id' | 'comprobanteUrl'>): Payment {
    return { ...payment, id: `PAG-${Date.now()}` };
  }
}
