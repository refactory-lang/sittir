import type { GrammarDiagnostic } from '../../types/diagnostics.ts';
import type { PatchForm, PatchSite } from '../../dsl/wire/wire.ts';
import type { DiagnosticRecord } from './diagnostic-records.ts';

export type PatchSiteLabel = 'authoring' | 'resolving';

export interface LabelledPatchSite extends PatchSite {
	readonly label: PatchSiteLabel;
	readonly claims: readonly string[];
}

const RESOLVING_ONLY: ReadonlySet<PatchForm> = new Set(['rule']);

export function labelPatchSites(sites: readonly PatchSite[], records: readonly DiagnosticRecord[]): LabelledPatchSite[] {
	const patchClaims = records.flatMap(({ code, resolvedBy }) =>
		resolvedBy?.stage === 'wire' ? resolvedBy.by.flatMap((by) => ('patch' in by ? [{ code, patch: by.patch }] : [])) : []
	);
	return sites.map((site) => {
		const claims = [...new Set(patchClaims.filter(({ patch }) => sameSite(patch, site)).map(({ code }) => code))].sort();
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
	return input.sites
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
		}));
}
