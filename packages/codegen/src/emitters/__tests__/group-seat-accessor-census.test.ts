import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { compileGrammar } from '../../compiler/compile.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { grammarPackage } from '../../grammars.ts';
import { AssembledList } from '../../compiler/model/node-map.ts';
import { elementConfigsOf, groupSeatHint, listOwnerHint, listSlotHints } from '../factories.ts';

const read = (grammar: string, file: string): string => readFileSync(`packages/${grammar}/src/${file}`, 'utf8');

const typeSources = (grammar: string): string => read(grammar, 'types.ts') + read(grammar, 'types-internal.ts');

const flatStamps = (source: string): readonly { readonly owner: string; readonly stamp: string }[] =>
	[...source.matchAll(/export interface (\w+) \{((?:(?!\n\}\n)[\s\S])*?)\$flat: (FlatHint<[^;]*?>);/g)].map((match) => ({
		owner: match[1]!,
		stamp: match[3]!.replace(/\s+/g, '')
	}));

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
				const keys = hint.keys.map((key) => `'${key.name}'`).join('|');
				const optional = hint.optional ? 'true' : 'false';
				expect(stamps.find((entry) => entry.owner === node.typeName)!.stamp, node.kind).toBe(
					`FlatHint<'${hint.slot}',T.${hint.group},${keys},${optional}>`
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
			const built = seats.filter(({ node }) => !(node instanceof AssembledList));
			expect([...read(grammar, 'wrap.ts').matchAll(/withElementsSeat\(/g)]).toHaveLength(built.length);
		});

		it(`${grammar}: every list owner and hoisted list slot carries its list's element config`, async () => {
			const generatedIdTables = await loadGeneratedIdTables(grammar);
			const { nodeMap } = await compileGrammar({ package: grammarPackage(grammar), generatedIdTables });
			const types = typeSources(grammar).replace(/\s+/g, '');
			const carried = [...nodeMap.nodes.values()].flatMap((node) => [
				listOwnerHint(node, nodeMap, undefined),
				...listSlotHints(node, nodeMap, undefined)
			]).filter((hint) => hint?.config !== undefined && hint.config !== 'never');
			const stamped = [...types.matchAll(/(?:ListOwnerHint<[^;]*?,|ListSlotHint<[^;]*?,)(T\.\w+\.Config)>;/g)];
			expect(stamped).toHaveLength(carried.length);
			for (const file of ['wrap.ts', 'factories/raw.ts']) {
				const specs = [...read(grammar, file).matchAll(/element: \{ keys:/g)];
				expect(specs).toHaveLength(carried.length);
			}
		});
	}
});
