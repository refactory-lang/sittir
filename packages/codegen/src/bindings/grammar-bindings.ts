import {
	childFields,
	fieldHoldsOnly,
	fieldHosts,
	fieldRenameIssue,
	fieldWrapIssue,
	isWrapSite,
	wrapHosts,
	type FieldRename,
	type FieldWrap,
	type LiteralSplit,
	type RelaxSite,
	type Split
} from '../dsl/bind.ts';
import { wordDisplaysOf } from '../dsl/rule-transforms.ts';
import { matchesWordShape } from '../util/word-matcher.ts';
import type { Lead } from '../dsl/verbs/effects.ts';
import { fieldRules, fieldThrough, isEnrichedField, isRecord, OPAQUE_RULES, supertypesOf, symbolNames, type GrammarRecord } from '../dsl/rule-patterns.ts';
import type { GrammarDiagnostic } from '../types/diagnostics.ts';
import { isPrecWrapper } from '../types/runtime-shapes.ts';
import type { EvaluatedGrammar, RawGrammar } from '../compiler/types.ts';
import { isEnrichGroupLiftSymbol } from '../dsl/transform/transform-path.ts';
import { type BindingFacts, type LiteralText, type MemberFact, type ModelSlot, type RefinedClaim, type SlotModel, WILDCARD, isNamedMember, literalClaimOf, refineClaims } from './facts.ts';
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
	readonly wordMatcher: RegExp | undefined;
	readonly layerRules: EvaluatedGrammar['rules'];
	readonly vocabMembers: ReadonlyMap<string, ReadonlySet<string>>;
	readonly routes: Pick<GrammarRoutes, 'members' | 'vocabOf'>;
	readonly model: SlotModel;
}

export const memberFieldName = (member: string): string => member.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

function relaxedTexts(rules: Readonly<Record<string, unknown>>, rule: unknown, display: string, entered: Set<string>, out: Set<string>): Set<string> {
	if (Array.isArray(rule)) for (const r of rule) relaxedTexts(rules, r, display, entered, out);
	if (!isRecord(rule)) return out;
	if (rule.type === 'ALIAS' && rule.named === true && rule.value === display && isRecord(rule.content) && rule.content.type === 'STRING' && typeof rule.content.value === 'string') return out.add(rule.content.value);
	if (rule.type === 'SYMBOL' && typeof rule.name === 'string') {
		if (isParserHiddenName(rule.name) && !entered.has(rule.name)) relaxedTexts(rules, rules[rule.name], display, entered.add(rule.name), out);
		return out;
	}
	for (const value of Object.values(rule)) relaxedTexts(rules, value, display, entered, out);
	return out;
}

function relaxedFamilyOf(rules: Readonly<Record<string, unknown>>, kind: string, literal: LiteralText): ReadonlySet<string> {
	const through = fieldThrough(rules, rules[kind], literal.field, new Set([kind])) ?? [];
	const holder = rules[through[through.length - 1] ?? kind];
	const contents = fieldRules(holder).filter((f) => f.name === literal.field).map((f) => f.content);
	return relaxedTexts(rules, contents, literal.leaf, new Set(), new Set());
}

function admitsDisplay(rules: Readonly<Record<string, unknown>>, rule: unknown, display: string, word: string, entered: Set<string>): boolean {
	if (!isRecord(rule)) return false;
	if (isPrecWrapper(rule as { type: string })) return admitsDisplay(rules, rule.content, display, word, entered);
	if (rule.type === 'CHOICE') return Array.isArray(rule.members) && rule.members.some((m) => admitsDisplay(rules, m, display, word, entered));
	if (rule.type === 'ALIAS') return rule.named === true && rule.value === display && admitsDisplay(rules, rule.content, word, word, entered);
	if (rule.type !== 'SYMBOL' || typeof rule.name !== 'string') return false;
	if (rule.name === display) return true;
	if (!isParserHiddenName(rule.name) || entered.has(rule.name)) return false;
	return admitsDisplay(rules, rules[rule.name], display, word, entered.add(rule.name));
}

