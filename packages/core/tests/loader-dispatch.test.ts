import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRenderer } from '../src/loader.ts';
import type { AnyNodeData } from '../src/types.ts';

// T026 (revised post-T037) — createRenderer(string) treats its string
// argument as a `.jinja` templates directory. The legacy YAML
// file-loading branch was retired as part of T037; production
// renderers always consume per-rule `.jinja` files.

describe('createRenderer(templatesDir)', () => {
	it('treats a string argument as a .jinja template directory', () => {
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
