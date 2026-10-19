import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { grammarPackage, type GrammarName } from '../../grammars.ts';
import { sourceChain } from '../../dsl/conflict-resolutions.ts';
import { canonical, evaluateForDerivation, grammarHash, type GrammarDerivationInputs } from '../evaluate-for-derivation.ts';
import { treeSitterCliVersion } from '../tree-sitter-cli.ts';
import { treeSitterPruned } from '../prune-grammar-json.ts';

interface UpstreamGrammarJson {
	readonly rules: Record<string, unknown>;
	readonly externals?: readonly { readonly type: string; readonly name?: string }[];
	readonly conflicts?: readonly (readonly string[])[];
}

function upstreamGrammarJson(name: GrammarName, grammarJsonPath: string): UpstreamGrammarJson {
	const requireFromPackage = createRequire(join(grammarPackage(name).dir, 'package.json'));
	return JSON.parse(readFileSync(requireFromPackage.resolve(grammarJsonPath), 'utf8')) as UpstreamGrammarJson;
}

describe('grammarHash', () => {
	const V = '0.26.9';
	const none = { upstreamConflicts: [], sourceEdges: {}, baseNames: {} };
	const grammar = { name: 'g', rules: { a: { type: 'STRING', value: 'a' } }, conflicts: [['a']] };

	it('leaves the hash unchanged for options, patch sites and provenance', () => {
		const decorated = {
			...grammar,
			options: { x: { 'a:': 1 } },
			patchSites: [{ rule: 'a', path: ['x'] }],
			provenance: new Map([
				['y', 2],
				['x', 1]
			])
		};
		expect(grammarHash(decorated, none, V)).toBe(grammarHash(grammar, none, V));
	});

	it('ignores the grammar name and conflicts', () => {
		expect(grammarHash({ ...grammar, name: 'other', conflicts: [] }, none, V)).toBe(grammarHash(grammar, none, V));
	});

	it('ignores key order in rules and in source edges', () => {
		const reordered = { conflicts: [['a']], rules: { a: { value: 'a', type: 'STRING' } }, name: 'g' };
		expect(grammarHash(reordered, none, V)).toBe(grammarHash(grammar, none, V));
		expect(grammarHash(grammar, { ...none, sourceEdges: { a: 'b', c: 'd' } }, V)).toBe(
			grammarHash(grammar, { ...none, sourceEdges: { c: 'd', a: 'b' } }, V)
		);
	});

	it('changes when the tree-sitter CLI version changes', () => {
		expect(grammarHash(grammar, none, '0.27.0')).not.toBe(grammarHash(grammar, none, V));
	});

	it('changes when a rule changes', () => {
		expect(grammarHash({ ...grammar, rules: { a: { type: 'STRING', value: 'b' } } }, none, V)).not.toBe(grammarHash(grammar, none, V));
	});

	it('changes when a reserved set changes', () => {
		const reserved = (value: string) => ({ ...grammar, reserved: { global: [{ type: 'STRING', value }] } });
		expect(grammarHash(reserved('if'), none, V)).not.toBe(grammarHash(reserved('else'), none, V));
	});

	it('changes when a source edge changes', () => {
		expect(grammarHash(grammar, { ...none, sourceEdges: { a: 'b' } }, V)).not.toBe(grammarHash(grammar, none, V));
	});

	it('changes when a base name changes', () => {
		expect(grammarHash(grammar, { ...none, baseNames: { a: 'x' } }, V)).not.toBe(grammarHash(grammar, none, V));
	});

	it('changes when an upstream conflict set changes', () => {
		expect(grammarHash(grammar, { ...none, upstreamConflicts: [['a', 'b']] }, V)).not.toBe(grammarHash(grammar, none, V));
	});

	it('ignores a hidden rule nothing reaches', () => {
		const orphaned = { ...grammar, rules: { ...grammar.rules, _orphan: { type: 'CHOICE', members: [] } } };
		expect(grammarHash(orphaned, none, V)).toBe(grammarHash(grammar, none, V));
	});

	describe('a hidden rule a route keeps alive moves the hash when its body changes', () => {
		const body = (value: string) => ({ type: 'STRING', value });
		const ref = (name: string) => ({ type: 'SYMBOL', name });
		const route = (hidden: string, changed: string, extra: Record<string, unknown>) => ({
			name: 'g',
			rules: { a: body('a'), [hidden]: body(changed) },
			...extra
		});
		const moves = (hidden: string, extra: Record<string, unknown>) =>
			expect(grammarHash(route(hidden, 'x', extra), none, V)).not.toBe(grammarHash(route(hidden, 'y', extra), none, V));

		it('a rule that a references', () => {
			expect(grammarHash({ name: 'g', rules: { a: { type: 'SEQ', members: [body('a'), ref('_h')] }, _h: body('x') } }, none, V)).not.toBe(
				grammarHash({ name: 'g', rules: { a: { type: 'SEQ', members: [body('a'), ref('_h')] }, _h: body('y') } }, none, V)
			);
		});

		it('a rule the extras name', () => {
			moves('_ws', { extras: [ref('_ws')] });
		});

		it('a rule the externals name', () => {
			moves('_ext', { externals: [ref('_ext')] });
		});

		it('a rule the precedences name', () => {
			moves('_p', { precedences: [[ref('_p'), body('a')]] });
		});

		it('a rule the supertypes name', () => {
			moves('_s', { supertypes: ['_s'] });
		});

		it('the word rule', () => {
			moves('_w', { word: '_w' });
		});
	});
});

