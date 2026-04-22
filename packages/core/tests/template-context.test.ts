import { describe, it, expect } from 'vitest';
import type { TemplateContext } from '../src/render.ts';
import { buildTemplateContext } from '../src/render.ts';
import type { RulesConfig, AnyNodeData } from '../src/types.ts';

// Mirror of render.ts's internal context builder; needed because
// buildTemplateContext is an internal helper that consumes the
// InternalRenderContext. We construct a minimal one here.
function makeCtx(config: RulesConfig) {
	const varPattern = /(\$\$\$|\$\$|\$_|\$)([A-Z][A-Z0-9_]*)/g;
	return { config, varPattern, prefix: '$' } as const;
}

describe('TemplateContext — ADR-0013 Task 3 formalization', () => {
	it('branch node: populates named field slots as pre-rendered strings', () => {
		const config: RulesConfig = {
			language: 'test',
			extensions: [],
			expandoChar: null,
			metadata: {},
			rules: { greet: '$NAME!' },
		};
		const ctx = makeCtx(config);
		const node: AnyNodeData = {
			$type: 'greet',
			$fields: { name: { $type: 'id', $text: 'world' } },
		};
		const tc: TemplateContext = buildTemplateContext(node, ctx as any);
		expect(tc.name).toBe('world');
		expect(tc.children).toBe('');
		expect(tc.variant).toBe('');
		expect(tc.text).toBe('');
		expect(tc.trailing_sep).toBe(false);
		expect(tc.leading_sep).toBe(false);
	});

	it('container node: pre-joins children into `children` string', () => {
		const config: RulesConfig = {
			language: 'test',
			extensions: [],
			expandoChar: null,
			metadata: {},
			rules: {
				list: { template: '[$$$CHILDREN]', joinBy: ', ' },
			},
		};
		const ctx = makeCtx(config);
		const node: AnyNodeData = {
			$type: 'list',
			$children: [
				{ $type: 'leaf', $text: 'a', $named: true },
				{ $type: 'leaf', $text: 'b', $named: true },
				{ $type: 'leaf', $text: 'c', $named: true },
			],
		};
		const tc = buildTemplateContext(node, ctx as any);
		expect(tc.children).toBe('a, b, c');
		expect(tc.children_list).toEqual(['a', 'b', 'c']);
	});

	it('polymorph node: surfaces $variant field', () => {
		const config: RulesConfig = {
			language: 'test',
			extensions: [],
			expandoChar: null,
			metadata: {},
			rules: {
				gate: {
					variants: {
						open: '[OPEN]',
						closed: '[CLOSED]',
					},
				},
			},
		};
		const ctx = makeCtx(config);
		const node: AnyNodeData = {
			$type: 'gate',
			$variant: 'closed',
			$fields: {},
		};
		const tc = buildTemplateContext(node, ctx as any);
		expect(tc.variant).toBe('closed');
	});

	it('leaf node with $text: sets text, empty variant/children', () => {
		const config: RulesConfig = {
			language: 'test',
			extensions: [],
			expandoChar: null,
			metadata: {},
			rules: { ident: '$TEXT' },
		};
		const ctx = makeCtx(config);
		const node: AnyNodeData = {
			$type: 'ident',
			$text: 'foo',
			$fields: {},
		};
		const tc = buildTemplateContext(node, ctx as any);
		expect(tc.text).toBe('foo');
		expect(tc.variant).toBe('');
		expect(tc.children).toBe('');
	});
});
