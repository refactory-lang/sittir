import { describe, it, expect } from 'vitest';
import { prepare } from '../src/render.ts';
import type { RulesConfig, AnyNodeData } from '../src/types.ts';

// Mirror of render.ts's internal context builder — the test needs one to
// call prepare(). Kept minimal: prefix '$' triggers the default var regex.
function makeCtx(config: RulesConfig) {
	const prefix = config.expandoChar ?? '$';
	const varPattern = /(\$\$\$|\$\$|\$_|\$)([A-Z][A-Z0-9_]*)/g;
	return { config, varPattern, prefix } as const;
}

describe('prepare() — ADR-0013 Task 3', () => {
	it('short-circuits to text on leaf nodes with only $text', () => {
		const ctx = makeCtx({
			language: 'test',
			extensions: [],
			expandoChar: null,
			metadata: {},
			rules: {}
		});
		const node: AnyNodeData = { $type: 'identifier', $text: 'main' };
		const prepared = prepare(node, ctx as any);
		expect(prepared.text).toBe('main');
		expect(prepared.template).toBeUndefined();
		expect(prepared.substitutions).toBeUndefined();
	});

	it('returns template + substitutions for a branch node', () => {
		const config: RulesConfig = {
			language: 'test',
			extensions: [],
			expandoChar: null,
			metadata: {},
			rules: { greet: '$NAME!' }
		};
		const ctx = makeCtx(config);
		const node: AnyNodeData = {
			$type: 'greet',
			$fields: { name: { $type: 'id', $text: 'world' } }
		};
		const prepared = prepare(node, ctx as any);
		expect(prepared.template).toBe('$NAME!');
		expect(prepared.substitutions).toHaveLength(1);
		expect(prepared.substitutions![0]!.value).toBe('world');
		expect(prepared.substitutions![0]!.matchIndex).toBe(0);
		expect(prepared.substitutions![0]!.matchLength).toBe(5);
	});

	it('clause consumes a child that $$$CHILDREN would otherwise emit', () => {
		// Template has a clause referencing a child kind; $$$CHILDREN then
		// emits only the remainder. Verifies clause-first consumption
		// ordering (the first of the three tricky cases the ADR calls out).
		const config: RulesConfig = {
			language: 'test',
			extensions: [],
			expandoChar: null,
			metadata: {},
			rules: {
				wrapper: {
					template: '$ALPHA_CLAUSE[$$$CHILDREN]',
					alpha_clause: '<$ALPHA>',
					joinBy: ','
				}
			}
		};
		const ctx = makeCtx(config);
		const node: AnyNodeData = {
			$type: 'wrapper',
			$children: [
				{ $type: 'alpha', $text: 'A', $named: true },
				{ $type: 'beta', $text: 'B', $named: true },
				{ $type: 'gamma', $text: 'C', $named: true }
			]
		};
		const prepared = prepare(node, ctx as any);
		// Both clause + $$$CHILDREN resolve in prepare; alpha is consumed
		// by the clause and thus not re-emitted in $$$CHILDREN.
		const clauseSub = prepared.substitutions!.find((s) =>
			s.value.startsWith('<')
		);
		const childrenSub = prepared.substitutions!.find(
			(s) => !s.value.startsWith('<')
		);
		expect(clauseSub?.value).toBe('<A>');
		expect(childrenSub?.value).toBe('B,C');
	});

	it('field-to-child promotion: single-valued $FIELD promotes the only named child when template has no $$$CHILDREN', () => {
		// Third tricky case: no $$$CHILDREN in template, exactly one named
		// child not in $fields — $FOO promotes it.
		const config: RulesConfig = {
			language: 'test',
			extensions: [],
			expandoChar: null,
			metadata: {},
			rules: { outer: '[$INNER]' }
		};
		const ctx = makeCtx(config);
		const node: AnyNodeData = {
			$type: 'outer',
			$children: [{ $type: 'leaf', $text: 'x', $named: true }]
		};
		const prepared = prepare(node, ctx as any);
		expect(prepared.substitutions).toHaveLength(1);
		expect(prepared.substitutions![0]!.value).toBe('x');
	});
});
