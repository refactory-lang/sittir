// A measurement copy of the overlay derivation, kept runnable as the record of how the binding was measured. Production
// writes packages/<grammar>/grammar.bindings.ts through `sittir tool bindings-inventory --write`
// (packages/codegen/src/bindings/overlay.ts); this script never writes there.
// Derives a bindings overlay from the grammar's bindings.scm against its base grammar and prints every claim and member
// route it does not turn into a grammar change, with the reason.
//   --out <file>   write the overlay module (overlay only, no rows) to <file>
//   --no-aliases   leave alias pairs as mappings
//   --no-splits    leave placed claims as mappings
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readBindings, refineClaims, type RefinedClaim } from '../../../../packages/codegen/src/bindings/index.ts';
import { evaluateGrammar, invoke } from '../../../../packages/tools/src/codegen-surface.ts';
import { grammarPackageDir, type GrammarName } from '../../../../packages/codegen/src/grammars.ts';

const grammar = (process.argv[2] ?? 'rust') as GrammarName;
const flag = (name: string) => process.argv.includes(name);
const dir = grammarPackageDir(grammar);
const HERE = new URL('.', import.meta.url).pathname;

/** Per-grammar overrides of a vocabulary path's bound name. */
const NAME_OVERRIDES: Readonly<Record<string, Readonly<Record<string, string>>>> = {};

/**
 * Per-grammar member names for a placement's container where the vocabulary has none: outer kind → member.
 * Each one is a vocabulary gap.
 */
const CONTAINER_MEMBER_OVERRIDES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
	rust: { impl_item_body: 'body' }
};

/** The bound name of a vocabulary path: its segments reversed, subkind first. The one place the naming lives. */
export const boundName = (vocab: string, hidden: boolean): string =>
	NAME_OVERRIDES[grammar]?.[vocab] ?? `${hidden ? '_' : ''}${vocab.split('.').reverse().join('_')}`;

/** A vocabulary member's field name. */
const fieldNameOf = (member: string): string => member.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

const facts = await readBindings(readFileSync(join(dir, 'bindings.scm'), 'utf8'));
const claims = refineClaims(facts.claims);
const base = await evaluateGrammar(grammar, { unbound: true });
const rules = base.rules as Record<string, unknown>;
const ruleNames = new Set(Object.keys(rules));
const externalNames = new Set(base.externals.flatMap((e) => ('name' in e && typeof e.name === 'string' ? [e.name] : [])));
const supertypeNames = new Set((base.supertypes ?? []).map((s) => (typeof s === 'string' ? s : (s as { name: string }).name)));

// The vocabulary's interface members, by kind path, read from its source so a member name can be checked.
const VOCAB_DIR = join(HERE, '../../../../packages/types/src/vocabulary');
const vocabMembers = new Map<string, Set<string>>();
for (const file of readdirSync(VOCAB_DIR).filter((f) => f.endsWith('.ts'))) {
	let current: Set<string> | undefined;
	for (const line of readFileSync(join(VOCAB_DIR, file), 'utf8').split('\n')) {
		const kind = line.match(/readonly \$kind: '([^']+)'/);
		if (kind) vocabMembers.set(kind[1]!, (current = new Set()));
		else if (/^\s*}/.test(line)) current = undefined;
		else if (current) {
			const member = line.match(/^\s*readonly (\w+)\??:/);
			if (member) current.add(member[1]!);
		}
	}
}

const renames: Record<string, string> = {};
const aliases: Record<string, string> = {};
const fieldRenames: { owner: string; from: string; to: string }[] = [];
const fieldWraps: { owner: string; field: string; target: { symbol: string } | { token: string } }[] = [];
const splits: { kind: string; within: readonly string[]; as: string; containers: readonly { name: string; field: string; baseField: string | null }[] }[] = [];
const placedSplits: { kind: string; within: readonly string[]; as: string; member: string }[] = [];
const residue: { cause: string; row: string }[] = [];
const left = (cause: string, row: string) => residue.push({ cause, row });

