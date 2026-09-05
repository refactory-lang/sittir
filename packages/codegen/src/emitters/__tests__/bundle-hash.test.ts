/**
 * Unit tests for `computeBundleHash` — spec 012 T015.
 * Anchors the three determinism invariants documented in T014:
 * file-order stability, CRLF/LF normalization, and content-change
 * sensitivity.
 */

import { describe, expect, it } from 'vitest';
import { computeBundleHash, type BundleFile } from '../bundle-hash.ts';

const files: BundleFile[] = [
	{ filename: 'function_item.jinja', content: '{{ name }}' },
	{ filename: 'block.jinja', content: '{ {{ children }} }' },
	{ filename: 'identifier.jinja', content: '{{ text }}' }
];

describe('computeBundleHash', () => {
	it('returns a 64-character lowercase hex string', () => {
		const hash = computeBundleHash(files);
		expect(hash).toMatch(/^[0-9a-f]{64}$/);
	});

	it('is stable across file-order perturbations', () => {
		// Same set, different arrival order — same hash.
		const reversed = [...files].reverse();
		const shuffled = [files[2]!, files[0]!, files[1]!];
		const baseline = computeBundleHash(files);
		expect(computeBundleHash(reversed)).toBe(baseline);
		expect(computeBundleHash(shuffled)).toBe(baseline);
	});

	it('normalizes CRLF to LF before hashing', () => {
		// Same logical content with Windows line endings must match LF.
		const lf: BundleFile[] = [{ filename: 'a.jinja', content: 'line1\nline2\nline3' }];
		const crlf: BundleFile[] = [{ filename: 'a.jinja', content: 'line1\r\nline2\r\nline3' }];
		expect(computeBundleHash(lf)).toBe(computeBundleHash(crlf));
	});

	it('preserves standalone \\r (CR-only) as-is', () => {
		// CR-only line endings are archaic but legal. They should NOT
		// be normalized — the hash reflects the bytes the Rust engine
		// will see. Only CRLF->LF is reversed (Git autocrlf mirror).
		const cr: BundleFile[] = [{ filename: 'a.jinja', content: 'line1\rline2' }];
		const lf: BundleFile[] = [{ filename: 'a.jinja', content: 'line1\nline2' }];
		expect(computeBundleHash(cr)).not.toBe(computeBundleHash(lf));
	});

	it('changes the hash on any byte-level edit', () => {
		const baseline = computeBundleHash(files);
		// Whitespace-only edit.
		const whitespace = [...files];
		whitespace[0] = { filename: 'function_item.jinja', content: '{{ name }} ' };
		expect(computeBundleHash(whitespace)).not.toBe(baseline);
		// Meaningful edit.
		const changed = [...files];
		changed[0] = { filename: 'function_item.jinja', content: '{{ other }}' };
		expect(computeBundleHash(changed)).not.toBe(baseline);
	});

	it('distinguishes filename changes from content changes', () => {
		const renamed: BundleFile[] = [{ filename: 'renamed.jinja', content: '{{ name }}' }];
		const original: BundleFile[] = [{ filename: 'function_item.jinja', content: '{{ name }}' }];
		expect(computeBundleHash(renamed)).not.toBe(computeBundleHash(original));
	});

	it('framing separator prevents boundary collisions', () => {
		// Without the \0 separator, these two would hash the same.
		// ["a.jinja":"b"] vs ["a.jinjab":""] — the second filename
		// ends where the first's content begins.
		const a: BundleFile[] = [{ filename: 'a.jinja', content: 'b' }];
		const b: BundleFile[] = [{ filename: 'a.jinjab', content: '' }];
		expect(computeBundleHash(a)).not.toBe(computeBundleHash(b));
	});

	it('empty file list produces a deterministic hash', () => {
		const hashA = computeBundleHash([]);
		const hashB = computeBundleHash([]);
		expect(hashA).toBe(hashB);
		expect(hashA).toMatch(/^[0-9a-f]{64}$/);
	});
});
