import {
	childFields,
	fieldHosts,
	fieldRenameIssue,
	fieldWrapIssue,
	isWrapSite,
	wrapHosts,
	type FieldRename,
	type FieldWrap,
	type Split
} from '../dsl/bind.ts';
import type { Lead } from '../dsl/verbs/effects.ts';
import { isRecord, OPAQUE_RULES, supertypesOf, symbolNames, type GrammarRecord } from '../dsl/rule-patterns.ts';
import type { GrammarDiagnostic } from '../types/diagnostics.ts';
import { isPrecWrapper } from '../types/runtime-shapes.ts';
import type { EvaluatedGrammar, RawGrammar } from '../compiler/types.ts';
import { type BindingFacts, type MemberFact, type ModelSlot, type RefinedClaim, type SlotModel, WILDCARD, isNamedMember, refineClaims } from './facts.ts';
import { type GrammarRoutes, type MemberRoute, formsOf } from './routes.ts';
import { boundKindName } from './names.ts';
import { deriveLeads } from './leads.ts';
import { isParserHiddenName, symbolFactsOf, type SymbolSource } from '../dsl/rule-patterns.ts';
import { predictedEntriesOf, renameAwareSymbolSource } from '../dsl/symbol-table.ts';

export type GrammarBindingsEdit =
	| { readonly field: string }
	| { readonly alias: string };

export interface GrammarBindingsPatch {
	readonly path: string;
	readonly edit: GrammarBindingsEdit;
}

export interface GrammarBindings {
	readonly patches: ReadonlyMap<string, readonly (readonly GrammarBindingsPatch[])[]>;
	readonly renames: Readonly<Record<string, string>>;
	readonly leads: readonly Lead[];
	readonly splits: readonly Split[];
}

export interface GrammarBindingsResidue {
	readonly cause: string;
	readonly row: string;
}

export interface GrammarBindingsReport {
	readonly claims: number;
	readonly members: number;
	readonly aliases: Readonly<Record<string, string>>;
	readonly fieldRenames: readonly FieldRename[];
	readonly fieldWraps: readonly FieldWrap[];
	readonly realizedKinds: readonly string[];
	readonly realizedByParent: readonly string[];
	readonly realizedMembers: readonly string[];
	readonly implicitMembers: readonly string[];
	readonly residue: readonly GrammarBindingsResidue[];
}

export interface GrammarBindingsInput {
	readonly file: string;
	readonly facts: BindingFacts;
	readonly base: RawGrammar;
	readonly layerRules: EvaluatedGrammar['rules'];
	readonly vocabMembers: ReadonlyMap<string, ReadonlySet<string>>;
	readonly routes: Pick<GrammarRoutes, 'members' | 'vocabOf'>;
	readonly model: SlotModel;
}

export const memberFieldName = (member: string): string => member.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

type FieldRequest = FieldRename | FieldWrap;

const SINGLE = new Set(['OPTIONAL', 'REPEAT', 'REPEAT1', 'FIELD', 'TOKEN', 'IMMEDIATE_TOKEN', 'ALIAS']);
const metaOf = (r: GrammarRecord): GrammarRecord => (isRecord(r.metadata) ? r.metadata : {});
const isLift = (r: GrammarRecord): boolean => r.type === 'SYMBOL' && metaOf(r).symbolSource === 'group-lift' && !(isRecord(r.annotations) && 'variant' in r.annotations);
const isGroupAlias = (r: GrammarRecord): boolean => r.type === 'ALIAS' && metaOf(r).aliasSource === 'visible-group';

function fieldOfReference(rules: Readonly<Record<string, unknown>>, owner: string, child: string): string | undefined {
	let found: string | undefined;
	const walk = (r: unknown, field: string | undefined): void => {
		if (Array.isArray(r)) return r.forEach((x) => walk(x, field));
		if (!isRecord(r)) return;
		if (r.type === 'SYMBOL' && r.name === child && field !== undefined) found = field;
		const inner = r.type === 'FIELD' ? (r.name as string) : field;
		for (const v of Object.values(r)) walk(v, inner);
	};
	walk(rules[owner], undefined);
	return found;
}

