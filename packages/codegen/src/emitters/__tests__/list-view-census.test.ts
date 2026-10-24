import { collectKindEntries, type KindEnumEntry } from '../kind-discriminant.ts';
import { beforeAll, describe, expect, it } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { readFileSync } from 'node:fs';
import { compileGrammar } from '../../compiler/compile.ts';
import { allGrammars, grammarPackage } from '../../grammars.ts';
import { listOptionKeys, listSlotHints, listViewHint, listViewPlanOf } from '../factories.ts';

const compact = (text: string): string => text.replace(/\s+/g, '').replace(/<\|/g, '<');

const keysOf = (text: string): string[] => [...text.matchAll(/\b(separator|delimiter)\??:/g)].map((m) => m[1]!).sort();

const read = (grammar: string, file: string): string => readFileSync(`packages/${grammar}/src/${file}`, 'utf8');

const typeSources = (grammar: string): string => read(grammar, 'types.ts') + read(grammar, 'types-internal.ts');

const interfaceBlock = (source: string, typeName: string): string => {
	const start = source.indexOf(`export interface ${typeName} {`);
	return start < 0 ? '' : source.slice(start, source.indexOf('\n}\n', start));
};

const factoryElement = (raw: string, factory: string): string | undefined => {
	const start = raw.search(new RegExp(`function ${factory}(?:<\\s*A extends [^(]*)?\\(\\s*(?:\\)|value|options|\\.\\.\\.)`));
	if (start < 0) return undefined;
	const dispatch = raw.indexOf(`function ${factory}(...args`, start);
	const body = raw.slice(start, dispatch >= 0 ? dispatch : raw.indexOf('\n}\n', start));
	const elements = body.lastIndexOf('...elements:');
	const rest = body.slice(body.startsWith('...elements: A & RefuseUndeclared<A>', elements) ? body.lastIndexOf('A extends ', elements) : elements);
	const element = /Admit<([\s\S]*?)>\s*(?:>|\[\])/.exec(rest);
	return element === null ? undefined : compact(element[1]!).replace(/^\|/, '');
};

const GRAMMARS = allGrammars();
const nodeMaps: Record<string, Awaited<ReturnType<typeof compileGrammar>>['nodeMap']> = {};
const kindEntriesOf: Record<string, readonly KindEnumEntry[]> = {};

for (const grammar of GRAMMARS) {
	beforeAll(async () => {
		const { nodeMap, generatedIdTables } = await compileGrammar({ package: grammarPackage(grammar) });
		nodeMaps[grammar] = nodeMap;
		kindEntriesOf[grammar] = collectKindEntries(nodeMap, generatedIdTables);
	}, FULL_PIPELINE_TIMEOUT);
}

/** The top-level functions of a generated module whose first line matches `head`. */
function functionsOf(source: string, head: RegExp): string[] {
	return source.split(/\n(?=(?:export )?function )/).filter((block) => head.test(block));
}

