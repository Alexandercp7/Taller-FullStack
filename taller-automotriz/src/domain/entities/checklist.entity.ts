export class ChecklistItem {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    private _label: string,
    private _checked: boolean,
    private _phase: string | null,
  ) {}

  get label(): string { return this._label; }
  get checked(): boolean { return this._checked; }
  get phase(): string | null { return this._phase; }

  toggle(): void {
    this._checked = !this._checked;
  }

  check(): void { this._checked = true; }
  uncheck(): void { this._checked = false; }
}

export function calculateChecklistProgress(items: ChecklistItem[]): number {
  if (items.length === 0) return 0;
  const done = items.filter((i) => i.checked).length;
  return Math.round((done / items.length) * 100);
}
