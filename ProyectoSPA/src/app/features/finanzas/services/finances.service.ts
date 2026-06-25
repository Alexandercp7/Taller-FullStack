import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import type {
  AccountPayable, AccountReceivable, DailyCashEntry, MonthComparative,
  ServicePopularity, TechnicianKPIData,
} from '../models/finances.models';

interface CashApi {
  id: number; fecha: string; concepto: string; tipo: string;
  monto: number; metodo_pago: string; referencia: string | null;
}
interface ReceivableApi {
  id: number; work_order_id: string; code?: string; cliente: string;
  monto: number; monto_recibido: number; monto_pendiente: number;
  fecha_emision: string; fecha_vencimiento: string | null; estado: string; estado_calculado?: string;
}
interface PayableApi {
  id: number; concepto: string; proveedor: string | null;
  monto: number; monto_pagado: number; monto_pendiente: number;
  fecha_vencimiento: string; estado: string; estado_calculado?: string; created_at: string;
}
interface ComparativeApi { mes: string; label: string; ingresos: number; egresos: number; ots: number }
interface Paginated<T> { data: T[] }

@Injectable({ providedIn: 'root' })
export class FinancesService {
  private readonly _http = inject(HttpClient);

  private readonly _dailyCashEntries = signal<DailyCashEntry[]>([]);
  private readonly _accountsReceivable = signal<AccountReceivable[]>([]);
  private readonly _accountsPayable = signal<AccountPayable[]>([]);
  private readonly _servicesPopularity = signal<ServicePopularity[]>([]);
  private readonly _technicianKPIs = signal<TechnicianKPIData[]>([]);
  private readonly _monthComparatives = signal<MonthComparative[]>([]);

  public readonly dailyCashEntries = this._dailyCashEntries.asReadonly();
  public readonly accountsReceivable = this._accountsReceivable.asReadonly();
  public readonly accountsPayable = this._accountsPayable.asReadonly();
  public readonly servicesPopularity = this._servicesPopularity.asReadonly();
  public readonly technicianKPIs = this._technicianKPIs.asReadonly();
  public readonly monthComparatives = this._monthComparatives.asReadonly();

  constructor() {
    this.loadCash();
    this.loadReceivable();
    this.loadPayable();
    this.loadComparative();
  }

  private loadCash(): void {
    this._http.get<Paginated<CashApi>>('/api/v1/finance/cash?per_page=100').subscribe({
      next: (res) => this._dailyCashEntries.set(res.data.map(this.mapCash)),
    });
  }

  private loadReceivable(): void {
    this._http.get<Paginated<ReceivableApi>>('/api/v1/finance/receivable?per_page=100').subscribe({
      next: (res) => this._accountsReceivable.set(res.data.map(this.mapReceivable)),
    });
  }

  private loadPayable(): void {
    this._http.get<Paginated<PayableApi>>('/api/v1/finance/payable?per_page=100').subscribe({
      next: (res) => this._accountsPayable.set(res.data.map(this.mapPayable)),
    });
  }

  private loadComparative(): void {
    this._http.get<{ data: ComparativeApi[] }>('/api/v1/finance/comparative').subscribe({
      next: (res) => this._monthComparatives.set(res.data.map(c => ({
        mes: c.label,
        ingresos: Number(c.ingresos),
        egresos: Number(c.egresos),
        saldo: Number(c.ingresos) - Number(c.egresos),
        otsCantidad: c.ots,
      }))),
    });
  }

  private mapCash(item: CashApi): DailyCashEntry {
    return {
      id: String(item.id), fecha: item.fecha, concepto: item.concepto,
      tipo: item.tipo as DailyCashEntry['tipo'], monto: Number(item.monto),
      metodoPago: item.metodo_pago as DailyCashEntry['metodoPago'],
      referencia: item.referencia ?? undefined, usuario: '',
    };
  }

  private mapReceivable(item: ReceivableApi): AccountReceivable {
    const code = item.code ?? item.work_order_id;
    return {
      id: String(item.id), otId: item.work_order_id, code,
      cliente: item.cliente ?? '',
      concepto: `OT ${code}`, monto: Number(item.monto),
      montoRecibido: Number(item.monto_recibido), montoPendiente: Number(item.monto_pendiente),
      fechaEmision: item.fecha_emision, fechaVencimiento: item.fecha_vencimiento ?? undefined,
      estado: (item.estado_calculado ?? item.estado) as AccountReceivable['estado'],
    };
  }

  private mapPayable(item: PayableApi): AccountPayable {
    return {
      id: String(item.id), proveedor: item.proveedor ?? 'Proveedor', concepto: item.concepto,
      monto: Number(item.monto), montoPagado: Number(item.monto_pagado),
      montoPendiente: Number(item.monto_pendiente),
      fechaEmision: item.created_at?.split('T')[0] ?? '',
      fechaVencimiento: item.fecha_vencimiento,
      estado: (item.estado_calculado ?? item.estado) as AccountPayable['estado'],
    };
  }

