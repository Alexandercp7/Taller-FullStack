import { describe, it, expect } from 'vitest';
import { Email } from '../../../../src/domain/value-objects/email.vo';
import { InvalidValueObjectError } from '../../../../src/domain/errors/invalid-value-object.error';

describe('Email', () => {
  it('crea un email válido', () => {
    const email = Email.from('test@example.com');
    expect(email.value).toBe('test@example.com');
  });

  it('normaliza a minúsculas', () => {
    const email = Email.from('Test@Example.COM');
    expect(email.value).toBe('test@example.com');
  });

  it('elimina espacios al inicio y al final', () => {
    const email = Email.from('  test@example.com  ');
    expect(email.value).toBe('test@example.com');
  });

  it('toString retorna el valor normalizado', () => {
    const email = Email.from('Foo@Bar.com');
    expect(email.toString()).toBe('foo@bar.com');
  });

  it('lanza error si falta el @', () => {
    expect(() => Email.from('test.example.com')).toThrow(InvalidValueObjectError);
  });

  it('lanza error si falta el dominio', () => {
    expect(() => Email.from('test@')).toThrow(InvalidValueObjectError);
  });

  it('lanza error si falta la extensión del dominio', () => {
    expect(() => Email.from('test@example')).toThrow(InvalidValueObjectError);
  });

  it('lanza error si contiene espacios internos', () => {
    expect(() => Email.from('te st@example.com')).toThrow(InvalidValueObjectError);
  });

  it('lanza error con cadena vacía', () => {
    expect(() => Email.from('')).toThrow(InvalidValueObjectError);
  });
});
