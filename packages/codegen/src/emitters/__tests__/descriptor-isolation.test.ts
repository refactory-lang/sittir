import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript6';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../../../../', import.meta.url));
const { options: compilerOptions } = ts.parseJsonConfigFileContent(ts.readConfigFile(resolve(root, 'tsconfig.json'), ts.sys.readFile).config, ts.sys, root);

const GRAMMARS = ['rust', 'python', 'typescript', 'regex', 'scm'] as const;

const FORBIDDEN: readonly RegExp[] = [
	/\/packages\/[^/]+\/src\/(api|wrap|portable|utils|types)\.ts$/,
	/\/packages\/common\/src\/(index|engine|engine-boundary|native-binding|native-boundary)\.ts$/,
	/\/src\/factories\//,
	/\/native\//,
	/\.node$/
];

const rel = (file: string): string => relative(root, file);

const runtimeSpecifiersOf = (file: string): string[] => {
	const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
	return source.statements.flatMap((statement) => {
		const runtime =
			(ts.isImportDeclaration(statement) && statement.importClause?.isTypeOnly !== true) ||
			(ts.isExportDeclaration(statement) && !statement.isTypeOnly && statement.moduleSpecifier !== undefined);
		return runtime ? [(statement.moduleSpecifier as ts.StringLiteral).text] : [];
	});
};

function violationsOf(entry: string): string[] {
	const violations: string[] = [];
	const seen = new Set([entry]);
	const queue = [entry];
	for (let file = queue.shift(); file !== undefined; file = queue.shift()) {
		for (const specifier of runtimeSpecifiersOf(file)) {
			const via = `${rel(file)} imports '${specifier}'`;
			const resolved = ts.resolveModuleName(specifier, file, compilerOptions, ts.sys).resolvedModule;
			if (resolved === undefined) {
				if (!specifier.startsWith('node:')) violations.push(`unresolved: ${via}`);
				continue;
			}
			if (resolved.isExternalLibraryImport) continue;
			const target = resolved.resolvedFileName;
			if (FORBIDDEN.some((pattern) => pattern.test(target))) {
				violations.push(`${via}, which is ${rel(target)}`);
				continue;
			}
			if (!seen.has(target)) {
				seen.add(target);
				queue.push(target);
			}
		}
	}
	return violations;
}

describe('a grammar descriptor', () => {
	it.each(GRAMMARS)('%s: is the descriptor.ts module of its package', (grammar) => {
		expect(existsSync(resolve(root, `packages/${grammar}/src/descriptor.ts`))).toBe(true);
	});

	it.each(GRAMMARS)('%s: loads no engine, api, wrap, factory, portable, utils, type or native module at runtime', (grammar) => {
		const entry = resolve(root, `packages/${grammar}/src/descriptor.ts`);
		expect(existsSync(entry), `${rel(entry)} exists`).toBe(true);
		expect(violationsOf(entry)).toEqual([]);
	});
});
