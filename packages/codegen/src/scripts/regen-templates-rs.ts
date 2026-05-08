/**
 * regen-templates-rs — regenerate only templates.rs for one or more grammars.
 *
 * Usage:
 *   npx tsx packages/codegen/src/scripts/regen-templates-rs.ts --grammar rust
 *   npx tsx packages/codegen/src/scripts/regen-templates-rs.ts --grammar rust,typescript,python
 *
 * This bypasses the full generate() pipeline (which calls all emitters
 * including factories.ts / wrap.ts). Use when you only need templates.rs
 * regenerated without touching TS output files.
 */

import { writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { evaluate } from '../compiler/evaluate.ts';
import { link } from '../compiler/link.ts';
import { optimize } from '../compiler/optimize.ts';
import { assemble, hydrateSlotRefs } from '../compiler/assemble.ts';
import { resolveGrammarJsPath, resolveOverridesPath } from '../compiler/resolve-grammar.ts';
import { loadGeneratedIdTables } from '../compiler/generated-metadata.ts';
import { emitJinjaTemplates } from '../emitters/templates.ts';
import { emitRenderModuleBundle } from '../emitters/render-module.ts';
import { renderModuleSrcDir } from '../emitters/render-module-paths.ts';

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

	// Phases 1–4: evaluate → link → optimize → assemble
	const grammarJsPath = resolveGrammarJsPath(grammar);
	const overridesPath = resolveOverridesPath(grammar);
	const entryPath = existsSync(overridesPath) ? overridesPath : grammarJsPath;

	const raw = await evaluate(entryPath);
	const linked = link(raw);
	const optimized = optimize(linked);
	const nodeMap = assemble(optimized);
	hydrateSlotRefs(nodeMap);
	const generatedIdTables = await loadGeneratedIdTables(grammar);

	// Emit jinja templates (needed for emitRenderModule)
	const jinjaTemplates = emitJinjaTemplates({ grammar, nodeMap });

	const renderModule = emitRenderModuleBundle(grammar, jinjaTemplates, nodeMap, generatedIdTables);
	const emit = renderModule.emit;

	// Write split render module files
	mkdirSync(dirname(emit.templatesRs.path), { recursive: true });
	writeFileSync(emit.templatesRs.path, emit.templatesRs.contents, 'utf8');
	console.log(`  → ${emit.templatesRs.path} (${emit.templatesRs.contents.length} bytes)`);
	writeFileSync(emit.dispatchRs.path, emit.dispatchRs.contents, 'utf8');
	console.log(`  → ${emit.dispatchRs.path} (${emit.dispatchRs.contents.length} bytes)`);
	writeFileSync(emit.transportRs.path, emit.transportRs.contents, 'utf8');
	console.log(`  → ${emit.transportRs.path} (${emit.transportRs.contents.length} bytes)`);
	writeFileSync(emit.bridgeRs.path, emit.bridgeRs.contents, 'utf8');
	console.log(`  → ${emit.bridgeRs.path} (${emit.bridgeRs.contents.length} bytes)`);
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
