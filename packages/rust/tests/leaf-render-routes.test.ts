import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const parsedSources = [
	'fn f() { /*a*/ x /*b*/; }\n',
	'fn f() {\n    /*a*/\n    x   /*b*/ ;\n}\n',
	'fn f() { let /*a*/ x /*b*/ = 1; }\n',
	'fn f() { let /*a*/   x\n /*b*/ = 1; }\n',
	'fn f() { x; }\n'
];
const writtenSources = [
	'fn f() { let x = 1; }\n',
	'fn f() { let /*a*/ x /*b*/ = 1; }\n',
	'fn f() { let /*a*/   x\n /*b*/ = 1; }\n'
];
const keptInArena: Record<string, Partial<Record<'leading' | 'trailing', string>>> = {
	'fn f() { let /*a*/   x\n /*b*/ = 1; }\n': { leading: 'let /*w*/ x\n /*b*/ = 1;', trailing: 'let /*a*/   x /*w*/ = 1;' }
};

describe.each(['arena', 'object'] as const)(
	'a leaf renders as its sides make it, by either route, in %s storage',
	(nodeStorage) => {
		it.each(parsedSources)(
			'a built leaf given a parsed leaf’s sides renders as the parsed leaf: %j',
			async (source) => {
				using rs: any = await createEngine(rust, { nodeStorage });
				const parsed = rs
					.parse(source)
					.$query()
					.$descendants.find(
						(node: any) => typeof node === 'object' && rs.is.identifier(node) && String(node.$render()).includes('x')
					);
				const built = rs.build.identifier('x');
				const leading = parsed.$trivia.leading() ?? [];
				const trailing = parsed.$trivia.trailing() ?? [];
				if (leading.length > 0) built.$trivia.leading(...leading);
				if (trailing.length > 0) built.$trivia.trailing(...trailing);
				expect(String(built.$render())).toBe(String(parsed.$render()));
			}
		);

		it.each(
			writtenSources.flatMap((source) => (['leading', 'trailing'] as const).map((side) => [source, side] as const))
		)(
			'a parsed leaf with a side written after the parse renders its written side alone as within its holder, which keeps its other bytes in arena storage: %j, %s',
			async (source, side) => {
				using rs: any = await createEngine(rust, { nodeStorage });
				const holder = rs
					.parse(source)
					.$query()
					.$descendants.find((node: any) => typeof node === 'object' && rs.is.letDeclaration(node));
				const leaf = holder
					.$query()
					.$descendants.find((node: any) => typeof node === 'object' && rs.is.identifier(node));
				leaf.$trivia[side](rs.build.blockComment(rs.build.blockCommentRegular('w')));
				const alone = String(leaf.$render());
				expect(alone).toContain('/*w*/');
				const kept = nodeStorage === 'arena' ? keptInArena[source]?.[side] : undefined;
				expect(String(holder.$render())).toBe(kept ?? `let ${alone} = 1;`);
			}
		);
	}
);
