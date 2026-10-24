import type { LayerRecords } from '../layer-record.ts';
import type { DisplayFamilies } from '../rule-transforms.ts';
import { isPreference } from '../primitives/preference.ts';
import { formatPreferencePath, parsePreferencePath } from '../primitives/preference-path.ts';
import { fieldNames, isRecord, subtypeNames, supertypesOf, transparentReach, type GrammarRecord } from '../rule-patterns.ts';
import { LABELS_KEY } from '../wire/options-block.ts';
import { REPARSE_HOST_PRIORITY } from '../wire/reparse-hosts.ts';

export interface LeadWithin {
	readonly field: string | null;
	readonly admits: readonly LeadMatch[];
}

export interface LeadMatch {
	readonly kind: string;
	readonly within?: LeadWithin;
	readonly as?: string;
}

export interface Lead {
	readonly list: string;
	readonly item: string;
	readonly field: string;
	readonly admits: readonly LeadMatch[];
}

export type CopyOrigin =
	| { readonly kind: 'path'; readonly owner: string; readonly path: string }
	| { readonly kind: 'copy'; readonly owner: string }
	| { readonly kind: 'narrow'; readonly owner: string; readonly path: string }
	| (Lead & { readonly kind: 'lead' });

export type NarrowingOrigin = Extract<CopyOrigin, { readonly kind: 'narrow' | 'lead' }>;

export interface SegmentEffect {
	readonly kind: 'segment';
	readonly owner: string;
	readonly from: string;
	readonly to: string;
}

export interface AliasEffect {
	readonly kind: 'alias';
	readonly from: string;
	readonly to: string;
}

export interface RenameEffect {
	readonly kind: 'rename';
	readonly from: string;
	readonly to: string;
}

export interface CopyEffect {
	readonly kind: 'copy';
	readonly copy: string;
	readonly source: string;
	readonly part: string;
	readonly context: string;
	readonly display: string | undefined;
	readonly admitted: string | undefined;
	readonly origin: CopyOrigin;
}

export type Effect = SegmentEffect | AliasEffect | RenameEffect | CopyEffect;

export interface LeadEffect extends Lead {
	readonly kind: 'lead';
	readonly receiver: string;
	readonly group: string;
	readonly restField: string;
	readonly variants: Readonly<Record<string, string>>;
}

export type BindingEffect = SegmentEffect | AliasEffect | LeadEffect;

export interface EffectCtx {
	readonly effects: readonly Effect[];
	readonly rules: Readonly<Record<string, unknown>>;
}

export interface Provenance {
	readonly splitFrom: Readonly<Record<string, string>>;
	readonly leadFrom?: Readonly<Record<string, string>>;
	readonly renamedFrom?: Readonly<Record<string, string>>;
	readonly bindingEffects: readonly BindingEffect[];
}

export type ProjectedGrammar<G> = G & Partial<Pick<Provenance, 'leadFrom' | 'bindingEffects'>>;

const KIND_KEYS: ReadonlySet<string> = new Set(['variantOf']);

function namesKind(record: GrammarRecord, key: string): boolean {
	if (key === 'name') return record.type === 'SYMBOL' || record.type === 'FIELD_ALIAS';
	if (key === 'value') return record.type === 'ALIAS' && record.named === true;
	return KIND_KEYS.has(key);
}

function renamedKinds(value: unknown, rename: (name: string) => string, bareNames: boolean): unknown {
	if (typeof value === 'string') return bareNames ? rename(value) : value;
	if (Array.isArray(value)) return value.map((v) => renamedKinds(v, rename, bareNames));
	if (!isRecord(value)) return value;
	const out: GrammarRecord = {};
	for (const [key, v] of Object.entries(value)) {
		if (typeof v === 'string') out[key] = namesKind(value, key) ? rename(v) : v;
		else out[key] = renamedKinds(v, rename, bareNames);
	}
	return out;
}

export function renameValue(value: unknown, rename: (name: string) => string): unknown {
	return renamedKinds(value, rename, true);
}

export function renameRefs(value: unknown, rename: (name: string) => string): unknown {
	return renamedKinds(value, rename, false);
}

function renameKeys(record: unknown, rename: (name: string) => string, renameValues = true): unknown {
	if (!isRecord(record)) return record;
	const out = new Map<string, unknown>();
	for (const [key, v] of record instanceof Map ? record : Object.entries(record)) {
		const to = typeof key === 'string' ? rename(key) : key;
		if (out.has(to)) throw new Error(`bind: '${key}' renames to '${to}', which the grammar already names`);
		out.set(to, renameValues ? renameValue(v, rename) : v);
	}
	return record instanceof Map ? out : Object.fromEntries(out);
}

