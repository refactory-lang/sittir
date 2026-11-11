import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { writeUnitSides } from '@sittir/common/utils';
import { constructions } from './constructions.mts';

const source = 'fn f() {\n    /* c */ ;\n    x();\n}\n';
const kept = '{\n    /* c */ ;\n    x();\n}';
const dropped = '{\n    ;\n    x();\n}';

type Block = { statements(): Iterable<unknown>; readonly $with: { statements(...items: unknown[]): Block } };

describe.each(constructions)("a unit's sides through a rebuild (%s)", (_, rs) => {
	const parsed = () => (rs.parse(source).statements()[0] as unknown as { body(): Block }).body();
	const rebuilt = (block: Block) => block.$with.statements(...block.statements());
	const rendered = (block: Block) => rs.render(block as never).toString();

	it('keeps them in a rebuild of the parsed block', () => {
		expect(rendered(rebuilt(parsed()))).toBe(kept);
	});

	it('keeps them in a rebuild of a rebuild', () => {
		expect(rendered(rebuilt(rebuilt(parsed())))).toBe(kept);
	});

	it('takes a write over the sides a rebuild carries, before its first render', () => {
		const block = rebuilt(parsed());
		writeUnitSides(block, []);
		expect(rendered(block)).toBe(dropped);
	});

	it('keeps them in a rebuild rendered after another rebuild was released unrendered', () => {
		const block = rebuilt(parsed());
		const other = rebuilt(parsed()) as Block & Disposable;
		other[Symbol.dispose]();
		expect(rendered(block)).toBe(kept);
	});
});

describe("a rebuild's carried unit sides once its parsed source is gone", () => {
	it("render at the rebuild's first render as object storage's do, the source tree held by the rebuild, which object storage refuses once that tree is disposed and arena storage keeps, refusing its disposeTree", () => {
		// A collection can only be forced under `--expose-gc`, so the case runs
		// in a child process that reports both storages.
		const fixture = fileURLToPath(new URL('../../common/tests/fixtures/carried-sides-release.mts', import.meta.url));
		const out = execFileSync(process.execPath, ['--expose-gc', '--import', 'tsx', fixture], {
			cwd: fileURLToPath(new URL('..', import.meta.url)),
			encoding: 'utf8',
			env: { ...process.env, SITTIR_BACKEND: 'native' }
		});
		const report = JSON.parse(out.trim().split('\n').at(-1) ?? '') as Record<'object' | 'record', unknown>;
		const rendered = '{\n    /* c */ ;\n    y();\n}';
		expect(report).toEqual({
			object: { rendered, held: 1, disposed: 'disposed', released: 'throws: tree N is not live (never parsed on this thread, or already released)' },
			record: { rendered, held: 1, disposed: "throws: tree N is a parse its engine holds: its root's release or its engine's dispose frees it, not disposeTree", released: rendered }
		});
	}, 60_000);
});
