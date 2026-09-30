import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { compileGrammar } from '../../compiler/compile.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { grammarPackage } from '../../grammars.ts';
import { listOwnerHint } from '../factories.ts';

const compact = (text: string): string => text.replace(/\s+/g, '');

const bare = (union: string): string => union.replace(/^\|/, '');

const read = (grammar: string, file: string): string => readFileSync(`packages/${grammar}/src/${file}`, 'utf8');

const typeSources = (grammar: string): string => read(grammar, 'types.ts') + read(grammar, 'types-internal.ts');

const interfaceBlock = (source: string, typeName: string): string => {
	const start = source.indexOf(`export interface ${typeName} {`);
	return start < 0 ? '' : source.slice(start, source.indexOf('\n}\n', start));
};

const accessorElement = (block: string, slot: string): string | undefined => {
	const start = block.indexOf(`\t${slot}():`);
	if (start < 0) return undefined;
	const declared = compact(block.slice(start + slot.length + 3, block.indexOf(';', start)).replace(/^:/, ''));
	const items = /^\|?(?:NonEmptyArray<(.*)>|readonly\((.*)\)\[\]|readonly(.*)\[\])(?:\|undefined)?$/.exec(declared);
	return items === null ? undefined : bare(items[1] ?? items[2] ?? items[3]!);
};

const factoryElement = (raw: string, factory: string): string | undefined => {
	const start = raw.search(new RegExp(`function ${factory}\\(\\s*(?:\\)|value|options|\\.\\.\\.)`));
	if (start < 0) return undefined;
	const body = raw.slice(start, raw.indexOf(`function ${factory}(...args`, start));
	const rest = body.slice(body.lastIndexOf('...elements:'));
	const element = /AdmitBound<([\s\S]*?),\s*T\.AdmittedNodes\s*>/.exec(rest);
	return element === null ? undefined : bare(compact(element[1]!));
};

describe('a list owner reads its list slot as the elements its factory takes', () => {
	for (const grammar of ['rust', 'python', 'typescript'] as const) {
		it(`${grammar}: every owner's accessor, hint and factory overload name one element type`, async () => {
			const generatedIdTables = await loadGeneratedIdTables(grammar);
			const { nodeMap } = await compileGrammar({ package: grammarPackage(grammar), generatedIdTables });
			const types = typeSources(grammar);
			const raw = read(grammar, 'factories/raw.ts');
			const owners = [...nodeMap.nodes.values()].filter((node) => listOwnerHint(node, nodeMap, undefined) !== undefined);
			expect(owners.length).toBeGreaterThan(0);
			for (const node of owners) {
				const hint = listOwnerHint(node, nodeMap, undefined)!;
				const block = interfaceBlock(types, node.typeName);
				const element = accessorElement(block, hint.slot);
				expect(element, `${node.kind} accessor`).toBeDefined();
				expect(compact(block).replace('ListOwnerHint<|', 'ListOwnerHint<').includes(`ListOwnerHint<${element}`), `${node.kind} hint`).toBe(true);
				expect(factoryElement(raw, node.rawFactoryName!), `${node.kind} factory`).toBe(element);
			}
		});

		it(`${grammar}: the owners the model finds are the interfaces stamped as owners and the wrapped and built nodes that seat one`, async () => {
			const generatedIdTables = await loadGeneratedIdTables(grammar);
			const { nodeMap } = await compileGrammar({ package: grammarPackage(grammar), generatedIdTables });
			const owners = [...nodeMap.nodes.values()]
				.filter((node) => listOwnerHint(node, nodeMap, undefined) !== undefined)
				.map((node) => node.typeName)
				.sort();
			const stamped = [...typeSources(grammar).matchAll(/export interface (\w+) \{(?:(?!\n\}\n)[\s\S])*?\$listOwner: ListOwnerHint</g)]
				.map((match) => match[1]!)
				.sort();
			expect(stamped).toEqual(owners);
			for (const file of ['wrap.ts', 'factories/raw.ts']) {
				expect([...read(grammar, file).matchAll(/withListOwner\(\s*(?:withAccessors|\{)/g)]).toHaveLength(owners.length);
			}
		});
	}
});