// Claims: a plain top-level claim renames its kind; several kinds claiming one path alias to it; a placed claim
// splits its kind by placement; a refinement (the facts' flag) stays a mapping.
const placed = (c: RefinedClaim) => c.within.length > 0;
const plain = claims.filter((c) => c.refinement === null && c.kind !== null && c.kind !== '_' && c.toplevel && !placed(c));
const kindsOfPath = new Map<string, Set<string>>();
for (const c of plain) (kindsOfPath.get(c.vocab) ?? kindsOfPath.set(c.vocab, new Set()).get(c.vocab)!).add(c.kind!);
const realizedKinds: string[] = [];
const wanted: { kind: string; to: string; row: string }[] = [];
const wantedAliases: { kind: string; to: string; row: string }[] = [];
// Kinds claiming their own parent's path: the parent takes the claim, and the arms stay its variants.
const realizedByParent: string[] = [];
for (const c of claims) {
	const row = `${c.kind ?? '(group)'} → ${c.vocab}`;
	if (c.refinement !== null) { left(`${c.refinement} refinement`, row); continue; }
	if (c.kind === null || c.kind === '_') { left(placed(c) ? 'wildcard placement' : 'wildcard claim', row); continue; }
	if (!ruleNames.has(c.kind)) { left('not a base rule', row); continue; }
	const to = boundName(c.vocab, c.kind.startsWith('_'));
	if (placed(c)) {
		if (flag('--no-splits') || !c.within.every((w) => ruleNames.has(w))) { left('placed claim', row); continue; }
		const outer = c.within[c.within.length - 1]!;
		const reference = c.within[c.within.length - 2] ?? c.kind;
		const member = CONTAINER_MEMBER_OVERRIDES[grammar]?.[outer] ?? fieldOfReference(outer, reference);
		if (member === undefined) { left('placement container has no member name', row); continue; }
		placedSplits.push({ kind: c.kind, within: c.within, as: to, member });
		realizedKinds.push(row);
		continue;
	}
	if (!c.toplevel) { left('nested claim', row); continue; }
	if (externalNames.has(c.kind) && flag('--no-externals')) { left('external token', row); continue; }
	if ((kindsOfPath.get(c.vocab)?.size ?? 0) > 1) {
		if (flag('--no-aliases')) { left('alias pair', row); continue; }
		wantedAliases.push({ kind: c.kind, to, row });
		continue;
	}
	if (to === c.kind) { realizedKinds.push(row); continue; }
	wanted.push({ kind: c.kind, to, row });
}
// Renames apply at once, so a name is free when its holder is renamed away; an alias target must be free too.
// Drop the clashing ones until stable.
for (let changed = true; changed; ) {
	changed = false;
	const leaving = new Set(wanted.map((w) => w.kind));
	const taken = (to: string) => ruleNames.has(to) && !leaving.has(to);
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

function fieldOfReference(owner: string, child: string): string | undefined {
	let found: string | undefined;
	const walk = (r: unknown, field: string | undefined): void => {
		if (Array.isArray(r)) return r.forEach((x) => walk(x, field));
		if (!r || typeof r !== 'object') return;
		const rule = r as Record<string, unknown>;
		if (rule.type === 'SYMBOL' && rule.name === child && field !== undefined) found = field;
		const inner = rule.type === 'FIELD' ? (rule.name as string) : field;
		for (const v of Object.values(rule)) walk(v, inner);
	};
	walk(rules[owner], undefined);
	return found;
}

// A split's containers are named by the placement's bound name and the member that holds them.
for (const split of placedSplits) {
	const outer = split.within[split.within.length - 1]!;
	const outerName = Object.hasOwn(renames, outer) ? renames[outer]! : Object.hasOwn(aliases, outer) ? aliases[outer]! : outer;
	splits.push({ kind: split.kind, within: split.within, as: split.as, containers: split.within.slice(0, -1).map((ancestor) => ({ name: `${outerName}_${split.member}`, field: fieldNameOf(split.member), baseField: fieldOfReference(outer, ancestor) ?? null })) });
}

// Members: every declared member becomes a field. A member routed to a whole field renames that field; a member routed
// to an unfielded child, or to a token's presence, wraps the child or the token in a field of the member's name.
type FieldRequest = { owner: string; from: string; to: string } | { owner: string; field: string; target: { symbol: string } | { token: string } };
const vocabOf = new Map(plain.map((c) => [c.kind!, c.vocab]));
const realizedMembers: string[] = [];
const sharedCases: { row: string; owner: string; hosts: string[] }[] = [];
const candidates: { row: string; request: FieldRequest }[] = [];
const grammarForChecks = { ...base, rules } as never;
for (const m of facts.members) {
	const row = `${m.owner}.${m.name}`;
	const vocab = vocabOf.get(m.owner);
	if (vocab !== undefined && vocabMembers.get(vocab)?.has(m.name) === false) { left('member not in the vocabulary', row); continue; }
	const to = fieldNameOf(m.name);
	if (m.route === 'nested') { left('nested route', row); continue; }
	if (m.route === 'presence' && m.via.length > 0) { left('token reached through a child', row); continue; }
	if (m.route === 'rename' && m.field !== null) {
		if (m.kind !== null || m.after !== null) { left('field shared by several members', row); continue; }
		if (to === m.field) { realizedMembers.push(row); continue; }
		candidates.push({ row, request: { owner: m.owner, from: m.field, to } });
		continue;
	}
	// A child or token the bindings leave unfielded may already sit in a field of the enriched base.
	const target = m.route === 'presence' ? { token: m.token } : m.kind !== null ? { symbol: m.kind } : null;
	if (m.route === 'rename' && m.kind === null && m.after !== null) { left('positional child', row); continue; }
	const where: { fields: string[]; unfielded: boolean; mixed: boolean; arm: boolean } = await invoke('bind', 'childFields', grammarForChecks, m.owner, target);
	if (where.arm) { left('the child is an arm of the owner, not a slot', row); continue; }
	if (where.fields.length === 0 && !where.unfielded) { left(target !== null && 'token' in target ? 'token is not on the owner outside a token' : 'child is not on the owner', row); continue; }
	if (where.fields.length > 1 || (where.fields.length === 1 && where.unfielded)) { left('child sits in several fields', row); continue; }
	if (where.fields.length === 1) {
		const field = where.fields[0]!;
		if (field === to) { realizedMembers.push(row); continue; }
		if (where.mixed) { left('field shared by several members', row); continue; }
		candidates.push({ row, request: { owner: m.owner, from: field, to } });
		continue;
	}
	if (target === null) { left('wildcard child with no field', row); continue; }
	candidates.push({ row, request: { owner: m.owner, field: to, target } });
}
// Implicit routes: a vocabulary member with no route in bindings.scm resolves when the owner has an unfielded child
// whose kind spells the member. A rename moves that slot name, so such a child is fielded with the member too.
const implicitMembers: string[] = [];
const implicitRows = new Set<string>();
const routed = new Set(facts.members.map((m) => `${m.owner}.${m.name}`));
for (const [owner, vocab] of vocabOf) {
	for (const member of vocabMembers.get(vocab) ?? []) {
		const child = fieldNameOf(member);
		const row = `${owner}.${member}`;
		if (routed.has(row) || !ruleNames.has(child)) continue;
		const where: { fields: string[]; unfielded: boolean; arm: boolean } = await invoke('bind', 'childFields', grammarForChecks, owner, { symbol: child });
		if (!where.unfielded || where.fields.length > 0) continue;
		if (where.arm) { left('implicit route: the child is an arm of the owner, not a slot', row); continue; }
		implicitRows.add(row);
		candidates.push({ row, request: { owner, field: child, target: { symbol: child } } });
	}
}

const targetKey = (r: FieldRequest) => ('from' in r ? `${r.owner}\u0000field:${r.from}` : `${r.owner}\u0000${'token' in r.target ? `token:${r.target.token}` : `symbol:${r.target.symbol}`}`);
const fieldKey = (r: FieldRequest) => `${r.owner}\u0000${'from' in r ? r.to : r.field}`;
const distinct = (key: (r: FieldRequest) => string, value: (r: FieldRequest) => string) => {
	const n = new Map<string, Set<string>>();
	for (const c of candidates) (n.get(key(c.request)) ?? n.set(key(c.request), new Set()).get(key(c.request))!).add(value(c.request));
	return n;
};
const membersOfTarget = distinct(targetKey, fieldKey);
const targetsOfField = distinct(fieldKey, targetKey);
const refuse = (cause: string, row: string) => left(implicitRows.has(row) ? `implicit route: ${cause}` : cause, row);
let accepted = candidates.filter(({ row, request }) => {
	if (membersOfTarget.get(targetKey(request))!.size > 1) { refuse('one child or token feeds several members', row); return false; }
	if (targetsOfField.get(fieldKey(request))!.size > 1) { refuse('two fields route to one member', row); return false; }
	return true;
});
// A field in a hidden rule several kinds share is edited in place when every kind reaching it asks for the same edit;
// an edit counts only while it is itself accepted, so the batch is narrowed until it agrees with itself.
const issues = new Map<(typeof candidates)[number], string>();
for (let changed = true; changed; ) {
	changed = false;
	const renameBatch = accepted.flatMap((c) => ('from' in c.request ? [c.request] : []));
	const wrapBatch = accepted.flatMap((c) => ('from' in c.request ? [] : [c.request]));
	for (const candidate of accepted.slice()) {
		const { request } = candidate;
		const issue: string | undefined = 'from' in request
			? await invoke('bind', 'fieldRenameIssue', grammarForChecks, request, renameBatch)
			: await invoke('bind', 'fieldWrapIssue', grammarForChecks, request, wrapBatch);
		if (issue === undefined) continue;
		issues.set(candidate, issue);
		accepted = accepted.filter((c) => c !== candidate);
		changed = true;
	}
}
for (const [{ row, request }, issue] of issues) {
	refuse(issue, row);
	if (issue === 'field sits in a hidden rule another kind shares') sharedCases.push({ row, owner: request.owner, hosts: await invoke('bind', 'sharedHosts', grammarForChecks, request) });
}
const applied = new Set<string>();
for (const { row, request } of accepted) {
	(implicitRows.has(row) ? implicitMembers : realizedMembers).push(row);
	if (applied.has(targetKey(request))) continue;
	applied.add(targetKey(request));
	if ('from' in request) fieldRenames.push(request);
	else fieldWraps.push(request);
}

// --clone-shared measures what cloning the shared hidden hosts would cost: each host an owner reaches directly is split
// into a clone of its own for that owner. The clones are never part of the generated binding otherwise.
if (flag('--clone-shared')) {
	const cloned = new Set<string>();
	for (const { owner, hosts } of sharedCases) {
		for (const host of hosts) {
			const key = `${host}\u0000${owner}`;
			if (cloned.has(key) || !symbolsOf(rules[owner]).has(host)) continue;
			cloned.add(key);
			splits.push({ kind: host, within: [owner], as: `${host}_${owner}`, containers: [] });
		}
	}
	console.log(`  --clone-shared: ${cloned.size} hidden hosts cloned for ${sharedCases.length} members`);
}

function symbolsOf(rule: unknown, out: Set<string> = new Set()): Set<string> {
	if (Array.isArray(rule)) for (const r of rule) symbolsOf(r, out);
	else if (rule && typeof rule === 'object') {
		const r = rule as Record<string, unknown>;
		if (r.type === 'SYMBOL' && typeof r.name === 'string') out.add(r.name);
		for (const v of Object.values(r)) symbolsOf(v, out);
	}
	return out;
}

// The grammar changes, as DSL calls at the patch stage. bind.ts's edits stay the one derivation of what changes; the
// generator only finds where: it walks each rule before and after an edit side by side and turns every difference into a
// patch at that position. Enrich's group lifts and visible-group aliases are transparent at the patch stage, as are
// precedence wrappers, so the walk passes through them without a path segment, and a lift's body is patched through the
// first rule reaching it. A variant's arm is a rule of its own at the patch stage (its body is a wire deposit, not a lift
// body), so it is patched under its own name.
type Rule = Record<string, unknown>;
const isRule = (v: unknown): v is Rule => typeof v === 'object' && v !== null && !Array.isArray(v);
const PRECS = new Set(['PREC', 'PREC_LEFT', 'PREC_RIGHT', 'PREC_DYNAMIC']);
const SINGLE = new Set(['OPTIONAL', 'REPEAT', 'REPEAT1', 'FIELD', 'TOKEN', 'IMMEDIATE_TOKEN', 'ALIAS']);
const metaOf = (r: Rule): Record<string, unknown> => (isRule(r.metadata) ? r.metadata : {});
const isLift = (r: Rule) => r.type === 'SYMBOL' && metaOf(r).symbolSource === 'group-lift' && !(isRule(r.annotations) && 'variant' in r.annotations);
const isGroupAlias = (r: Rule) => r.type === 'ALIAS' && metaOf(r).aliasSource === 'visible-group';
const liftNames = new Set<string>();
const collectLifts = (r: unknown): void => {
	if (Array.isArray(r)) r.forEach(collectLifts);
	else if (isRule(r)) {
		if (isLift(r) && typeof r.name === 'string') liftNames.add(r.name);
		Object.values(r).forEach(collectLifts);
	}
};
Object.values(rules).forEach(collectLifts);
const roots = Object.keys(rules).filter((name) => !liftNames.has(name));

type Patch = { path: string; call: string };
// A set whose keys are all plain indices is read flat: a key indexes the members of the first SEQ under the root, and on
// a CHOICE root it indexes inside every arm. The walk's paths mean path mode, where a CHOICE root's index picks the arm.
// A wrapper root's one index is its content in path mode, while flat mode looks inside it. Such a key is written as the
// same position counted from the end, which reads in path mode.
function pathMode(root: unknown, patches: readonly Patch[]): Patch[] {
	let node = root;
	while (isRule(node) && PRECS.has(node.type as string)) node = node.content;
	if (!isRule(node) || node.type === 'SEQ' || patches.some((p) => p.path.includes('/') || p.path === '.')) return [...patches];
	const length = Array.isArray(node.members) ? node.members.length : 1;
	return patches.map((p) => ({ ...p, path: String(Number(p.path) - length) }));
}
function patchesBetween(before: Rule, after: Rule, site: (b: Rule, a: Rule) => string | undefined): Map<string, Patch[]> {
	const out = new Map<string, Patch[]>();
	const reached = new Set<string>();
	for (const root of roots) {
		const patches: Patch[] = [];
		const walk = (b: unknown, a: unknown, path: readonly number[]): void => {
			if (!isRule(b) || !isRule(a)) return;
			if (PRECS.has(b.type as string)) return walk(b.content, a.content, path);
			const call = site(b, a);
			if (call !== undefined) patches.push({ path: path.length === 0 ? '.' : path.join('/'), call });
			if (isLift(b)) {
				const name = b.name as string;
				if (reached.has(name)) return;
				reached.add(name);
				return walk(before[name], after[name], path);
			}
			if (isGroupAlias(b)) return walk(b.content, a.content, path);
			const inner = a.type === 'FIELD' && b.type !== 'FIELD' ? a.content : a;
			if (Array.isArray(b.members) && isRule(inner) && Array.isArray(inner.members)) b.members.forEach((m, i) => walk(m, (inner.members as unknown[])[i], [...path, i]));
			else if (SINGLE.has(b.type as string) && isRule(inner)) walk(b.content, inner.content, [...path, 0]);
		};
		walk(before[root], after[root], []);
		if (patches.length > 0) out.set(root, pathMode(before[root], patches));
	}
	const unreached = [...liftNames].filter((name) => !reached.has(name) && JSON.stringify(before[name]) !== JSON.stringify(after[name]));
	if (unreached.length > 0) throw new Error(`edited group lifts no rule reaches: ${unreached.join(', ')}`);
	return out;
}

const unbound = { ...base, rules } as never;
const fielded = await invoke('bind', 'fieldWrapGrammar', await invoke('bind', 'fieldRenameGrammar', unbound, fieldRenames), fieldWraps);
const fieldedRules = (fielded as { rules: Rule }).rules;
const fieldPatches = patchesBetween(rules as Rule, fieldedRules, (b, a) =>
	a.type === 'FIELD' && (b.type !== 'FIELD' || b.name !== a.name) ? `field(${JSON.stringify(a.name)})` : undefined
);
const aliasPatches = patchesBetween(fieldedRules, fieldedRules, (b) =>
	b.type === 'SYMBOL' && typeof b.name === 'string' && Object.hasOwn(aliases, b.name) ? `alias(sym(${JSON.stringify(b.name)}), sym(${JSON.stringify(aliases[b.name])}))` : undefined
);
// A symbol directly under an ALIAS is already aliased; the walk reaches it, so drop those sites.
for (const [root, patches] of aliasPatches) {
	const kept = patches.filter((p) => {
		if (p.path === '.') return true;
		const parent = p.path.split('/').slice(0, -1);
		let node: unknown = fieldedRules[root];
		const at = (r: unknown): Rule => (isRule(r) && (PRECS.has(r.type as string) || isGroupAlias(r)) ? at(r.content) : isRule(r) && isLift(r) ? at(fieldedRules[r.name as string]) : (r as Rule));
		for (const segment of parent) {
			const r = at(node);
			node = Array.isArray(r.members) ? r.members[Number(segment)] : r.content;
		}
		return at(node).type !== 'ALIAS';
	});
	if (kept.length > 0) aliasPatches.set(root, kept);
	else aliasPatches.delete(root);
}

const q = (v: string) => JSON.stringify(v);
const patchSet = (patches: readonly Patch[]) => `{ ${patches.map((p) => `${q(p.path)}: ${p.call}`).join(', ')} }`;
const patchLines = [...new Set([...fieldPatches.keys(), ...aliasPatches.keys()])].sort().map((kind) => {
	const sets = [fieldPatches.get(kind), aliasPatches.get(kind)].filter((p): p is Patch[] => p !== undefined).map(patchSet);
	return `\t\t${kind}: ${sets.length === 1 ? sets[0] : `[${sets.join(', ')}]`}`;
});
const renameLines = Object.entries(renames).map(([from, to]) => `\t\trename(${q(from)}, ${q(to)})`);
const splitLines = splits.map(
	(s) => `\t\tsplit(${q(s.kind)}, ${q(s.as)}, { within: [${s.within.map(q).join(', ')}], containers: [${s.containers.map((c) => `{ name: ${q(c.name)}, field: ${q(c.field)} }`).join(', ')}] })`
);
const body = `// Generated from bindings.scm by docs/superpowers/probes/grammar-bindings/generate-bindings.mts. Do not edit.
/// <reference path="../codegen/src/dsl/authoring-globals.d.ts" />
import { alias, bindings, field, rename, split } from '../codegen/src/dsl/dsl-authoring.ts';

export default bindings({
	patches: {
${patchLines.join(',\n')}
	},
	renames: [
${renameLines.join(',\n')}
	],
	splits: [
${splitLines.join(',\n')}
	]
});
`;
const outAt = process.argv.indexOf('--out');
if (outAt > 0) writeFileSync(process.argv[outAt + 1]!, body);
const recordAt = process.argv.indexOf('--record');
if (recordAt > 0) writeFileSync(process.argv[recordAt + 1]!, JSON.stringify({ renames, aliases, fieldRenames, fieldWraps, splits }, null, '\t'));
const sites = (m: Map<string, Patch[]>) => [...m.values()].reduce((n, p) => n + p.length, 0);
console.log(`  patch sites: ${sites(fieldPatches)} field (${fieldPatches.size} rules), ${sites(aliasPatches)} alias (${aliasPatches.size} rules)`);

const pct = (n: number, d: number) => `${n}/${d} (${d === 0 ? 0 : Math.round((1000 * n) / d) / 10} %)`;
console.log(`${grammar}: ${Object.keys(renames).length} renames, ${Object.keys(aliases).length} aliases, ${fieldRenames.length} field renames, ${fieldWraps.length} field wraps, ${splits.length} splits`);
console.log(`  claims realized as kinds ${pct(realizedKinds.length + realizedByParent.length, facts.claims.length)} (${realizedByParent.length} by the parent)`);
console.log(`  members realized as field names ${pct(realizedMembers.length, facts.members.length)}; implicit routes fielded ${implicitMembers.length}${implicitMembers.length > 0 ? ` (${implicitMembers.join(', ')})` : ''}`);
const byCause = new Map<string, string[]>();
for (const r of residue) (byCause.get(r.cause) ?? byCause.set(r.cause, []).get(r.cause)!).push(r.row);
for (const [cause, rows] of [...byCause].sort((a, b) => b[1].length - a[1].length)) console.log(`  residue ${String(rows.length).padStart(3)}  ${cause}: ${rows.slice(0, 4).join('; ')}${rows.length > 4 ? '; …' : ''}`);
if (flag('--verbose')) for (const r of residue) console.log(`    ${r.cause}: ${r.row}`);
