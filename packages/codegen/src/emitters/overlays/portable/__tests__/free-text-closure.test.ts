import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { bindingsPathIn } from '../../../../bindings/facts.ts';
import { compileGrammar, type Compilation } from '../../../../compiler/compile.ts';
import { loadPackageIdTables } from '../../../../compiler/generated-metadata.ts';
import { generate } from '../../../../compiler/generate.ts';
import { grammarPackage } from '../../../../grammars.ts';
import type { ExactSlots } from '../exact.ts';

let compilation: Compilation;

beforeAll(async () => {
	const pkg = grammarPackage('python');
	compilation = await compileGrammar({ package: pkg, generatedIdTables: await loadPackageIdTables(pkg) });
}, 120_000);

const REFINED_STRINGS = /^\(\(string \(string_start\) @_p\).*\n/gm;

const claim = (path: string, ...tests: readonly string[]): string => `((string (string_start) @_p) @${path} ${tests.map((pattern) => `(#match? @_p "${pattern}")`).join(' ')})`;

const exactWith = async (claims: readonly string[]): Promise<ExactSlots> => {
	const dir = mkdtempSync(join(tmpdir(), 'sittir-free-text-'));
	writeFileSync(bindingsPathIn(dir), `${readFileSync(bindingsPathIn(compilation.package.dir), 'utf8').replace(REFINED_STRINGS, '')}${claims.join('\n')}\n`);
	const generated = await generate({ grammar: 'python', outputDir: join(dir, 'src'), compilation: { ...compilation, package: { ...compilation.package, dir } } });
	if (generated.portableTyped === undefined) throw new Error('python emitted no typed module');
	return generated.portableTyped.exact;
};

const elementsAt = (exact: ExactSlots, path: string): { readonly paths: readonly string[]; readonly raw: readonly string[] } => {
	const set = exact.get(path)?.get('elements');
	if (set === undefined) throw new Error(`no exact set at ${path}.elements`);
	return { paths: set.kinds, raw: set.raw.map((arm) => arm.kind) };
};

const INTERPOLATING = [claim('literal.string.interpolated', '^[a-zA-Z]*[fF]'), claim('literal.string.interpolated.deferred', '^[a-zA-Z]*[tT]')];
const BYTES = claim('literal.string.bytes', '^[a-zA-Z]*[bB]');

describe("a string path's elements, by the prefixes that read as it", () => {
	it('keeps interpolations on a refinement the reader picks over its parent, though both test one prefix', async () => {
		const multiline = String.raw`((string (string_start) @_p) @literal.string.interpolated.multiline (#match? @_p "^[a-zA-Z]*[fF](\"\"\"|''')"))`;
		const exact = await exactWith([...INTERPOLATING, multiline, BYTES]);
		for (const path of ['literal.string.interpolated', 'literal.string.interpolated.multiline']) {
			expect(elementsAt(exact, path).paths, path).toContain('expression.interpolation');
			expect(elementsAt(exact, path).raw, path).toContain('interpolation');
		}
		for (const path of ['literal.string', 'literal.string.bytes']) {
			expect(elementsAt(exact, path).paths, path).not.toContain('expression.interpolation');
			expect(elementsAt(exact, path).raw, path).not.toContain('interpolation');
		}
	}, 120_000);

	it('closes no path of a kind with a claim the prefix alone cannot decide', async () => {
		const ended = '((string (string_start) @_p (string_end) @_e) @literal.string.interpolated (#match? @_p "^[a-zA-Z]*[fF]") (#match? @_e "."))';
		const exact = await exactWith([ended, INTERPOLATING[1]!, BYTES]);
		for (const path of ['literal.string', 'literal.string.interpolated', 'literal.string.bytes']) {
			expect(elementsAt(exact, path).paths, path).toContain('expression.interpolation');
			expect(elementsAt(exact, path).raw, path).toContain('interpolation');
		}
	}, 120_000);
});