function relaxSitesOf(rules: Readonly<Record<string, unknown>>, word: string, family: ReadonlySet<string>, texts: readonly string[]): RelaxSite[] {
	const sites: RelaxSite[] = [];
	for (const [kind, body] of Object.entries(rules)) {
		const walk = (rule: unknown, path: readonly string[], within?: { readonly path: readonly string[]; readonly rule: unknown }): void => {
			if (!isRecord(rule)) return;
			if (isPrecWrapper(rule as { type: string })) return walk(rule.content, path);
			if (rule.type === 'FIELD' && typeof rule.name === 'string') return walk(rule.content, [...path, `${rule.name}:`]);
			if (SINGLE.has(rule.type as string)) return walk(rule.content, [...path, '0']);
			if (rule.type !== 'SEQ' && rule.type !== 'CHOICE') return;
			const members = Array.isArray(rule.members) ? (rule.members as unknown[]) : [];
			if (rule.type === 'CHOICE') {
				const site = within ?? { path, rule };
				const byDisplay = new Map<string, Set<string>>();
				for (const m of members) {
					if (isRecord(m) && m.type === 'ALIAS' && m.named === true && typeof m.value === 'string' && isRecord(m.content) && m.content.type === 'STRING' && typeof m.content.value === 'string') {
						byDisplay.set(m.value, (byDisplay.get(m.value) ?? new Set()).add(m.content.value));
					}
				}
				for (const [display, held] of byDisplay) {
					const at = site.path.length === 0 ? '.' : site.path.join('/');
					if ([...family].every((text) => held.has(text)) && texts.some((text) => !held.has(text)) && admitsDisplay(rules, site.rule, display, word, new Set()) && !sites.some((s) => s.kind === kind && s.path === at && s.display === display)) sites.push({ kind, path: at, display });
				}
				members.forEach((m, i) => walk(m, [...path, String(i)], site));
				return;
			}
			members.forEach((m, i) => walk(m, [...path, String(i)]));
		};
		walk(body, []);
	}
	return sites;
}

type FieldRequest = FieldRename | FieldWrap;

const SEVERAL_FIELDS = 'placement reaches a kind through several fields';
const SINGLE = new Set(['OPTIONAL', 'REPEAT', 'REPEAT1', 'FIELD', 'TOKEN', 'IMMEDIATE_TOKEN', 'ALIAS']);
const metaOf = (r: GrammarRecord): GrammarRecord => (isRecord(r.metadata) ? r.metadata : {});
const isLift = (r: GrammarRecord): boolean => r.type === 'SYMBOL' && metaOf(r).symbolSource === 'group-lift' && !(isRecord(r.annotations) && 'variant' in r.annotations);
const isGroupAlias = (r: GrammarRecord): boolean => r.type === 'ALIAS' && metaOf(r).aliasSource === 'visible-group';

interface ReferenceField {
	readonly name: string;
	readonly whole: boolean;
}

interface PlacedStep {
	readonly kind: string;
	readonly field: ReferenceField | undefined;
}

interface PlacedSplit {
	readonly kind: string;
	readonly within: readonly string[];
	readonly as: string;
	readonly steps: readonly PlacedStep[];
	readonly literal?: LiteralSplit;
}

function reachesThroughHidden(rules: Readonly<Record<string, unknown>>, rule: unknown, child: string, entered: Set<string>): boolean {
	if (Array.isArray(rule)) return rule.some((r) => reachesThroughHidden(rules, r, child, entered));
	if (!isRecord(rule) || (OPAQUE_RULES.has(rule.type) && !isEnrichedField(rule))) return false;
	if (rule.type !== 'SYMBOL' || typeof rule.name !== 'string') return Object.values(rule).some((v) => reachesThroughHidden(rules, v, child, entered));
	if (rule.name === child) return true;
	if (!isParserHiddenName(rule.name) || isEnrichGroupLiftSymbol(rule) || entered.has(rule.name)) return false;
	entered.add(rule.name);
	return reachesThroughHidden(rules, rules[rule.name], child, entered);
}

function supertypesBetween(
	rules: Readonly<Record<string, unknown>>,
	supertypes: ReadonlySet<string>,
	owner: string,
	child: string,
	entered: ReadonlySet<string> = new Set()
): readonly string[] | undefined {
	if (reachesThroughHidden(rules, rules[owner], child, new Set())) return [];
	for (const supertype of supertypes) {
		if (supertype === owner || entered.has(supertype) || !reachesThroughHidden(rules, rules[owner], supertype, new Set())) continue;
		const rest = supertypesBetween(rules, supertypes, supertype, child, new Set([...entered, owner]));
		if (rest !== undefined) return [supertype, ...rest];
	}
	return undefined;
}

