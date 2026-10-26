import { describe, expect, it } from 'vitest';
import {
  ageFromDateOfBirth,
  formatDateForInput,
  isValidDateOfBirth,
} from './dateOfBirth';

const today = new Date(2026, 9, 11, 12);

describe('date of birth helpers', () => {
  it('calculates age before and on a birthday', () => {
    expect(ageFromDateOfBirth('2013-10-12', today)).toBe(12);
    expect(ageFromDateOfBirth('2013-10-11', today)).toBe(13);
  });

  it('rejects future and impossible dates', () => {
    expect(ageFromDateOfBirth('2026-10-12', today)).toBeNull();
    expect(ageFromDateOfBirth('2024-02-31', today)).toBeNull();
  });

  it('enforces the inclusive 13-to-120 signup range', () => {
    expect(isValidDateOfBirth('2013-10-11', today)).toBe(true);
    expect(isValidDateOfBirth('1906-10-11', today)).toBe(true);
    expect(isValidDateOfBirth('2013-10-12', today)).toBe(false);
    expect(isValidDateOfBirth('1905-10-11', today)).toBe(false);
  });

  it('formats the local date for date inputs', () => {
    expect(formatDateForInput(today)).toBe('2026-10-11');
  });
});
