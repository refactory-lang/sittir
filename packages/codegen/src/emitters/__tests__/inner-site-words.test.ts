import { beforeAll, describe, expect, it } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { compileGrammar } from '../../compiler/compile.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { grammarPackage, type GrammarName } from '../../grammars.ts';
import { innerKinds } from '../../compiler/model/trivia.ts';
import type { NodeMap } from '../../compiler/types.ts';
import type { GeneratedIdTables } from '../../dsl/symbol-table.ts';
import { innerSiteWord, innerSiteWords, innerSitesRs } from '../render-module.ts';
import { emitKindIdRust } from '../kind-id-rust.ts';
import { emitConsts } from '../consts.ts';

interface Compiled {
	readonly nodeMap: NodeMap;
	readonly generatedIdTables: GeneratedIdTables;
}

async function compiled(grammar: GrammarName): Promise<Compiled> {
	const generatedIdTables = await loadGeneratedIdTables(grammar);
	const { nodeMap } = await compileGrammar({ package: grammarPackage(grammar), generatedIdTables });
	return { nodeMap, generatedIdTables };
}

function kindIdOf(nodeMap: NodeMap, kind: string): number {
	const id = nodeMap.nodes.get(kind)?.kindId;
	if (id === undefined) throw new Error(`no kind id for ${kind}`);
	return id;
}

describe('the inner-site stamp', () => {
	let rust: Compiled;
	let regex: Compiled;

	beforeAll(async () => {
		rust = await compiled('rust');
		regex = await compiled('regex');
	}, FULL_PIPELINE_TIMEOUT);

	it('names each inner-site kind by the record word of its inner-site slot', () => {
		const words = innerSiteWords(rust.nodeMap);
		expect([...words.keys()].sort()).toEqual([...innerKinds(rust.nodeMap)].sort());
		expect(words.get('block')).toBe(5);
		expect(words.get('source_file')).toBe(5);
		expect(words.get('arguments')).toBe(2);
		expect(innerSiteWords(regex.nodeMap)).toEqual(new Map([['character_class', 2]]));
	});

	it('stamps the words natively by kind id, in kind id order, and the surface kinds read them', () => {
		const stamp = innerSitesRs(rust.nodeMap).join('\n');
		expect(stamp).toContain('pub const INNER_SITES: &[(::sittir_core::types::KindId, u32)] = &[');
		expect(stamp).toContain(`(::sittir_core::types::KindId(${kindIdOf(rust.nodeMap, 'block')}), 5)`);
		const ids = [...stamp.matchAll(/KindId\((\d+)\), \d+\)/g)].map((match) => Number(match[1]));
		expect(ids).toEqual([...ids].sort((a, b) => a - b));
		expect(ids).toHaveLength(innerKinds(rust.nodeMap).size);
		expect(emitKindIdRust({ grammar: 'rust', ...rust })).toContain('    inner: super::node::INNER_SITES,');
	});

	it('lists the JavaScript side its inner-site kinds from the same stamp', () => {
		const consts = emitConsts({ grammar: 'rust', nodeMap: rust.nodeMap });
		const listed = consts.match(/export const INNER_SITES: ReadonlySet<string> = new Set<string>\((\[.*\])\);/)?.[1];
		expect(listed === undefined ? undefined : JSON.parse(listed)).toEqual([...innerSiteWords(rust.nodeMap).keys()]);
	});

	it('refuses an inner site that is no slot of its kind', () => {
		const node = rust.nodeMap.nodes.get('range_expression_bare');
		expect(node?.slots).toEqual([]);
		const slotless = Object.create(node!, { innerSite: { value: { key: 'interior', precedingTokens: 1, slots: [] } } });
		expect(() => innerSiteWord(slotless, rust.nodeMap)).toThrow(/inner-site-without-slot|its inner site 'interior' is no slot/);
	});
}, FULL_PIPELINE_TIMEOUT);
