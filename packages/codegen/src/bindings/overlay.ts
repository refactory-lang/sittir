import { childFields, fieldRenameGrammar, fieldRenameIssue, fieldWrapGrammar, fieldWrapIssue, type FieldRename, type FieldWrap, type Split } from '../dsl/bind.ts';
import type { RawGrammar } from '../compiler/types.ts';
import type { GrammarName } from '../grammars.ts';
import { type BindingFacts, type MemberFact, type RefinedClaim, WILDCARD, refineClaims } from './facts.ts';
import type { MemberRoute } from './routes.ts';

export type OverlayEdit = { readonly field: string } | { readonly alias: { readonly from: string; readonly to: string } };

export interface OverlayPatch {
	readonly path: string;
	readonly edit: OverlayEdit;
}

export interface BindingsOverlay {
	readonly patches: ReadonlyMap<string, readonly (readonly OverlayPatch[])[]>;
	readonly renames: Readonly<Record<string, string>>;
	readonly splits: readonly Split[];
}

export interface OverlayResidue {
	readonly cause: string;
	readonly row: string;
}

export interface OverlayReport {
	readonly claims: number;
	readonly members: number;
	readonly aliases: Readonly<Record<string, string>>;
	readonly fieldRenames: readonly FieldRename[];
	readonly fieldWraps: readonly FieldWrap[];
	readonly realizedKinds: readonly string[];
	readonly realizedByParent: readonly string[];
	readonly realizedMembers: readonly string[];
	readonly implicitMembers: readonly string[];
	readonly residue: readonly OverlayResidue[];
}

export interface OverlayInput {
	readonly grammar: GrammarName;
	readonly facts: BindingFacts;
	readonly base: RawGrammar;
	readonly vocabMembers: ReadonlyMap<string, ReadonlySet<string>>;
	readonly routedMembers: ReadonlyMap<string, readonly MemberRoute[]>;
}

const CONTAINER_MEMBER_OVERRIDES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
	rust: { impl_item_body: 'body' }
};

export const boundKindName = (vocab: string, hidden: boolean): string => `${hidden ? '_' : ''}${vocab.split('.').reverse().join('_')}`;

export const memberFieldName = (member: string): string => member.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

type Rule = Record<string, unknown>;
type GrammarRecord = Record<string, unknown>;
type FieldRequest = FieldRename | FieldWrap;

const isRule = (v: unknown): v is Rule => typeof v === 'object' && v !== null && !Array.isArray(v);
const PRECS = new Set(['PREC', 'PREC_LEFT', 'PREC_RIGHT', 'PREC_DYNAMIC']);
const SINGLE = new Set(['OPTIONAL', 'REPEAT', 'REPEAT1', 'FIELD', 'TOKEN', 'IMMEDIATE_TOKEN', 'ALIAS']);
const metaOf = (r: Rule): Rule => (isRule(r.metadata) ? r.metadata : {});
const isLift = (r: Rule): boolean => r.type === 'SYMBOL' && metaOf(r).symbolSource === 'group-lift' && !(isRule(r.annotations) && 'variant' in r.annotations);
const isGroupAlias = (r: Rule): boolean => r.type === 'ALIAS' && metaOf(r).aliasSource === 'visible-group';

function symbolsOf(rule: unknown, out: Set<string> = new Set()): Set<string> {
	if (Array.isArray(rule)) for (const r of rule) symbolsOf(r, out);
	else if (isRule(rule)) {
		if (rule.type === 'SYMBOL' && typeof rule.name === 'string') out.add(rule.name);
		for (const v of Object.values(rule)) symbolsOf(v, out);
	}
	return out;
}

function fieldOfReference(rules: Readonly<Record<string, unknown>>, owner: string, child: string): string | undefined {
	let found: string | undefined;
	const walk = (r: unknown, field: string | undefined): void => {
		if (Array.isArray(r)) return r.forEach((x) => walk(x, field));
		if (!isRule(r)) return;
		if (r.type === 'SYMBOL' && r.name === child && field !== undefined) found = field;
		const inner = r.type === 'FIELD' ? (r.name as string) : field;
		for (const v of Object.values(r)) walk(v, inner);
	};
	walk(rules[owner], undefined);
	return found;
}

const targetKey = (r: FieldRequest): string =>
	'from' in r ? `${r.owner}\u0000field:${r.from}` : `${r.owner}\u0000${'token' in r.target ? `token:${r.target.token}` : `symbol:${r.target.symbol}`}`;
const fieldKey = (r: FieldRequest): string => `${r.owner}\u0000${'from' in r ? r.to : r.field}`;

