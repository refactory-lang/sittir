import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';

import { evaluate } from '../compiler/evaluate.ts';
import { link } from '../compiler/link.ts';
import { normalizeGrammar } from '../compiler/normalize.ts';
import { assemble, AssembleCtx } from '../compiler/assemble.ts';
import { loadGeneratedIdTables } from '../compiler/generated-metadata.ts';
import { projectSlotNaming, type AssembledNonterminal } from '../compiler/model/node-map.ts';
import { assertGrammar, stableGrammars, type GrammarName } from '../grammars.ts';
import { resolveGrammarJsPath, resolveOverridesPath } from '../compiler/resolve-grammar.ts';


export interface Divergence {
	kind: string;
	slot: string;
	projection: 'storageName' | 'name' | 'configKey' | 'propertyName' | 'paramName';
	legacy: string;
	recomputed: string;
}

export const ALLOWLISTED_RENAMES: readonly Divergence[] = [
	{
		kind: 'format_specifier',
		slot: 'content',
		projection: 'storageName',
		legacy: 'content',
		recomputed: 'format_expression'
	},
	{ kind: 'format_specifier', slot: 'content', projection: 'name', legacy: 'content', recomputed: 'format_expression' },
	{
		kind: 'format_specifier',
		slot: 'content',
		projection: 'configKey',
		legacy: 'content',
		recomputed: 'formatExpression'
	},
	{
		kind: 'format_specifier',
		slot: 'content',
		projection: 'propertyName',
		legacy: 'contents',
		recomputed: 'formatExpressions'
	},
	{
		kind: 'format_specifier',
		slot: 'content',
		projection: 'paramName',
		legacy: 'contents',
		recomputed: 'formatExpressions'
	},
	{ kind: '_suite', slot: 'block', projection: 'storageName', legacy: 'block', recomputed: 'content' },
	{ kind: '_suite', slot: 'block', projection: 'name', legacy: 'block', recomputed: 'content' },
	{ kind: '_suite', slot: 'block', projection: 'configKey', legacy: 'block', recomputed: 'content' },
	{ kind: '_suite', slot: 'block', projection: 'propertyName', legacy: 'block', recomputed: 'content' },
	{ kind: '_suite', slot: 'block', projection: 'paramName', legacy: 'block', recomputed: 'content' },
	{ kind: 'match_block', slot: 'match_arm', projection: 'storageName', legacy: 'match_arm', recomputed: 'content' },
	{ kind: 'match_block', slot: 'match_arm', projection: 'name', legacy: 'match_arm', recomputed: 'content' },
	{ kind: 'match_block', slot: 'match_arm', projection: 'configKey', legacy: 'matchArm', recomputed: 'content' },
	{ kind: 'match_block', slot: 'match_arm', projection: 'propertyName', legacy: 'matchArms', recomputed: 'contents' },
	{ kind: 'match_block', slot: 'match_arm', projection: 'paramName', legacy: 'matchArms', recomputed: 'contents' }
];

function isAllowlisted(d: Divergence): boolean {
	return ALLOWLISTED_RENAMES.some(
		(e) =>
			e.kind === d.kind &&
			e.slot === d.slot &&
			e.projection === d.projection &&
			e.legacy === d.legacy &&
			e.recomputed === d.recomputed
	);
}

export function diffSlotNames(slot: AssembledNonterminal, kind: string): Divergence[] {
	const out: Divergence[] = [];
	const proj = projectSlotNaming(slot);
	const push = (projection: Divergence['projection'], legacy: string, recomputed: string) => {
		if (legacy !== recomputed) out.push({ kind, slot: slot.name, projection, legacy, recomputed });
	};
	push('storageName', slot.storageName, proj.storageName);
	push('name', slot.name, proj.name);
	push('configKey', slot.configKey, proj.configKey);
	push('propertyName', slot.propertyName, proj.propertyName);
	push('paramName', slot.paramName, proj.paramName);
	return out;
}

function resolveEntryPath(grammar: GrammarName): string {
	const overridesPath = resolveOverridesPath(grammar);
	return existsSync(overridesPath) ? overridesPath : resolveGrammarJsPath(grammar);
}

async function probeGrammar(grammar: GrammarName): Promise<Divergence[]> {
	const raw = await evaluate(resolveEntryPath(grammar));
	const normalized = normalizeGrammar(link(raw, undefined));
	const nodeMap = assemble(AssembleCtx.from(normalized, await loadGeneratedIdTables(grammar)));
	const divergences: Divergence[] = [];
	for (const [kind, node] of nodeMap.nodes) {
		for (const slot of node.slots) {
			divergences.push(...diffSlotNames(slot, kind));
		}
	}
	return divergences;
}

export async function run(argv: string[]): Promise<number> {
	const { values } = parseArgs({
		args: argv,
		options: {
			grammar: { type: 'string' },
			first: { type: 'string', default: '10' }
		}
	});
	const first = Number.parseInt(values.first ?? '10', 10);
	const targets: readonly GrammarName[] = values.grammar ? [assertGrammar(values.grammar)] : stableGrammars();

	const origLog = console.log;
	const origWarn = console.warn;
	console.log = (...a: unknown[]) => void process.stderr.write(a.map(String).join(' ') + '\n');
	console.warn = (...a: unknown[]) => void process.stderr.write(a.map(String).join(' ') + '\n');

	let totalUnexpected = 0;
	try {
		for (const grammar of targets) {
			const divergences = await probeGrammar(grammar);
			const unexpected = divergences.filter((d) => !isAllowlisted(d));
			const allowlisted = divergences.length - unexpected.length;
			totalUnexpected += unexpected.length;
			process.stdout.write(`${grammar}: ${unexpected.length} unexpected, ${allowlisted} allowlisted\n`);
			for (const d of unexpected.slice(0, first)) {
				process.stdout.write(
					`  ${d.kind}.${d.slot} [${d.projection}] legacy=${JSON.stringify(d.legacy)} recomputed=${JSON.stringify(d.recomputed)}\n`
				);
			}
			if (unexpected.length > first) {
				process.stdout.write(`  … and ${unexpected.length - first} more\n`);
			}
		}
	} finally {
		console.log = origLog;
		console.warn = origWarn;
	}
	return totalUnexpected === 0 ? 0 : 1;
}

const _isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (_isMain) {
	run(process.argv.slice(2))
		.then(process.exit)
		.catch((e) => {
			process.stderr.write(`reconcile-naming: ${(e as Error).stack ?? e}\n`);
			process.exit(1);
		});
}
