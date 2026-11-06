import { isParserHiddenName, unwrapPrec } from '../rule-patterns.ts';

interface Walked {
	readonly type?: string;
	readonly members?: readonly unknown[];
	readonly content?: unknown;
	readonly name?: string;
	readonly value?: unknown;
}

export interface ExternalAliasSite {
	readonly external: string;
	readonly name: string;
}

export interface AuthoredExternalAlias extends ExternalAliasSite {
	readonly rule: string;
}

export type RenderAsAliasProblemKind = 'anonymous' | 'upstream-aliased' | 'visible';

export interface RenderAsAliasProblem {
	readonly external: string;
	readonly problem: RenderAsAliasProblemKind;
}

export interface RenderAsEntryAliases {
	readonly bodies: Readonly<Record<string, unknown>>;
	readonly names: Readonly<Record<string, string>>;
	readonly anonymous: ReadonlySet<string>;
}

export interface RenderAsVisibilityCtx {
	readonly externals: ReadonlySet<string>;
	readonly minted: ReadonlySet<string>;
	readonly upstreamSites: readonly ExternalAliasSite[];
	readonly entryAliases: Pick<RenderAsEntryAliases, 'names' | 'anonymous'>;
}

export interface RenderAsVisibility {
	readonly visibleAs: Readonly<Record<string, string>>;
	readonly problems: readonly RenderAsAliasProblem[];
}

export const externalAliasKey = (site: ExternalAliasSite): string => `${site.external}\0${site.name}`;

export function externalAliasSitesOf(rule: unknown, externals: ReadonlySet<string>): ExternalAliasSite[] {
	const sites: ExternalAliasSite[] = [];
	const visit = (node: unknown): void => {
		if (node === null || typeof node !== 'object') return;
		const walked = node as Walked;
		if (walked.type === 'ALIAS' && typeof walked.value === 'string') {
			const content = unwrapPrec(walked.content) as Walked | undefined;
			if (content?.type === 'SYMBOL' && typeof content.name === 'string' && externals.has(content.name)) {
				sites.push({ external: content.name, name: walked.value });
			}
		}
		for (const member of walked.members ?? []) visit(member);
		if (walked.content !== undefined) visit(walked.content);
	};
	visit(rule);
	return sites;
}

export function upstreamAliasSitesOf(bodies: Readonly<Record<string, unknown>>, externals: ReadonlySet<string>): ExternalAliasSite[] {
	return Object.values(bodies).flatMap((body) => externalAliasSitesOf(body, externals));
}

export function splitRenderAsAliases(bodies: Readonly<Record<string, unknown>> | undefined): RenderAsEntryAliases {
	const out: Record<string, unknown> = {};
	const names: Record<string, string> = {};
	const anonymous = new Set<string>();
	for (const [key, body] of Object.entries(bodies ?? {})) {
		const walked = body as Walked | null | undefined;
		if (walked?.type !== 'ALIAS') {
			out[key] = body;
			continue;
		}
		out[key] = walked.content;
		const named = (walked as { readonly named?: boolean }).named !== false;
		if (named && typeof walked.value === 'string') names[key] = walked.value;
		else anonymous.add(key);
	}
	return { bodies: out, names, anonymous };
}

export function visibleAsOf(renderAs: Readonly<Record<string, unknown>> | undefined, ctx: RenderAsVisibilityCtx): RenderAsVisibility {
	const visibleAs: Record<string, string> = {};
	const problems: RenderAsAliasProblem[] = [];
	const { names, anonymous } = ctx.entryAliases;
	const upstreamAliased = new Set(ctx.upstreamSites.map((site) => site.external));
	for (const key of Object.keys(renderAs ?? {})) {
		const minted = ctx.minted.has(key);
		if (!ctx.externals.has(key) && !minted) continue;
		const named = names[key];
		if (anonymous.has(key)) problems.push({ external: key, problem: 'anonymous' });
		else if (!isParserHiddenName(key)) {
			if (named !== undefined) problems.push({ external: key, problem: 'visible' });
		} else if (!minted && upstreamAliased.has(key)) {
			if (named !== undefined) problems.push({ external: key, problem: 'upstream-aliased' });
		} else visibleAs[key] = named ?? key.replace(/^_+/, '');
	}
	return { visibleAs, problems };
}

export function externalsReadAs(
	kind: string,
	ctx: { readonly externals: ReadonlySet<string>; readonly sites: readonly ExternalAliasSite[]; readonly visibleAs: Readonly<Record<string, string>> }
): string[] {
	const owners = new Set<string>();
	for (const [external, name] of Object.entries(ctx.visibleAs)) if (name === kind) owners.add(external);
	for (const site of ctx.sites) if (site.name === kind) owners.add(site.external);
	if (ctx.externals.has(kind)) owners.add(kind);
	return owners.size === 0 ? [kind] : [...owners].sort();
}
