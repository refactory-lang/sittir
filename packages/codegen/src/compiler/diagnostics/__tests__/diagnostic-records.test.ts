import { describe, expect, it } from 'vitest';
import { deriveDiagnosticRecords, type DeriveDiagnosticRecordsInput } from '../diagnostic-records.ts';
import type { StageDiagnosis } from '../../stage.ts';
import type { RuleCatalog } from '../../types.ts';
import type { GrammarDiagnostic } from '../../../types/diagnostics.ts';
import type { PatchSite } from '../../../dsl/wire/wire.ts';

const fired = (code: string, ownerKind: string, slotName?: string): GrammarDiagnostic => ({
	scope: 'grammar',
	grammar: 'synth',
	code,
	severity: 'error',
	ownerKind,
	...(slotName === undefined ? {} : { slotName }),
	message: '',
	canProceed: false
});
const catalog = (roots: Record<string, string> = {}): RuleCatalog => ({ byId: new Map(), classificationById: new Map(), rootsByKind: new Map(Object.entries(roots)) });
const stage = (ruleNames: string[], diagnostics: GrammarDiagnostic[]): StageDiagnosis => ({
	ruleNames: new Set(ruleNames),
	externalNames: new Set(),
	diagnostics,
	ruleCatalog: catalog()
});
const derive = (input: Partial<DeriveDiagnosticRecordsInput> & Pick<DeriveDiagnosticRecordsInput, 'stages'>) =>
	deriveDiagnosticRecords({ final: { diagnostics: [], ruleCatalog: catalog() }, authoredRules: [], patchSites: [], ...input });

describe('deriveDiagnosticRecords', () => {
	it('a key the enriched stage no longer raises is resolved by enrich, credited to nothing', () => {
		const [record] = derive({ stages: { raw: stage(['a'], [fired('content-collision', 'a')]), enriched: stage(['a'], []) } });
		expect(record).toEqual(
			expect.objectContaining({ code: 'content-collision', ruleId: 'rule:a:root', ruleProvenance: 'upstream', resolved: true, resolvedBy: { stage: 'enrich', by: [] } })
		);
	});

	it('a key the final stage still raises is unresolved', () => {
		const d = fired('unclassifiable-shape', 'a');
		const [record] = derive({
			stages: { raw: stage(['a'], [d]), enriched: stage(['a'], [d]) },
			final: { diagnostics: [d], ruleCatalog: catalog() }
		});
		expect(record).toEqual(expect.objectContaining({ resolved: false }));
		expect(record).not.toHaveProperty('resolvedBy');
	});

	it('wire credits the rules: entry and the patch sites on the owner, and the sites that rewrote its lift', () => {
		const onOwner: PatchSite = { ownerKind: 'a_arm', path: '0', form: 'field' };
		const throughLift: PatchSite = { ownerKind: 'a', path: '0/1', form: 'variant', lifts: ['a_arm'] };
		const elsewhere: PatchSite = { ownerKind: 'b', path: '0', form: 'field' };
		const [record] = derive({
			stages: { raw: stage(['a'], []), enriched: stage(['a', 'a_arm'], [fired('storagename-collision', 'a_arm', 'x')]) },
			authoredRules: ['a_arm', 'b'],
			patchSites: [onOwner, throughLift, elsewhere]
		});
		expect(record).toEqual({
			code: 'storagename-collision',
			ruleId: 'rule:a_arm:root',
			ownerKind: 'a_arm',
			slotName: 'x',
			ruleProvenance: 'enrich',
			resolved: true,
			resolvedBy: {
				stage: 'wire',
				by: [{ rule: 'a_arm' }, { patch: { ownerKind: 'a_arm', path: '0', form: 'field' } }, { patch: { ownerKind: 'a', path: '0/1', form: 'variant' } }]
			}
		});
	});

	it('a kind only wire declares has wire provenance', () => {
		const d = fired('content-collision', 'minted');
		const [record] = derive({ stages: { raw: stage([], []), enriched: stage([], []) }, final: { diagnostics: [d], ruleCatalog: catalog() } });
		expect(record?.ruleProvenance).toBe('wire');
	});

	it('a kind the final catalog renames keeps the key of its source rule', () => {
		const d = fired('union-slot-routed', '_source');
		const records = derive({
			stages: { raw: stage(['_source'], [d]), enriched: stage(['_source'], [d]) },
			final: { diagnostics: [fired('union-slot-routed', 'renamed')], ruleCatalog: catalog({ renamed: 'rule:_source:root' }) }
		});
		expect(records).toEqual([expect.objectContaining({ ruleId: 'rule:_source:root', ownerKind: 'renamed', resolved: false })]);
	});

	it('slot names split keys on one owner', () => {
		const records = derive({ stages: { raw: stage(['a'], [fired('content-collision', 'a', 'x'), fired('content-collision', 'a', 'y')]), enriched: stage(['a'], []) } });
		expect(records.map((r) => r.slotName)).toEqual(['x', 'y']);
	});
});
