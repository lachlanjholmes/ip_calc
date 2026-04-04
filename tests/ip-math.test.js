import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const {
    inet_aton,
    inet_ntoa,
    network_address,
    subnet_addresses,
    subnet_last_address,
    subnet_netmask,
} = require('../lib/script.js');

// ── inet_aton ────────────────────────────────────────────────────────────────

describe('inet_aton', () => {
    it('converts 0.0.0.0 to 0', () => {
        expect(inet_aton('0.0.0.0')).toBe(0);
    });

    it('converts 127.0.0.1 to the loopback integer', () => {
        expect(inet_aton('127.0.0.1')).toBe(0x7f000001);
    });

    it('converts 10.0.0.1', () => {
        expect(inet_aton('10.0.0.1')).toBe((10 << 24) | 1);
    });

    it('converts 192.168.1.1 (high-bit, negative signed)', () => {
        // 192 >= 128 → result is a negative signed 32-bit int
        const result = inet_aton('192.168.1.1');
        expect(result).toBe((192 << 24) | (168 << 16) | (1 << 8) | 1);
        expect(result).toBeLessThan(0); // signed 32-bit
    });

    it('converts 255.255.255.255 to -1 (signed)', () => {
        expect(inet_aton('255.255.255.255')).toBe(-1);
    });

    it('converts 128.0.0.0 to -2147483648 (signed)', () => {
        expect(inet_aton('128.0.0.0')).toBe(-2147483648);
    });

    it('returns null for empty string', () => {
        expect(inet_aton('')).toBeNull();
    });

    it('returns null for non-dotted string', () => {
        expect(inet_aton('12345')).toBeNull();
    });

    it('returns null for octet > 255', () => {
        expect(inet_aton('256.0.0.0')).toBeNull();
    });

    it('returns null for too few octets', () => {
        expect(inet_aton('10.0.0')).toBeNull();
    });

    it('returns null for too many octets', () => {
        expect(inet_aton('10.0.0.0.0')).toBeNull();
    });

    it('returns null for alphabetic input', () => {
        expect(inet_aton('abc.def.ghi.jkl')).toBeNull();
    });

    it('returns null for negative octet notation', () => {
        expect(inet_aton('-1.0.0.0')).toBeNull();
    });
});

// ── inet_ntoa ────────────────────────────────────────────────────────────────

describe('inet_ntoa', () => {
    it('converts 0 to 0.0.0.0', () => {
        expect(inet_ntoa(0)).toBe('0.0.0.0');
    });

    it('converts loopback integer to 127.0.0.1', () => {
        expect(inet_ntoa(0x7f000001)).toBe('127.0.0.1');
    });

    it('converts -1 (signed) to 255.255.255.255', () => {
        expect(inet_ntoa(-1)).toBe('255.255.255.255');
    });

    it('converts -2147483648 to 128.0.0.0', () => {
        expect(inet_ntoa(-2147483648)).toBe('128.0.0.0');
    });

    it('round-trips with inet_aton for 10.20.30.40', () => {
        expect(inet_ntoa(inet_aton('10.20.30.40'))).toBe('10.20.30.40');
    });

    it('round-trips with inet_aton for 192.168.0.1 (high-bit)', () => {
        expect(inet_ntoa(inet_aton('192.168.0.1'))).toBe('192.168.0.1');
    });

    it('round-trips with inet_aton for 255.255.255.255', () => {
        expect(inet_ntoa(inet_aton('255.255.255.255'))).toBe('255.255.255.255');
    });
});

// ── network_address ──────────────────────────────────────────────────────────

describe('network_address', () => {
    it('mask /32 returns the address unchanged', () => {
        const addr = inet_aton('10.1.2.3');
        expect(network_address(addr, 32)).toBe(addr);
    });

    it('mask /0 returns 0', () => {
        expect(network_address(inet_aton('255.255.255.255'), 0)).toBe(0);
    });

    it('mask /24 zeroes the last octet', () => {
        expect(inet_ntoa(network_address(inet_aton('10.0.1.123'), 24))).toBe('10.0.1.0');
    });

    it('mask /16 zeroes the last two octets', () => {
        expect(inet_ntoa(network_address(inet_aton('172.16.5.99'), 16))).toBe('172.16.0.0');
    });

    it('mask /8 zeroes the last three octets', () => {
        expect(inet_ntoa(network_address(inet_aton('10.20.30.40'), 8))).toBe('10.0.0.0');
    });

    it('handles high-bit addresses (192.168.x.x with /24)', () => {
        expect(inet_ntoa(network_address(inet_aton('192.168.1.99'), 24))).toBe('192.168.1.0');
    });

    it('mask /31 preserves all but the last bit', () => {
        expect(inet_ntoa(network_address(inet_aton('10.0.0.3'), 31))).toBe('10.0.0.2');
    });
});

// ── subnet_addresses ─────────────────────────────────────────────────────────

describe('subnet_addresses', () => {
    it('/32 has 1 address', () => {
        expect(subnet_addresses(32)).toBe(1);
    });

    it('/31 has 2 addresses', () => {
        expect(subnet_addresses(31)).toBe(2);
    });

    it('/24 has 256 addresses', () => {
        expect(subnet_addresses(24)).toBe(256);
    });

    it('/16 has 65536 addresses', () => {
        expect(subnet_addresses(16)).toBe(65536);
    });

    it('/8 has 16777216 addresses', () => {
        expect(subnet_addresses(8)).toBe(16777216);
    });

    it('/0 has 2^32 addresses', () => {
        expect(subnet_addresses(0)).toBe(4294967296);
    });
});

// ── subnet_last_address ──────────────────────────────────────────────────────

describe('subnet_last_address', () => {
    it('/32 last address equals the subnet itself', () => {
        const addr = inet_aton('10.0.0.1');
        expect(subnet_last_address(addr, 32)).toBe(addr);
    });

    it('/24 last address is .255', () => {
        const addr = inet_aton('10.0.1.0');
        expect(inet_ntoa(subnet_last_address(addr, 24))).toBe('10.0.1.255');
    });

    it('/16 last address ends in .255.255', () => {
        const addr = inet_aton('172.16.0.0');
        expect(inet_ntoa(subnet_last_address(addr, 16))).toBe('172.16.255.255');
    });

    it('/31 last address is base + 1', () => {
        const addr = inet_aton('10.0.0.0');
        expect(inet_ntoa(subnet_last_address(addr, 31))).toBe('10.0.0.1');
    });
});

// ── subnet_netmask ───────────────────────────────────────────────────────────

describe('subnet_netmask', () => {
    it('/0 netmask is 0.0.0.0', () => {
        expect(inet_ntoa(subnet_netmask(0))).toBe('0.0.0.0');
    });

    it('/8 netmask is 255.0.0.0', () => {
        expect(inet_ntoa(subnet_netmask(8))).toBe('255.0.0.0');
    });

    it('/16 netmask is 255.255.0.0', () => {
        expect(inet_ntoa(subnet_netmask(16))).toBe('255.255.0.0');
    });

    it('/24 netmask is 255.255.255.0', () => {
        expect(inet_ntoa(subnet_netmask(24))).toBe('255.255.255.0');
    });

    it('/32 netmask is 255.255.255.255', () => {
        expect(inet_ntoa(subnet_netmask(32))).toBe('255.255.255.255');
    });

    it('/25 netmask is 255.255.255.128', () => {
        expect(inet_ntoa(subnet_netmask(25))).toBe('255.255.255.128');
    });

    it('/31 netmask is 255.255.255.254', () => {
        expect(inet_ntoa(subnet_netmask(31))).toBe('255.255.255.254');
    });
});