function sameShapeAs(kinds: readonly string[], members: readonly MemberFact[], routed: ReadonlyMap<string, readonly MemberRoute[]>): readonly string[] {
	const readAsKind = new Set(members.flatMap((m) => (m.route === 'kind' ? [m.kind] : [])));
	const supplied = (kind: string): string =>
		(routed.get(kind) ?? [])
			.map((m) => m.name)
			.sort()
			.join('\0');
	const [first, ...rest] = kinds;
	if (first === undefined) return [];
	const same = (kind: string): boolean => !readAsKind.has(first) && !readAsKind.has(kind) && supplied(kind) === supplied(first);
	return [first, ...rest.filter(same)];
}

export function deriveOverlay(input: OverlayInput): { overlay: BindingsOverlay; report: OverlayReport } {
	const { grammar, facts, base, vocabMembers, routedMembers } = input;
	const rules = base.rules as Record<string, unknown>;
	const ruleNames = new Set(Object.keys(rules));
	const residue: OverlayResidue[] = [];
	const left = (cause: string, row: string): void => {
		residue.push({ cause, row });
	};
	const claims = refineClaims(facts.claims);
	const placed = (c: RefinedClaim): boolean => c.within.length > 0;
	const naming = new Map<string, RefinedClaim>();
	for (const c of claims) if (c.refinement === null && c.kind !== null && c.kind !== WILDCARD && c.toplevel && !placed(c) && !naming.has(c.kind)) naming.set(c.kind, c);
	const kindsOfPath = new Map<string, Set<string>>();
	for (const [kind, c] of naming) (kindsOfPath.get(c.vocab) ?? kindsOfPath.set(c.vocab, new Set()).get(c.vocab)!).add(kind);
	const mergedOfPath = new Map([...kindsOfPath].map(([path, kinds]) => [path, sameShapeAs([...kinds], facts.members, routedMembers)]));

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
		const to = boundKindName(c.vocab, c.kind.startsWith('_'));
		if (placed(c)) {
			if (!c.within.every((w) => ruleNames.has(w))) {
				left('placed claim', row);
				continue;
			}
			const outer = c.within[c.within.length - 1]!;
			const reference = c.within[c.within.length - 2] ?? c.kind;
			const member = CONTAINER_MEMBER_OVERRIDES[grammar]?.[outer] ?? fieldOfReference(rules, outer, reference);
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
			else if (a.kind === a.to || symbolsOf(rules[a.to]).has(a.kind)) realizedByParent.push(`${a.row} (${a.to})`);
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
	const vocabOf = new Map([...naming].map(([kind, c]) => [kind, c.vocab]));
	const realizedMembers: string[] = [];
	const candidates: { row: string; request: FieldRequest }[] = [];
	for (const m of facts.members) {
		const row = `${m.owner}.${m.name}`;
		const vocab = vocabOf.get(m.owner);
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
		if (m.route === 'rename' && m.field !== null) {
			if (m.kind !== null || m.after !== null) {
				left('field shared by several members', row);
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
	const routed = new Set(facts.members.map((m) => `${m.owner}.${m.name}`));
	for (const [owner, vocab] of vocabOf) {
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
	let accepted = candidates.filter(({ row, request }) => {
		if (membersOfTarget.get(targetKey(request))!.size > 1) {
			refuse('one child or token feeds several members', row);
			return false;
		}
		if (targetsOfField.get(fieldKey(request))!.size > 1) {
			refuse('two fields route to one member', row);
			return false;
		}
		return true;
	});
	const issues = new Map<(typeof candidates)[number], string>();
	for (let changed = true; changed; ) {
		changed = false;
		const renameBatch = accepted.flatMap((c) => ('from' in c.request ? [c.request] : []));
		const wrapBatch = accepted.flatMap((c) => ('from' in c.request ? [] : [c.request]));
		for (const candidate of accepted.slice()) {
			const { request } = candidate;
			const issue = 'from' in request ? fieldRenameIssue(checks, request, renameBatch) : fieldWrapIssue(checks, request, wrapBatch);
			if (issue === undefined) continue;
			issues.set(candidate, issue);
			accepted = accepted.filter((c) => c !== candidate);
			changed = true;
		}
	}
	for (const [{ row }, issue] of issues) refuse(issue, row);
	const fieldRenames: FieldRename[] = [];
	const fieldWraps: FieldWrap[] = [];
	const applied = new Set<string>();
	for (const { row, request } of accepted) {
		(implicitRows.has(row) ? implicitMembers : realizedMembers).push(row);
		if (applied.has(targetKey(request))) continue;
		applied.add(targetKey(request));
		if ('from' in request) fieldRenames.push(request);
		else fieldWraps.push(request);
	}

	const patches = overlayPatches(rules, fieldWrapGrammar(fieldRenameGrammar(checks, fieldRenames), fieldWraps).rules as Record<string, unknown>, aliases);
	return {
		overlay: { patches, renames, splits },
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

function overlayPatches(
	before: Record<string, unknown>,
	fielded: Record<string, unknown>,
	aliases: Readonly<Record<string, string>>
): Map<string, OverlayPatch[][]> {
	const liftNames = new Set<string>();
	const collectLifts = (r: unknown): void => {
		if (Array.isArray(r)) r.forEach(collectLifts);
		else if (isRule(r)) {
			if (isLift(r) && typeof r.name === 'string') liftNames.add(r.name);
			Object.values(r).forEach(collectLifts);
		}
	};
	Object.values(before).forEach(collectLifts);
	const roots = Object.keys(before).filter((name) => !liftNames.has(name));

	const pathMode = (root: unknown, patches: readonly OverlayPatch[]): OverlayPatch[] => {
		let node = root;
		while (isRule(node) && PRECS.has(node.type as string)) node = node.content;
		if (!isRule(node) || node.type === 'SEQ' || patches.some((p) => p.path.includes('/') || p.path === '.')) return [...patches];
		const length = Array.isArray(node.members) ? node.members.length : 1;
		return patches.map((p) => ({ ...p, path: String(Number(p.path) - length) }));
	};
	const patchesBetween = (b0: Record<string, unknown>, a0: Record<string, unknown>, site: (b: Rule, a: Rule) => OverlayEdit | undefined): Map<string, OverlayPatch[]> => {
		const out = new Map<string, OverlayPatch[]>();
		const reached = new Set<string>();
		for (const root of roots) {
			const patches: OverlayPatch[] = [];
			const walk = (b: unknown, a: unknown, path: readonly number[]): void => {
				if (!isRule(b) || !isRule(a)) return;
				if (PRECS.has(b.type as string)) return walk(b.content, a.content, path);
				const edit = site(b, a);
				if (edit !== undefined) patches.push({ path: path.length === 0 ? '.' : path.join('/'), edit });
				if (isLift(b)) {
					const name = b.name as string;
					if (reached.has(name)) return;
					reached.add(name);
					return walk(b0[name], a0[name], path);
				}
				if (isGroupAlias(b)) return walk(b.content, a.content, path);
				const inner = a.type === 'FIELD' && b.type !== 'FIELD' ? a.content : a;
				if (Array.isArray(b.members) && isRule(inner) && Array.isArray(inner.members)) b.members.forEach((m, i) => walk(m, (inner.members as unknown[])[i], [...path, i]));
				else if (SINGLE.has(b.type as string) && isRule(inner)) walk(b.content, inner.content, [...path, 0]);
			};
			walk(b0[root], a0[root], []);
			if (patches.length > 0) out.set(root, pathMode(b0[root], patches));
		}
		const unreached = [...liftNames].filter((name) => !reached.has(name) && JSON.stringify(b0[name]) !== JSON.stringify(a0[name]));
		if (unreached.length > 0) throw new Error(`edited group lifts no rule reaches: ${unreached.join(', ')}`);
		return out;
	};

	const fieldPatches = patchesBetween(before, fielded, (b, a) =>
		a.type === 'FIELD' && (b.type !== 'FIELD' || b.name !== a.name) ? { field: a.name as string } : undefined
	);
	const aliasPatches = patchesBetween(fielded, fielded, (b) =>
		b.type === 'SYMBOL' && typeof b.name === 'string' && Object.hasOwn(aliases, b.name) ? { alias: { from: b.name, to: aliases[b.name]! } } : undefined
	);
	const at = (r: unknown): Rule =>
		isRule(r) && (PRECS.has(r.type as string) || isGroupAlias(r)) ? at(r.content) : isRule(r) && isLift(r) ? at(fielded[r.name as string]) : (r as Rule);
	for (const [root, patches] of aliasPatches) {
		const kept = patches.filter((p) => {
			if (p.path === '.') return true;
			let node: unknown = fielded[root];
			for (const segment of p.path.split('/').slice(0, -1)) {
				const r = at(node);
				node = Array.isArray(r.members) ? r.members[Number(segment)] : r.content;
			}
			return at(node).type !== 'ALIAS';
		});
		if (kept.length > 0) aliasPatches.set(root, kept);
		else aliasPatches.delete(root);
	}
	return new Map(
		[...new Set([...fieldPatches.keys(), ...aliasPatches.keys()])]
			.sort()
			.map((kind) => [kind, [fieldPatches.get(kind), aliasPatches.get(kind)].filter((p): p is OverlayPatch[] => p !== undefined)])
	);
}