export function renameReparseHosts(config: GrammarRecord, rename: (name: string) => string): GrammarRecord {
	const out: GrammarRecord = { ...config, hosts: renameKeys(config.hosts, rename, false), priority: renameValue(config.priority ?? REPARSE_HOST_PRIORITY, rename) };
	if ('gated' in config) out.gated = renameValue(config.gated, rename);
	return out;
}

function renameSegment(segment: string, rename: (name: string) => string, fields: ReadonlySet<string>): string {
	if (segment.startsWith('(') && segment.endsWith(')')) return `(${rename(segment.slice(1, -1))})`;
	if (segment.endsWith(':') && !fields.has(segment.slice(0, -1))) return `${rename(segment.slice(0, -1))}:`;
	return segment;
}

function renamePath(path: string, rename: (name: string) => string, kindHead: boolean, fields: ReadonlySet<string>): string {
	const [head = '', ...rest] = path.split('/');
	return [kindHead ? rename(head) : renameSegment(head, rename, fields), ...rest.map((s) => renameSegment(s, rename, fields))].join('/');
}

function renameOptionPaths(record: unknown, rename: (name: string) => string, kindHead: boolean, fields: ReadonlySet<string>, labelHeads = true): unknown {
	if (!isRecord(record) || isPreference(record)) return record;
	const out: GrammarRecord = {};
	for (const [key, value] of Object.entries(record)) {
		const to = renamePath(key, rename, kindHead, fields);
		if (to in out) throw new Error(`bind: options '${key}' renames to '${to}', which the options already name`);
		out[to] = renameOptionPaths(value, rename, key === LABELS_KEY && labelHeads, fields, labelHeads);
	}
	return out;
}

interface SegmentRewrite {
	readonly owner: string;
	readonly from: string;
	readonly to: string;
}

function segmentDestinations(
	rewrites: readonly SegmentRewrite[],
	grammar?: GrammarRecord
): (owner: string, segment: string) => readonly string[] {
	const rules = isRecord(grammar?.rules) ? grammar.rules : {};
	const stop = grammar === undefined ? new Set<string>() : supertypesOf(grammar);
	const reach = new Map<string, ReadonlySet<string>>();
	const hostsOf = (owner: string): ReadonlySet<string> => {
		const hosts = reach.get(owner) ?? transparentReach(rules, owner, stop);
		reach.set(owner, hosts);
		return hosts;
	};
	const holds = (owner: string, segment: string): boolean => {
		const [head] = parsePreferencePath(segment);
		return head?.kind === 'fieldName' && [...hostsOf(owner)].some((host) => fieldNames(rules[host]).has(head.name));
	};
	const destinationsOf = (owner: string, segment: string): readonly string[] => {
		const own = [...new Set(rewrites.filter((r) => hostsOf(owner).has(r.owner) && r.from === segment).map((r) => r.to))];
		if (!stop.has(owner) || own.length > 0) return own;
		const forms = subtypeNames(rules, rules[owner]).map((form) => {
			const to = destinationsOf(form, segment);
			return to.length > 0 ? to : holds(form, segment) ? [segment] : [];
		});
		const agreed = new Set(forms.flat());
		return agreed.size === 1 && agreed.has(segment) ? [] : [...agreed];
	};
	return destinationsOf;
}

export function boundSegmentOf(
	rewrites: readonly SegmentRewrite[],
	grammar?: GrammarRecord
): (owner: string, segment: string) => string {
	const destinationsOf = segmentDestinations(rewrites, grammar);
	return (owner, segment) => {
		const destinations = destinationsOf(owner, segment);
		if (destinations.length > 1)
			throw new Error(`bind: '${owner}/${segment}' has conflicting field renames: ${destinations.join(', ')}`);
		return destinations[0] ?? segment;
	};
}

export function bindMatch(
	match: LeadMatch,
	rename: (kind: string) => string,
	fieldNameOf: (owner: string, field: string) => string = (_owner, field) => field
): LeadMatch {
	return {
		...match,
		kind: rename(match.kind),
		...(match.within === undefined
			? {}
			: {
					within: {
						field: match.within.field === null ? null : fieldNameOf(match.kind, match.within.field),
						admits: match.within.admits.map((m) => bindMatch(m, rename, fieldNameOf))
					}
				})
	};
}

