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
				files: ['dist'],
				type: 'module',
				main: './dist/index.js',
				types: './dist/index.d.ts',
				exports: {
					'.': { types: './dist/index.d.ts', import: './dist/index.js' },
					'./utils': { types: './dist/utils.d.ts', import: './dist/utils.js' }
				},
				scripts: {
					build: 'tsc -p tsconfig.build.json',
					clean: 'rm -rf dist tsconfig.build.tsbuildinfo tsconfig.tsbuildinfo',
					dev: 'tsc -p tsconfig.build.json --watch',
					test: 'vitest run',
					'test:coverage': 'vitest run --coverage',
					'type-check': 'tsc --noEmit'
				},
				dependencies: {
					'@sittir/types': 'workspace:*',
					'@sittir/common': 'workspace:*'
				},
				devDependencies: {
					'@types/node': '^25.6.0',
					[v.upstreamDependency]: v.upstreamRange,
					'type-fest': '^5.6.0'
				},
				'//native': `Native artifacts are grammar-local implementation details for @sittir/${v.name}, built from rust/crates/sittir-${v.name}.`
			})
		},
		{
			path: 'tsconfig.json',
			contents: json({
				extends: '../../tsconfig.json',
				compilerOptions: { types: ['node'] },
				include: ['src', 'tests'],
				exclude: ['node_modules', 'dist']
			})
		},
		{
			path: 'tsconfig.build.json',
			contents: json({
				extends: './tsconfig.json',
				compilerOptions: {
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
			path: 'grammar.sittir.ts',
			contents: `// @ts-nocheck — grammar.js is untyped
import base from '${v.upstreamDependency}/grammar.js';
import { enrich, wire } from '../codegen/src/dsl/index.ts';

const enrichedBase = enrich(base);
export default grammar(
	enrichedBase,
	wire(
		{
			name: '${v.name}',
			externals: ($, previous) => [...(previous ?? []), $._tight, $._space, $._newline],
			supertypes: ($, previous) => [...(previous ?? []), $._whitespace],
			visibleExternals: (_$) => ({
				_tight: string(''),
				_space: string(' '),
				_newline: string('\\n')
			}),
			rules: {
				_whitespace: ($) => choice($._tight, $._space, $._newline)
			}
		},
		enrichedBase
	)
);
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
