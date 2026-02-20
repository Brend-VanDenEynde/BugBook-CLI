
import { describe, it, expect } from 'vitest';
import { validateBugId } from '../src/utils/storage';

describe('Security: validateBugId', () => {
    it('should accept valid hex IDs', () => {
        expect(validateBugId('AABB1122')).toBe(true);
        expect(validateBugId('abcd')).toBe(true);
        expect(validateBugId('1')).toBe(true);
        expect(validateBugId('12345678')).toBe(true);
    });

    it('should reject path traversal attempts', () => {
        expect(validateBugId('../../etc/passwd')).toBe(false);
        expect(validateBugId('../..')).toBe(false);
        expect(validateBugId('..\\..\\windows')).toBe(false);
    });

    it('should reject special characters', () => {
        expect(validateBugId('abc;rm -rf')).toBe(false);
        expect(validateBugId('id|cat /etc')).toBe(false);
        expect(validateBugId('hello world')).toBe(false);
        expect(validateBugId('')).toBe(false);
    });

    it('should reject oversized IDs (more than 8 hex chars)', () => {
        expect(validateBugId('123456789')).toBe(false);
        expect(validateBugId('AABBCCDDEE')).toBe(false);
    });
});
