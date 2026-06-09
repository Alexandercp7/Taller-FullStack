import { InventoryType } from '../enums/inventory-type.enum';
import { MovementType } from '../enums/movement-type.enum';
import { Money } from '../value-objects/money.vo';
import { StockCalculator } from '../services/stock-calculator.service';
import { StockBelowMinimum } from '../events/stock-below-minimum.event';
import { DomainEvent } from '../events/domain-event';

export interface StockMovementRecord {
  id: string;
  itemId: string;
  type: MovementType;
  quantity: number;
  reason: string | null;
  orderId: string | null;
  userId: string;
}

export interface DeductionResult {
  movement: Omit<StockMovementRecord, 'id'>;
  isBelowMinimum: boolean;
}

export class InventoryItem {
  private _domainEvents: DomainEvent[] = [];

  constructor(
    public readonly id: string,
    private _name: string,
    private _description: string | null,
    private _sku: string | null,
    private _type: InventoryType,
    private _stock: number,
    private _minStock: number,
    private _purchasePrice: Money,
    private _salePrice: Money,
    private _supplierId: string | null,
    private _location: string | null,
    private _isActive: boolean,
  ) {}

  get name(): string { return this._name; }
  get description(): string | null { return this._description; }
  get sku(): string | null { return this._sku; }
  get type(): InventoryType { return this._type; }
  get stock(): number { return this._stock; }
  get minStock(): number { return this._minStock; }
  get purchasePrice(): Money { return this._purchasePrice; }
  get salePrice(): Money { return this._salePrice; }
  get supplierId(): string | null { return this._supplierId; }
  get location(): string | null { return this._location; }
  get isActive(): boolean { return this._isActive; }
  get domainEvents(): ReadonlyArray<DomainEvent> { return this._domainEvents; }
  get isBelowMinimum(): boolean { return this._stock < this._minStock; }

  deductStock(quantity: number, userId: string, orderId: string): DeductionResult {
    const result = StockCalculator.validateAndDeduct(this._stock, quantity, this._minStock);
    this._stock = result.newStock;

    if (result.isBelowMinimum) {
      this._domainEvents.push(
        new StockBelowMinimum(this.id, this._stock, this._minStock, this._name),
      );
    }

    return {
      movement: {
        itemId: this.id,
        type: MovementType.EXIT,
        quantity,
        reason: `Asignado a orden`,
        orderId,
        userId,
      },
      isBelowMinimum: result.isBelowMinimum,
    };
  }

  addStock(quantity: number, userId: string, reason?: string): Omit<StockMovementRecord, 'id'> {
    this._stock += quantity;
    return {
      itemId: this.id,
      type: MovementType.ENTRY,
      quantity,
      reason: reason ?? null,
      orderId: null,
      userId,
    };
  }

  adjustStock(newStock: number, userId: string, reason: string): Omit<StockMovementRecord, 'id'> {
    const diff = newStock - this._stock;
    const type = diff >= 0 ? MovementType.ENTRY : MovementType.EXIT;
    this._stock = newStock;
    return {
      itemId: this.id,
      type,
      quantity: Math.abs(diff),
      reason,
      orderId: null,
      userId,
    };
  }

  updatePrices(purchasePrice: Money, salePrice: Money): void {
    this._purchasePrice = purchasePrice;
    this._salePrice = salePrice;
  }

  updateInfo(data: {
    name?: string;
    description?: string | null;
    sku?: string | null;
    type?: InventoryType;
    minStock?: number;
    supplierId?: string | null;
    location?: string | null;
  }): void {
    if (data.name !== undefined) this._name = data.name;
    if (data.description !== undefined) this._description = data.description;
    if (data.sku !== undefined) this._sku = data.sku;
    if (data.type !== undefined) this._type = data.type;
    if (data.minStock !== undefined) this._minStock = data.minStock;
    if (data.supplierId !== undefined) this._supplierId = data.supplierId;
    if (data.location !== undefined) this._location = data.location;
  }

  deactivate(): void {
    this._isActive = false;
  }

  clearEvents(): void {
    this._domainEvents = [];
  }
}
