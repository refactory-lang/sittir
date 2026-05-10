import { describe, expect, it } from 'vitest';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRendererFromConfig } from '../src/render.ts';
import type { AnyNodeData, RulesConfig } from '../src/types.ts';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'numeric-fields');

const config: RulesConfig = {
	language: 'test',
	extensions: [],
	expandoChar: null,
	metadata: {},
	rules: {},
	kindNames: new Map<number, string>([
		[16, 'let'],
		[5, 'lbrace'],
		[7, 'rbrace']
	])
};

const { render } = createRendererFromConfig(config, { templatesDir: fixturesDir });

describe('nunjucks renderer numeric kind fields', () => {
	it('renders numeric keyword fields via kindNames lookup', () => {
		const node: AnyNodeData = {
			$type: 'lexical_declaration',
			_kind: 16,
			_declarators: [{ $type: 'identifier', $text: 'bar' }],
			_semicolon: ';'
		};
		expect(render(node)).toBe('let bar ;\n');
	});

	it('renders numeric delimiter fields via kindNames lookup', () => {
		const node: AnyNodeData = {
			$type: 'object_type',
			_opening: 5,
			_members: [{ $type: 'identifier', $text: 'foo: string' }],
			_closing: 7
		};
		expect(render(node)).toBe('{ foo: string }\n');
	});
});
