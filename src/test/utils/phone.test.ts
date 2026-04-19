import { describe, it, expect } from 'vitest';
import { normalizeSaudiPhone } from '@/components/form/FormPhoneInput';

describe('normalizeSaudiPhone', () => {
  it('converts 05xxxxxxxx to +9665xxxxxxxx', () => {
    expect(normalizeSaudiPhone('0512345678')).toBe('+966512345678');
  });

  it('converts 5xxxxxxxx to +9665xxxxxxxx', () => {
    expect(normalizeSaudiPhone('512345678')).toBe('+966512345678');
  });

  it('adds + to 9665xxxxxxxx', () => {
    expect(normalizeSaudiPhone('966512345678')).toBe('+966512345678');
  });

  it('keeps +9665xxxxxxxx as is', () => {
    expect(normalizeSaudiPhone('+966512345678')).toBe('+966512345678');
  });

  it('removes spaces and formats correctly', () => {
    expect(normalizeSaudiPhone('05 123 456 78')).toBe('+966512345678');
  });

  it('returns original if input is too short', () => {
    expect(normalizeSaudiPhone('123')).toBe('123');
  });
});
