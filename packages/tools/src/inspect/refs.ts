/**
 * inspect/refs — merged inspect-refs + inspect-suggestions tool.
 *
 * Modes:
 *   refs        — dump every reference TO a given symbol (who names it, who doesn't).
 *   suggestions — dump derivation log from Link: inferred fields, promoted rules,
 *                 repeated shapes. Replaces the old inspect-suggestions.ts positional script.
 *
 * CLI:
 *   inspect-refs [--mode refs|suggestions] [--grammar <name>] [--symbol <name>]
 *                [--base] [--limit <n>]
 *
 * Options:
 *   --mode         refs | suggestions  (default: refs)
 *   --grammar      grammar name        (default: rust)
 *   --symbol       target symbol name  (refs mode only, default: _type_identifier)
 *   --base         use base grammar.js instead of overrides (where available)
 *   --limit        max entries per section in suggestions mode (default: 10)
 */

import { existsSync } from 'node:fs';

// Codegen phases/loaders + their real types come from the shared
// codegen-surface (typed invoke + import()-type aliases); no local stub
// types or dynamic-import loader are needed here.
import { invoke } from '../codegen-surface.ts';

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface InspectRefsOptions {
	mode: string;
	grammar: string;
	symbol: string;
	useBase: boolean;
	limit: number;
}

// ---------------------------------------------------------------------------
// Entry resolution
// ---------------------------------------------------------------------------

function resolveEntryPath(overridesPath: string, grammarJsPath: string, useBase: boolean): string {
	if (!useBase && existsSync(overridesPath)) return overridesPath;
	return grammarJsPath;
}

// ---------------------------------------------------------------------------
// Mode: refs
// ---------------------------------------------------------------------------

async function runRefs(args: InspectRefsOptions): Promise<number> {
	const entryPath = resolveEntryPath(
		await invoke('resolveGrammar', 'resolveOverridesPath', args.grammar),
		await invoke('resolveGrammar', 'resolveGrammarJsPath', args.grammar),
		args.useBase
	);
	process.stdout.write(`entry: ${entryPath}\n`);

	const raw = await invoke('evaluate', 'evaluate', entryPath);
	const refs = raw.references.filter((r) => r.to === args.symbol);

	process.stdout.write(`\n${refs.length} references to ${args.symbol}:\n`);

	const named = refs.filter((r) => r.fieldName !== undefined);
	const unnamed = refs.filter((r) => r.fieldName === undefined);
	process.stdout.write(`  named:   ${named.length}\n`);
	process.stdout.write(`  unnamed: ${unnamed.length}\n\n`);

	process.stdout.write('Named references (parent → fieldName):\n');
	for (const r of named) {
		const flags = [r.optional ? '[optional]' : '', r.repeated ? '[repeated]' : ''].filter(Boolean).join(' ');
		process.stdout.write(`  ${r.from} → field('${r.fieldName}')${flags ? ' ' + flags : ''}\n`);
	}

	process.stdout.write('\nUnnamed references (parent only):\n');
	for (const r of unnamed) {
		const flags = [r.optional ? '[optional]' : '', r.repeated ? '[repeated]' : ''].filter(Boolean).join(' ');
		process.stdout.write(`  ${r.from}${flags ? ' ' + flags : ''}\n`);
	}

	return 0;
}

// ---------------------------------------------------------------------------
// Mode: suggestions
// ---------------------------------------------------------------------------

async function runSuggestions(args: InspectRefsOptions): Promise<number> {
	const entryPath = resolveEntryPath(
		await invoke('resolveGrammar', 'resolveOverridesPath', args.grammar),
		await invoke('resolveGrammar', 'resolveGrammarJsPath', args.grammar),
		args.useBase
	);
	process.stdout.write(`entry: ${entryPath}\n`);

	const raw = await invoke('evaluate', 'evaluate', entryPath);
	process.stdout.write(`raw.references: ${raw.references.length}\n`);

	const namedRefs = raw.references.filter((r) => r.fieldName !== undefined);
	process.stdout.write(`  with fieldName: ${namedRefs.length}\n`);
	const samples = raw.references.slice(0, 5);
	process.stdout.write('  first 5:\n');
	for (const r of samples) process.stdout.write(`    ${JSON.stringify(r)}\n`);

	const linked = await invoke('link', 'link', raw);
	const { derivations } = linked;
	const { inferredFields, promotedRules, repeatedShapes } = derivations;

	process.stdout.write(
		`\n${args.grammar}: ${inferredFields.length} inferred fields, ` +
			`${promotedRules.length} promoted rules, ` +
			`${repeatedShapes.length} repeated shapes\n`
	);

	// By classification
	const byClass: Record<string, number> = {};
	for (const p of promotedRules) {
		byClass[p.classification] = (byClass[p.classification] ?? 0) + 1;
	}
	process.stdout.write(`Promotions by classification: ${JSON.stringify(byClass)}\n\n`);

	// Inferred fields section
	process.stdout.write(`--- inferred fields (first ${args.limit}) ---\n`);
	let n = 0;
	for (const f of inferredFields) {
		if (n++ >= args.limit) break;
		process.stdout.write(
			`  ${f.kind}: field('${f.fieldName}', $.${f.targetSymbol})  ` +
				`[${f.confidence}] agreement=${f.agreement.toFixed(2)} n=${f.sampleSize}` +
				`${f.applied ? '' : ' [held]'}\n`
		);
	}
	process.stdout.write('\n');

	// Promoted rules section
	process.stdout.write(`--- promoted rules (first ${args.limit}) ---\n`);
	n = 0;
	for (const p of promotedRules) {
		if (n++ >= args.limit) break;
		process.stdout.write(`  ${p.kind}: ${p.classification}${p.applied ? '' : ' [held]'}\n`);
	}
	process.stdout.write('\n');

	// Repeated shapes section
	process.stdout.write(`--- repeated shapes (first ${args.limit}) ---\n`);
	n = 0;
	for (const s of repeatedShapes) {
		if (n++ >= args.limit) break;
		process.stdout.write(
			`  ${s.suggestedName} [${s.shape}]: kinds=[${s.kinds.join(', ')}]  ` + `parents=[${s.parents.join(', ')}]\n`
		);
	}

	return 0;
}

// ---------------------------------------------------------------------------
// Public run entry point
// ---------------------------------------------------------------------------

export async function run(opts: InspectRefsOptions): Promise<number> {
	if (opts.mode === 'suggestions') return runSuggestions(opts);
	return runRefs(opts);
}
