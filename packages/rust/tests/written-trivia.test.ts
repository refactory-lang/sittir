import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const engine = await createEngine(rust);

function commentOf(statement: { $trivia: { leading(): unknown } }): object {
	const comment = (statement.$trivia.leading() as unknown[]).find((entry) => typeof entry === 'object');
	if (comment === undefined) throw new Error('expected a leading comment');
	return comment as object;
}

describe('a parsed comment written into a tree is detached data there', () => {
	it("keeps rendering once the comment's own tree is released", () => {
		// A collection can only be forced under `--expose-gc`, so the case runs
		// in a child process that reports the render before and after.
		const fixture = fileURLToPath(new URL('../../common/tests/fixtures/written-trivia-release.mts', import.meta.url));
		const out = execFileSync(process.execPath, ['--expose-gc', '--import', 'tsx', fixture], {
			cwd: fileURLToPath(new URL('..', import.meta.url)),
			encoding: 'utf8',
			env: { ...process.env, SITTIR_BACKEND: 'native' }
		});
		expect(JSON.parse(out.trim().split('\n').at(-1) ?? '')).toEqual({ before: '// c\nfn r() {}\n', after: '// c\nfn r() {}\n', live: 1 });
	}, 60_000);

	it('snapshots without a coordinate, and the snapshot renders as the tree does, after a JSON round trip too', () => {
		const root = engine.parse('// c\nfn a() {}\nfn b() {}\n');
		const [a, b] = root.statements();
		if (a === undefined || b === undefined || typeof a === 'number' || typeof b === 'number') throw new Error('expected two items');
		b.$trivia.leading(commentOf(a) as never);
		const rendered = root.$render();
		expect(rendered).toBe('// c\nfn a() {}\n\n// c\nfn b() {}\n');
		const json = JSON.stringify(root.$snapshot());
		expect(json).not.toContain('$treeHandle');
		expect(engine.render(JSON.parse(json)).toString()).toBe(rendered);
	});
});
