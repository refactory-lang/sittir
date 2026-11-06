import { BASE_ENTRY, BOOTSTRAP_INDENT_UNIT, GRAMMAR_ENTRY, GRAMMAR_TSCONFIG, GRAMMAR_TYPECHECK_CEILING, GRAMMAR_TYPECHECK_SCRIPT, PORTABLE_TYPE_TESTS } from '@sittir/codegen/grammars';

export interface GrammarTemplateVars {
	readonly name: string;
	readonly Name: string;
	readonly upstreamDependency: string;
	readonly upstreamRange: string;
}

export interface TemplateFile {
	readonly path: string;
	readonly contents: string;
}

const json = (value: unknown): string => `${JSON.stringify(value, null, '\t')}\n`;

export function grammarPackageFiles(v: GrammarTemplateVars): TemplateFile[] {
	return [
		{
			path: 'package.json',
			contents: json({
				name: `@sittir/${v.name}`,
				version: '0.1.0',
				description: `Typed ${v.Name} IR builder — node kinds from the ${v.upstreamDependency} grammar`,
				keywords: ['ast', 'codegen', 'ir', v.name, 'tree-sitter'],
				homepage: 'https://github.com/refactory-lang/sittir#readme',
				license: 'MIT',
				repository: {
					type: 'git',
					url: 'https://github.com/refactory-lang/sittir.git',
					directory: `packages/${v.name}`
				},
				files: ['dist', 'native'],
				type: 'module',
				main: './dist/index.js',
				types: './dist/index.d.ts',
				exports: {
					'.': { types: './dist/index.d.ts', import: './dist/index.js' },
					'./api': { types: './dist/api.d.ts', import: './dist/api.js' }
				},
				scripts: {
					build: 'tsrs -p tsconfig.build.json',
					clean: 'rm -rf dist tsconfig.build.tsbuildinfo tsconfig.tsbuildinfo',
					dev: 'tsrs -p tsconfig.build.json --watch',
					test: 'vitest run',
					'test:coverage': 'vitest run --coverage',
					'type-check': 'tsrs --noEmit',
					[GRAMMAR_TYPECHECK_SCRIPT]: `tsrs -p ${GRAMMAR_TSCONFIG}`
				},
				dependencies: {
					'@sittir/types': 'workspace:*',
					'@sittir/common': 'workspace:*'
				},
				devDependencies: {
					'@types/node': '^25.6.0',
					[v.upstreamDependency]: v.upstreamRange
				},
				'//native': `Native artifacts are grammar-local implementation details for @sittir/${v.name}, shipped in native/ and built from rust/crates/sittir-${v.name}.`
			})
		},
		{
			path: 'tsconfig.json',
			contents: json({
				extends: '../../tsconfig.json',
				compilerOptions: { types: ['node'] },
				include: ['src', 'tests'],
				exclude: ['node_modules', 'dist', PORTABLE_TYPE_TESTS]
			})
		},
		{
			path: 'tsconfig.build.json',
			contents: json({
				extends: './tsconfig.json',
				compilerOptions: {
					noEmit: false,
					composite: true,
					incremental: true,
					declaration: true,
					declarationMap: true,
					rootDir: './src',
					outDir: './dist',
					tsBuildInfoFile: './tsconfig.build.tsbuildinfo',
					paths: {}
				},
				references: [{ path: '../types/tsconfig.build.json' }, { path: '../common/tsconfig.build.json' }],
				include: ['src'],
				exclude: ['node_modules', 'dist', 'tests']
			})
		},
		{
			path: GRAMMAR_TSCONFIG,
			contents: json({ extends: `../../${GRAMMAR_TSCONFIG}`, include: [GRAMMAR_ENTRY] })
		},
		{
			path: GRAMMAR_TYPECHECK_CEILING,
			contents: json({ [GRAMMAR_ENTRY]: 1 })
		},
		{
			path: BASE_ENTRY,
			contents: `// The upstream tree-sitter grammar. tsconfig \`paths\` types this specifier as the grammar's
// generated shape (grammar-shapes/upstream/), so \`raw\` needs no cast; Node loads the real grammar.js.
// Node's type stripping loads this file, so it stays erasable.
import raw from '${v.upstreamDependency}/grammar.js';
export default raw;
`
		},
		{
			path: GRAMMAR_ENTRY,
			contents: `/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import base from './${BASE_ENTRY}';
import resolutions from './.sittir/resolutions.json' with { type: 'json' };
import { enrich, preference, wire } from '../codegen/src/dsl/index.ts';

export default grammar(enrich(base), wire({
\tresolutions,
\toptions: { indent: preference('${BOOTSTRAP_INDENT_UNIT}') }
}));
`
		},
		{
			path: 'README.md',
			contents: `# @sittir/${v.name}

Typed ${v.Name} IR builders generated from the \`${v.upstreamDependency}\` grammar by \`@sittir/codegen\`.

Regenerate:

\`\`\`bash
pnpm exec tsx packages/cli/src/cli.ts gen --grammar ${v.name} --all --output packages/${v.name}/src
\`\`\`

This grammar is not yet part of the default validation gates. Once it matures, add
\`"sittir": { "stable": true }\` to \`package.json\`.
`
		}
	];
}