describe('canonical', () => {
	it('refuses a value whose JSON would be lost or turned into null', () => {
		const unprintable = [() => 1, 1n, Number.NaN, Number.POSITIVE_INFINITY, /a/, new Date(0), [undefined], new Set([undefined]), new Map([['a', undefined]])];
		for (const value of unprintable) expect(() => canonical({ value })).toThrow(/has no canonical JSON form/);
	});

	it('keeps a plain object without a prototype', () => {
		expect(canonical(Object.assign(Object.create(null) as object, { b: 1, a: 2 }))).toEqual({ a: 2, b: 1 });
	});
});

describe('evaluateForDerivation', () => {
	let python: GrammarDerivationInputs;
	beforeAll(() => {
		python = evaluateForDerivation(grammarPackage('python')).base;
	});

	it('hashes with the version of the tree-sitter CLI that generates', () => {
		expect(treeSitterCliVersion()).toMatch(/^\d+\.\d+\.\d+/);
	});

	it('hashes the same grammar identically in two fresh processes', () => {
		expect(evaluateForDerivation(grammarPackage('python')).base.grammarHash).toBe(python.grammarHash);
	});

	it("carries upstream's own declared conflicts", () => {
		expect(python.upstreamConflicts).toEqual(upstreamGrammarJson('python', 'tree-sitter-python/src/grammar.json').conflicts);
		expect(python.ruleCount).toBeGreaterThan(0);
	});

	it('maps a variant hoisted from a lift to its upstream parent, not to the lift mint', () => {
		expect(sourceChain('integer_hex', python.sourceEdges)).toEqual(['integer_hex', 'integer']);
		expect(sourceChain('expression_statement_tuple', python.sourceEdges)).toEqual(['expression_statement_tuple', 'expression_statement']);
	});

	it('follows a variant of a variant to the upstream rule', () => {
		const typescript = evaluateForDerivation(grammarPackage('typescript')).base;
		expect(sourceChain('export_statement_default_from', typescript.sourceEdges)).toEqual([
			'export_statement_default_from',
			'export_statement_default',
			'export_statement'
		]);
	});

	it("evaluates rust's layer 1 and top layer to the hashes its resolutions file keeps for them", () => {
		const resolutions = JSON.parse(readFileSync(join(grammarPackage('rust').dir, '.sittir', 'resolutions.json'), 'utf8')) as {
			readonly grammarHash: string;
			readonly bound: { readonly grammarHash: string };
		};
		const rust = evaluateForDerivation(grammarPackage('rust'));
		expect(rust.base.grammarHash).toBe(resolutions.grammarHash);
		expect(rust.bound.grammarHash).toBe(resolutions.bound.grammarHash);
	}, 120_000);

	it('never gives an upstream rule or external an edge', () => {
		const upstream = upstreamGrammarJson('python', 'tree-sitter-python/src/grammar.json');
		const upstreamSymbols = new Set([...Object.keys(upstream.rules), ...(upstream.externals ?? []).flatMap((e) => (e.name ? [e.name] : []))]);
		expect(Object.keys(python.sourceEdges).filter((name) => upstreamSymbols.has(name))).toEqual([]);
	});
});

describe('treeSitterPruned', () => {
	it('keeps the document key order and drops the pruned names from inline and conflicts', () => {
		const doc = {
			name: 'g',
			rules: { a: { type: 'SYMBOL', name: '_h' }, _dead: { type: 'CHOICE', members: [] }, _h: { type: 'STRING', value: 'h' } },
			inline: ['_dead', '_h'],
			conflicts: [['_dead', 'a'], ['_h', 'a']]
		};
		const { grammar, pruned } = treeSitterPruned(doc);
		expect(pruned).toEqual(['_dead']);
		expect(Object.keys(grammar)).toEqual(Object.keys(doc));
		expect(Object.keys(grammar.rules as object)).toEqual(['a', '_h']);
		expect(grammar.inline).toEqual(['_h']);
		expect(grammar.conflicts).toEqual([['_h', 'a']]);
	});
});
