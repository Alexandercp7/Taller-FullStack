import { Money } from '../value-objects/money.vo';

export class Quote {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    private _serviceId: string | null,
    private _subtotal: Money,
    private _tax: Money,
    private _total: Money,
    private _isApproved: boolean,
    private _approvedAt: Date | null,
    private _pdfUrl: string | null,
  ) {}

  get serviceId(): string | null { return this._serviceId; }
  get subtotal(): Money { return this._subtotal; }
  get tax(): Money { return this._tax; }
  get total(): Money { return this._total; }
  get isApproved(): boolean { return this._isApproved; }
  get approvedAt(): Date | null { return this._approvedAt; }
  get pdfUrl(): string | null { return this._pdfUrl; }

  approve(): void {
    this._isApproved = true;
    this._approvedAt = new Date();
  }

  updateTotals(subtotal: Money, tax: Money, total: Money): void {
    this._subtotal = subtotal;
    this._tax = tax;
    this._total = total;
  }

  attachPdf(url: string): void {
    this._pdfUrl = url;
  }

  assignService(serviceId: string): void {
    this._serviceId = serviceId;
  }
}
