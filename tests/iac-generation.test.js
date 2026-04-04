import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { jsonToYaml, shallowEqual } = require('../lib/script.js');

// ── jsonToYaml ───────────────────────────────────────────────────────────────

describe('jsonToYaml', () => {
    it('converts a flat object', () => {
        const result = jsonToYaml({ name: 'test', value: 42 });
        expect(result).toContain('name: test');
        expect(result).toContain('value: 42');
    });

    it('converts a nested object', () => {
        const result = jsonToYaml({ outer: { inner: 'value' } });
        expect(result).toContain('outer:');
        expect(result).toContain('  inner: value');
    });

    it('converts an array', () => {
        const result = jsonToYaml({ items: ['a', 'b', 'c'] });
        expect(result).toContain('items:');
        expect(result).toContain('- a');
        expect(result).toContain('- b');
        expect(result).toContain('- c');
    });

    it('converts an array of objects', () => {
        const result = jsonToYaml({
            subnets: [{ cidr: '10.0.0.0/24' }, { cidr: '10.0.1.0/24' }],
        });
        expect(result).toContain('subnets:');
        // Each array item with an object child puts dash on its own line, then indented key
        expect(result).toContain('cidr: 10.0.0.0/24');
        expect(result).toContain('cidr: 10.0.1.0/24');
    });

    it('handles boolean values', () => {
        const result = jsonToYaml({ enabled: true, disabled: false });
        expect(result).toContain('enabled: true');
        expect(result).toContain('disabled: false');
    });

    it('handles null values', () => {
        const result = jsonToYaml({ key: null });
        expect(result).toContain('key: null');
    });

    it('handles numeric values', () => {
        const result = jsonToYaml({ port: 8080 });
        expect(result).toContain('port: 8080');
    });

    it('handles deeply nested structures', () => {
        const result = jsonToYaml({
            level1: { level2: { level3: 'deep' } },
        });
        expect(result).toContain('level1:');
        expect(result).toContain('  level2:');
        expect(result).toContain('    level3: deep');
    });
});

// ── shallowEqual ─────────────────────────────────────────────────────────────

describe('shallowEqual', () => {
    it('returns true for identical objects', () => {
        expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });

    it('returns true for empty objects', () => {
        expect(shallowEqual({}, {})).toBe(true);
    });

    it('returns false for different values', () => {
        expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('returns false for different key counts', () => {
        expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it('returns false for different keys', () => {
        expect(shallowEqual({ a: 1 }, { b: 1 })).toBe(false);
    });

    it('is order-independent for keys', () => {
        expect(shallowEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    });

    it('uses strict equality (no type coercion)', () => {
        expect(shallowEqual({ a: 1 }, { a: '1' })).toBe(false);
    });

    it('distinguishes undefined from missing key', () => {
        expect(shallowEqual({ a: undefined }, {})).toBe(false);
    });

    it('handles boolean values', () => {
        expect(shallowEqual({ flag: true }, { flag: true })).toBe(true);
        expect(shallowEqual({ flag: true }, { flag: false })).toBe(false);
    });
});