function isUnionSlotMember(model: SlotModel, owner: string, kind: string): boolean {
	return (model.get(owner)?.slots ?? []).some((slot) => slot.kinds.length > 1 && slot.kinds.includes(kind));
}

interface SlotShape {
	readonly list: boolean;
	readonly holds: ReadonlySet<string>;
}

function slotShape(model: SlotModel, slot: ModelSlot): SlotShape {
	const single = !slot.multiple && slot.kinds.length === 1 && slot.terminals.length === 0 ? model.get(slot.kinds[0]!) : undefined;
	if (single?.modelType === 'list') return { list: true, holds: new Set(single.elementKinds) };
	return { list: slot.multiple, holds: new Set([...slot.kinds, ...slot.terminals.map((text) => JSON.stringify(text))]) };
}

function formFieldRenames(model: SlotModel, owner: string, from: string, to: string): readonly FieldRename[] | string {
	const forms = formsOf(model, owner).filter((form) => model.get(form)?.modelType !== 'supertype');
	const slotsOf = (form: string): readonly ModelSlot[] => model.get(form)?.slots ?? [];
	const claimed = forms.flatMap((form) => slotsOf(form).filter((slot) => slot.name === from).map((slot) => slotShape(model, slot)));
	const [first] = claimed;
	if (first === undefined) return 'field is not on the owner';
	if (claimed.some((other) => other.list !== first.list)) return 'a form holds the member in another shape';
	const held = new Set(claimed.flatMap((shape) => [...shape.holds]));
	const renames: FieldRename[] = [];
	for (const form of forms) {
		const own = slotsOf(form).find((slot) => slot.name === from);
		const holders = own !== undefined ? [own] : slotsOf(form).filter((slot) => [...slotShape(model, slot).holds].some((kind) => held.has(kind)));
		if (holders.some((slot) => slotShape(model, slot).list !== first.list)) return 'a form holds the member in another shape';
		if (holders.length > 1) return 'a form holds the member in several fields';
		const [holder] = holders;
		if (holder !== undefined && holder.name !== to) renames.push({ owner: form, from: holder.name, to });
	}
	return renames;
}

const targetKey = (r: FieldRequest): string =>
	'from' in r ? `${r.owner}\u0000field:${r.from}` : `${r.owner}\u0000${'token' in r.target ? `token:${r.target.token}` : `symbol:${r.target.symbol}`}`;
const fieldKey = (r: FieldRequest): string => `${r.owner}\u0000${'from' in r ? r.to : r.field}`;

function sameShapeAs(
	kinds: readonly string[],
	members: readonly MemberFact[],
	routed: ReadonlyMap<string, readonly MemberRoute[]>,
	symbols: SymbolSource
): readonly string[] {
	const readAsKind = new Set(members.flatMap((m) => (m.route === 'kind' ? [m.kind] : [])));
	const supplied = (kind: string): string =>
		(routed.get(kind) ?? [])
			.map((m) => m.name)
			.sort()
			.join('\0');
	const [first, ...rest] = kinds;
	if (first === undefined) return [];
	const same = (kind: string): boolean =>
		!readAsKind.has(first) &&
		!readAsKind.has(kind) &&
		symbols.isTerminal(kind) === symbols.isTerminal(first) &&
		supplied(kind) === supplied(first);
	return [first, ...rest.filter(same)];
}

