import { InvalidValueObjectError } from '../errors/invalid-value-object.error';

export class DateRange {
  private constructor(
    private readonly _start: Date,
    private readonly _end: Date,
  ) {}

  static from(start: Date, end: Date): DateRange {
    if (start > end) {
      throw new InvalidValueObjectError('DateRange', 'la fecha de inicio no puede ser posterior a la de fin');
    }
    return new DateRange(start, end);
  }

  get start(): Date {
    return this._start;
  }

  get end(): Date {
    return this._end;
  }

  get daysCount(): number {
    const ms = this._end.getTime() - this._start.getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }

  contains(date: Date): boolean {
    return date >= this._start && date <= this._end;
  }
}
