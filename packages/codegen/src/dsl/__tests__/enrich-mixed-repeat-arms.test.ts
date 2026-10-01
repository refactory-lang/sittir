import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { enrich, type EnrichAuthoredConfig } from '../enrich.ts';
import { readRuleMetadata } from '../rule-metadata.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';
import { grammarPackage } from '../../grammars.ts';
import { evaluatePackage } from '../../compiler/evaluate-package.ts';
import { loadGeneratedIdTables } from '../../compiler/generated-metadata.ts';
import { collectCatalogKinds } from '../../emitters/kind-discriminant.ts';
import { readFileSync } from 'node:fs';

beforeAll(() => installFakeDsl());
afterAll(() => restoreFakeDsl());

const sym = (name: string) => ({ type: 'SYMBOL', name });
const str = (value: string) => ({ type: 'STRING', value });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const choice = (...members: unknown[]) => ({ type: 'CHOICE', members });
const repeat = (content: unknown) => ({ type: 'REPEAT', content });
const field = (name: string, content: unknown) => ({ type: 'FIELD', name, content });

const suffix = () => repeat(choice(sym('capture'), field('quantifier', sym('quantifier'))));
const member = () => choice(field('name', sym('property_name')), sym('assignment'));
const base = { capture: str('@c'), quantifier: str('*'), property_name: str('p'), assignment: seq(str('a'), str('='), str('b')) };

type Node = { type?: string; name?: string; metadata?: unknown; annotations?: { variant?: string; variantOf?: string; hoisted?: true }; members?: Node[]; content?: Node };

function run(rules: Record<string, unknown>, authored?: EnrichAuthoredConfig) {
	const out = enrich({ grammar: { name: 'test', rules, supertypes: [] } } as never, authored) as unknown as {
		grammar: { rules: Record<string, Node>; supertypes: string[] };
	};
	return out.grammar;
}

function nodes(rule: Node | undefined, out: Node[] = []): Node[] {
	if (!rule || typeof rule !== 'object') return out;
	out.push(rule);
	for (const m of rule.members ?? []) nodes(m, out);
	nodes(rule.content, out);
	return out;
}

const liftRefs = (rule: Node | undefined): string[] =>
	nodes(rule)
		.filter((n) => n.type === 'SYMBOL' && readRuleMetadata(n.metadata as never)?.symbolSource === 'group-lift')
		.map((n) => n.name!);

const fieldNames = (rule: Node | undefined): string[] => nodes(rule).filter((n) => n.type === 'FIELD').map((n) => n.name!);

describe('the element choice of a repeat with a lifted arm', () => {
	it('becomes a hidden supertype named after the owner and the singular slot, listed in supertypes', () => {
		const grammar = run({ ...base, list: seq(str('('), str(')'), suffix()) });
		expect(grammar.rules['_list_element']).toMatchObject({ type: 'CHOICE' });
		expect(grammar.rules['_list_element']!.annotations?.hoisted).toBeUndefined();
		expect(grammar.supertypes).toContain('_list_element');
		expect(liftRefs(grammar.rules['list'])).toEqual(['_list_element']);
		expect(fieldNames(grammar.rules['list'])).toEqual(['elements']);
	});

	it('names the lifted arm after the supertype and hoists it', () => {
		const { rules } = run({ ...base, list: seq(str('('), str(')'), suffix()) });
		expect(rules['list_element_quantifier']).toMatchObject({ type: 'FIELD', name: 'quantifier', annotations: { hoisted: true } });
		expect(rules['list_quantifier']).toBeUndefined();
	});

	it('labels every arm a variant of the supertype, never of the owner', () => {
		const { rules } = run({ ...base, list: seq(str('('), str(')'), suffix()) });
		const arms = rules['_list_element']!.members!;
		expect(arms.map((arm) => [arm.name, arm.annotations?.variant, arm.annotations?.variantOf])).toEqual([
			['capture', 'capture', '_list_element'],
			['list_element_quantifier', 'quantifier', '_list_element']
		]);
		expect(nodes(rules['list']).some((n) => n.annotations?.variantOf === 'list')).toBe(false);
	});

	it('shares one supertype and one arm kind across owners of an identical choice, named by the first owner', () => {
		const { rules } = run({ ...base, list: seq(str('('), str(')'), suffix()), grouping: seq(str('['), str(']'), suffix()) });
		expect(liftRefs(rules['grouping'])).toEqual(['_list_element']);
		expect(rules['_grouping_element']).toBeUndefined();
		expect(rules['grouping_element_quantifier']).toBeUndefined();
	});

	it('uses the element name of a separated list for both occurrences', () => {
		const { rules } = run({ ...base, enum_body: seq(str('{'), member(), repeat(seq(str(','), member())), str('}')) });
		const owner = Object.keys(rules).find((name) => liftRefs(rules[name]).includes('_enum_body_element'))!;
		expect(liftRefs(rules[owner])).toEqual(['_enum_body_element', '_enum_body_element']);
		expect(fieldNames(rules[owner])).toEqual(['element', 'element']);
		expect(rules['enum_body_element_name']).toMatchObject({ type: 'FIELD', name: 'name' });
	});

	it('takes an authored slot name from the patch field site and leaves the fielding to the patch', () => {
		const { rules } = run(
			{ ...base, class_body: seq(str('{'), suffix(), str('}')) },
			{ fieldSites: new Map([['class_body', [{ path: [1], name: 'members' }]]]) }
		);
		expect(rules['_class_body_member']).toMatchObject({ type: 'CHOICE' });
		expect(rules['class_body_member_quantifier']).toBeDefined();
		expect(fieldNames(rules['class_body'])).toEqual([]);
	});

	it('leaves a repeat of one topology alone', () => {
		const { rules } = run({ ...base, list: seq(str('('), str(')'), repeat(choice(sym('capture'), sym('quantifier')))) });
		expect(liftRefs(rules['list'])).toEqual([]);
		expect(Object.keys(rules).filter((name) => name.startsWith('_list'))).toEqual([]);
	});
});

