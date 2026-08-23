/**
 * Namespaced constructors — the derivation (`namespacedConstructors`) and
 * its factory emission (`export const buildX = attachProps(...)`).
 */

import { CHOICE, FIELD, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { emitFactories } from '../../__tests__/helpers/emit-factories.ts';
import { computeSlotClasses } from '../shared.ts';
import { AssembledBranch, AssembledPattern, type AssembledNode } from '../../compiler/model/node-map.ts';
import type { Rule, SeqRule } from '../../types/rule.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { deleteWrapper } from '../../compiler/wrapper-deletion.ts';
import { namespacedConstructors } from '../namespaced-constructors.ts';

function branch(kind: string, rule: SeqRule<'link'>): AssembledBranch {
	return new AssembledBranch(kind, rule, deleteWrapper(rule), deleteWrapper(rule));
}

function field(name: string, content: Rule<'link'>): Rule<'link'> {
	return { type: FIELD, name, content };
}

const NAME = { type: SYMBOL, name: 'name' } as const;

/**
 * `wrapper` — sole slot `content` choosing between two minted arms;
 * `_wrapper_b` discriminates on a `kind` enum (let | const), so its member
 * constructors hoist into `wrapper`'s namespace beside `a` and `b`.
 */
function makeFormNodeMap(): ReturnType<typeof makeNodeMapWith> {
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'wrapper',
		branch('wrapper', {
			type: SEQ,
			members: [
				field('content', {
					type: CHOICE,
					members: [
						{ type: SYMBOL, name: '_wrapper_a' },
						{ type: SYMBOL, name: '_wrapper_b' }
					]
				})
			]
		})
	);
	nodes.set(
		'_wrapper_a',
		branch('_wrapper_a', { type: SEQ, members: [{ type: STRING, value: 'a' }, field('name', NAME)] })
	);
	nodes.set(
		'_wrapper_b',
		branch('_wrapper_b', {
			type: SEQ,
			members: [
				field('kind', {
					type: CHOICE,
					members: [
						{ type: STRING, value: 'let' },
						{ type: STRING, value: 'const' }
					]
				}),
				field('name', NAME)
			]
		})
	);
	nodes.set('name', new AssembledPattern('name', { type: PATTERN, value: '[a-z]+' }));
	const nodeMap = makeNodeMapWith(nodes);
	computeSlotClasses(nodeMap);
	return nodeMap;
}

describe('namespacedConstructors — derivation', () => {
	it('names form constructors by the arm suffix and hoists the arm enum members', () => {
		const nodeMap = makeFormNodeMap();
		const { entries, ambiguous } = namespacedConstructors(nodeMap.nodes.get('wrapper')!, nodeMap);
		expect(ambiguous).toEqual([]);
		expect(entries.map((e) => [e.via, e.name])).toEqual([
			['form', 'a'],
			['form', 'b'],
			['form', 'let'],
			['form', 'const']
		]);
		const hoisted = entries.find((e) => e.name === 'let');
		expect(hoisted).toMatchObject({ via: 'form', childKind: '_wrapper_b', path: ['let'] });
	});

	it('gives the arm its own member constructors with the non-enum slots as parameters', () => {
		const nodeMap = makeFormNodeMap();
		const { entries } = namespacedConstructors(nodeMap.nodes.get('_wrapper_b')!, nodeMap);
		expect(entries.map((e) => e.name)).toEqual(['let', 'const']);
		const member = entries[0]!;
		expect(member.via).toBe('member');
		if (member.via === 'member') {
			expect(member.literal).toBe('let');
			expect(member.params.map((p) => p.name)).toEqual(['name']);
		}
	});

	it('drops a name two candidates claim and reports both', () => {
		// `_wrapper_b`'s members are `let` and `const`; a sibling arm minted
		// as `_wrapper_let` claims `let` too — neither is hoisted.
		const nodeMap = makeFormNodeMap();
		const nodes = new Map(nodeMap.nodes);
		nodes.set(
			'_wrapper_let',
			branch('_wrapper_let', { type: SEQ, members: [{ type: STRING, value: 'x' }, field('name', NAME)] })
		);
		const rule: SeqRule<'link'> = {
			type: SEQ,
			members: [
				field('content', {
					type: CHOICE,
					members: [
						{ type: SYMBOL, name: '_wrapper_let' },
						{ type: SYMBOL, name: '_wrapper_b' }
					]
				})
			]
		};
		nodes.set('wrapper', branch('wrapper', rule));
		const clashing = makeNodeMapWith(nodes);
		computeSlotClasses(clashing);
		const { entries, ambiguous } = namespacedConstructors(clashing.nodes.get('wrapper')!, clashing);
		expect(entries.map((e) => e.name)).toEqual(['b', 'const']);
		expect(ambiguous).toEqual([{ name: 'let', claimants: ['_wrapper_let', '_wrapper_b.let'] }]);
	});

	it('is empty for a sole slot holding one kind (the forwarded shape)', () => {
		const nodes = new Map<string, AssembledNode>();
		nodes.set('solo', branch('solo', { type: SEQ, members: [field('content', { type: SYMBOL, name: '_solo_a' })] }));
		nodes.set('_solo_a', branch('_solo_a', { type: SEQ, members: [field('name', NAME)] }));
		nodes.set('name', new AssembledPattern('name', { type: PATTERN, value: '[a-z]+' }));
		const nodeMap = makeNodeMapWith(nodes);
		computeSlotClasses(nodeMap);
		expect(namespacedConstructors(nodeMap.nodes.get('solo')!, nodeMap).entries).toEqual([]);
	});
});

describe('namespacedConstructors — factory emission', () => {
	it('exports the parent as an attachProps const over a private impl', () => {
		const emitted = emitFactories({ grammar: 'test', nodeMap: makeFormNodeMap() });
		expect(emitted).toContain('function buildWrapper$impl(');
		expect(emitted).not.toContain('export function buildWrapper(');
		expect(emitted).toContain('export const buildWrapper = attachProps(buildWrapper$impl, {');
		expect(emitted).toContain("import { withMethods, withAccessors, methodsEngine, attachProps } from './utils.js';");
	});

	it('declares a form constructor with the child factory parameters and stores the built child', () => {
		const emitted = emitFactories({ grammar: 'test', nodeMap: makeFormNodeMap() });
		expect(emitted).toContain('a: (config: T.WrapperA.Config) => buildWrapper$impl(buildWrapperA(config)),');
		expect(emitted).toContain(
			'let: (...args: Parameters<typeof buildWrapperB.let>) => buildWrapper$impl(buildWrapperB.let(...args)),'
		);
	});

	it('declares a member constructor fixing the enum slot and taking the rest positionally', () => {
		const emitted = emitFactories({ grammar: 'test', nodeMap: makeFormNodeMap() });
		expect(emitted).toContain(
			"let: (name: T.WrapperB.Config['name']) => buildWrapperB$impl({ name: name, kind: 'let' }),"
		);
	});
});