export function boundFieldNameOf(
	rewrites: readonly SegmentRewrite[],
	grammar?: GrammarRecord
): (owner: string, field: string) => string {
	const segmentOf = boundSegmentOf(rewrites, grammar);
	return (owner, field) => {
		const segment = parsePreferencePath(
			segmentOf(owner, formatPreferencePath([{ kind: 'fieldName', name: field }]))
		)[0];
		if (segment?.kind !== 'fieldName') throw new Error(`bind: '${owner}.${field}' was not renamed to a field`);
		return segment.name;
	};
}

export function rewriteOwnedSegments(options: unknown, rewrites: readonly SegmentRewrite[], grammar?: GrammarRecord): unknown {
	if (!isRecord(options)) return options;
	const fieldOf = boundSegmentOf(rewrites, grammar);
	const ownedPath = (owner: string, path: string): string =>
		path
			.split('/')
			.map((segment) => fieldOf(owner, segment))
			.join('/');
	const ownedRecord = (owner: string, record: unknown): unknown => {
		if (!isRecord(record) || isPreference(record)) return record;
		const out: GrammarRecord = {};
		for (const [key, value] of Object.entries(record)) out[ownedPath(owner, key)] = ownedRecord(owner, value);
		return out;
	};
	const out: GrammarRecord = {};
	for (const [key, value] of Object.entries(options)) {
		if (key === LABELS_KEY && isRecord(value)) {
			const labels: GrammarRecord = {};
			for (const [address, target] of Object.entries(value)) {
				const [head = '', ...rest] = address.split('/');
				labels[[head, ...rest.map((segment) => fieldOf(head, segment))].join('/')] = target;
			}
			out[key] = labels;
		} else out[key] = ownedRecord(key, value);
	}
	return out;
}

function ownerOptions(options: GrammarRecord, owner: string): GrammarRecord {
	const labels = options[LABELS_KEY];
	return {
		...(owner in options ? { [owner]: options[owner] } : {}),
		...(isRecord(labels) ? { [LABELS_KEY]: Object.fromEntries(Object.entries(labels).filter(([path]) => path.split('/')[0] === owner)) } : {})
	};
}

export function inheritSplitOptions(grammar: GrammarRecord, splitFrom: Readonly<Record<string, string>>): unknown {
	if (!isRecord(grammar.options)) return grammar.options;
	const out = { ...grammar.options };
	const fields = fieldNames(grammar.rules);
	for (const [to, from] of Object.entries(splitFrom)) {
		const projected = renameOptionPaths(ownerOptions(grammar.options, from), (name) => name === from ? to : name, true, fields);
		if (!isRecord(projected)) continue;
		for (const [key, value] of Object.entries(projected)) {
			const existing = out[key];
			out[key] = isRecord(value) && isRecord(existing) ? { ...value, ...existing } : existing ?? value;
		}
	}
	return out;
}

const isSegment = (effect: { readonly kind: string }): effect is SegmentEffect => effect.kind === 'segment';

export function effectsForOwners<E extends { readonly kind: string }>(grammar: GrammarRecord, effects: readonly E[]): readonly (E | SegmentEffect)[] {
	const segments: SegmentEffect[] = [];
	for (const effect of effects) if (isSegment(effect)) segments.push(effect);
	const destinationsOf = segmentDestinations(segments, grammar);
	const from = [...new Set(segments.map((effect) => effect.from))];
	const owners = isRecord(grammar.rules) ? Object.keys(grammar.rules) : [];
	return [
		...effects.filter((effect) => !isSegment(effect)),
		...owners.flatMap((owner) =>
			from.flatMap((before): SegmentEffect[] => {
				const destinations = destinationsOf(owner, before);
				return destinations.length === 1 && destinations[0] === before ? [] : destinations.map((to) => ({ kind: 'segment', owner, from: before, to }));
			})
		)
	];
}

const inheritsOptions = (origin: CopyOrigin): boolean => origin.kind === 'path' || origin.kind === 'copy';

function splitFromOf(effects: readonly Effect[]): Record<string, string> {
	const splitFrom: Record<string, string> = {};
	for (const effect of effects) if (effect.kind === 'copy' && inheritsOptions(effect.origin)) splitFrom[effect.copy] = effect.source;
	return splitFrom;
}

type RecordRename = 'optionPaths' | 'keysAndBodies' | 'keys' | 'names' | 'reparseHosts' | { readonly entry: string };

