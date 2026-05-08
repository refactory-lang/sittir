import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluate } from '../compiler/evaluate.ts';
import { link } from '../compiler/link.ts';
import { optimize } from '../compiler/optimize.ts';
import { assemble, hydrateSlotRefs } from '../compiler/assemble.ts';
import { emitJinjaTemplates } from '../emitters/templates.ts';

let rustTemplates: Map<string, string> | undefined;

async function getRustTemplate(kind: string): Promise<string> {
	if (rustTemplates === undefined) {
		const repoRoot = resolve(new URL('../../../..', import.meta.url).pathname);
		const grammar = 'rust';
		const overridesPath = resolve(repoRoot, `packages/${grammar}/overrides.ts`);
		const grammarJsPath = resolve(
			repoRoot,
			'node_modules/.pnpm/tree-sitter-rust@0.24.0_tree-sitter@0.22.4/node_modules/tree-sitter-rust/grammar.js'
		);
		const raw = await evaluate(existsSync(overridesPath) ? overridesPath : grammarJsPath);
		const linked = link(raw);
		const optimized = optimize(linked);
		const nodeMap = assemble(optimized);
		hydrateSlotRefs(nodeMap);
		rustTemplates = emitJinjaTemplates({ grammar, nodeMap }).bodies;
	}
	return rustTemplates.get(kind) ?? '';
}

describe('rust polymorph templates inline parameterless child terminators', () => {
	it('renders mod_item with a children-presence semicolon fallback', async () => {
		const body = await getRustTemplate('mod_item');
		expect(body).toContain('{% if children | isPresent %}{{ children | join(" ") }}{% else %};{% endif %}');
	});

	it('renders impl_item with a children-presence semicolon fallback', async () => {
		const body = await getRustTemplate('impl_item');
		expect(body).toContain('{% if children | isPresent %}{{ children | join(" ") }}{% else %};{% endif %}');
	});

	it('renders struct_item with a children-presence semicolon fallback', async () => {
		const body = await getRustTemplate('struct_item');
		expect(body).toContain('{% if children | isPresent %}{{ children | join(" ") }}{% else %};{% endif %}');
	});
});
