import { describe, expect, it } from 'vitest';
import { blockedRecords } from '../grammar-diagnostics.ts';
import { diagnosePatchSites, labelPatchSites } from '../patch-sites.ts';
import type { DiagnosticRecord } from '../diagnostic-records.ts';
import type { PatchSite } from '../../../dsl/wire/wire.ts';

const site = (form: PatchSite['form'], ownerKind = 'host'): PatchSite => ({ ownerKind, path: '1', form, name: 'x' });
const record = (code: string, resolvedBy: DiagnosticRecord['resolvedBy']): DiagnosticRecord => ({
	code,
	ruleId: 'rule:host:root',
	ownerKind: 'host',
	ruleProvenance: 'upstream',
	resolved: resolvedBy !== undefined,
	...(resolvedBy === undefined ? {} : { resolvedBy })
});
const byWire = (...sites: PatchSite[]): DiagnosticRecord['resolvedBy'] => ({
	stage: 'wire',
	by: sites.map(({ ownerKind, path, form }) => ({ patch: { ownerKind, path, form } }))
});

describe('labelPatchSites', () => {
	it('a site wire credits with resolving enriched records is resolving and claims their codes', () => {
		const [labelled] = labelPatchSites(
			[site('field')],
			[record('storagename-collision', byWire(site('field'))), record('content-collision', byWire(site('field')))]
		);
		expect(labelled).toEqual(expect.objectContaining({ label: 'resolving', claims: ['content-collision', 'storagename-collision'] }));
	});

	it('records enrich resolved, records left unresolved and records credited to another site claim nothing', () => {
		const [labelled] = labelPatchSites(
			[site('field')],
			[
				record('unclassifiable-shape', { stage: 'enrich', by: [] }),
				record('union-slot-routed', undefined),
				record('content-collision', byWire(site('variant')))
			]
		);
		expect(labelled).toEqual(expect.objectContaining({ label: 'authoring', claims: [] }));
	});
});

describe('diagnosePatchSites', () => {
	it('a rule() site that claims nothing is patch-without-cause, blocking', () => {
		const ds = diagnosePatchSites({ grammar: 'synth', sites: labelPatchSites([site('rule')], []) });
		expect(ds).toEqual([expect.objectContaining({ code: 'patch-without-cause', ownerKind: 'host', canProceed: false })]);
		expect(ds[0]!.message).toMatch(/rule\('x'\)/);
	});

	it('a rule() site that claims a code is silent', () => {
		const labelled = labelPatchSites([site('rule')], [record('unclassifiable-shape', byWire(site('rule')))]);
		expect(diagnosePatchSites({ grammar: 'synth', sites: labelled })).toEqual([]);
	});

	it('authoring forms are never judged', () => {
		const labelled = labelPatchSites([site('field'), site('variant'), site('alias')], []);
		expect(diagnosePatchSites({ grammar: 'synth', sites: labelled })).toEqual([]);
	});

	it('patch-without-cause is accepted at the gate when the owner is floor-listed for it', () => {
		const ds = diagnosePatchSites({ grammar: 'synth', sites: labelPatchSites([site('rule')], []) });
		expect(ds).toEqual([expect.objectContaining({ code: 'patch-without-cause', canProceed: false })]);
		expect(blockedRecords(ds, { 'patch-without-cause': ['host'] })).toEqual([]);
	});
});
