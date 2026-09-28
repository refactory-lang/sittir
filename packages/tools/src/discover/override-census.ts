/**
 * discover/override-census -- the grammar's hand-authored departures from its
 * upstream base, and the diagnostic records they resolve: every hand-written
 * `rules:` entry with its declaration, every `patches:` entry labelled
 * resolving or authoring, and the records folded over the raw, enriched and
 * final stages.
 *
 * Usage:
 *   override-census [--grammar <g>] [--json]
 *
 * A patch site is "resolving" when it claims a record present in the
 * enriched stage and resolved by wire. A site claims the records owned by its
 * owner kind and by every enrich lift it rewrote or renamed.
 */

import { invoke } from '../codegen-surface.ts';
import { grammarPackage } from '@sittir/codegen/grammars';

export interface OverrideCensusOptions {
	grammar: string;
	json: boolean;
}

export async function run(opts: OverrideCensusOptions): Promise<number> {
	const { grammar } = opts;
	const generatedIdTables = await invoke('generatedMetadata', 'loadGeneratedIdTables', grammar);
	const compilation = await invoke('compile', 'compileGrammar', { package: grammarPackage(grammar), generatedIdTables });
	if (compilation.stages === undefined) {
		process.stderr.write(`${grammar}: declares no rules: or patches:, so nothing departs from the upstream base\n`);
		return 0;
	}
	const records = compilation.diagnosticRecords;
	const declared = Object.entries(compilation.raw.ruleCauses ?? {}).map(([name, declaration]) => ({ name, ...declaration }));
	const undeclared = compilation.raw.undeclaredRules ?? [];
	const sites = await invoke('patchSites', 'labelPatchSites', compilation.raw.patchSites ?? [], records);
	const resolving = sites.filter((site) => site.label === 'resolving');
	const authoring = sites.filter((site) => site.label === 'authoring');
	const owned = await Promise.all(records.map(async (record) => ({ record, owner: await invoke('ruleCatalog', 'ruleIdOwner', record.ruleId) })));
	const liftClaimed = owned.flatMap(({ record, owner }) => {
		const lifts = (record.resolvedBy?.by ?? []).flatMap((by) => ('patch' in by && by.patch.ownerKind !== owner ? [by.patch] : []));
		return lifts.length > 0 ? [{ code: record.code, owner, slotName: record.slotName, claimedBy: lifts }] : [];
	});
	const byProvenance = Object.fromEntries(
		(['upstream', 'enrich', 'wire'] as const).map((provenance) => {
			const of = records.filter((record) => record.ruleProvenance === provenance);
			return [provenance, { resolved: of.filter((record) => record.resolved).length, unresolved: of.filter((record) => !record.resolved).length }];
		})
	);
	const report = {
		grammar,
		handWrittenRules: { count: declared.length + undeclared.length, declared, undeclared },
		patchSites: { resolving, authoring },
		records: {
			byProvenance,
			resolvedByEnrich: records.filter((record) => record.resolvedBy?.stage === 'enrich').length,
			resolvedByWire: records.filter((record) => record.resolvedBy?.stage === 'wire').length,
			liftClaimed,
			all: records
		}
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
	process.stdout.write(`patch sites: ${resolving.length} resolving, ${authoring.length} authoring\n`);
	for (const site of resolving) {
		const named = site.name === undefined ? site.form : `${site.form}('${site.name}')`;
		process.stdout.write(`  ${site.ownerKind} @ ${site.path}: ${named} claims ${site.claims.join(', ')}\n`);
	}
	process.stdout.write(
		`records: ${records.length} (resolved by enrich ${report.records.resolvedByEnrich}, by wire ${report.records.resolvedByWire})\n`
	);
	for (const [provenance, counts] of Object.entries(byProvenance)) {
		process.stdout.write(`  ${provenance.padEnd(8)} resolved ${counts.resolved}, unresolved ${counts.unresolved}\n`);
	}
	process.stdout.write(`lift-claimed records: ${liftClaimed.length}\n`);
	for (const entry of liftClaimed) {
		const slot = entry.slotName === undefined ? '' : `.${entry.slotName}`;
		const claimants = entry.claimedBy.map((site) => `${site.ownerKind} @ ${site.path} ${site.form}`).join('; ');
		process.stdout.write(`  ${entry.code} ${entry.owner}${slot} <- ${claimants}\n`);
	}
	return 0;
}