function fieldOfReference(rules: Readonly<Record<string, unknown>>, owner: string, child: string): ReferenceField | undefined | 'several' {
	const fields = fieldRules(rules[owner]).filter((f) => !isEnrichedField(f) && reachesThroughHidden(rules, f.content, child, new Set()));
	const field = fields.at(-1);
	if (field === undefined) return undefined;
	if (fields.some((f) => f.name !== field.name)) return 'several';
	const content = unwrappedPrec(field.content);
	return { name: field.name, whole: isRecord(content) && content.type === 'SYMBOL' && content.name === child };
}

function placedStepsOf(rules: Readonly<Record<string, unknown>>, stop: ReadonlySet<string>, kind: string, within: readonly string[]): readonly PlacedStep[] | 'several' {
	const owner = within[within.length - 1]!;
	const claimed = [...within.slice(0, -1).toReversed(), kind];
	const kinds = claimed.flatMap((k, i) => [...(supertypesBetween(rules, stop, i === 0 ? owner : claimed[i - 1]!, k) ?? []), k]);
	const steps = kinds.map((k, i) => ({ kind: k, field: fieldOfReference(rules, i === 0 ? owner : kinds[i - 1]!, k) }));
	return steps.some((step) => step.field === 'several') ? 'several' : (steps as PlacedStep[]);
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

function isMintedField(rules: GrammarRecord, form: string, field: string, stop: ReadonlySet<string>): boolean {
	const fields = fieldHosts(rules, form, field, stop).flatMap((host) => fieldRules(rules[host]).filter((rule) => rule.name === field));
	return fields.length > 0 && fields.every(isEnrichedField);
}

function formFieldRenames(
	model: SlotModel,
	owner: string,
	from: string,
	to: string,
	minted: (form: string, field: string) => boolean
): readonly FieldRename[] | string {
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
		if (holder !== undefined && own === undefined && !minted(form, holder.name)) return 'a form holds the member only under a field the grammar names otherwise';
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
	const checks = { ...base, rules } as unknown as GrammarRecord;
	const stop = supertypesOf(checks);
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
	const placedSplits: PlacedSplit[] = [];
	const wordMatcher = input.wordMatcher;
	const wordLeaves = new Set([...(base.word === null ? [] : [base.word]), ...wordDisplaysOf(base.rules, { word: base.word ?? undefined })]);
	const literalDiagnostics: GrammarDiagnostic[] = [];
	const refuseLiteral = (row: string, literal: LiteralText): void => {
		const reason = wordLeaves.has(literal.leaf)
			? `${literal.texts.filter((text) => !matchesWordShape(text, wordMatcher)).join(', ')} is not word-shaped`
			: `${literal.leaf} is not the grammar's word or an alias of it`;
		literalDiagnostics.push({
			scope: 'grammar',
			code: 'literal-split-not-keyword',
			severity: 'fail',
			grammar: base.name,
			message: `${input.file}: the claim ${row} names its kind by the text of ${literal.leaf}, which cannot become a keyword: ${reason}`,
			canProceed: false,
			details: { file: input.file, claim: row, leaf: literal.leaf, texts: literal.texts, reason }
		});
	};
	const literalSplitAt = (c: RefinedClaim, kind: string, within: readonly string[], literal: LiteralText, as: string): PlacedSplit | string => {
		if (!ruleNames.has(kind) || !within.every((w) => ruleNames.has(w))) return 'placed claim';
		const absent = c.absent.flatMap((field) => {
			const through = fieldThrough(rules, rules[kind], field, new Set([kind]), (symbol) => !isEnrichGroupLiftSymbol(symbol));
			return through === undefined ? [] : [{ field, through }];
		});
		if (absent.length !== c.absent.length) return 'negated field is not a field of the split kind';
		const steps = placedStepsOf(rules, stop, kind, within);
		if (steps === 'several') return SEVERAL_FIELDS;
		const family = relaxedFamilyOf(rules, kind, literal);
		const relax = family.size === 0 || base.word === null ? [] : relaxSitesOf(input.layerRules as Readonly<Record<string, unknown>>, base.word, family, literal.texts);
		return { kind, within, as, steps, literal: { ...literal, absent, relax } };
	};
	const mintedLiterals: { c: RefinedClaim; kind: string; literal: LiteralText; row: string }[] = [];
	for (const c of claims) {
		const row = `${c.kind ?? '(group)'} → ${c.vocab}`;
		const kind = c.kind;
		const literal = c.refines === null && kind !== null && kind !== WILDCARD ? literalClaimOf(c) : undefined;
		if (literal !== undefined && kind !== null) {
			if (!wordLeaves.has(literal.leaf) || !literal.texts.every((text) => matchesWordShape(text, wordMatcher))) {
				refuseLiteral(row, literal);
				continue;
			}
			if (!placed(c) && !ruleNames.has(kind)) {
				mintedLiterals.push({ c, kind, literal, row });
				continue;
			}
			if (!placed(c)) {
				left('literal split names no site', row);
				continue;
			}
			const split = literalSplitAt(c, kind, c.within, literal, boundKindName(c.vocab, isParserHiddenName(kind)));
			if (typeof split === 'string') {
				left(split, row);
				continue;
			}
			placedSplits.push(split);
			realizedKinds.push(row);
			continue;
		}
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
			if (fieldOfReference(rules, outer, reference) === undefined) {
				left('placement container has no member name', row);
				continue;
			}
			const steps = placedStepsOf(rules, stop, c.kind, c.within);
			if (steps === 'several') {
				left(SEVERAL_FIELDS, row);
				continue;
			}
			placedSplits.push({ kind: c.kind, within: c.within, as: to, steps });
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
	for (const { c, kind, literal, row } of mintedLiterals) {
		const sites = placedSplits.filter((split) => split.literal === undefined && split.as === kind);
		const at = sites.map((site) => literalSplitAt(c, site.kind, site.within, literal, boundKindName(c.vocab, isParserHiddenName(kind))));
		const refused = sites.length === 0 ? 'literal split names no site' : at.find((split): split is string => typeof split === 'string');
		if (refused !== undefined) {
			left(refused, row);
			continue;
		}
		placedSplits.push(...at.filter((split): split is PlacedSplit => typeof split !== 'string'));
		realizedKinds.push(row);
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

	const layer = input.layerRules as unknown as GrammarRecord;

	const splits: Split[] = placedSplits.map((split) => {
		const owner = split.within[split.within.length - 1]!;
		const ownerName = Object.hasOwn(renames, owner) ? renames[owner]! : Object.hasOwn(aliases, owner) ? aliases[owner]! : owner;
		const first = split.steps[0]?.field;
		const cloneName = (kind: string, i: number): string | null => {
			if (i === split.steps.length - 1 || stop.has(kind)) return null;
			return i === 0 && first?.whole === true ? `${ownerName}_${first.name}` : `${kind}_${ownerName}`;
		};
		return {
			owner,
			path: split.steps.map(({ kind, field }, i) => ({ field: field?.name ?? null, kind, as: cloneName(kind, i) })),
			as: split.as,
			...(split.literal === undefined ? {} : { literal: split.literal })
		};
	});
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
				const renames = formFieldRenames(model, m.owner, m.field, to, (form, field) => isMintedField(layer, form, field, stop));
				if (typeof renames === 'string') left(renames, row);
				else if (renames.length === 0) realizedMembers.push(row);
				else for (const request of renames) candidates.push({ row, request, group: row });
				continue;
			}
			if (to === m.field || (m.flag === true && m.token !== undefined && !fieldHoldsOnly(checks, m.owner, m.field, { token: m.token }))) {
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
			if (field === to || (m.flag === true && target !== null && !fieldHoldsOnly(checks, m.owner, field, target))) {
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

	const layerField = (owner: string, field: string): string => fieldRenames.find((r) => r.owner === owner && r.from === field)?.to ?? field;
	const layerSplits = splits.map((split): Split => {
		if (split.literal === undefined) return split;
		const source = split.path[split.path.length - 1]!.kind;
		const { field, absent } = split.literal;
		return {
			...split,
			literal: {
				...split.literal,
				field: layerField(source, field),
				absent: absent.map((a) => ({ ...a, field: layerField(a.through[a.through.length - 1] ?? source, a.field) }))
			}
		};
	});
	const layerRules = Object.fromEntries(Object.keys(rules).map((name) => [name, input.layerRules[name]]));
	const patches = grammarBindingsPatches({ ...checks, rules: layerRules }, fieldRenames, fieldWraps, aliases);
	const { leads, diagnostics: leadDiagnostics } = deriveLeads({ file: input.file, base, facts });
	const diagnostics = [...leadDiagnostics, ...literalDiagnostics];
	return {
		bindings: { patches, renames, leads, splits: layerSplits },
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
