import { describe, expect, it } from 'vitest';
import { diagnosePatchSites, labelPatchSites } from '../patch-sites.ts';
import type { UpstreamCompilation } from '../../upstream.ts';
import type { PatchSite } from '../../../dsl/wire/wire.ts';

const upstream = (fired: [code: string, ownerKind: string, canProceed: boolean][]): UpstreamCompilation => ({
	ruleNames: new Set(),
	externalNames: new Set(),
	diagnostics: fired.map(([code, ownerKind, canProceed]) => ({
		scope: 'grammar' as const,
		grammar: 'synth',
		code,
		severity: canProceed ? ('warning' as const) : ('error' as const),
		ownerKind,
		message: '',
		canProceed
	}))
});
const site = (form: PatchSite['form'], ownerKind = 'host'): PatchSite => ({ ownerKind, path: '1', form, name: 'x' });

describe('labelPatchSites', () => {
	it('a site on an owner the upstream compile blocks is resolving and claims every blocking code', () => {
		const [labelled] = labelPatchSites(
			[site('field')],
			upstream([
				['storagename-collision', 'host', false],
				['content-collision', 'host', false],
				['union-slot-routed', 'host', true]
			])
		);
		expect(labelled).toEqual(expect.objectContaining({ label: 'resolving', claims: ['content-collision', 'storagename-collision'] }));
	});

	it('a site on an owner with no blocking upstream diagnostic is authoring and claims nothing', () => {
		const [labelled] = labelPatchSites([site('field')], upstream([['union-slot-routed', 'host', true]]));
		expect(labelled).toEqual(expect.objectContaining({ label: 'authoring', claims: [] }));
	});
});

describe('diagnosePatchSites', () => {
	it('a rule() site that claims nothing is patch-without-cause, blocking', () => {
		const ds = diagnosePatchSites({ grammar: 'synth', sites: labelPatchSites([site('rule')], upstream([])) });
		expect(ds).toEqual([expect.objectContaining({ code: 'patch-without-cause', ownerKind: 'host', canProceed: false })]);
		expect(ds[0]!.message).toMatch(/rule\('x'\)/);
	});

	it('a rule() site that claims a code is silent', () => {
		const labelled = labelPatchSites([site('rule')], upstream([['unclassifiable-shape', 'host', false]]));
		expect(diagnosePatchSites({ grammar: 'synth', sites: labelled })).toEqual([]);
	});

	it('authoring forms are never judged', () => {
		const labelled = labelPatchSites([site('field'), site('variant'), site('alias')], upstream([]));
		expect(diagnosePatchSites({ grammar: 'synth', sites: labelled })).toEqual([]);
	});

	it('patch-without-cause is accepted when the owner is floor-listed for it', () => {
		const ds = diagnosePatchSites({
			grammar: 'synth',
			sites: labelPatchSites([site('rule')], upstream([])),
			expectDiagnostics: { 'patch-without-cause': ['host'] }
		});
		expect(ds).toEqual([expect.objectContaining({ code: 'patch-without-cause', canProceed: true })]);
	});
});
