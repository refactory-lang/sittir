import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { grammarPackage } from '../../grammars.ts';

const dir = grammarPackage('typescript').dir;
const read = (...parts: string[]): string => readFileSync(join(dir, ...parts), 'utf8');

type Member = { readonly name: string; readonly route: string; readonly slot?: string; readonly except?: readonly string[]; readonly path?: unknown };
const members = (): readonly Member[] => {
	const model = JSON.parse(read('src', 'node-model-portable.json5')) as { kinds: Record<string, { members?: readonly Member[] }> };
	return model.kinds.export_statement_default_declaration?.members ?? [];
};

describe('the TypeScript export default declaration, a union slot', () => {
	it('has no binding entry for the rule', () => {
		expect(read('grammar.bindings.ts')).not.toContain('export_statement_default_declaration');
	});

	it('has no declaration field in the generated rule', () => {
		const grammar = JSON.parse(read('.sittir', 'src', 'grammar.json')) as { rules: Record<string, unknown> };
		expect(JSON.stringify(grammar.rules.export_statement_default_declaration)).not.toContain('"type":"FIELD","name":"declaration"');
	});

	it('reports no union-slot-routed diagnostic', () => {
		expect(read('.sittir', 'grammar-diagnostics.json')).not.toContain('union-slot-routed');
	});

	it('routes the declaration member to the content slot, except the default keyword', () => {
		expect(members().find((m) => m.name === 'declaration' && m.route === 'slot')).toEqual({
			name: 'declaration',
			route: 'slot',
			slot: 'content',
			except: ['export_statement_default_declaration_default_kw'],
			path: [{ owner: 'export_statement_default_declaration', slot: 'content' }]
		});
	});

	it('routes the nested declaration through the default keyword', () => {
		expect(members().find((m) => m.name === 'declaration' && m.route === 'nested')).toMatchObject({
			route: 'nested',
			via: [{ kind: 'export_statement_default_declaration_default_kw' }],
			parent: 'export_statement_default_declaration_default_kw',
			slot: 'content',
			path: [
				{ owner: 'export_statement_default_declaration', slot: 'content' },
				{ owner: 'export_statement_default_declaration_default_kw', slot: 'content' }
			]
		});
	});
});
