import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { compileGrammar } from '../../compiler/compile.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { grammarPackage } from '../../grammars.ts';
import { elementConfigsOf, groupSeatHints, listSlotHints } from '../factories.ts';

const read = (grammar: string, file: string): string => readFileSync(`packages/${grammar}/src/${file}`, 'utf8');

const typeSources = (grammar: string): string => read(grammar, 'types.ts') + read(grammar, 'types-internal.ts');

const FLAT_STAMP = '$flat:';

const topLevelParts = (source: string, start: number): readonly string[] => {
	const parts: string[] = [];
	let depth = 0;
	let from = start;
	for (let at = start; ; at++) {
		const char = source[at]!;
		if (char === '<' || char === '{') depth++;
		else if (char === '>' || char === '}') depth--;
		else if (depth === 0 && (char === '|' || char === ';')) {
			parts.push(source.slice(from, at));
			if (char === ';') return parts.map((part) => part.trim()).filter((part) => part !== '');
			from = at + 1;
		}
	}
};

const normalizeStamp = (stamp: string): string => stamp.replace(/\s+/g, '').replace(/['"]/g, '').replace(/;\}/g, '}');

const flatStamps = (source: string): ReadonlyMap<string, readonly string[]> =>
	new Map(
		[...source.matchAll(/export interface (\w+) \{/g)].flatMap((match) => {
			const body = source.slice(match.index, source.indexOf('\n}\n', match.index));
			const at = body.indexOf(FLAT_STAMP);
			return at < 0 ? [] : [[match[1]!, topLevelParts(body, at + FLAT_STAMP.length).map(normalizeStamp)] as const];
		})
	);

describe('a group seat flattens exactly the group fields its config surface names', () => {
	for (const grammar of ['rust', 'python', 'typescript'] as const) {
		it(`${grammar}: the seats the model finds are the interfaces stamped $flat and the nodes that seat one`, async () => {
			const generatedIdTables = await loadGeneratedIdTables(grammar);
			const { nodeMap } = await compileGrammar({ package: grammarPackage(grammar), generatedIdTables });
			const seated = [...nodeMap.nodes.values()].flatMap((node) => {
				const hints = groupSeatHints(node, nodeMap, undefined);
				return hints.length === 0 ? [] : [{ node, hints }];
			});
			expect(seated.length).toBeGreaterThan(0);
			const stamps = flatStamps(typeSources(grammar));
			expect([...stamps.keys()].sort()).toEqual(seated.map(({ node }) => node.typeName).sort());
			for (const { node, hints } of seated) {
				expect(stamps.get(node.typeName), node.kind).toEqual(
					hints.map((hint) => {
						const keys = hint.keys.map((key) => `readonly${key.name}:${key.field}`).join(';');
						return `FlatHint<${hint.slot},T.${hint.group},{${keys}},${hint.optional}>`;
					})
				);
				const slots = 'slots' in node ? node.slots.map((slot) => slot.propertyName) : [];
				for (const hint of hints) {
					const taken = new Set([
						...slots.filter((slot) => slot !== hint.slot),
						...hints.filter((other) => other !== hint).flatMap((other) => other.keys.map((key) => key.field))
					]);
					for (const key of hint.keys) {
						expect(key.name, `${node.kind}.${hint.slot}.${key.field}`).toBe(
							taken.has(key.field) ? `${hint.slot}${key.field.charAt(0).toUpperCase()}${key.field.slice(1)}` : key.field
						);
					}
				}
			}
			const hints = seated.flatMap(({ hints }) => hints);
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
