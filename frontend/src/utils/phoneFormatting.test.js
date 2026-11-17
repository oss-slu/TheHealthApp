import { describe, it, expect } from 'vitest';
import { parsePhoneNumber, SUPPORTED_COUNTRY_CODES } from './phoneFormatting';

describe('phoneFormatting utility', () => {
  describe('Local numbers', () => {
    it('normalizes valid US/Canada (+1) 10-digit local number', () => {
      const res = parsePhoneNumber('1234567890', '+1');
      expect(res.isValid).toBe(true);
      expect(res.canonical).toBe('+11234567890');
      expect(res.localDigits).toBe('1234567890');
    });

    it('normalizes formatted US local number', () => {
      const res = parsePhoneNumber('(555) 123-4567', '+1');
      expect(res.isValid).toBe(true);
      expect(res.canonical).toBe('+15551234567');
      expect(res.localDigits).toBe('5551234567');
    });

    it('normalizes valid Spain (+34) 9-digit local number', () => {
      const res = parsePhoneNumber('912345678', '+34');
      expect(res.isValid).toBe(true);
      expect(res.canonical).toBe('+34912345678');
      expect(res.localDigits).toBe('912345678');
    });

    it('normalizes valid UAE (+971) 9-digit local number', () => {
      const res = parsePhoneNumber('501234567', '+971');
      expect(res.isValid).toBe(true);
      expect(res.canonical).toBe('+971501234567');
      expect(res.localDigits).toBe('501234567');
    });

    it('normalizes valid India (+91) 10-digit local number', () => {
      const res = parsePhoneNumber('9876543210', '+91');
      expect(res.isValid).toBe(true);
      expect(res.canonical).toBe('+919876543210');
    });

    it('normalizes valid China (+86) 11-digit local number', () => {
      const res = parsePhoneNumber('13812345678', '+86');
      expect(res.isValid).toBe(true);
      expect(res.canonical).toBe('+8613812345678');
    });

    it('rejects invalid local lengths', () => {
      expect(parsePhoneNumber('12345', '+1').isValid).toBe(false);
      expect(parsePhoneNumber('12345678901', '+1').isValid).toBe(false);
      expect(parsePhoneNumber('91234567', '+34').isValid).toBe(false); // 8 digits
      expect(parsePhoneNumber('50123456', '+971').isValid).toBe(false); // 8 digits
      expect(parsePhoneNumber('1381234567', '+86').isValid).toBe(false); // 10 digits
    });
  });

  describe('Pasted E.164 international numbers', () => {
    it('accepts pasted +1 numbers without doubling the country code', () => {
      const res = parsePhoneNumber('+15551234567', '+1');
      expect(res.isValid).toBe(true);
      expect(res.canonical).toBe('+15551234567');
      expect(res.countryCode).toBe('+1');
      expect(res.localDigits).toBe('5551234567');
    });

    it('accepts pasted +34 numbers when dropdown is +1 and does not double prefix', () => {
      const res = parsePhoneNumber('+34912345678', '+1');
      expect(res.isValid).toBe(true);
      expect(res.canonical).toBe('+34912345678');
      expect(res.countryCode).toBe('+34');
      expect(res.localDigits).toBe('912345678');
    });

    it('handles pasted E.164 values with surrounding whitespace and formatting', () => {
      const res = parsePhoneNumber('  +34 912345678  ', '+1');
      expect(res.isValid).toBe(true);
      expect(res.canonical).toBe('+34912345678');
      expect(res.countryCode).toBe('+34');
    });

    it('handles pasted UAE (+971) E.164 with formatting', () => {
      const res = parsePhoneNumber('+971 50 123 4567', '+1');
      expect(res.isValid).toBe(true);
      expect(res.canonical).toBe('+971501234567');
      expect(res.countryCode).toBe('+971');
      expect(res.localDigits).toBe('501234567');
    });

    it('rejects pasted international number if local portion has invalid length', () => {
      const res = parsePhoneNumber('+34 9123', '+1'); // Spain requires 9 digits
      expect(res.isValid).toBe(false);
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
    it('handles empty and non-string values safely', () => {
      expect(parsePhoneNumber('').isValid).toBe(false);
      expect(parsePhoneNumber('   ').isValid).toBe(false);
      expect(parsePhoneNumber(null).isValid).toBe(false);
      expect(parsePhoneNumber(undefined).isValid).toBe(false);
    });
  });
});