  public readonly dailyCashSummary = computed(() => {
    const entries = this._dailyCashEntries();
    const today = new Date().toISOString().split('T')[0];
    const ingresos = entries.filter(e => e.tipo === 'Ingreso').reduce((s, e) => s + e.monto, 0);
    const egresos  = entries.filter(e => e.tipo === 'Egreso').reduce((s, e) => s + e.monto, 0);
    return {
      fecha: today, ingresosCaja: ingresos, egresosCaja: egresos, saldoFinal: ingresos - egresos,
      transacciones: entries,
      detalleMetodoPago: {
        efectivo:     entries.filter(e => e.metodoPago === 'Efectivo').reduce((s, e) => s + e.monto, 0),
        transferencia:entries.filter(e => e.metodoPago === 'Transferencia').reduce((s, e) => s + e.monto, 0),
        tarjeta:      entries.filter(e => e.metodoPago === 'Tarjeta').reduce((s, e) => s + e.monto, 0),
      },
    };
  });

  public readonly receivableSummary = computed(() => {
    const accounts = this._accountsReceivable();
    return {
      total: accounts.reduce((s, a) => s + a.monto, 0),
      received: accounts.reduce((s, a) => s + a.montoRecibido, 0),
      pending: accounts.reduce((s, a) => s + a.montoPendiente, 0),
      overdue: accounts.filter(a => a.estado === 'Vencido').length, accounts,
    };
  });

  public readonly payableSummary = computed(() => {
    const accounts = this._accountsPayable();
    return {
      total: accounts.reduce((s, a) => s + a.monto, 0),
      paid: accounts.reduce((s, a) => s + a.montoPagado, 0),
      pending: accounts.reduce((s, a) => s + a.montoPendiente, 0),
      overdue: accounts.filter(a => a.estado === 'Vencido').length, accounts,
    };
  });

  public readonly totalIncome   = computed(() => this._monthComparatives().reduce((s, m) => s + m.ingresos, 0));
  public readonly totalExpenses = computed(() => this._monthComparatives().reduce((s, m) => s + m.egresos, 0));
  public readonly totalBalance  = computed(() => this.totalIncome() - this.totalExpenses());

  public addDailyCashEntry(entry: Omit<DailyCashEntry, 'id'>): void {
    const body = {
      concepto: entry.concepto, tipo: entry.tipo, monto: entry.monto,
      metodo_pago: entry.metodoPago, fecha: entry.fecha, referencia: entry.referencia,
    };
    this._http.post<{ data: CashApi }>('/api/v1/finance/cash', body).subscribe({
      next: (res) => this._dailyCashEntries.update(list => [this.mapCash(res.data), ...list]),
    });
  }

  public removeDailyCashEntry(id: string): void {
    const prev = this._dailyCashEntries().find(e => e.id === id);
    if (!prev) return;
    this._dailyCashEntries.update(list => list.filter(e => e.id !== id));
    this._http.delete(`/api/v1/finance/cash/${id}`).subscribe({
      error: () => this._dailyCashEntries.update(list => [prev, ...list]),
    });
  }

  public updateDailyCashEntry(id: string, updates: Partial<DailyCashEntry>): void {
    this._dailyCashEntries.update(list => list.map(e => e.id === id ? { ...e, ...updates } : e));
  }

  public addAccountReceivable(account: Omit<AccountReceivable, 'id'>): void {
    this._accountsReceivable.update(list => [{ ...account, id: `cxc-${Date.now()}` }, ...list]);
  }

  public updateAccountReceivable(id: string, updates: Partial<AccountReceivable>): void {
    this._accountsReceivable.update(list => list.map(a => a.id === id ? { ...a, ...updates } : a));
  }

  public removeAccountReceivable(id: string): void {
    this._accountsReceivable.update(list => list.filter(a => a.id !== id));
  }

  public addAccountPayable(account: Omit<AccountPayable, 'id'>): void {
    this._accountsPayable.update(list => [{ ...account, id: `cxp-${Date.now()}` }, ...list]);
  }

  public updateAccountPayable(id: string, updates: Partial<AccountPayable>): void {
    this._accountsPayable.update(list => list.map(a => a.id === id ? { ...a, ...updates } : a));
  }

  public removeAccountPayable(id: string): void {
    this._accountsPayable.update(list => list.filter(a => a.id !== id));
  }

  public getDailyCashEntry(id: string): DailyCashEntry | undefined { return this._dailyCashEntries().find(e => e.id === id); }
  public getAccountReceivable(id: string): AccountReceivable | undefined { return this._accountsReceivable().find(a => a.id === id); }
  public getAccountPayable(id: string): AccountPayable | undefined { return this._accountsPayable().find(a => a.id === id); }
  public getReceivablesByStatus(status: string): AccountReceivable[] { return this._accountsReceivable().filter(a => a.estado === status); }
  public getPayablesByStatus(status: string): AccountPayable[] { return this._accountsPayable().filter(a => a.estado === status); }
  public getOverdueReceivables(): AccountReceivable[] { return this._accountsReceivable().filter(a => a.estado === 'Vencido'); }
  public getOverduePayables(): AccountPayable[] { return this._accountsPayable().filter(a => a.estado === 'Vencido'); }
  public getMonthlyComparative(): MonthComparative[] { return this._monthComparatives(); }
  public getServicePopularity(): ServicePopularity[] { return this._servicesPopularity(); }
  public getTechnicianKPIs(): TechnicianKPIData[] { return this._technicianKPIs(); }
  public getTopTechnicians(limit = 3): TechnicianKPIData[] { return this._technicianKPIs().sort((a, b) => b.ingresoGenerado - a.ingresoGenerado).slice(0, limit); }
  public getMostPopularServices(limit = 3): ServicePopularity[] { return this._servicesPopularity().sort((a, b) => b.cantidad - a.cantidad).slice(0, limit); }
}
