import type { GrammarDiagnostic } from '../../types/diagnostics.ts';
import type { Rule } from '../../types/rule.ts';
import type { RuntimeRule } from '../../types/runtime-shapes.ts';
import { undisplayedKindAddress } from '../arm-names.ts';
import type { EnrichRuleOrigin } from '../enrich-ctx.ts';
import { isParserHiddenName, isRecord, listedNames, listEntryName, rulesEqual, supertypesOf, type GrammarRecord } from '../rule-patterns.ts';
import type { CopyOrigin, Effect, NarrowingOrigin } from './effects.ts';

export type VerbRefusalCode = 'edit-site-missing' | 'edit-entry-invalid' | 'narrow-invalid' | 'rename-invalid' | 'edit-site-conflict' | 'rule-name-taken';

export class VerbRefusal extends Error {
	readonly code: VerbRefusalCode;
	readonly reason: string;
	readonly details: Readonly<Record<string, unknown>>;
	constructor(code: VerbRefusalCode, reason: string, details: Readonly<Record<string, unknown>> = {}) {
		super(reason);
		this.code = code;
		this.reason = reason;
		this.details = details;
	}
}

export interface MintLists {
	readonly supertypes: unknown[];
	readonly inline: unknown[];
	readonly enlist: (base: string, name: string) => void;
}

export function mintLists(grammar: GrammarRecord): MintLists {
	const supertypes = (Array.isArray(grammar.supertypes) ? grammar.supertypes : []).slice();
	const inline = (Array.isArray(grammar.inline) ? grammar.inline : []).slice();
	const listed = (list: unknown[], name: string): boolean => list.some((entry) => listEntryName(entry) === name);
	const enlist = (base: string, name: string): void => {
		for (const list of [supertypes, inline]) if (listed(list, base) && !listed(list, name)) list.push(typeof list[0] === 'string' ? name : { type: 'SYMBOL', name });
	};
	return { supertypes, inline, enlist };
}

export interface GroupMints {
	readonly rules: Record<string, Rule>;
	readonly origins: Map<string, EnrichRuleOrigin>;
	readonly dedupe: Record<string, string>;
}

export interface VerbCtx {
	readonly name: string;
	readonly grammar: GrammarRecord;
	readonly rules: GrammarRecord;
	readonly lists: MintLists;
	readonly supertypes: ReadonlySet<string>;
	readonly transparent: (name: string) => boolean;
	readonly effects: Effect[];
	readonly created: string[];
	readonly reached: Map<string, NarrowingOrigin>;
	readonly groups: GroupMints;
	readonly diagnostics: GrammarDiagnostic[];
}

export interface VerbLog {
	readonly effects: Effect[];
	readonly diagnostics: GrammarDiagnostic[];
}

export function verbCtxOf(grammar: GrammarRecord, log: VerbLog = { effects: [], diagnostics: [] }, rules: GrammarRecord = { ...(isRecord(grammar.rules) ? grammar.rules : {}) }): VerbCtx {
	const supertypes = supertypesOf(grammar);
	const inlined = listedNames(grammar.inline);
	return {
		name: typeof grammar.name === 'string' ? grammar.name : '',
		grammar,
		rules,
		lists: mintLists(grammar),
		supertypes,
		transparent: (name) => isParserHiddenName(name) || supertypes.has(name) || inlined.has(name),
		effects: log.effects,
		created: [],
		reached: new Map(),
		groups: { rules: {}, origins: new Map(), dedupe: {} },
		diagnostics: log.diagnostics
	};
}

export function refusalOf(ctx: VerbCtx, apply: () => void): VerbRefusal | undefined {
	const rules = { ...ctx.rules };
	const effects = ctx.effects.length;
	const created = ctx.created.length;
	const supertypes = ctx.lists.supertypes.length;
	const inline = ctx.lists.inline.length;
	const reached = new Set(ctx.reached.keys());
	const groups = new Set(Object.keys(ctx.groups.rules));
	const dedupe = new Set(Object.keys(ctx.groups.dedupe));
	const origins = new Set(ctx.groups.origins.keys());
	try {
		apply();
		return undefined;
	} catch (error) {
		if (!(error instanceof VerbRefusal)) throw error;
		for (const name of Object.keys(ctx.rules)) if (!(name in rules)) delete ctx.rules[name];
		Object.assign(ctx.rules, rules);
		ctx.effects.length = effects;
		ctx.created.length = created;
		ctx.lists.supertypes.length = supertypes;
		ctx.lists.inline.length = inline;
		for (const name of ctx.reached.keys()) if (!reached.has(name)) ctx.reached.delete(name);
		for (const name of Object.keys(ctx.groups.rules)) if (!groups.has(name)) delete ctx.groups.rules[name];
		for (const key of Object.keys(ctx.groups.dedupe)) if (!dedupe.has(key)) delete ctx.groups.dedupe[key];
		for (const name of ctx.groups.origins.keys()) if (!origins.has(name)) ctx.groups.origins.delete(name);
		return error;
	}
}

export interface EntryLabel {
	readonly ownerKind: string;
	readonly name: string;
	readonly details: Record<string, unknown>;
}

export function applyEntry(ctx: VerbCtx, label: EntryLabel, apply: () => void): void {
	const refusal = refusalOf(ctx, apply);
	if (refusal === undefined) return;
	ctx.diagnostics.push({
		scope: 'grammar',
		code: refusal.code,
		severity: 'fail',
		canProceed: false,
		grammar: ctx.name,
		ownerKind: label.ownerKind,
		message: `${label.name}: ${refusal.reason}`,
		details: label.details
	});
}

export interface CopyRequest {
	readonly source: string;
	readonly part: string;
	readonly context: string;
	readonly body: unknown;
	readonly origin: CopyOrigin;
	readonly display?: string;
	readonly admitted?: string;
}

export function copyNameOf(source: string, part: string, context: string): string {
	const segments = part === '.' ? [] : part.split('/').map((segment) => (segment.endsWith(':') ? segment.slice(0, -1) : segment));
	return `_${[undisplayedKindAddress(source), ...segments, undisplayedKindAddress(context)].join('_')}`;
}

export function copySourceOf(name: string, ctx: Pick<VerbCtx, 'effects'>): string | undefined {
	for (const effect of ctx.effects) if (effect.kind === 'copy' && effect.copy === name) return effect.source;
	return undefined;
}

export function applyCopy(request: CopyRequest, ctx: VerbCtx): string {
	const { source, part, context, body } = request;
	const name = copyNameOf(source, part, context);
	if (name in ctx.rules) {
		if (copySourceOf(name, ctx) !== source) throw new VerbRefusal('rule-name-taken', `'${source}' mints '${name}', which the grammar already names`);
		if (!rulesEqual(ctx.rules[name] as RuntimeRule, body as RuntimeRule)) throw new VerbRefusal('edit-site-conflict', `'${source}' narrows two ways to '${name}'`);
		return name;
	}
	ctx.rules[name] = body;
	ctx.created.push(name);
	ctx.effects.push({ kind: 'copy', copy: name, source, part, context, display: request.display, admitted: request.admitted, origin: request.origin });
	ctx.lists.enlist(source, name);
	return name;
}
