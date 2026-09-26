/**
 * discover/override-census -- the grammar's hand-authored departures from its
 * upstream: every hand-written `rules:` entry with its declaration, and every
 * `patches:` entry labelled authoring or resolving against the upstream compile.
 *
 * Usage:
 *   override-census [--grammar <g>] [--json]
 *
 * A patch site is "resolving" when some diagnostic blocks the upstream shape
 * of its owner kind, and it claims every such code. The labelling is
 * owner-level (upstream diagnostics name an owner, not a path), so an
 * authoring patch on a flagged owner also reads as resolving: the census may
 * over-report resolving sites, never under-report them.
 */

import { invoke } from '../codegen-surface.ts';

export interface OverrideCensusOptions {
	grammar: string;
	json: boolean;
}

export async function run(opts: OverrideCensusOptions): Promise<number> {
	const { grammar } = opts;
	const generatedIdTables = await invoke('generatedMetadata', 'loadGeneratedIdTables', grammar);
	const compilation = await invoke('compile', 'compileGrammar', { grammar, generatedIdTables });
	if (compilation.upstream === undefined) {
		process.stderr.write(`${grammar}: declares no rules: or patches:, so nothing departs from the upstream\n`);
		return 0;
	}
	const declared = Object.entries(compilation.raw.ruleCauses ?? {}).map(([name, declaration]) => ({ name, ...declaration }));
	const undeclared = compilation.raw.undeclaredRules ?? [];
	const sites = await invoke('patchSites', 'labelPatchSites', compilation.raw.patchSites ?? [], compilation.upstream);
	const resolving = sites.filter((site) => site.label === 'resolving');
	const authoring = sites.filter((site) => site.label === 'authoring');
	const report = {
		grammar,
		handWrittenRules: { count: declared.length + undeclared.length, declared, undeclared },
		patchSites: { resolving, authoring }
	};
	if (opts.json) {
		process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
		return 0;
	}
	process.stdout.write(`${grammar}: ${report.handWrittenRules.count} hand-written rules\n`);
	for (const rule of declared) {
		const cause = 'cause' in rule ? rule.cause : '';
		process.stdout.write(`  ${rule.kind.padEnd(11)} ${cause.padEnd(17)} ${rule.name}\n`);
	}
	for (const name of undeclared) process.stdout.write(`  ${'bare'.padEnd(11)} ${''.padEnd(17)} ${name}\n`);
	process.stdout.write(
		`patch sites: ${resolving.length} resolving, ${authoring.length} authoring (resolving is owner-level and may over-report)\n`
	);
	for (const site of resolving) {
		const named = site.name === undefined ? site.form : `${site.form}('${site.name}')`;
		process.stdout.write(`  ${site.ownerKind} @ ${site.path}: ${named} claims ${site.claims.join(', ')}\n`);
	}
	return 0;
}
