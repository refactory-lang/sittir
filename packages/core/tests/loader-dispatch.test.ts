import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRenderer } from '../src/loader.ts';
import type { AnyNodeData } from '../src/types.ts';

// T026 — createRenderer(path) must detect whether `path` points at a
// .yaml file (legacy) or a directory (new .jinja per-rule layout) and
// dispatch accordingly. During the migration both paths must work so
// callers can cut over grammar-by-grammar.

describe('createRenderer dispatch (T026)', () => {
	it('treats a path ending in .yaml as a legacy YAML templates file', () => {
		const tmp = mkdtempSync(join(tmpdir(), 'sittir-loader-'));
		try {
			const yamlPath = join(tmp, 'templates.yaml');
			writeFileSync(yamlPath, 'language: test\nextensions: []\nrules:\n  greet: "$NAME!"\n');
			const { render } = createRenderer(yamlPath);
			const node: AnyNodeData = {
				$type: 'greet',
				$fields: { name: { $type: 'id', $text: 'world' } },
			};
			expect(render(node)).toBe('world!');
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});

	it('treats a directory path as a .jinja template root', () => {
		const tmp = mkdtempSync(join(tmpdir(), 'sittir-loader-'));
		try {
			writeFileSync(join(tmp, 'greet.jinja'), '{{ name }}!');
			const { render } = createRenderer(tmp);
			const node: AnyNodeData = {
				$type: 'greet',
				$fields: { name: { $type: 'id', $text: 'world' } },
			};
			expect(render(node)).toBe('world!');
		} finally {
			rmSync(tmp, { recursive: true, force: true });
		}
	});
});
