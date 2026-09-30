import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { compileGrammar } from '../../compiler/compile.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { grammarPackage } from '../../grammars.ts';
import { elementConfigsOf, groupSeatHint, listSlotHints } from '../factories.ts';

const read = (grammar: string, file: string): string => readFileSync(`packages/${grammar}/src/${file}`, 'utf8');

const typeSources = (grammar: string): string => read(grammar, 'types.ts') + read(grammar, 'types-internal.ts');

const FLAT_STAMP = '$flat: FlatHint<';

const stampAt = (source: string, start: number): string => {
	let depth = 1;
	let end = start;
	while (depth > 0) {
		const char = source[end++];
		if (char === '<') depth++;
		else if (char === '>') depth--;
	}
	return source.slice(start - 'FlatHint<'.length, end);
};

const normalizeStamp = (stamp: string): string => stamp.replace(/\s+/g, '').replace(/['"]/g, '').replace(/;\}/g, '}');

const flatStamps = (source: string): readonly { readonly owner: string; readonly stamp: string }[] =>
	[...source.matchAll(/export interface (\w+) \{/g)].flatMap((match) => {
		const body = source.slice(match.index, source.indexOf('\n}\n', match.index));
		const at = body.indexOf(FLAT_STAMP);
		return at < 0 ? [] : [{ owner: match[1]!, stamp: normalizeStamp(stampAt(body, at + FLAT_STAMP.length)) }];
	});

describe('a group seat flattens exactly the group fields its config surface names', () => {
	for (const grammar of ['rust', 'python', 'typescript'] as const) {
		it(`${grammar}: the seats the model finds are the interfaces stamped $flat and the nodes that seat one`, async () => {
			const generatedIdTables = await loadGeneratedIdTables(grammar);
			const { nodeMap } = await compileGrammar({ package: grammarPackage(grammar), generatedIdTables });
			const hints = [...nodeMap.nodes.values()].flatMap((node) => {
				const hint = groupSeatHint(node, nodeMap, undefined);
				return hint === undefined ? [] : [{ node, hint }];
			});
			expect(hints.length).toBeGreaterThan(0);
			const stamps = flatStamps(typeSources(grammar));
			expect(stamps.map((entry) => entry.owner).sort()).toEqual(hints.map(({ node }) => node.typeName).sort());
			for (const { node, hint } of hints) {
				const keys = hint.keys.map((key) => `readonly${key.name}:${key.field}`).join(';');
				expect(stamps.find((entry) => entry.owner === node.typeName)!.stamp, node.kind).toBe(
					`FlatHint<${hint.slot},T.${hint.group},{${keys}},${hint.optional}>`
				);
			}
			for (const file of ['wrap.ts', 'factories/raw.ts']) {
				expect([...read(grammar, file).matchAll(/withGroupSeat\(/g)]).toHaveLength(hints.length);
			}
		});
	}
});

describe('an elements seat sets the element config objects its config surface takes', () => {
	for (const grammar of ['rust', 'python', 'typescript'] as const) {
		it(`${grammar}: every seat is stamped on its slot hint and applied where its setter is built`, async () => {
			const generatedIdTables = await loadGeneratedIdTables(grammar);
			const { nodeMap } = await compileGrammar({ package: grammarPackage(grammar), generatedIdTables });
			const types = typeSources(grammar);
			const seats = [...nodeMap.nodes.values()].flatMap((node) =>
				elementConfigsOf(node, nodeMap).map((fact) => ({ node, fact }))
			);
			const compact = (text: string): string => text.replace(/\s+/g, '');
			for (const { node, fact } of seats) {
				const block = compact(types.slice(types.indexOf(`export interface ${node.typeName} {`), types.indexOf('\n}\n', types.indexOf(`export interface ${node.typeName} {`))));
				expect(block, `${node.kind}.${fact.slot}`).toMatch(new RegExp(`readonly${fact.slot}:SlotHint<[\\s\\S]*?,(?:true|false),(?:true|false),T\\.${fact.group}\\.Config>;`));
			}
			expect([...read(grammar, 'factories/raw.ts').matchAll(/withElementsSeat\(/g)]).toHaveLength(seats.length);
			expect([...read(grammar, 'wrap.ts').matchAll(/withElementsSeat\(/g)]).toHaveLength(seats.length);
		});

		it(`${grammar}: every slot that holds a list carries its list's element config`, async () => {
			const generatedIdTables = await loadGeneratedIdTables(grammar);
			const { nodeMap } = await compileGrammar({ package: grammarPackage(grammar), generatedIdTables });
			const types = typeSources(grammar).replace(/\s+/g, '');
			const carried = [...nodeMap.nodes.values()]
				.flatMap((node) => listSlotHints(node, nodeMap, undefined))
				.filter((hint) => hint.config !== 'never');
			const stamped = [...types.matchAll(/ListSlotHint<[^;]*?,(T\.\w+\.Config)>;/g)];
			expect(stamped).toHaveLength(carried.length);
			for (const file of ['wrap.ts', 'factories/raw.ts']) {
				const specs = [...read(grammar, file).matchAll(/element: \{ keys:/g)];
				expect(specs).toHaveLength(carried.length);
			}
		});
	}
});
