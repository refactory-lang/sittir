import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { stableGrammars } from '@sittir/codegen/grammars';
import { grammarModulePath, importGrammarModule, requireGrammarModule } from '../src/grammar-internals.ts';
import { languageByName } from '../src/languages.ts';
import { readNativeTree } from '../src/validate/common.ts';

const sources: Readonly<Record<string, string>> = {
	rust: 'fn main() {}\n',
	typescript: 'const value = 1;\n',
	python: 'value = 1\n',
	scm: '(identifier) @name\n',
	regex: '[ab]+'
};

describe.each(stableGrammars())('%s grammar internals', (grammar) => {
	it('keeps middleware on the canonical parsed and rendered engine surface', async () => {
		const source = sources[grammar];
		if (source === undefined) throw new Error(`Missing fixture for ${grammar}`);
		const calls: string[] = [];
		const engine = await createEngine(await languageByName(grammar), {
			intercept: [
				{
					parse(call, next) {
						calls.push(`parse:${call.source}`);
						return next();
					},
					render(_call, next) {
						calls.push('render');
						return next();
					}
				}
			]
		});
		try {
			const root = engine.parse(source);
			expect(engine.isParsedNode(root)).toBe(true);
			using rendered = engine.render(root);
			expect(rendered.toString()).toBe(source);
			expect(rendered.toString()).toBe(source);
			expect(calls).toEqual([`parse:${source}`, 'render']);
		} finally {
			engine.dispose();
		}
	});

	it('uses the current engine with matching raw, coercion and wrap artifacts', async () => {
		const source = sources[grammar];
		if (source === undefined) throw new Error(`Missing fixture for ${grammar}`);
		const engine = await createEngine(await languageByName(grammar));
		try {
			const [types, factories, coercion, wrap] = await Promise.all([
				requireGrammarModule(grammar, 'types.ts'),
				requireGrammarModule(grammar, 'factories/raw.ts'),
				requireGrammarModule(grammar, 'factories/coerce.ts'),
				requireGrammarModule(grammar, 'wrap.ts')
			]);
			const parsed = readNativeTree(engine, source);
			const wrapped = wrap.wrapNode(parsed.root, parsed.tree);
			if (!engine.isNode(wrapped)) throw new Error(`Invalid wrapped root for ${grammar}`);
			if (typeof wrapped.$type !== 'number') throw new Error(`Non-numeric root kind for ${grammar}`);
			const kind = types.KIND_NAMES.get(wrapped.$type);
			if (kind === undefined) throw new Error(`Missing root kind for ${grammar}`);

			expect(types.kindIdFromName(kind)).toBe(wrapped.$type);
			expect(factories._factoryMap[kind]).toBeTypeOf('function');
			expect(coercion._fromMap[kind]).toBeTypeOf('function');
			expect(engine.render(wrapped).toString()).toBe(source);
			expect(wrap.wrapNode(parsed.tree.read!(0), parsed.tree)).toMatchObject({ $type: wrapped.$type });
		} finally {
			engine.dispose();
		}
	}, 30_000);
});

describe('missing grammar artifacts', () => {
	it('preserves the optional missing-module result', async () => {
		expect(grammarModulePath('not-a-grammar', 'types.ts')).toBeUndefined();
		expect(await importGrammarModule('not-a-grammar', 'types.ts')).toBeUndefined();
	});

	it('reports a required artifact failure instead of an empty successful load', async () => {
		await expect(requireGrammarModule('not-a-grammar', 'factories/coerce.ts')).rejects.toThrow(
			"grammar 'not-a-grammar' has no generated src/factories/coerce.ts"
		);
	});
});