export function deriveGrammarBindings(input: GrammarBindingsInput): {
	bindings: GrammarBindings;
	report: GrammarBindingsReport;
	diagnostics: readonly GrammarDiagnostic[];
} {
	const { facts, base, vocabMembers, routes, model } = input;
	const symbols = renameAwareSymbolSource({
		...symbolFactsOf(base),
		kindEntries: predictedEntriesOf(base.predictedKinds)
	});
	const rules = base.rules as Record<string, unknown>;
	const ruleNames = new Set(Object.keys(rules));
	const residue: GrammarBindingsResidue[] = [];
	const left = (cause: string, row: string): void => {
		residue.push({ cause, row });
	};
	const claims = refineClaims(facts.claims, (kind) => formsOf(input.model, kind));
	const placed = (c: RefinedClaim): boolean => c.within.length > 0;
	const naming = new Map<string, RefinedClaim>();
	for (const c of claims)
		if (
			c.refinement === null &&
			c.kind !== null &&
			c.kind !== WILDCARD &&
			c.toplevel &&
			!placed(c) &&
			!naming.has(c.kind)
		)
			naming.set(c.kind, c);
	const kindsOfPath = new Map<string, string[]>();
	const unpatchableOfPath = new Map<string, string[]>();
	for (const [kind, c] of naming) {
		const into = ruleNames.has(kind) ? kindsOfPath : unpatchableOfPath;
		(into.get(c.vocab) ?? into.set(c.vocab, []).get(c.vocab)!).push(kind);
	}
	const mergedOfPath = new Map(
		[...kindsOfPath].map(([path, kinds]) => [path, sameShapeAs(kinds, facts.members, routes.members, symbols)])
	);
	for (const path of new Set([...kindsOfPath.keys(), ...unpatchableOfPath.keys()])) {
		const kinds = kindsOfPath.get(path) ?? [];
		const merged = mergedOfPath.get(path) ?? [];
		const unpatchable = unpatchableOfPath.get(path) ?? [];
		if (kinds.length + unpatchable.length < 2 || (merged.length === kinds.length && unpatchable.length === 0)) continue;
		const groups = [merged.join(' + '), ...kinds.filter((kind) => !merged.includes(kind))].filter((g) => g !== '');
		left(
			'claimed kinds not merged',
			`${path}: ${groups.join(' | ')}${unpatchable.length > 0 ? `; not a base rule: ${unpatchable.join(', ')}` : ''}`
		);
	}

	const renames: Record<string, string> = {};
	const aliases: Record<string, string> = {};
	const realizedKinds: string[] = [];
	const realizedByParent: string[] = [];
	const wanted: { kind: string; to: string; row: string }[] = [];
	const wantedAliases: { kind: string; to: string; row: string }[] = [];
	const placedSplits: { kind: string; within: readonly string[]; as: string; member: string }[] = [];
	for (const c of claims) {
		const row = `${c.kind ?? '(group)'} → ${c.vocab}`;
		if (c.refinement !== null) {
			left(`${c.refinement} refinement`, row);
			continue;
		}
		if (c.kind === null || c.kind === WILDCARD) {
			left(placed(c) ? 'wildcard placement' : 'wildcard claim', row);
			continue;
		}
		if (!ruleNames.has(c.kind)) {
			left('not a base rule', row);
			continue;
		}
		const to = boundKindName(c.vocab, isParserHiddenName(c.kind));
		if (placed(c)) {
			if (!c.within.every((w) => ruleNames.has(w))) {
				left('placed claim', row);
				continue;
			}
			const outer = c.within[c.within.length - 1]!;
			const reference = c.within[c.within.length - 2] ?? c.kind;
			const member = fieldOfReference(rules, outer, reference);
			if (member === undefined) {
				left('placement container has no member name', row);
				continue;
			}
			placedSplits.push({ kind: c.kind, within: c.within, as: to, member });
			realizedKinds.push(row);
			continue;
		}
		if (!c.toplevel) {
			left('nested claim', row);
			continue;
		}
		if (naming.get(c.kind) !== c) {
			left('kind named by an earlier claim', row);
			continue;
		}
		const merged = mergedOfPath.get(c.vocab) ?? [];
		if (!merged.includes(c.kind)) {
			left('kind kept apart by its shape', row);
			continue;
		}
		if (merged.length > 1) {
			wantedAliases.push({ kind: c.kind, to, row });
			continue;
		}
		if (to === c.kind) {
			realizedKinds.push(row);
			continue;
		}
		wanted.push({ kind: c.kind, to, row });
	}
	for (let changed = true; changed; ) {
		changed = false;
		const leaving = new Set(wanted.map((w) => w.kind));
		const taken = (to: string): boolean => ruleNames.has(to) && !leaving.has(to);
		for (const w of wanted.slice()) {
			const clash = taken(w.to) || wanted.some((o) => o !== w && o.to === w.to) || wantedAliases.some((a) => a.to === w.to);
			if (!clash) continue;
			wanted.splice(wanted.indexOf(w), 1);
			left('name taken', `${w.row} (${w.to})`);
			changed = true;
		}
		for (const a of wantedAliases.slice()) {
			if (!ruleNames.has(a.to)) continue;
			wantedAliases.splice(wantedAliases.indexOf(a), 1);
			if (!taken(a.to)) left('alias target names a base rule renamed away (a merge)', `${a.row} (${a.to})`);
			else if (a.kind === a.to || symbolNames(rules[a.to]).has(a.kind)) realizedByParent.push(`${a.row} (${a.to})`);
			else left('alias target taken', `${a.row} (${a.to})`);
			changed = true;
		}
	}
	for (const w of wanted) {
		renames[w.kind] = w.to;
		realizedKinds.push(w.row);
	}
	for (const a of wantedAliases) {
		aliases[a.kind] = a.to;
		realizedKinds.push(a.row);
	}

	const splits: Split[] = placedSplits.map((split) => {
		const outer = split.within[split.within.length - 1]!;
		const outerName = Object.hasOwn(renames, outer) ? renames[outer]! : Object.hasOwn(aliases, outer) ? aliases[outer]! : outer;
		return {
			kind: split.kind,
			within: split.within,
			as: split.as,
			containers: split.within.slice(0, -1).map(() => ({ name: `${outerName}_${split.member}`, field: memberFieldName(split.member) }))
		};
	});

	const checks = { ...base, rules } as unknown as GrammarRecord;
	const realizedMembers: string[] = [];
	const candidates: { row: string; request: FieldRequest; group?: string }[] = [];
	const named = facts.members.filter(isNamedMember);
	for (const m of named) {
		const row = `${m.owner}.${m.name}`;
		const vocab = routes.vocabOf.get(m.owner);
		if (vocab !== undefined && vocabMembers.get(vocab)?.has(m.name) === false) {
			left('member not in the vocabulary', row);
			continue;
		}
		const to = memberFieldName(m.name);
		if (m.route === 'kind') {
			realizedMembers.push(row);
			continue;
		}
		if (m.route === 'nested') {
			left('nested route', row);
			continue;
		}
		if (m.route === 'presence' && m.via.length > 0) {
			left('token reached through a child', row);
			continue;
		}
		if (m.route === 'rename' && (m.anchor !== null || m.adjacent !== undefined)) {
			left('positional child', row);
			continue;
		}
		if (m.route === 'rename' && m.field !== null) {
			if (m.kind !== null || m.after !== null) {
				left('field shared by several members', row);
				continue;
			}
			if (model.get(m.owner)?.modelType === 'supertype') {
				const renames = formFieldRenames(model, m.owner, m.field, to);
				if (typeof renames === 'string') left(renames, row);
				else if (renames.length === 0) realizedMembers.push(row);
				else for (const request of renames) candidates.push({ row, request, group: row });
				continue;
			}
			if (to === m.field) {
				realizedMembers.push(row);
				continue;
			}
			candidates.push({ row, request: { owner: m.owner, from: m.field, to } });
			continue;
		}
		const target = m.route === 'presence' ? { token: m.token } : m.kind !== null ? { symbol: m.kind } : null;
		if (m.route === 'rename' && m.kind === null && m.after !== null) {
			left('positional child', row);
			continue;
		}
		const where = childFields(checks, m.owner, target);
		const child = target !== null && 'symbol' in target ? target.symbol : undefined;
		if (child !== undefined && where.fields.length === 0 && where.unfielded && isUnionSlotMember(model, m.owner, child)) {
			realizedMembers.push(row);
			continue;
		}
		if (where.arm) {
			left('the child is an arm of the owner, not a slot', row);
			continue;
		}
		if (where.fields.length === 0 && !where.unfielded) {
			left(target !== null && 'token' in target ? 'token is not on the owner outside a token' : 'child is not on the owner', row);
			continue;
		}
		if (where.fields.length > 1 || (where.fields.length === 1 && where.unfielded)) {
			left('child sits in several fields', row);
			continue;
		}
		if (where.fields.length === 1) {
			const field = where.fields[0]!;
			if (field === to) {
				realizedMembers.push(row);
				continue;
			}
			if (where.mixed) {
				left('field shared by several members', row);
				continue;
			}
			candidates.push({ row, request: { owner: m.owner, from: field, to } });
			continue;
		}
		if (target === null) {
			left('wildcard child with no field', row);
			continue;
		}
		candidates.push({ row, request: { owner: m.owner, field: to, target } });
	}
	const implicitMembers: string[] = [];
	const implicitRows = new Set<string>();
	const routed = new Set(named.map((m) => `${m.owner}.${m.name}`));
	for (const [owner, vocab] of routes.vocabOf) {
		for (const member of vocabMembers.get(vocab) ?? []) {
			const child = memberFieldName(member);
			const row = `${owner}.${member}`;
			if (routed.has(row) || !ruleNames.has(child)) continue;
			const where = childFields(checks, owner, { symbol: child });
			if (!where.unfielded || where.fields.length > 0) continue;
			if (where.arm) {
				left('implicit route: the child is an arm of the owner, not a slot', row);
				continue;
			}
			implicitRows.add(row);
			candidates.push({ row, request: { owner, field: child, target: { symbol: child } } });
		}
	}

	const distinct = (key: (r: FieldRequest) => string, value: (r: FieldRequest) => string): Map<string, Set<string>> => {
		const n = new Map<string, Set<string>>();
		for (const c of candidates) (n.get(key(c.request)) ?? n.set(key(c.request), new Set()).get(key(c.request))!).add(value(c.request));
		return n;
	};
	const membersOfTarget = distinct(targetKey, fieldKey);
	const targetsOfField = distinct(fieldKey, targetKey);
	const refuse = (cause: string, row: string): void => left(implicitRows.has(row) ? `implicit route: ${cause}` : cause, row);
	const refusedGroups = new Set<string>();
	const refuseCandidate = (cause: string, { row, group }: (typeof candidates)[number]): void => {
		if (group !== undefined) {
			if (refusedGroups.has(group)) return;
			refusedGroups.add(group);
		}
		refuse(cause, row);
	};
	const together = (candidate: (typeof candidates)[number]) => (c: (typeof candidates)[number]): boolean =>
		c !== candidate && (candidate.group === undefined || c.group !== candidate.group);
	let accepted = candidates.filter((candidate) => {
		const { request } = candidate;
		if (membersOfTarget.get(targetKey(request))!.size > 1) {
			refuseCandidate('one child or token feeds several members', candidate);
			return false;
		}
		if (targetsOfField.get(fieldKey(request))!.size > 1) {
			refuseCandidate('two fields route to one member', candidate);
			return false;
		}
		return true;
	});
	accepted = accepted.filter((c) => c.group === undefined || !refusedGroups.has(c.group));
	const issues = new Map<(typeof candidates)[number], string>();
	for (let changed = true; changed; ) {
		changed = false;
		const renameBatch = accepted.flatMap((c) => ('from' in c.request ? [c.request] : []));
		const wrapBatch = accepted.flatMap((c) => ('from' in c.request ? [] : [c.request]));
		for (const candidate of accepted.slice()) {
			if (!accepted.includes(candidate)) continue;
			const { request } = candidate;
			const issue = 'from' in request ? fieldRenameIssue(checks, request, renameBatch) : fieldWrapIssue(checks, request, wrapBatch);
			if (issue === undefined) continue;
			issues.set(candidate, issue);
			accepted = accepted.filter(together(candidate));
			changed = true;
		}
	}
	for (const [candidate, issue] of issues) refuseCandidate(issue, candidate);
	const fieldRenames: FieldRename[] = [];
	const fieldWraps: FieldWrap[] = [];
	const applied = new Set<string>();
	const realizedGroups = new Set<string>();
	for (const { row, request, group } of accepted) {
		if (group === undefined || !realizedGroups.has(group)) (implicitRows.has(row) ? implicitMembers : realizedMembers).push(row);
		if (group !== undefined) realizedGroups.add(group);
		if (applied.has(targetKey(request))) continue;
		applied.add(targetKey(request));
		if ('from' in request) fieldRenames.push(request);
		else fieldWraps.push(request);
	}

	const layerRules = Object.fromEntries(Object.keys(rules).map((name) => [name, input.layerRules[name]]));
	const patches = grammarBindingsPatches({ ...checks, rules: layerRules }, fieldRenames, fieldWraps, aliases);
	const { leads, diagnostics } = deriveLeads({ file: input.file, base, facts });
	return {
		bindings: { patches, renames, leads, splits },
		diagnostics,
		report: {
			claims: facts.claims.length,
			members: facts.members.length,
			aliases,
			fieldRenames,
			fieldWraps,
			realizedKinds,
			realizedByParent,
			realizedMembers,
			implicitMembers,
			residue
		}
	};
}

