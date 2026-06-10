import { describe, it, expect } from 'vitest';
import { DateRange } from '../../../../src/domain/value-objects/date-range.vo';
import { InvalidValueObjectError } from '../../../../src/domain/errors/invalid-value-object.error';

describe('DateRange', () => {
  it('crea un rango válido', () => {
    const start = new Date('2026-01-01');
    const end = new Date('2026-01-10');
    const range = DateRange.from(start, end);
    expect(range.start).toBe(start);
    expect(range.end).toBe(end);
  });

  it('permite que inicio y fin sean el mismo día', () => {
    const date = new Date('2026-01-01');
    const range = DateRange.from(date, date);
    expect(range.daysCount).toBe(0);
  });

  it('calcula daysCount correctamente', () => {
    const range = DateRange.from(new Date('2026-01-01'), new Date('2026-01-11'));
    expect(range.daysCount).toBe(10);
  });

  it('contains retorna true para una fecha dentro del rango', () => {
    const range = DateRange.from(new Date('2026-01-01'), new Date('2026-01-31'));
    expect(range.contains(new Date('2026-01-15'))).toBe(true);
  });

  it('contains retorna true para los límites del rango (inclusivo)', () => {
    const start = new Date('2026-01-01');
    const end = new Date('2026-01-31');
    const range = DateRange.from(start, end);
    expect(range.contains(start)).toBe(true);
    expect(range.contains(end)).toBe(true);
  });

  it('contains retorna false para una fecha fuera del rango', () => {
    const range = DateRange.from(new Date('2026-01-01'), new Date('2026-01-31'));
    expect(range.contains(new Date('2026-02-01'))).toBe(false);
  });

  it('lanza error si la fecha de inicio es posterior a la de fin', () => {
    expect(() => DateRange.from(new Date('2026-01-10'), new Date('2026-01-01'))).toThrow(
      InvalidValueObjectError,
    );
  });
});