const RECORD_RENAMES = {
	options: 'optionPaths',
	renderAs: 'keysAndBodies',
	visibleExternals: 'keysAndBodies',
	reparseHosts: 'reparseHosts',
	refineForms: 'keys',
	ruleCauses: 'keys',
	undeclaredRules: 'names',
	patchSites: { entry: 'ownerKind' },
	externalRoles: 'keys',
	expectDiagnostics: 'names',
	expectTestFailures: 'keys',
	protectedRuleNames: 'names',
	whitespaceCollisions: { entry: 'name' },
	bodyPatternZeroMatches: 'names'
} as const satisfies { readonly [K in keyof LayerRecords]-?: RecordRename };

function renamedRecord(value: unknown, as: RecordRename, rename: (name: string) => string, fields: ReadonlySet<string>): unknown {
	if (typeof as === 'object')
		return Array.isArray(value)
			? value.map((entry: unknown) => {
					if (!isRecord(entry)) return entry;
					const name = entry[as.entry];
					return typeof name === 'string' ? { ...entry, [as.entry]: rename(name) } : entry;
				})
			: value;
	switch (as) {
		case 'optionPaths':
			return renameOptionPaths(value, rename, true, fields);
		case 'keysAndBodies':
			return renameKeys(value, rename);
		case 'keys':
			return renameKeys(value, rename, false);
		case 'names':
			return renameValue(value, rename);
		case 'reparseHosts':
			return isRecord(value) ? renameReparseHosts(value, rename) : value;
	}
}

function renameRecords(records: GrammarRecord, rename: (name: string) => string, fields: ReadonlySet<string>): GrammarRecord {
	const out: GrammarRecord = { ...records };
	for (const [key, as] of Object.entries(RECORD_RENAMES)) if (key in records) out[key] = renamedRecord(records[key], as, rename, fields);
	return out;
}

export function renameMapOf(effects: readonly Effect[]): ReadonlyMap<string, string> {
	const renames = new Map<string, string>();
	for (const effect of effects) {
		if (effect.kind !== 'rename') continue;
		for (const [from, to] of renames) if (to === effect.from) renames.set(from, effect.to);
		renames.set(effect.from, effect.to);
	}
	return renames;
}

export function rewriteInherited(records: LayerRecords, ctx: EffectCtx): LayerRecords {
	const segments: SegmentEffect[] = [];
	const aliases = new Map<string, string>();
	const renames = renameMapOf(ctx.effects);
	for (const effect of ctx.effects) {
		if (effect.kind === 'segment') segments.push(effect);
		else if (effect.kind === 'alias') aliases.set(effect.from, effect.to);
	}
	const splitFrom = splitFromOf(ctx.effects);
	const fields = fieldNames(ctx.rules);
	let out: GrammarRecord = { ...records };
	if (out.options !== undefined) {
		if (segments.length > 0) out.options = rewriteOwnedSegments(out.options, segments);
		if (aliases.size > 0) out.options = renameOptionPaths(out.options, (name) => aliases.get(name) ?? name, false, fields, false);
	}
	if (renames.size > 0) out = renameRecords(out, (name) => renames.get(name) ?? name, fields);
	if (out.options !== undefined && Object.keys(splitFrom).length > 0) out.options = inheritSplitOptions({ options: out.options, rules: ctx.rules }, splitFrom);
	return out as LayerRecords;
}

interface LeadCopies {
	readonly origin: Extract<CopyOrigin, { readonly kind: 'lead' }>;
	readonly copies: CopyEffect[];
}

function symbolsOutsideField(rule: unknown, field: string, out: string[] = []): string[] {
	if (Array.isArray(rule)) for (const r of rule) symbolsOutsideField(r, field, out);
	else if (isRecord(rule) && !(rule.type === 'FIELD' && rule.name === field)) {
		if (rule.type === 'SYMBOL' && typeof rule.name === 'string') out.push(rule.name);
		for (const value of Object.values(rule)) symbolsOutsideField(value, field, out);
	}
	return out;
}

function fieldsHolding(rule: unknown, symbol: string, out: string[] = []): string[] {
	if (Array.isArray(rule)) for (const r of rule) fieldsHolding(r, symbol, out);
	else if (isRecord(rule)) {
		if (rule.type === 'FIELD' && typeof rule.name === 'string' && isRecord(rule.content) && rule.content.type === 'SYMBOL' && rule.content.name === symbol)
			out.push(rule.name);
		for (const value of Object.values(rule)) fieldsHolding(value, symbol, out);
	}
	return out;
}

function soleName(names: readonly string[], refusal: string): string {
	const [name, ...others] = new Set(names);
	if (name === undefined || others.length > 0) throw new Error(`effects: ${refusal}`);
	return name;
}

