import { Injectable, inject } from '@angular/core';
import type { DailyCashEntry, AccountReceivable, AccountPayable } from '../models/finances.models';
import { FinancesService } from './finances.service';

/**
 * Thin delegate that re-exports FinancesService signals and methods.
 * Kept for backwards compatibility with existing components;
 * all data loading is handled by FinancesService to avoid duplicate HTTP calls.
 */
@Injectable({ providedIn: 'root' })
export class FinancesDataService {
  private readonly _svc = inject(FinancesService);

  public readonly dailyCashEntries = this._svc.dailyCashEntries;
  public readonly accountsReceivable = this._svc.accountsReceivable;
  public readonly accountsPayable = this._svc.accountsPayable;

  getDailyCashEntries(): DailyCashEntry[] { return this._svc.dailyCashEntries(); }
  getAccountsReceivable(): AccountReceivable[] { return this._svc.accountsReceivable(); }
  getAccountsPayable(): AccountPayable[] { return this._svc.accountsPayable(); }
  getCompletedWorkOrders(): unknown[] { return []; }

  getExpenses() {
    return this._svc.dailyCashEntries()
      .filter(e => e.tipo === 'Egreso')
      .map(e => ({ id: e.id, concepto: e.concepto, monto: e.monto, fecha: e.fecha, categoria: 'Gasto', proveedor: '' }));
  }

  addDailyCashEntry(entry: DailyCashEntry): void {
    this._svc.addDailyCashEntry(entry);
  }

  removeDailyCashEntry(id: string): void {
    this._svc.removeDailyCashEntry(id);
  }
}
