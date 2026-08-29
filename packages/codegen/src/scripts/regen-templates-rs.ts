import { writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { evaluate } from '../compiler/evaluate.ts';
import { link } from '../compiler/link.ts';
import { normalizeGrammar } from '../compiler/normalize.ts';
import { assemble, AssembleCtx, hydrateSlotRefs } from '../compiler/assemble.ts';
import { resolveGrammarJsPath, resolveOverridesPath } from '../compiler/resolve-grammar.ts';
import { loadGeneratedIdTables } from '../compiler/generated-metadata.ts';
import { runRenderModuleEmitter } from '../emitters/render-module-runner.ts';

const SUPPORTED_GRAMMARS = ['rust', 'typescript', 'python'] as const;
type Grammar = (typeof SUPPORTED_GRAMMARS)[number];

const args = process.argv.slice(2);
const grammarArg =
	args.find((_, i) => args[i - 1] === '--grammar' || args[i - 1] === '-g') ??
	args.find((a) => a.startsWith('--grammar='))?.split('=')[1];

if (!grammarArg) {
	console.error('Usage: regen-templates-rs --grammar <rust|typescript|python|rust,typescript,python>');
	process.exit(1);
}

const grammarsToRegen = grammarArg.split(',').map((g) => g.trim()) as Grammar[];
for (const g of grammarsToRegen) {
	if (!(SUPPORTED_GRAMMARS as readonly string[]).includes(g)) {
		console.error(`Unknown grammar: ${g}. Supported: ${SUPPORTED_GRAMMARS.join(', ')}`);
		process.exit(1);
	}
}

async function regenTemplatesRs(grammar: Grammar): Promise<void> {
	console.log(`\n=== Regenerating templates.rs for ${grammar} ===`);

	const grammarJsPath = resolveGrammarJsPath(grammar);
	const overridesPath = resolveOverridesPath(grammar);
	const entryPath = existsSync(overridesPath) ? overridesPath : grammarJsPath;

	const raw = await evaluate(entryPath);
	const linked = link(raw);
	const normalized = normalizeGrammar(linked);
	const generatedIdTables = await loadGeneratedIdTables(grammar);
	const nodeMap = assemble(AssembleCtx.from(normalized, generatedIdTables));
	hydrateSlotRefs(nodeMap);

	const renderModule = runRenderModuleEmitter({ grammar, nodeMap, generatedIdTables });
	const emit = renderModule.emit;

	mkdirSync(dirname(emit.templatesRs.path), { recursive: true });
	writeFileSync(emit.templatesRs.path, emit.templatesRs.contents, 'utf8');
	console.log(`  → ${emit.templatesRs.path} (${emit.templatesRs.contents.length} bytes)`);
	writeFileSync(emit.transportRs.path, emit.transportRs.contents, 'utf8');
	console.log(`  → ${emit.transportRs.path} (${emit.transportRs.contents.length} bytes)`);
	writeFileSync(emit.libRs.path, emit.libRs.contents, 'utf8');
	console.log(`  → ${emit.libRs.path} (${emit.libRs.contents.length} bytes)`);

	const dstTemplatesDir = renderModule.templateCopies.directory;
	mkdirSync(dstTemplatesDir, { recursive: true });
	const emittedNames = new Set<string>();
	for (const file of renderModule.templateCopies.files) {
		writeFileSync(file.path, file.contents, 'utf8');
		emittedNames.add(file.path.split('/').pop() ?? file.path);
	}
	for (const existing of readdirSync(dstTemplatesDir)) {
		if (!existing.endsWith('.jinja')) continue;
		if (!emittedNames.has(existing)) rmSync(join(dstTemplatesDir, existing), { force: true });
	}
	console.log(`  → ${dstTemplatesDir}/ (${emittedNames.size} .jinja files)`);
}

for (const grammar of grammarsToRegen) {
	await regenTemplatesRs(grammar);
}
console.log('\nDone.');