/** How many list views the blocks install: a `withListView` call or a `[LIST_ITEMS]` member each. */
function installsIn(blocks: readonly string[]): number {
	return blocks.reduce((sum, block) => sum + (block.match(/withListView\(|\[LIST_ITEMS\]: /g)?.length ?? 0), 0);
}

describe('every kind that reads as a list is stamped, wired and typed from one fact', () => {
	for (const grammar of GRAMMARS) {
		it(`${grammar}: the list views the model finds are the interfaces stamped $listView and the nodes that install one`, () => {
			const nodeMap = nodeMaps[grammar]!;
			const types = typeSources(grammar);
			const raw = read(grammar, 'factories/objects.ts');
			const views = [...nodeMap.nodes.values()].filter((node) => listViewHint(node, nodeMap, kindEntriesOf[grammar]!) !== undefined);
			if (['rust', 'python', 'typescript'].includes(grammar)) expect(views.length).toBeGreaterThan(0);
			const stamped = [...types.matchAll(/export interface (\w+) \{(?:(?!\n\}\n)[\s\S])*?\$listView: ListViewHint</g)].map((m) => m[1]!);
			expect(stamped.sort()).toEqual(views.map((node) => node.typeName).sort());
			for (const node of views) {
				const hint = listViewHint(node, nodeMap, kindEntriesOf[grammar]!)!;
				const element = factoryElement(raw, hint.factory);
				expect(element, `${node.kind} list factory`).toBeDefined();
				expect(compact(interfaceBlock(types, node.typeName)), `${node.kind} view element`).toContain(`$listView:ListViewHint<${element}`);
			}
			expect(installsIn(functionsOf(raw, /^/)), 'factories/objects.ts').toBe(views.length);
			const wrap = read(grammar, 'wrap.ts');
			expect(installsIn(functionsOf(wrap, /^export function wrap/)), 'wrap.ts wraps').toBe(views.length);
			const viewed = functionsOf(wrap, /^function view/).filter((block) => installsIn([block]) > 0).map((block) => /^function view(\w+)\(/.exec(block)![1]!);
			if (views.length > 0) expect(viewed.length, 'wrap.ts views').toBeGreaterThan(0);
			for (const name of viewed) expect(installsIn(functionsOf(wrap, new RegExp(`^export function wrap${name}\\(`))), `view${name} views a list its wrap views`).toBe(1);
		});

		it(`${grammar}: every slot that holds a list is stamped with its list's items and wired to its builder`, () => {
			const nodeMap = nodeMaps[grammar]!;
			const types = typeSources(grammar);
			const parents = [...nodeMap.nodes.values()].filter((node) => listSlotHints(node, nodeMap, kindEntriesOf[grammar]!).length > 0);
			if (['rust', 'python', 'typescript'].includes(grammar)) expect(parents.length).toBeGreaterThan(0);
			for (const node of parents) {
				const block = compact(interfaceBlock(types, node.typeName));
				for (const hint of listSlotHints(node, nodeMap, kindEntriesOf[grammar]!)) {
					const view = /\$listView:ListViewHint<([\s\S]*?),\{/.exec(compact(interfaceBlock(types, hint.kind)))?.[1];
					expect(view, `${hint.kind} view`).toBeDefined();
					expect(block, `${node.kind}.${hint.slot}`).toContain(`readonly${hint.slot}:ListSlotHint<${view},`);
				}
			}
			const stamped = [...types.matchAll(/readonly \$listSlots: \{/g)];
			expect(stamped).toHaveLength(parents.length);
			for (const file of ['wrap.ts', 'factories/objects.ts']) {
				const wired = [...read(grammar, file).matchAll(/kind: TSKindId\.\w+ as const,\s*optional: (?:true|false),\s*make:/g)];
				expect(wired, file).toHaveLength(parents.reduce((total, node) => total + listSlotHints(node, nodeMap, kindEntriesOf[grammar]!).length, 0));
			}
		});
	}
});

describe('the list-view plan', () => {
	it('names an option key exactly when the list factory takes it', () => {
		expect(listOptionKeys({ hasSeparatorKindOption: false, hasDelimiterOption: true })).toEqual(['delimiter']);
		expect(listOptionKeys({ hasSeparatorKindOption: true, hasDelimiterOption: false })).toEqual(['separator']);
		expect(listOptionKeys({ hasSeparatorKindOption: false, hasDelimiterOption: false })).toEqual([]);
	});

	for (const grammar of GRAMMARS) {
		it(`${grammar}: every list view's spec keys are the keys of its marker's options`, () => {
			const nodeMap = nodeMaps[grammar]!;
			const kindEntries = kindEntriesOf[grammar]!;
			let views = 0;
			for (const node of nodeMap.nodes.values()) {
				const plan = listViewPlanOf(node, nodeMap, kindEntries);
				const hint = listViewHint(node, nodeMap, kindEntries);
				expect(plan === undefined).toBe(hint === undefined);
				if (plan === undefined || hint === undefined) continue;
				views++;
				expect(plan.options.map((option) => option.key).sort()).toEqual(keysOf(hint.options));
				expect(plan.count).toMatch(/^_\w+$/);
			}
			if (['rust', 'python', 'typescript'].includes(grammar)) expect(views).toBeGreaterThan(0);
		});
	}
});
