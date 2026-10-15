import type { GrammarDiagnostic } from '../../types/diagnostics.ts';
import { patchSiteKey, type PatchForm, type PatchSite } from '../../dsl/wire/wire.ts';
import type { DiagnosticRecord } from './diagnostic-records.ts';

export type PatchSiteLabel = 'authoring' | 'resolving';

export interface LabelledPatchSite extends PatchSite {
	readonly label: PatchSiteLabel;
	readonly claims: readonly string[];
}

const RESOLVING_ONLY: ReadonlySet<PatchForm> = new Set(['rule']);

interface PatchSiteDiagnosticCtx {
	readonly grammar: string;
}

export function labelPatchSites(
	sites: readonly PatchSite[],
	records: readonly DiagnosticRecord[]
): LabelledPatchSite[] {
	const patchClaims = records.flatMap(({ code, resolvedBy }) =>
		resolvedBy?.stage === 'wire'
			? resolvedBy.by.flatMap((by) => ('patch' in by ? [{ code, patch: by.patch }] : []))
			: []
	);
	return sites.map((site) => {
		const claims = [
			...new Set(patchClaims.filter(({ patch }) => sameSite(patch, site)).map(({ code }) => code))
		].sort();
		return { ...site, label: claims.length > 0 ? 'resolving' : 'authoring', claims };
	});
}

function sameSite(a: Pick<PatchSite, 'ownerKind' | 'path' | 'form'>, b: PatchSite): boolean {
	return a.ownerKind === b.ownerKind && a.path === b.path && a.form === b.form;
}

export function diagnosePatchSites(input: {
	readonly grammar: string;
	readonly sites: readonly LabelledPatchSite[];
}): GrammarDiagnostic[] {
	return [
		...ambiguousRulePatches(input.sites, input),
		...input.sites
			.filter((site) => site.label === 'authoring' && RESOLVING_ONLY.has(site.form))
			.map((site) => ({
				scope: 'grammar' as const,
				grammar: input.grammar,
				code: 'patch-without-cause',
				severity: 'error' as const,
				ownerKind: site.ownerKind,
				message: `patches: ${site.form}('${site.name ?? ''}') at '${site.ownerKind}' path '${site.path}' resolves nothing: it claims no diagnostic of the enriched stage that wire resolves. Delete the patch so the enriched shape stands`,
				canProceed: false,
				details: { path: site.path, form: site.form, name: site.name }
			}))
	];
}

function ambiguousRulePatches(sites: readonly LabelledPatchSite[], ctx: PatchSiteDiagnosticCtx): GrammarDiagnostic[] {
	const byOwner = new Map<string, Map<string, LabelledPatchSite>>();
	for (const site of sites) {
		if (site.form !== 'rule') continue;
		const ownerSites = byOwner.get(site.ownerKind) ?? new Map<string, LabelledPatchSite>();
		ownerSites.set(patchSiteKey(site), site);
		byOwner.set(site.ownerKind, ownerSites);
	}
	return [...byOwner].flatMap(([ownerKind, ownerSites]) => {
		if (ownerSites.size < 2) return [];
		const patches = [...ownerSites.values()];
		const locations = patches.map((site) => `rule('${site.name ?? ''}') at path '${site.path}'`).join(', ');
		return [
			{
				scope: 'grammar' as const,
				grammar: ctx.grammar,
				code: 'patch-credit-ambiguous',
				severity: 'error' as const,
				ownerKind,
				message: `rule() credit is owner-level for '${ownerKind}', but it has multiple rule() sites: ${locations}. Use one rule() patch per owner until per-site credit is supported`,
				canProceed: false,
				details: { sites: patches.map(({ path, form, name }) => ({ path, form, name })) }
			}
		];
	});
}