describe('the scm suffix element', () => {
	it('is one shared supertype with one quantifier kind, referenced by every suffix owner', async () => {
		const { rules } = await evaluatePackage(grammarPackage('scm'));
		const refersTo = (rule: unknown, name: string): boolean => JSON.stringify(rule).includes(`"name":"${name}"`);
		expect(rules['list_element_quantifier']).toMatchObject({ type: 'FIELD', name: 'quantifier' });
		const owners = ['list', 'grouping', 'missing_node', 'anonymous_node', 'named_node_plain', 'named_node_supertyped'];
		expect(owners.filter((owner) => !refersTo(rules[owner], '_list_element'))).toEqual([]);
		expect(Object.keys(rules).filter((name) => name.endsWith('_quantifier') || name.endsWith('_element')).sort()).toEqual([
			'_list_element',
			'list_element_quantifier'
		]);
	}, 120_000);
});

describe('a variant() name declared under both the owner and its element supertype', () => {
	it('reaches neither pipeline under the parent that did not resolve it', async () => {
		const unused = ['class_body_method', 'class_body_method_sig', 'class_body_declaration'];
		const resolved = ['class_body_member_method', 'class_body_member_method_sig', 'class_body_member_declaration'];
		const parserRules = Object.keys(
			(JSON.parse(readFileSync(new URL('../../../../typescript/.sittir/src/grammar.json', import.meta.url), 'utf8')) as { rules: object }).rules
		);
		const { rules } = await evaluatePackage(grammarPackage('typescript'));
		const tables = await loadGeneratedIdTables('typescript');
		if (tables === undefined) throw new Error('no generated id tables for typescript');
		const catalog = JSON.stringify(collectCatalogKinds(tables));
		for (const name of unused) {
			expect(parserRules).not.toContain(name);
			expect(Object.keys(rules)).not.toContain(name);
			expect(catalog).not.toContain(`"${name}"`);
		}
		for (const name of resolved) {
			expect(parserRules).toContain(name);
			expect(Object.keys(rules)).toContain(name);
			expect(catalog).toContain(`"${name}"`);
		}
	}, 120_000);
});

describe('scm variant names declared under the shared element supertype', () => {
	it('reach neither pipeline: the named_node variants resolve under their owner', async () => {
		const unused = ['list_element_plain', 'list_element_supertyped'];
		const parserRules = Object.keys(
			(JSON.parse(readFileSync(new URL('../../../../scm/.sittir/src/grammar.json', import.meta.url), 'utf8')) as { rules: object }).rules
		);
		const { rules } = await evaluatePackage(grammarPackage('scm'));
		const tables = await loadGeneratedIdTables('scm');
		if (tables === undefined) throw new Error('no generated id tables for scm');
		const catalog = JSON.stringify(collectCatalogKinds(tables));
		for (const name of unused) {
			expect(parserRules).not.toContain(name);
			expect(Object.keys(rules)).not.toContain(name);
			expect(catalog).not.toContain(`"${name}"`);
		}
		for (const name of ['named_node_plain', 'named_node_supertyped', 'list_element_quantifier']) {
			expect(parserRules).toContain(name);
			expect(Object.keys(rules)).toContain(name);
			expect(catalog).toContain(`"${name}"`);
		}
	}, 120_000);
});

describe('a list group whose element choice became a supertype', () => {
	it('is still labelled a variant of its parent, so the parent keeps the route that mounts it', async () => {
		const { rules } = await evaluatePackage(grammarPackage('typescript'));
		const group = nodes(rules['enum_body'] as Node).find((n) => n.type === 'SYMBOL' && n.name === 'enum_body_elements');
		expect(group?.annotations).toMatchObject({ variant: 'elements', variantOf: 'enum_body' });
	}, 120_000);
});
