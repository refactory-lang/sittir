import { beforeAll, describe, expect, it } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { readFileSync } from 'node:fs';
import { compileGrammar } from '../../compiler/compile.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { allGrammars, grammarPackage } from '../../grammars.ts';
import { listSlotHints, listViewHint } from '../factories.ts';

const compact = (text: string): string => text.replace(/\s+/g, '').replace(/<\|/g, '<');

const read = (grammar: string, file: string): string => readFileSync(`packages/${grammar}/src/${file}`, 'utf8');

const typeSources = (grammar: string): string => read(grammar, 'types.ts') + read(grammar, 'types-internal.ts');

const interfaceBlock = (source: string, typeName: string): string => {
	const start = source.indexOf(`export interface ${typeName} {`);
	return start < 0 ? '' : source.slice(start, source.indexOf('\n}\n', start));
};

const factoryElement = (raw: string, factory: string): string | undefined => {
	const start = raw.search(new RegExp(`function ${factory}\\(\\s*(?:\\)|value|options|\\.\\.\\.)`));
	if (start < 0) return undefined;
	const dispatch = raw.indexOf(`function ${factory}(...args`, start);
	const body = raw.slice(start, dispatch >= 0 ? dispatch : raw.indexOf('\n}\n', start));
	const rest = body.slice(body.lastIndexOf('...elements:'));
	const element = /Admit<([\s\S]*?)>\s*(?:>|\[\])/.exec(rest);
	return element === null ? undefined : compact(element[1]!).replace(/^\|/, '');
};

const GRAMMARS = allGrammars();
const nodeMaps: Record<string, Awaited<ReturnType<typeof compileGrammar>>['nodeMap']> = {};

for (const grammar of GRAMMARS) {
	beforeAll(async () => {
		const generatedIdTables = await loadGeneratedIdTables(grammar);
		nodeMaps[grammar] = (await compileGrammar({ package: grammarPackage(grammar), generatedIdTables })).nodeMap;
	}, FULL_PIPELINE_TIMEOUT);
}

describe('every kind that reads as a list is stamped, wired and typed from one fact', () => {
	for (const grammar of GRAMMARS) {
		it(`${grammar}: the list views the model finds are the interfaces stamped $listView and the nodes that install one`, () => {
			const nodeMap = nodeMaps[grammar]!;
			const types = typeSources(grammar);
			const raw = read(grammar, 'factories/raw.ts');
			const views = [...nodeMap.nodes.values()].filter((node) => listViewHint(node, nodeMap, undefined) !== undefined);
			if (['rust', 'python', 'typescript'].includes(grammar)) expect(views.length).toBeGreaterThan(0);
			const stamped = [...types.matchAll(/export interface (\w+) \{(?:(?!\n\}\n)[\s\S])*?\$listView: ListViewHint</g)].map((m) => m[1]!);
			expect(stamped.sort()).toEqual(views.map((node) => node.typeName).sort());
			for (const node of views) {
				const hint = listViewHint(node, nodeMap, undefined)!;
				const element = factoryElement(raw, hint.factory);
				expect(element, `${node.kind} list factory`).toBeDefined();
				expect(compact(interfaceBlock(types, node.typeName)), `${node.kind} view element`).toContain(`$listView:ListViewHint<${element}`);
			}
			for (const file of ['wrap.ts', 'factories/raw.ts']) {
				const installed = [...read(grammar, file).matchAll(/withListView\(|\[LIST_ITEMS\]: /g)];
				expect(installed, file).toHaveLength(views.length);
			}
		});

		it(`${grammar}: every slot that holds a list is stamped with its list's items and wired to its builder`, () => {
			const nodeMap = nodeMaps[grammar]!;
			const types = typeSources(grammar);
			const parents = [...nodeMap.nodes.values()].filter((node) => listSlotHints(node, nodeMap, undefined).length > 0);
			if (['rust', 'python', 'typescript'].includes(grammar)) expect(parents.length).toBeGreaterThan(0);
			for (const node of parents) {
				const block = compact(interfaceBlock(types, node.typeName));
				for (const hint of listSlotHints(node, nodeMap, undefined)) {
					const view = /\$listView:ListViewHint<([\s\S]*?),\{/.exec(compact(interfaceBlock(types, hint.kind)))?.[1];
					expect(view, `${hint.kind} view`).toBeDefined();
					expect(block, `${node.kind}.${hint.slot}`).toContain(`readonly${hint.slot}:ListSlotHint<${view},`);
				}
			}
			const stamped = [...types.matchAll(/readonly \$listSlots: \{/g)];
			expect(stamped).toHaveLength(parents.length);
			for (const file of ['wrap.ts', 'factories/raw.ts']) {
				const wired = [...read(grammar, file).matchAll(/kind: TSKindId\.\w+ as const,\s*optional: (?:true|false),\s*make:/g)];
				expect(wired, file).toHaveLength(parents.reduce((total, node) => total + listSlotHints(node, nodeMap, undefined).length, 0));
			}
		});
	}
});
