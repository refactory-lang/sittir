import type { GrammarDiagnostic } from '../../types/diagnostics.ts';
import type { PatchForm, PatchSite } from '../../dsl/wire/wire.ts';
import type { UpstreamCompilation } from '../upstream.ts';

export type PatchSiteLabel = 'authoring' | 'resolving';

export interface LabelledPatchSite extends PatchSite {
	readonly label: PatchSiteLabel;
	readonly claims: readonly string[];
}

const RESOLVING_ONLY: ReadonlySet<PatchForm> = new Set(['rule']);

export function labelPatchSites(sites: readonly PatchSite[], upstream: UpstreamCompilation): LabelledPatchSite[] {
	const blockingByOwner = new Map<string, Set<string>>();
	for (const d of upstream.diagnostics) {
		if (d.canProceed !== false || d.ownerKind === undefined) continue;
		blockingByOwner.set(d.ownerKind, (blockingByOwner.get(d.ownerKind) ?? new Set()).add(d.code));
	}
	return sites.map((site) => {
		const claims = [...(blockingByOwner.get(site.ownerKind) ?? [])].sort();
		return { ...site, label: claims.length > 0 ? 'resolving' : 'authoring', claims };
	});
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
			message: `patches: ${site.form}('${site.name ?? ''}') at '${site.ownerKind}' path '${site.path}' resolves nothing: no diagnostic blocks the upstream shape of '${site.ownerKind}'. Delete the patch so the upstream shape stands`,
			canProceed: false,
			details: { path: site.path, form: site.form, name: site.name }
		}));
}
