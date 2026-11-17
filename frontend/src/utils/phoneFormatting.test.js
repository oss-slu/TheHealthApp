import { describe, it, expect } from 'vitest';
import { parsePhoneNumber } from './phoneFormatting';

describe('phoneFormatting utility', () => {
  describe('Local numbers', () => {
    it.each([
      { input: '1234567890', code: '+1', expectedCanonical: '+11234567890', expectedLocal: '1234567890' },
      { input: '(555) 123-4567', code: '+1', expectedCanonical: '+15551234567', expectedLocal: '5551234567' },
      { input: '912345678', code: '+34', expectedCanonical: '+34912345678', expectedLocal: '912345678' },
      { input: '501234567', code: '+971', expectedCanonical: '+971501234567', expectedLocal: '501234567' },
      { input: '9876543210', code: '+91', expectedCanonical: '+919876543210', expectedLocal: '9876543210' },
      { input: '13812345678', code: '+86', expectedCanonical: '+8613812345678', expectedLocal: '13812345678' },
    ])('normalizes $input with country $code to $expectedCanonical', ({ input, code, expectedCanonical, expectedLocal }) => {
      const res = parsePhoneNumber(input, code);
      expect(res.isValid).toBe(true);
      expect(res.canonical).toBe(expectedCanonical);
      expect(res.localDigits).toBe(expectedLocal);
    });

    it.each([
      { input: '12345', code: '+1' },
      { input: '12345678901', code: '+1' },
      { input: '91234567', code: '+34' },
      { input: '50123456', code: '+971' },
      { input: '1381234567', code: '+86' },
    ])('rejects invalid local length $input for $code', ({ input, code }) => {
      expect(parsePhoneNumber(input, code).isValid).toBe(false);
    });
  });

  describe('Pasted E.164 international numbers', () => {
    it.each([
      { input: '+15551234567', code: '+1', expectedCanonical: '+15551234567', expectedCode: '+1', expectedLocal: '5551234567' },
      { input: '+34912345678', code: '+1', expectedCanonical: '+34912345678', expectedCode: '+34', expectedLocal: '912345678' },
      { input: '  +34 912345678  ', code: '+1', expectedCanonical: '+34912345678', expectedCode: '+34', expectedLocal: '912345678' },
      { input: '+971 50 123 4567', code: '+1', expectedCanonical: '+971501234567', expectedCode: '+971', expectedLocal: '501234567' },
    ])('accepts pasted $input without duplicate prefix', ({ input, code, expectedCanonical, expectedCode, expectedLocal }) => {
      const res = parsePhoneNumber(input, code);
      expect(res.isValid).toBe(true);
      expect(res.canonical).toBe(expectedCanonical);
      expect(res.countryCode).toBe(expectedCode);
      expect(res.localDigits).toBe(expectedLocal);
    });

    it('rejects pasted international number if local portion has invalid length', () => {
      expect(parsePhoneNumber('+34 9123', '+1').isValid).toBe(false);
    });

    it('validates unsupported international numbers with general E.164 rule', () => {
      const validUk = parsePhoneNumber('+44 20 7946 0958', '+1');
      expect(validUk.isValid).toBe(true);
      expect(validUk.canonical).toBe('+442079460958');

      const tooShort = parsePhoneNumber('+44 123', '+1');
      expect(tooShort.isValid).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it.each(['', '   ', null, undefined])('handles empty or non-string input %s', (val) => {
      expect(parsePhoneNumber(val).isValid).toBe(false);
    });
  });
});