function namedAliasValues(rule: unknown, out: Set<string> = new Set()): Set<string> {
	if (Array.isArray(rule)) for (const r of rule) namedAliasValues(r, out);
	else if (isRecord(rule)) {
		if (rule.type === 'ALIAS' && rule.named === true && typeof rule.value === 'string') out.add(rule.value);
		for (const value of Object.values(rule)) namedAliasValues(value, out);
	}
	return out;
}

function renamesWithoutCopy(admits: readonly LeadMatch[]): (readonly [string, string])[] {
	return admits.flatMap((admit) => [
		...(admit.as !== undefined && admit.within === undefined ? [[admit.kind, admit.as] as const] : []),
		...renamesWithoutCopy(admit.within?.admits ?? [])
	]);
}

function headVariants({ origin, copies }: LeadCopies, rules: Readonly<Record<string, unknown>>): Record<string, string> {
	const shown = new Set<string>();
	for (const copy of copies) if (copy.context === origin.field) namedAliasValues(rules[copy.copy], shown);
	return Object.fromEntries([
		...copies.flatMap((copy) => (copy.admitted === undefined || copy.display === undefined ? [] : [[copy.admitted, copy.display] as const])),
		...renamesWithoutCopy(origin.admits).filter(([, as]) => shown.has(as))
	]);
}

function leadEffectOf(lead: LeadCopies, rules: Readonly<Record<string, unknown>>): LeadEffect {
	const { origin, copies } = lead;
	const receiver = copies.find((copy) => copy.source === origin.list);
	if (receiver?.display === undefined) throw new Error(`effects: the lead on '${origin.list}.${origin.field}' records no shown copy of the list`);
	const group = soleName(symbolsOutsideField(rules[receiver.copy], origin.field), `the receiver form '${receiver.copy}' names no single group`);
	const restField = soleName(fieldsHolding(rules[group], origin.list), `the group '${group}' holds '${origin.list}' in no single field`);
	return {
		kind: 'lead',
		list: origin.list,
		item: origin.item,
		field: origin.field,
		admits: origin.admits,
		receiver: receiver.display,
		group,
		restField,
		variants: headVariants(lead, rules)
	};
}

export function displayFamiliesOf(effects: readonly Effect[]): DisplayFamilies {
	const members = new Map<string, Set<string>>();
	const add = (display: string, member: string): void => void members.set(display, (members.get(display) ?? new Set()).add(member));
	for (const effect of effects) {
		if (effect.kind === 'alias') add(effect.to, effect.from);
		if (effect.kind === 'copy' && effect.display === effect.source) {
			add(effect.display, effect.source);
			add(effect.display, effect.copy);
		}
	}
	return new Map([...members].filter(([, froms]) => froms.size >= 2));
}

export function provenanceOf(effects: readonly Effect[], rules: Readonly<Record<string, unknown>>): Provenance {
	const splitFrom = splitFromOf(effects);
	const leadFrom: Record<string, string> = {};
	const renamedFrom: Record<string, string> = {};
	const leads = new Map<string, LeadCopies>();
	for (const effect of effects) {
		if (effect.kind === 'rename') renamedFrom[effect.to] = effect.from;
		if (effect.kind !== 'copy') continue;
		const { origin } = effect;
		if (origin.kind !== 'lead') continue;
		leadFrom[effect.copy] = effect.source;
		const key = JSON.stringify([origin.list, origin.field]);
		const lead = leads.get(key) ?? { origin, copies: [] };
		leads.set(key, lead);
		lead.copies.push(effect);
	}
	return provenance(splitFrom, leadFrom, renamedFrom, [
		...effects.filter((effect): effect is SegmentEffect | AliasEffect => effect.kind === 'segment' || effect.kind === 'alias'),
		...[...leads.values()].map((lead) => leadEffectOf(lead, rules))
	]);
}

export function appendProvenance(inherited: Provenance | undefined, own: Provenance): Provenance {
	if (inherited === undefined) return own;
	return provenance(
		{ ...inherited.splitFrom, ...own.splitFrom },
		{ ...inherited.leadFrom, ...own.leadFrom },
		{ ...inherited.renamedFrom, ...own.renamedFrom },
		[...inherited.bindingEffects, ...own.bindingEffects]
	);
}

function provenance(
	splitFrom: Readonly<Record<string, string>>,
	leadFrom: Readonly<Record<string, string>>,
	renamedFrom: Readonly<Record<string, string>>,
	bindingEffects: readonly BindingEffect[]
): Provenance {
	return {
		splitFrom,
		...(Object.keys(leadFrom).length === 0 ? {} : { leadFrom }),
		...(Object.keys(renamedFrom).length === 0 ? {} : { renamedFrom }),
		bindingEffects
	};
}
