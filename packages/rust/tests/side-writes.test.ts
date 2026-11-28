import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { decodeBuiltCell, wordOf } from '@sittir/common/engine';
import { builtRefOf } from '../../common/src/built-ref.ts';
import { decodeListCell, decodeSideRows, headerGapKinds } from '../../common/src/record-cell.ts';
import rust from '../src/index.ts';

type Entry = 'newline' | { readonly text: string };
interface Case {
	readonly name: string;
	readonly own: boolean;
	readonly writes: readonly { readonly side: 'leading' | 'trailing' | 'inner'; readonly entries: readonly Entry[] }[];
	readonly expect: {
		readonly codes: Readonly<Record<'leading' | 'trailing', readonly Entry[]>>;
		readonly rows: Readonly<Partial<Record<'leading' | 'trailing' | 'inner', readonly Entry[] | null>>>;
		readonly rowsRecord: boolean;
		readonly under: 'own' | 'none';
	};
}

const fixture = JSON.parse(readFileSync(new URL('../../../rust/crates/sittir-core/src/arena/side-writes.json', import.meta.url), 'utf8')) as { readonly cases: readonly Case[] };
const NEWLINE_CODE = 4;

describe("a built record's side written in JavaScript, as the shared fixture the native kept core is pinned to holds it", () => {
	it.each(fixture.cases.map((entry) => [entry.name, entry] as const))('%s', async (_, entry) => {
		using rs: any = await createEngine(rust, { nodeStorage: 'arena' });
		const record = rs.build.expressionStatement(rs.build.identifier('a'));
		const { arena, at } = builtRefOf(record)! as { arena: any; at: number };
		const { format } = arena;
		const newline = format.layout.gapKinds[NEWLINE_CODE];
		const start = wordOf(at, format);
		const own = entry.own ? arena.push([format.sideSeparatorKind, 7], 1) : 0;
		if (entry.own) arena.words(at, 2)[start + 1] = own;
		for (const write of entry.writes) {
			arena.writeSide(
				at,
				write.side,
				write.entries.map((item) => (item === 'newline' ? newline : { $type: rs.kinds.LineComment, $text: item.text }))
			);
		}
		const words = arena.words(at, 2);
		const named = (kind: number): Entry => {
			expect(kind).toBe(newline);
			return 'newline';
		};
		for (const side of ['leading', 'trailing'] as const) expect(headerGapKinds(words[start], format, side).map(named)).toEqual(entry.expect.codes[side]);
		const rows = decodeSideRows(arena, words[start + 1]);
		for (const [side, row] of Object.entries(entry.expect.rows) as ['leading' | 'trailing' | 'inner', readonly Entry[] | null][]) {
			const cell = rows?.[side];
			const kept =
				cell === undefined
					? null
					: (() => {
							const { run, len } = decodeListCell(arena, cell);
							const cells = len === 0 ? [] : arena.words(run, len);
							return Array.from({ length: len }, (_, n): Entry => {
								const decoded = decodeBuiltCell(arena, cells[wordOf(run, format) + n]);
								if (decoded.form === 'unit') return named(decoded.kind);
								if (decoded.form !== 'builtLeaf') throw new Error(`a ${decoded.form} cell is no entry the fixture writes`);
								return { text: arena.entryAt(decoded.offset).entry.text };
							});
						})();
			expect(kept, `${side} row`).toEqual(row);
		}
		expect(rows !== undefined).toBe(entry.expect.rowsRecord);
		const under = rows === undefined ? words[start + 1] : rows.next;
		expect(under).toBe(entry.expect.under === 'own' ? own : 0);
	});
});
