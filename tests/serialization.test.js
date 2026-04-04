import { describe, it, expect, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { nodeToString, binToAscii, asciiToBin, loadNode, createNode } = require('../lib/script.js');

// ── nodeToString ─────────────────────────────────────────────────────────────

describe('nodeToString', () => {
    it('serializes a leaf node to "0"', () => {
        const leaf = createNode();
        expect(nodeToString(leaf)).toBe('0');
    });

    it('serializes a single division to "100"', () => {
        const root = createNode();
        root.children = [createNode(), createNode()];
        expect(nodeToString(root)).toBe('100');
    });

    it('serializes left-side double division to "11000"', () => {
        const root = createNode();
        root.children = [createNode(), createNode()];
        root.children[0].children = [createNode(), createNode()];
        expect(nodeToString(root)).toBe('11000');
    });

    it('serializes right-side double division to "10100"', () => {
        const root = createNode();
        root.children = [createNode(), createNode()];
        root.children[1].children = [createNode(), createNode()];
        expect(nodeToString(root)).toBe('10100');
    });

    it('serializes both-sides double division to "1100100"', () => {
        const root = createNode();
        root.children = [createNode(), createNode()];
        root.children[0].children = [createNode(), createNode()];
        root.children[1].children = [createNode(), createNode()];
        expect(nodeToString(root)).toBe('1100100');
    });
});

// ── binToAscii / asciiToBin round-trip ───────────────────────────────────────

describe('binToAscii / asciiToBin', () => {
    it('round-trips a single "0" (leaf)', () => {
        const bin = '0';
        expect(asciiToBin(binToAscii(bin))).toBe(bin);
    });

    it('round-trips "100" (single division)', () => {
        const bin = '100';
        expect(asciiToBin(binToAscii(bin))).toBe(bin);
    });

    it('round-trips "11000" (left double division)', () => {
        const bin = '11000';
        expect(asciiToBin(binToAscii(bin))).toBe(bin);
    });

    it('round-trips "1100100" (both-sides division)', () => {
        const bin = '1100100';
        expect(asciiToBin(binToAscii(bin))).toBe(bin);
    });

    it('round-trips a long binary string', () => {
        const bin = '1110000100';
        expect(asciiToBin(binToAscii(bin))).toBe(bin);
    });

    it('binToAscii encodes single "0" correctly', () => {
        expect(binToAscii('0')).toBe('1.0');
    });

    it('binToAscii encodes single "1" correctly', () => {
        expect(binToAscii('1')).toBe('1.1');
    });

    it('asciiToBin returns empty string for invalid input', () => {
        expect(asciiToBin('invalid')).toBe('');
    });

    it('asciiToBin returns empty string for empty string', () => {
        expect(asciiToBin('')).toBe('');
    });
});

// ── loadNode ─────────────────────────────────────────────────────────────────

describe('loadNode', () => {
    it('loads a leaf node from "0"', () => {
        const node = createNode();
        const remaining = loadNode(node, '0');
        expect(remaining).toBe('');
        expect(node.children).toBeNull();
    });

    it('loads a single division from "100"', () => {
        const node = createNode();
        const remaining = loadNode(node, '100');
        expect(remaining).toBe('');
        expect(node.children).not.toBeNull();
        expect(node.children).toHaveLength(2);
        expect(node.children[0].children).toBeNull();
        expect(node.children[1].children).toBeNull();
    });

    it('loads a left double division from "11000"', () => {
        const node = createNode();
        const remaining = loadNode(node, '11000');
        expect(remaining).toBe('');
        expect(node.children[0].children).not.toBeNull();
        expect(node.children[0].children[0].children).toBeNull();
        expect(node.children[0].children[1].children).toBeNull();
        expect(node.children[1].children).toBeNull();
    });

    it('round-trips with nodeToString (single division)', () => {
        const original = createNode();
        original.children = [createNode(), createNode()];
        const serialized = nodeToString(original);

        const restored = createNode();
        loadNode(restored, serialized);
        expect(nodeToString(restored)).toBe(serialized);
    });

    it('round-trips with nodeToString (complex tree)', () => {
        const original = createNode();
        original.children = [createNode(), createNode()];
        original.children[0].children = [createNode(), createNode()];
        original.children[1].children = [createNode(), createNode()];
        original.children[0].children[0].children = [createNode(), createNode()];
        const serialized = nodeToString(original);

        const restored = createNode();
        loadNode(restored, serialized);
        expect(nodeToString(restored)).toBe(serialized);
    });

    it('enforces max recursion depth of 32', () => {
        const node = createNode();
        // 33 consecutive '1's would try to recurse 33 levels deep
        const malformed = '1'.repeat(33) + '0'.repeat(34);
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        loadNode(node, malformed);
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
    });
});
