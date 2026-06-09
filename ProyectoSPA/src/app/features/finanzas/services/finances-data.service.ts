import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import type { DailyCashEntry, AccountReceivable, AccountPayable } from '../models/finances.models';

interface CashApi {
  id: number; fecha: string; concepto: string; tipo: string;
  monto: number; metodo_pago: string; referencia: string | null;
}
interface ReceivableApi {
  id: number; work_order_id: string; client_id: number; cliente: string;
  monto: number; monto_recibido: number; monto_pendiente: number;
  fecha_emision: string; fecha_vencimiento: string | null; estado: string; estado_calculado?: string;
}
interface PayableApi {
  id: number; concepto: string; contact_id: number | null; proveedor: string | null;
  monto: number; monto_pagado: number; monto_pendiente: number;
  fecha_vencimiento: string; estado: string; estado_calculado?: string; created_at: string;
}
interface Paginated<T> { data: T[] }

@Injectable({ providedIn: 'root' })
export class FinancesDataService {
  private readonly _http = inject(HttpClient);

  private readonly _accountsReceivableData = signal<AccountReceivable[]>([]);
  private readonly _accountsPayableData = signal<AccountPayable[]>([]);
  private readonly _dailyCashData = signal<DailyCashEntry[]>([]);
  private readonly _workOrdersData = signal<any[]>([]);

  public readonly dailyCashEntries = this._dailyCashData.asReadonly();
  public readonly accountsReceivable = this._accountsReceivableData.asReadonly();
  public readonly accountsPayable = this._accountsPayableData.asReadonly();

  constructor() {
    this.loadReceivable();
    this.loadPayable();
    this.loadCash();
  }

  private loadReceivable(): void {
    this._http.get<Paginated<ReceivableApi>>('/api/v1/finance/receivable?per_page=100').subscribe({
      next: (res) => this._accountsReceivableData.set(res.data.map(this.mapReceivable)),
    });
  }

  private loadPayable(): void {
    this._http.get<Paginated<PayableApi>>('/api/v1/finance/payable?per_page=100').subscribe({
      next: (res) => this._accountsPayableData.set(res.data.map(this.mapPayable)),
    });
  }

  private loadCash(): void {
    this._http.get<Paginated<CashApi>>('/api/v1/finance/cash?per_page=100').subscribe({
      next: (res) => this._dailyCashData.set(res.data.map(this.mapCash)),
    });
  }

  private mapCash(item: CashApi): DailyCashEntry {
    return {
      id: String(item.id),
      fecha: item.fecha,
      concepto: item.concepto,
      tipo: item.tipo as DailyCashEntry['tipo'],
      monto: Number(item.monto),
      metodoPago: item.metodo_pago as DailyCashEntry['metodoPago'],
      referencia: item.referencia ?? undefined,
      usuario: '',
    };
  }

  private mapReceivable(item: ReceivableApi): AccountReceivable {
    return {
      id: String(item.id),
      otId: item.work_order_id,
      cliente: item.cliente ?? '',
      concepto: `OT ${item.work_order_id}`,
      monto: Number(item.monto),
      montoRecibido: Number(item.monto_recibido),
      montoPendiente: Number(item.monto_pendiente),
      fechaEmision: item.fecha_emision,
      fechaVencimiento: item.fecha_vencimiento ?? undefined,
      estado: (item.estado_calculado ?? item.estado) as AccountReceivable['estado'],
    };
  }

  private mapPayable(item: PayableApi): AccountPayable {
    return {
      id: String(item.id),
      proveedor: item.proveedor ?? 'Proveedor',
      concepto: item.concepto,
      monto: Number(item.monto),
      montoPagado: Number(item.monto_pagado),
      montoPendiente: Number(item.monto_pendiente),
      fechaEmision: item.created_at?.split('T')[0] ?? '',
      fechaVencimiento: item.fecha_vencimiento,
      estado: (item.estado_calculado ?? item.estado) as AccountPayable['estado'],
    };
  }

  getCompletedWorkOrders() { return this._workOrdersData(); }

  getExpenses() {
    return this._dailyCashData()
      .filter(e => e.tipo === 'Egreso')
      .map(e => ({ id: e.id, concepto: e.concepto, monto: e.monto, fecha: e.fecha, categoria: 'Gasto', proveedor: '' }));
  }

  getAccountsReceivable() { return this._accountsReceivableData(); }

  getAccountsPayable() { return this._accountsPayableData(); }

  getDailyCashEntries() { return this._dailyCashData(); }

  addDailyCashEntry(entry: DailyCashEntry) {
    const body = {
      concepto: entry.concepto, tipo: entry.tipo, monto: entry.monto,
      metodo_pago: entry.metodoPago, fecha: entry.fecha, referencia: entry.referencia,
    };
    this._http.post<{ data: CashApi }>('/api/v1/finance/cash', body).subscribe({
      next: (res) => this._dailyCashData.update(list => [this.mapCash(res.data), ...list]),
    });
  }

  removeDailyCashEntry(id: string) {
    this._dailyCashData.update(list => list.filter(e => e.id !== id));
    this._http.delete(`/api/v1/finance/cash/${id}`).subscribe();
  }

  updateReceivablePayment(id: string, paymentAmount: number) {
    this._accountsReceivableData.update(list =>
      list.map(ar => {
        if (ar.id !== id) return ar;
        const newReceived = ar.montoRecibido + paymentAmount;
        const newPending = Math.max(0, ar.montoPendiente - paymentAmount);
        const estado: AccountReceivable['estado'] = newPending === 0 ? 'Pagado' : 'Parcial';
        return { ...ar, montoRecibido: newReceived, montoPendiente: newPending, estado };
      })
    );
    this._http.patch(`/api/v1/finance/receivable/${id}/payment`, {
      monto: paymentAmount, metodo_pago: 'Efectivo',
    }).subscribe({
      next: () => this.loadReceivable(),
    });
  }

  updatePayablePayment(id: string, paymentAmount: number) {
    this._accountsPayableData.update(list =>
      list.map(ap => {
        if (ap.id !== id) return ap;
        const newPaid = ap.montoPagado + paymentAmount;
        const newPending = Math.max(0, ap.montoPendiente - paymentAmount);
        const estado: AccountPayable['estado'] = newPending === 0 ? 'Pagado' : 'Parcial';
        return { ...ap, montoPagado: newPaid, montoPendiente: newPending, estado };
      })
    );
    this._http.patch(`/api/v1/finance/payable/${id}/payment`, {
      monto: paymentAmount, metodo_pago: 'Efectivo',
    }).subscribe({
      next: () => this.loadPayable(),
    });
  }

  removeReceivable(id: string) {
    this._accountsReceivableData.update(list => list.filter(ar => ar.id !== id));
  }

  removePayable(id: string) {
    this._accountsPayableData.update(list => list.filter(ap => ap.id !== id));
  }
}
