import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const {
    createNode,
    updateNumChildren,
    updateDepthChildren,
    findAwsSubnetIndex,
    inet_aton,
} = require('../lib/script.js');

// ── createNode ───────────────────────────────────────────────────────────────

describe('createNode', () => {
    it('returns an object with depth=0, numChildren=0, children=null', () => {
        const node = createNode();
        expect(node).toEqual({ depth: 0, numChildren: 0, children: null });
    });

    it('returns a new object each time (no shared references)', () => {
        const a = createNode();
        const b = createNode();
        expect(a).not.toBe(b);
    });
});

// ── updateNumChildren ────────────────────────────────────────────────────────

describe('updateNumChildren', () => {
    it('returns 1 for a leaf node and sets numChildren=0', () => {
        const leaf = createNode();
        const result = updateNumChildren(leaf);
        expect(result).toBe(1);
        expect(leaf.numChildren).toBe(0);
    });

    it('returns 2 for a node with two leaf children', () => {
        const root = createNode();
        root.children = [createNode(), createNode()];
        const result = updateNumChildren(root);
        expect(result).toBe(2);
        expect(root.numChildren).toBe(2);
    });

    it('returns 3 for a node where left child is divided', () => {
        const root = createNode();
        root.children = [createNode(), createNode()];
        root.children[0].children = [createNode(), createNode()];
        const result = updateNumChildren(root);
        expect(result).toBe(3);
        expect(root.numChildren).toBe(3);
        expect(root.children[0].numChildren).toBe(2);
        expect(root.children[1].numChildren).toBe(0);
    });

    it('returns 4 for a fully divided two-level tree', () => {
        const root = createNode();
        root.children = [createNode(), createNode()];
        root.children[0].children = [createNode(), createNode()];
        root.children[1].children = [createNode(), createNode()];
        const result = updateNumChildren(root);
        expect(result).toBe(4);
        expect(root.numChildren).toBe(4);
    });
});

// ── updateDepthChildren ──────────────────────────────────────────────────────

describe('updateDepthChildren', () => {
    it('returns 1 for a leaf node and sets depth=0', () => {
        const leaf = createNode();
        const result = updateDepthChildren(leaf);
        expect(result).toBe(1);
        expect(leaf.depth).toBe(0);
    });

    it('returns 2 for a node with two leaf children', () => {
        const root = createNode();
        root.children = [createNode(), createNode()];
        const result = updateDepthChildren(root);
        expect(result).toBe(2);
        expect(root.depth).toBe(2);
    });

    it('returns 3 for a node where left child is divided', () => {
        const root = createNode();
        root.children = [createNode(), createNode()];
        root.children[0].children = [createNode(), createNode()];
        const result = updateDepthChildren(root);
        expect(result).toBe(3);
        expect(root.depth).toBe(3);
    });

    it('returns correct count for asymmetric tree', () => {
        const root = createNode();
        root.children = [createNode(), createNode()];
        root.children[0].children = [createNode(), createNode()];
        root.children[0].children[0].children = [createNode(), createNode()];
        // Left subtree has 3 leaves, right has 1 → total = 4
        const result = updateDepthChildren(root);
        expect(result).toBe(4);
        expect(root.depth).toBe(4);
    });
});

// ── findAwsSubnetIndex ───────────────────────────────────────────────────────

describe('findAwsSubnetIndex', () => {
    it('returns 0 for the first subnet', () => {
        expect(findAwsSubnetIndex('10.0.0.0', '10.0.0.0', 24, 16)).toBe(0);
    });

    it('returns 1 for the second /24 in a /16', () => {
        expect(findAwsSubnetIndex('10.0.1.0', '10.0.0.0', 24, 16)).toBe(1);
    });

    it('returns 255 for the last /24 in a /16', () => {
        expect(findAwsSubnetIndex('10.0.255.0', '10.0.0.0', 24, 16)).toBe(255);
    });

    it('returns correct index for /28 subnets in a /24', () => {
        // /24 contains 16 /28 subnets (each has 16 addresses)
        expect(findAwsSubnetIndex('10.0.0.0', '10.0.0.0', 28, 24)).toBe(0);
        expect(findAwsSubnetIndex('10.0.0.16', '10.0.0.0', 28, 24)).toBe(1);
        expect(findAwsSubnetIndex('10.0.0.240', '10.0.0.0', 28, 24)).toBe(15);
    });

    it('accepts integer addresses', () => {
        const subnet = inet_aton('10.0.1.0');
        const supernet = inet_aton('10.0.0.0');
        expect(findAwsSubnetIndex(subnet, supernet, 24, 16)).toBe(1);
    });

    it('returns -1 for misaligned subnet', () => {
        // 10.0.0.1 is not aligned to a /24 boundary
        expect(findAwsSubnetIndex('10.0.0.1', '10.0.0.0', 24, 16)).toBe(-1);
    });

    it('works with high-bit addresses (192.168.x.x)', () => {
        expect(findAwsSubnetIndex('192.168.1.0', '192.168.0.0', 24, 16)).toBe(1);
    });

    it('works with 172.16.x.x addresses', () => {
        expect(findAwsSubnetIndex('172.16.2.0', '172.16.0.0', 24, 16)).toBe(2);
    });

    it('returns 0 when subnet mask equals supernet mask', () => {
        expect(findAwsSubnetIndex('10.0.0.0', '10.0.0.0', 24, 24)).toBe(0);
    });
});
