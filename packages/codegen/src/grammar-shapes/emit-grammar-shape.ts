import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format as oxfmtFormat } from 'oxfmt';
import { OXFMT_EFFECTIVE_CONFIG } from '../oxfmt-config.ts';
import { grammarPackages, packageRequire, type GrammarPackage } from '../grammars.ts';

const SHAPES_DIR = dirname(fileURLToPath(import.meta.url));
export const BASE_ENTRY = 'base.ts';
const BASE_IMPORT = /^import raw from '([^']+)';$/m;

export function grammarShapeFile(name: string): string {
	return join(SHAPES_DIR, `grammar-shape.${name}.ts`);
}

const UPSTREAM_PREFIX = 'tree-sitter-';
const UPSTREAM_TYPES_DIR = join(SHAPES_DIR, 'upstream');

function upstreamSpecifier(pkg: GrammarPackage): string {
	const basePath = join(pkg.dir, BASE_ENTRY);
	const specifier = BASE_IMPORT.exec(readFileSync(basePath, 'utf8'))?.[1];
	if (specifier === undefined) throw new Error(`${basePath}: no \`import raw from '<upstream grammar.js>';\` line`);
	if (!specifier.startsWith(UPSTREAM_PREFIX) || !specifier.endsWith('.js')) {
		throw new Error(`${basePath}: '${specifier}' must be a '${UPSTREAM_PREFIX}<name>/…/grammar.js' package specifier`);
	}
	return specifier;
}

export function upstreamDeclarationFile(pkg: GrammarPackage): string {
	return join(UPSTREAM_TYPES_DIR, `${upstreamSpecifier(pkg).slice(UPSTREAM_PREFIX.length).replace(/\.js$/, '')}.d.ts`);
}

export function emitUpstreamDeclarationSource(pkg: GrammarPackage): string {
	const typeName = `${pkg.name.charAt(0).toUpperCase()}${pkg.name.slice(1)}GrammarShape`;
	const shape = relative(dirname(upstreamDeclarationFile(pkg)), grammarShapeFile(pkg.name));
	return `import type { ${typeName} } from '${shape}';\n\ndeclare const base: ${typeName};\nexport default base;\n`;
}

export function upstreamGrammarJson(pkg: GrammarPackage): string {
	const specifier = upstreamSpecifier(pkg);
	const grammarJs = specifier.startsWith('.') ? resolve(pkg.dir, specifier) : packageRequire(pkg).resolve(specifier);
	return realpathSync(join(dirname(grammarJs), 'src', 'grammar.json'));
}

export async function emitGrammarShapeSource(pkg: GrammarPackage): Promise<string> {
	const gj = JSON.parse(readFileSync(upstreamGrammarJson(pkg), 'utf8')) as {
		name: string;
		rules: Record<string, unknown>;
		supertypes?: string[];
	};
	const slim = { name: gj.name, rules: gj.rules, supertypeNames: gj.supertypes ?? [] };
	const constName = `${pkg.name}GrammarShape`;
	const typeName = `${pkg.name.charAt(0).toUpperCase()}${pkg.name.slice(1)}GrammarShape`;
	const source = `import type { GrammarJson } from './grammar-json.ts';\n\nexport const ${constName} = ${JSON.stringify(slim, null, 1)} as const satisfies GrammarJson;\n\nexport type ${typeName} = typeof ${constName};\n`;
	const path = grammarShapeFile(pkg.name);
	const formatted = await oxfmtFormat(path, source, OXFMT_EFFECTIVE_CONFIG);
	if (formatted.errors.length > 0) throw new Error(`oxfmt failed to format ${path}`);
	return formatted.code;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	for (const pkg of grammarPackages()) {
		if (!existsSync(join(pkg.dir, BASE_ENTRY))) continue;
		const source = await emitGrammarShapeSource(pkg);
		writeFileSync(grammarShapeFile(pkg.name), source);
		mkdirSync(dirname(upstreamDeclarationFile(pkg)), { recursive: true });
		writeFileSync(upstreamDeclarationFile(pkg), emitUpstreamDeclarationSource(pkg));
		console.log(`wrote grammar-shape.${pkg.name}.ts (${source.length} bytes)`);
	}
}