export function grammarBindingsPatches(
	grammar: GrammarRecord,
	renames: readonly FieldRename[],
	wraps: readonly FieldWrap[],
	aliases: Readonly<Record<string, string>>
): Map<string, GrammarBindingsPatch[][]> {
	const rules = (isRecord(grammar.rules) ? grammar.rules : {}) as Record<string, unknown>;
	const stop = supertypesOf(grammar);
	const renamesAt = byHost(renames, (rename) => fieldHosts(rules, rename.owner, rename.from, stop));
	const wrapsAt = byHost(wraps, (wrap) => wrapHosts(rules, wrap, stop));
	const fieldNameAt = (host: string, name: string): string => (renamesAt.get(host) ?? []).reduce((current, r) => (current === r.from ? r.to : current), name);
	const wrapAt = (host: string, rule: GrammarRecord): FieldWrap | undefined => wrapsAt.get(host)?.find((wrap) => isWrapSite(rule, wrap.target));
	const fieldEditAt = (host: string, rule: GrammarRecord, wrappable: boolean): GrammarBindingsEdit | undefined => {
		const wrap = wrappable ? wrapAt(host, rule) : undefined;
		if (wrap !== undefined) return { field: wrap.field };
		if (rule.type !== 'FIELD' || typeof rule.name !== 'string') return undefined;
		const name = fieldNameAt(host, rule.name);
		return name === rule.name ? undefined : { field: name };
	};

	const liftNames = new Set<string>();
	const collectLifts = (r: unknown): void => {
		if (Array.isArray(r)) r.forEach(collectLifts);
		else if (isRecord(r)) {
			if (isLift(r) && typeof r.name === 'string') liftNames.add(r.name);
			Object.values(r).forEach(collectLifts);
		}
	};
	Object.values(rules).forEach(collectLifts);
	const roots = Object.keys(rules).filter((name) => !liftNames.has(name));

	const fieldPatches = new Map<string, GrammarBindingsPatch[]>();
	const aliasPatches = new Map<string, GrammarBindingsPatch[]>();
	const reached = new Set<string>();
	for (const root of roots) {
		const fields: GrammarBindingsPatch[] = [];
		const aliased: GrammarBindingsPatch[] = [];
		const walk = (rule: unknown, site: WalkSite): void => {
			if (!isRecord(rule)) return;
			if (isPrecWrapper(rule as { type: string })) return walk(rule.content, site);
			const edit = fieldEditAt(site.host, rule, site.wrappable);
			if (edit !== undefined) fields.push({ path: pathText(site.fieldPath), edit });
			const wrapped = site.wrappable && wrapAt(site.host, rule) !== undefined;
			const aliasPath = wrapped ? [...site.aliasPath, 0] : site.aliasPath;
			const container = wrapped ? 'FIELD' : site.container;
			if (rule.type === 'SYMBOL' && typeof rule.name === 'string' && Object.hasOwn(aliases, rule.name) && (aliasPath.length === 0 || container !== 'ALIAS'))
				aliased.push({ path: pathText(aliasPath), edit: { alias: aliases[rule.name]! } });
			if (isLift(rule)) {
				const name = rule.name as string;
				if (reached.has(name)) return;
				reached.add(name);
				return walk(rules[name], { host: name, wrappable: true, fieldPath: site.fieldPath, aliasPath, container });
			}
			if (isGroupAlias(rule)) return walk(rule.content, { ...site, wrappable: false, aliasPath, container });
			const child = (fieldPath: readonly number[], index: number): WalkSite => ({
				host: site.host,
				wrappable: site.wrappable && !wrapped && !OPAQUE_RULES.has(rule.type) && rule.type !== 'ALIAS',
				fieldPath: [...fieldPath, index],
				aliasPath: [...aliasPath, index],
				container: rule.type as string
			});
			if (Array.isArray(rule.members)) rule.members.forEach((member, index) => walk(member, child(site.fieldPath, index)));
			else if (SINGLE.has(rule.type as string)) walk(rule.content, child(site.fieldPath, 0));
		};
		walk(rules[root], { host: root, wrappable: true, fieldPath: [], aliasPath: [], container: undefined });
		const top = unwrappedPrec(rules[root]);
		if (fields.length > 0) fieldPatches.set(root, pathMode(top, fields));
		const fieldedTop = isRecord(top) && wrapAt(root, top) !== undefined ? { type: 'FIELD' } : top;
		if (aliased.length > 0) aliasPatches.set(root, pathMode(fieldedTop, aliased));
	}
	const unreached = [...liftNames].filter((name) => !reached.has(name) && hasFieldEdit(rules[name], name, true));
	if (unreached.length > 0) throw new Error(`edited group lifts no rule reaches: ${unreached.join(', ')}`);

	function hasFieldEdit(rule: unknown, host: string, wrappable: boolean): boolean {
		if (Array.isArray(rule)) return rule.some((r) => hasFieldEdit(r, host, wrappable));
		if (!isRecord(rule)) return false;
		if (fieldEditAt(host, rule, wrappable) !== undefined) return true;
		const inner = wrappable && wrapAt(host, rule) === undefined && !OPAQUE_RULES.has(rule.type) && rule.type !== 'ALIAS';
		return Object.values(rule).some((value) => hasFieldEdit(value, host, inner));
	}

	return new Map(
		[...new Set([...fieldPatches.keys(), ...aliasPatches.keys()])]
			.sort()
			.map((kind) => [kind, [fieldPatches.get(kind), aliasPatches.get(kind)].filter((p): p is GrammarBindingsPatch[] => p !== undefined)])
	);
}

interface WalkSite {
	readonly host: string;
	readonly wrappable: boolean;
	readonly fieldPath: readonly number[];
	readonly aliasPath: readonly number[];
	readonly container: string | undefined;
}

function byHost<T>(requests: readonly T[], hosts: (request: T) => readonly string[]): Map<string, T[]> {
	const out = new Map<string, T[]>();
	for (const request of requests) for (const host of hosts(request)) (out.get(host) ?? out.set(host, []).get(host)!).push(request);
	return out;
}

const pathText = (path: readonly number[]): string => (path.length === 0 ? '.' : path.join('/'));

function unwrappedPrec(rule: unknown): unknown {
	let node = rule;
	while (isRecord(node) && isPrecWrapper(node as { type: string })) node = node.content;
	return node;
}

function pathMode(top: unknown, patches: readonly GrammarBindingsPatch[]): GrammarBindingsPatch[] {
	if (!isRecord(top) || top.type === 'SEQ' || patches.some((p) => p.path.includes('/') || p.path === '.')) return [...patches];
	const length = Array.isArray(top.members) ? top.members.length : 1;
	return patches.map((p) => ({ ...p, path: String(Number(p.path) - length) }));
}
