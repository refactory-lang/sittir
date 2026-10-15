import type { SourceSpans } from '@sittir/common';
import type { Engine as LanguageEngine } from '@sittir/types';
import type {
	AnonymousNode,
	Definition,
	GroupExpressionArm,
	Grouping,
	ImmediateString,
	ListElement,
	NamedNode,
	NamedNodeExpressionArm,
	NamedNodeGroup,
	NegatedField,
	Predicate,
	ScmAPI,
	String as QueryString
} from '@sittir/scm';
import type { LeadMatch } from '../dsl/bind.ts';
import { loadPinnedBuild, type PinnedBuild } from '../bootstrap/pinned.ts';
import {
	type Anchor,
	type BindingFacts,
	type BindingPattern,
	type BindingsRoundTrip,
	type PatternReference,
	type ChildFact,
	type ClaimFact,
	type ContainerFact,
	type LeadLeadMatch,
	type MatchRead,
	type MemberFact,
	type PatternOrigin,
	type PredicateArgument,
	type CaptureSite,
	type PredicateFact,
	type SlotSelector,
	type TemplateFact,
	type UnclaimedFact,
	BindingsSyntaxError,
	WILDCARD
} from './facts.ts';

type Kinds = Awaited<ReturnType<PinnedBuild['scm']['default']['load']>>['kinds'];
type Engine = LanguageEngine<ScmAPI>;

let K: Kinds;
let engine: Engine;
let sourceSpans: PinnedBuild['common']['sourceSpans'];
let spanOf: PinnedBuild['utils']['spanOf'];
let loaded: Promise<void> | undefined;

function ready(): Promise<void> {
	loaded ??= (async () => {
		const pinned = await loadPinnedBuild();
		K = (await pinned.scm.default.load()).kinds;
		engine = await pinned.common.createEngine(pinned.scm.default);
		({ sourceSpans } = pinned.common);
		({ spanOf } = pinned.utils);
	})();
	loaded.catch(() => {
		loaded = undefined;
	});
	return loaded;
}

type Expression = Definition.Parsed | NegatedField.Parsed | NamedNodeExpressionArm.Parsed | GroupExpressionArm.Parsed;
type PatternNode = NamedNode.Parsed | AnonymousNode.Parsed | Grouping.Parsed;

interface ParsedPattern extends PatternOrigin {
	readonly definition: Definition.Parsed;
}

interface Visit {
	readonly node: PatternNode;
	readonly field: string | null;
	readonly anchor: Anchor | null;
	readonly adjacent: boolean;
	readonly parent: Visit | null;
	readonly alternation: Expression | null;
	readonly inherited: readonly ListElement.Parsed[];
	readonly children: Visit[];
	readonly negated: NegatedField.Parsed[];
}

interface Anchored {
	readonly expression: Expression;
	readonly anchor: Anchor | null;
	readonly adjacent: boolean;
}

interface Pattern {
	readonly top: Visit;
	readonly nodes: readonly Visit[];
	readonly predicates: readonly Predicate.Parsed[];
}

interface Facts {
	readonly claims: ClaimFact[];
	readonly members: MemberFact[];
	readonly containers: ContainerFact[];
	readonly templates: TemplateFact[];
	readonly unclaimed: UnclaimedFact[];
}

function stringValue(node: QueryString.Parsed | ImmediateString.Parsed): string {
	return (node.stringContent()?.contents() ?? [])
		.map((piece) => (piece.$type === K.EscapeSequence ? piece.content() : piece.$text))
		.join('');
}

function lineOf(text: string, spans: SourceSpans, offset: number): number {
	const index = spans.toIndices({ start: offset, end: offset }).start;
	let line = 1;
	for (let i = text.indexOf('\n'); i !== -1 && i < index; i = text.indexOf('\n', i + 1)) line += 1;
	return line;
}


async function parsedBindings(text: string): Promise<ReturnType<Engine['parse']>> {
	await ready();
	return engine.parse(text, { depth: Infinity });
}

function patternsIn(text: string, root: ReturnType<Engine['parse']>): ParsedPattern[] {
	const spans = sourceSpans(text);
	return root.definitions().map((definition) => {
		const span = spanOf(definition);
		if (span === undefined) throw new Error('bindings.scm: a parsed definition carries no span');
		return { line: lineOf(text, spans, span.start), source: spans.slice(span), definition };
	});
}

async function parsedPatterns(text: string): Promise<ParsedPattern[]> {
	return patternsIn(text, await parsedBindings(text));
}

function captures(v: Visit): string[] {
	return [...v.node.elements(), ...v.inherited].flatMap((e) => (e.$type === K.Capture ? [e.name().$text] : []));
}

function mayBeAbsent(v: Visit): boolean {
	return [...v.node.elements(), ...v.inherited].some(
		(e) => e.$type === K.ListElementQuantifier && (e.quantifier() === K.Star || e.quantifier() === K.Qmark)
	);
}
function quantified(v: Visit): boolean {
	return [...v.node.elements(), ...v.inherited].some(
		(e) => e.$type === K.ListElementQuantifier && (e.quantifier() === K.Star || e.quantifier() === K.Plus)
	);
}

function kindOf(v: Visit): string | null {
	const node = v.node;
	switch (node.$type) {
		case K.NamedNodePlain: {
			const name = node.name();
			return typeof name === 'number' ? WILDCARD : name.$text;
		}
		case K.NamedNodeSupertyped: {
			const name = node.name();
			return name.$type === K.ImmediateIdentifier ? name.$text : stringValue(name);
		}
		case K.AnonymousNode:
			return typeof node.name() === 'number' ? WILDCARD : null;
		case K.Grouping:
			return null;
	}
}

function namedKind(v: Visit): string | null {
	const kind = kindOf(v);
	return kind === WILDCARD ? null : kind;
}

function tokenText(v: Visit): string | null {
	if (v.node.$type !== K.AnonymousNode) return null;
	const name = v.node.name();
	return typeof name === 'number' ? null : stringValue(name);
}

const isGroup = (v: Visit): boolean => v.node.$type === K.Grouping;
const atTop = (v: Visit, top: Visit): boolean => v === top || (isGroup(top) && v.parent === top);
const UNCLAIMED = 'unclaimed';
const DROPPED = 'dropped';
const isPath = (capture: string): boolean => capture.includes('.');
const TOKEN_CLASSES: ReadonlySet<string> = new Set(['keyword', 'punctuation']);
const inClaimPosition = (capture: string, atTop: boolean): boolean =>
	isPath(capture) || (atTop && !capture.startsWith('_'));
const isTokenClass = (capture: string): boolean => TOKEN_CLASSES.has(capture.split('.')[0] ?? capture);
const isClaim = (capture: string, atTop: boolean): boolean => inClaimPosition(capture, atTop) && !isTokenClass(capture);

function placement(v: Visit): SlotSelector {
	const kind = namedKind(v);
	if (v.field !== null || kind !== null) return { field: v.field, kind, after: null, anchor: v.anchor };
	const siblings = v.parent?.children ?? [];
	const previous = siblings
		.slice(0, siblings.indexOf(v))
		.filter((sibling) => tokenText(sibling) === null)
		.at(-1);
	return { field: null, kind: null, after: previous === undefined ? null : placement(previous), anchor: v.anchor };
}

const neighbour = (v: Visit): SlotSelector => ({ ...placement(v), anchor: null });

function selector(v: Visit): SlotSelector {
	const siblings = v.parent?.children ?? [];
	const at = siblings.indexOf(v);
	const previous = v.adjacent ? siblings[at - 1] : undefined;
	const following = siblings[at + 1];
	const next = following?.adjacent === true ? following : undefined;
	const own = placement(v);
	if (previous === undefined && next === undefined) return own;
	return { ...own, adjacent: { ...(previous && { previous: neighbour(previous) }), ...(next && { next: neighbour(next) }) } };
}

const joined = (v: Visit): boolean => v.adjacent || v.parent?.children[v.parent.children.indexOf(v) + 1]?.adjacent === true;

function refuse(origin: PatternOrigin, reason: string): never {
	throw new Error(`bindings.scm line ${origin.line}: ${reason}`);
}

const SIBLING_ANCHOR = 'an anchor between grouped patterns ties siblings that share no parent below a claim';

function anchorAt(group: NamedNodeGroup.Parsed, index: number, count: number): Anchor | null {
	const first = index === 0 && group.anchor() === true;
	const last = index === count - 1 && group.$type === K.NamedNodeGroupAnchoredLast;
	return first && last ? 'only' : first ? 'first' : last ? 'last' : null;
}

type Joined = { readonly expression: Expression; readonly adjacent: boolean };

function joinedOf(expression: Expression): readonly Joined[] {
	if (expression.$type !== K.NamedNodeExpressionArm) return [{ expression, adjacent: false }];
	const [first, ...rest] = joinedOf(expression.right());
	return [...joinedOf(expression.left()), ...(first ? [{ ...first, adjacent: true }, ...rest] : [])];
}

function expressionsOf(node: PatternNode, origin: PatternOrigin): readonly Anchored[] {
	switch (node.$type) {
		case K.NamedNodePlain:
		case K.NamedNodeSupertyped: {
			const group = node.namedNodeGroup();
			if (group === undefined) return [];
			const expressions = (
				group.$type === K.NamedNodeGroupChildren ? group.namedNodeExpressions() : [...group.namedNodeExpressions(), group.last()]
			).flatMap(joinedOf);
			return expressions.map(({ expression, adjacent }, i) => ({ expression, adjacent, anchor: anchorAt(group, i, expressions.length) }));
		}
		case K.Grouping: {
			const groups = node.groupingGroups();
			if (groups.some((g) => g.anchor() === true)) refuse(origin, SIBLING_ANCHOR);
			return groups.map((g) => ({ expression: g.groupExpression(), anchor: null, adjacent: false }));
		}
		case K.AnonymousNode:
			return [];
	}
}

function refuseLooseAnchors(parent: Visit, origin: PatternOrigin): void {
	for (const v of parent.children) {
		if (v.anchor === null && !joined(v)) continue;
		if (tokenText(v) !== null) refuse(origin, 'an anchor next to a token: an anchor names the nodes it ties together');
		if (isGroup(v) || v.alternation !== null) refuse(origin, 'an anchor next to a grouping or an alternation ties no one node');
		if (mayBeAbsent(v)) refuse(origin, 'an anchor next to a node the pattern makes optional ties nothing when the node is absent');
	}
}

function readPattern(top: PatternNode, inherited: readonly ListElement.Parsed[], origin: PatternOrigin): Pattern {
	const nodes: Visit[] = [];
	const predicates: Predicate.Parsed[] = [];
	const visit = (
		node: PatternNode,
		field: string | null,
		anchor: Anchor | null,
		adjacent: boolean,
		parent: Visit | null,
		alternation: Expression | null,
		inherited: readonly ListElement.Parsed[]
	): Visit => {
		const v: Visit = { node, field, anchor, adjacent, parent, alternation, inherited, children: [], negated: [] };
		nodes.push(v);
		for (const { expression, anchor, adjacent } of expressionsOf(node, origin)) place(expression, null, anchor, adjacent, v, null, []);
		refuseLooseAnchors(v, origin);
		return v;
	};
	const place = (
		expression: Expression,
		field: string | null,
		anchor: Anchor | null,
		adjacent: boolean,
		parent: Visit,
		alternation: Expression | null,
		inherited: readonly ListElement.Parsed[]
	): void => {
		switch (expression.$type) {
			case K.NamedNodePlain:
			case K.NamedNodeSupertyped:
			case K.AnonymousNode:
			case K.Grouping:
				parent.children.push(visit(expression, field, anchor, adjacent, parent, alternation, inherited));
				return;
			case K.FieldDefinition:
				place(expression.definition(), expression.name().$text, anchor, adjacent, parent, alternation, inherited);
				return;
			case K.List:
				for (const option of expression.definitions())
					place(option, field, anchor, adjacent, parent, expression, [...inherited, ...expression.elements()]);
				return;
			case K.NamedNodeExpressionArm:
			case K.GroupExpressionArm:
				return refuse(origin, SIBLING_ANCHOR);
			case K.Predicate:
			case K.NegatedField:
			case K.MissingNode:
				if (anchor !== null || adjacent) refuse(origin, 'an anchor pins a child node; a predicate, negated field or missing node is none');
				if (expression.$type === K.Predicate) predicates.push(expression);
				if (expression.$type === K.NegatedField) parent.negated.push(expression);
				return;
		}
	};
	return { top: visit(top, null, null, false, null, null, inherited), nodes, predicates };
}

function templateOf(predicate: Predicate.Parsed): Omit<TemplateFact, 'vocabs'> | null {
	if (predicate.prefix() !== K.Pound || predicate.type() !== K.Qmark || predicate.name().$text !== 'match') return null;
	const [target, regex] = predicate.parameters()?.elements() ?? [];
	if (target?.$type !== K.Capture || regex?.$type !== K.String) return null;
	const rx = stringValue(regex);
	const holes = [...rx.matchAll(/\(\?<(\w+)>/g)].map((m) => m[1] ?? '');
	if (holes.length === 0 || !rx.startsWith('^') || !rx.endsWith('$')) return null;
	return { target: target.name().$text, template: rx.slice(1, -1).replace(/\(\?<\w+>[^)]*\)/g, '${string}'), holes };
}

function predicateFact(predicate: Predicate.Parsed): Omit<PredicateFact, 'subject'> | null {
	if (predicate.prefix() !== K.Pound || predicate.type() !== K.Qmark) return null;
	const parameters = predicate.parameters()?.elements() ?? [];
	const [subject] = parameters;
	const tested = subject?.$type === K.Capture ? subject.name().$text : null;
	return {
		operator: predicate.name().$text,
		capture: tested,
		arguments: parameters.slice(tested === null ? 0 : 1).flatMap((a): PredicateArgument[] => {
			switch (a.$type) {
				case K.Capture:
					return [{ capture: a.name().$text }];
				case K.String:
					return [{ text: stringValue(a) }];
				case K.Identifier:
					return [{ text: a.$text }];
				default:
					return [];
			}
		})
	};
}

function captureSite(claim: Visit, capture: string, nodes: readonly Visit[]): CaptureSite | null {
	const at = nodes.find((v) => captures(v).includes(capture));
	return at === undefined ? null : siteOf(claim, at);
}

function siteOf(claim: Visit, at: Visit): CaptureSite | null {
	let up = 0;
	for (let holder: Visit | null = claim; holder !== null; holder = holder.parent) {
		if (holder !== claim) {
			if (kindOf(holder) === null) continue;
			up++;
		}
		const down: Visit[] = [];
		let cursor: Visit | null = at;
		for (; cursor !== null && cursor !== holder; cursor = cursor.parent) if (!isGroup(cursor)) down.push(cursor);
		if (cursor === holder) return { up, down: down.reverse().map(selector) };
	}
	return null;
}

function leadsToPresence(v: Visit): boolean {
	return (tokenText(v) !== null && captures(v).length > 0) || v.children.some(leadsToPresence);
}

function placesClaim(v: Visit): boolean {
	return captures(v).some((name) => isPath(name) && !isTokenClass(name)) || v.children.some(placesClaim);
}

const capturesMember = (v: Visit): boolean => captures(v).some((name) => !isPath(name) && !name.startsWith('_') && name !== 'element');

const leadsList = (v: Visit): boolean => v.anchor === 'first' && capturesMember(v);

const within = (v: Visit, root: Visit): boolean => {
	for (let cursor: Visit | null = v; cursor !== null; cursor = cursor.parent) if (cursor === root) return true;
	return false;
};

function predicateReason(operator: string): string {
	return operator === 'not-kind-eq' ? 'a negated kind' : operator === 'kind-eq' ? 'a kind predicate' : 'a text test';
}

function matchOf(root: Visit, nodes: readonly Visit[], predicates: readonly Omit<PredicateFact, 'subject'>[]): MatchRead {
	const tested = predicates.find((p) => p.capture !== null && nodes.some((v) => captures(v).includes(p.capture!) && within(v, root)));
	if (tested !== undefined) return { refused: predicateReason(tested.operator) };
	const read = (v: Visit): MatchRead => {
		if (v.children.some((child) => mayBeAbsent(child) || quantified(child))) return { refused: 'a quantifier' };
		if (v.negated.length > 0) return { refused: 'a negated field' };
		if (tokenText(v) !== null) return { refused: 'a text test' };
		const kind = kindOf(v);
		if (kind === WILDCARD) return { refused: 'a wildcard' };
		if (kind === null) return { refused: 'a grouping' };
		const restrictions: Visit[][] = [];
		for (const child of v.children) {
			const group = child.alternation === null ? undefined : restrictions.find((r) => r[0]!.alternation === child.alternation);
			if (group !== undefined) group.push(child);
			else restrictions.push([child]);
		}
		if (restrictions.length > 1) return { refused: 'a second restriction on one kind' };
		const [options] = restrictions;
		if (options === undefined) return { match: { kind } };
		if (options.some((option) => option.field !== options[0]!.field)) return { refused: 'an alternation over two fields' };
		const admits: LeadMatch[] = [];
		for (const option of options) {
			const arm = read(option);
			if ('refused' in arm) return arm;
			admits.push(arm.match);
		}
		return { match: { kind, within: { field: options[0]!.field, admits } } };
	};
	return read(root);
}

function siblingsOf(holder: Visit): readonly Visit[] {
	return holder.children.flatMap((v) =>
		isGroup(v) ? siblingsOf(v) : tokenText(v) !== null || v.alternation !== null || mayBeAbsent(v) ? [] : [v]
	);
}

function childFacts(claim: Visit, origin: PatternOrigin): ChildFact[] {
	const out: ChildFact[] = [];
	const at = (v: Visit): CaptureSite => siteOf(claim, v) ?? refuse(origin, 'a node below the claimed node has no site');
	const walk = (holder: Visit): void => {
		if (!isGroup(holder)) {
			const siblings = siblingsOf(holder);
			if (siblings.length > 1 || siblings.some((v) => v.anchor !== null))
				out.push({ subject: at(holder), siblings: siblings.map((v) => ({ selector: selector(v), bare: v.children.length === 0 })) });
		}
		const seen = new Set<Expression>();
		for (const child of holder.children) {
			if (mayBeAbsent(child) || leadsToPresence(child) || placesClaim(child)) continue;
			if (child.alternation !== null) {
				if (seen.has(child.alternation)) continue;
				seen.add(child.alternation);
				const options = holder.children.filter((c) => c.alternation === child.alternation);
				const kinds = options.map((option) => (option.children.length === 0 ? namedKind(option) : null));
				if (kinds.some((kind) => kind === null))
					refuse(origin, 'an alternation below the claimed node tests only named nodes with nothing below them');
				out.push({ subject: at(child), kinds: kinds as string[], captured: options.some(capturesMember) });
				continue;
			}
			if (isGroup(child)) {
				walk(child);
				continue;
			}
			const text = tokenText(child);
			if (text !== null) {
				if (holder === claim) continue;
				out.push(child.field === null ? { subject: at(holder), token: text } : { subject: at(child), text });
				continue;
			}
			const kind = kindOf(child);
			if (kind !== WILDCARD && kind !== null) out.push({ subject: at(child), kinds: [kind], captured: capturesMember(child) });
			else if (!capturesMember(child)) out.push({ subject: at(child), present: true });
			walk(child);
		}
	};
	walk(claim);
	return out;
}

function claimFact(
	v: Visit,
	vocab: string,
	top: Visit,
	nodes: readonly Visit[],
	patternPredicates: readonly Omit<PredicateFact, 'subject'>[],
	origin: PatternOrigin
): ClaimFact {
	const predicates = patternPredicates.map((p) => ({
		...p,
		subject: p.capture === null ? null : captureSite(v, p.capture, nodes)
	}));
	const first = v.children[0];
	const kind = isGroup(v) ? (first === undefined ? null : kindOf(first)) : kindOf(v);
	const fieldLiterals: Record<string, string> = {};
	const tokens: string[] = [];
	for (const child of v.children) {
		const text = tokenText(child);
		if (text === null || child.alternation !== null) continue;
		if (child.field !== null) {
			if (!isGroup(v)) fieldLiterals[child.field] = text;
		} else if (captures(child).length === 0) tokens.push(text);
	}
	const toplevel = atTop(v, top);
	const within: string[] = [];
	for (let cursor = v.parent; cursor !== null; cursor = cursor.parent) {
		const enclosing = kindOf(cursor);
		if (enclosing !== null) within.push(enclosing);
	}
	const read = isGroup(v) || v.children.length === 0 ? undefined : matchOf(v, nodes, patternPredicates);
	const match = read !== undefined && 'match' in read && read.match.within !== undefined ? { match: read.match } : {};
	return { vocab, kind, field: v.field, predicates, toplevel, within, fieldLiterals, tokens, children: isGroup(v) ? [] : childFacts(v, origin), ...match };
}

function memberFact(
	v: Visit,
	name: string,
	top: Visit,
	topKind: string | null,
	claimed: ReadonlyMap<Visit, readonly number[]>,
	leadMatch: LeadLeadMatch | undefined
): MemberFact | null {
	const parent = v.parent;
	if (parent === null || isGroup(parent)) return null;
	const owner = kindOf(parent);
	if (owner === null) return null;
	const home = claimedHome(parent, top, claimed);
	const homeKind = home === top ? topKind : kindOf(home);
	const direct = parent === home || homeKind === null;
	const claims = claimed.get(direct ? parent : home);
	const of = { ...(claims === undefined ? {} : { claims }), ...(leadMatch === undefined ? {} : { leadMatch }) };
	const token = tokenText(v);
	if (name === DROPPED) return { route: 'dropped', owner, ...selector(v), ...(token === null ? {} : { token }), ...of };
	if (direct) {
		if (token !== null && v.field === null) return { route: 'presence', owner, name, token, via: [], ...of };
		return isGroup(v) && v.field === null ? null : { route: 'rename', owner, name, ...selector(v), ...(token === null ? {} : { token }), ...of };
	}
	const via: SlotSelector[] = [];
	for (let cursor: Visit | null = parent; cursor !== null && cursor !== home; cursor = cursor.parent)
		if (kindOf(cursor) !== null) via.push(selector(cursor));
	if (token !== null) return { route: 'presence', owner: homeKind, name, token, via, ...of };
	return { route: 'nested', owner: homeKind, name, parent: owner, multiple: quantified(v), via, ...selector(v), ...of };
}

function claimedHome(parent: Visit, top: Visit, claimed: ReadonlyMap<Visit, readonly number[]>): Visit {
	for (let cursor: Visit | null = parent; cursor !== null && cursor !== top; cursor = cursor.parent)
		if (claimed.has(cursor)) return cursor;
	return top;
}

function containerFact(
	kind: string,
	element: Visit,
	nodes: readonly Visit[],
	reason: string | null,
	pattern: PatternOrigin
): ContainerFact {
	if (nodes.some((v) => v.anchor !== null || joined(v))) refuse(pattern, 'a container reads every child of its kind; an anchor would pick one');
	return {
		kind,
		element: selector(element),
		captures: nodes.flatMap((v) =>
			captures(v)
				.filter((name) => name !== 'element' && name !== DROPPED && !name.startsWith('_'))
				.map((name) => ({ name, token: tokenText(v), multiple: quantified(v), ...selector(v) }))
		),
		dropped: nodes.filter((v) => captures(v).includes(DROPPED)).map(selector),
		reason,
		pattern
	};
}

function reasonOf(predicates: readonly Predicate.Parsed[]): string | null {
	for (const predicate of predicates) {
		if (predicate.name().$text !== 'set' || predicate.type() !== K.Bang) continue;
		const [key, value] = predicate.parameters()?.elements() ?? [];
		if (key?.$type === K.Identifier && key.$text === 'reason' && value?.$type === K.String) return stringValue(value);
	}
	return null;
}

function patternFacts({ top, nodes, predicates }: Pattern, facts: Facts, origin: PatternOrigin): void {
	const unclaimed = nodes.filter((v) => captures(v).includes(UNCLAIMED));
	if (unclaimed.length > 0) {
		const reason = reasonOf(predicates);
		for (const v of unclaimed) {
			const kind = kindOf(v);
			if (kind !== null) facts.unclaimed.push({ kind, reason });
		}
		return;
	}
	const topKind = kindOf(top);
	const element = nodes.find((v) => captures(v).includes('element'));
	const owners = nodes.filter((v) => atTop(v, top) && !isGroup(v));
	const owner = owners.length === 1 ? owners[0] : undefined;
	const ownerKind = owner === undefined ? null : kindOf(owner);
	if (
		owner !== undefined &&
		ownerKind !== null &&
		element !== undefined &&
		!captures(owner).some((name) => isPath(name) && !isTokenClass(name))
	) {
		facts.containers.push(containerFact(ownerKind, element, nodes, reasonOf(predicates), origin));
		return;
	}
	const vocabs = nodes.flatMap((v) => captures(v).filter((name) => isPath(name) && !isTokenClass(name)));
	for (const predicate of predicates) {
		const template = templateOf(predicate);
		if (template !== null) facts.templates.push({ vocabs, ...template });
	}
	const claimPredicates = predicates.flatMap((p) => predicateFact(p) ?? []);
	const claimed = new Map<Visit, number[]>();
	for (const v of nodes) {
		for (const name of captures(v)) {
			if (!inClaimPosition(name, v === top) || !isClaim(name, v === top)) continue;
			refuseAnchoredPlacement(v, name, origin);
			(claimed.get(v) ?? claimed.set(v, []).get(v))?.push(facts.claims.length);
			facts.claims.push(claimFact(v, name, top, nodes, claimPredicates, origin));
		}
	}
	for (const v of nodes) {
		const members: MemberFact[] = [];
		for (const name of captures(v)) {
			if (inClaimPosition(name, v === top) || name.startsWith('_') || name === 'element') continue;
			const leadMatch = leadsList(v) ? { line: origin.line, ...matchOf(v, nodes, claimPredicates) } : undefined;
			const member: MemberFact | null = kindPresence(members[0], v, name) ?? memberFact(v, name, top, topKind, claimed, leadMatch);
			if (member !== null) members.push(member);
		}
		facts.members.push(...slotNamed(members));
	}
}

function refuseAnchoredPlacement(claim: Visit, vocab: string, origin: PatternOrigin): void {
	for (let cursor: Visit | null = claim; cursor !== null; cursor = cursor.parent)
		if (cursor.anchor !== null || joined(cursor))
			refuse(origin, `an anchor at ${kindOf(cursor) ?? 'a group'} places the claim @${vocab}; an anchor constrains only a step below the claimed node`);
}

function kindPresence(first: MemberFact | undefined, v: Visit, name: string): MemberFact | null {
	const kind = namedKind(v);
	if (first === undefined || kind === null || first.route === 'presence' || first.route === 'dropped') return null;
	return { route: 'kind', owner: first.owner, name, member: first.name, kind, ...(first.claims === undefined ? {} : { claims: first.claims }) };
}

function slotNamed(members: readonly MemberFact[]): readonly MemberFact[] {
	const [first, ...rest] = members;
	if (first?.route !== 'rename' || first.field === null || !rest.some((m) => m.route === 'kind')) return members;
	return [{ ...first, kind: null }, ...rest];
}

function patternsOf(
	definition: Definition.Parsed,
	inherited: readonly ListElement.Parsed[]
): [PatternNode, readonly ListElement.Parsed[]][] {
	switch (definition.$type) {
		case K.NamedNodePlain:
		case K.NamedNodeSupertyped:
		case K.AnonymousNode:
		case K.Grouping:
			return [[definition, inherited]];
		case K.List:
			return definition.definitions().flatMap((option) => patternsOf(option, [...inherited, ...definition.elements()]));
		default:
			return [];
	}
}

export async function readBindingsInProcess(text: string): Promise<BindingFacts> {
	const facts: Facts = { claims: [], members: [], containers: [], templates: [], unclaimed: [] };
	const root = await parsedBindings(text);
	const patterns = patternsIn(text, root);
	const errors = root.$errors.map((region) => region.span.start);
	if (patterns.length === 0 && text.trim() !== '') errors.push(0);
	for (const { definition, ...origin } of patterns) {
		for (const [top, inherited] of patternsOf(definition, []))
			patternFacts(readPattern(top, inherited, origin), facts, origin);
	}
	if (errors.length > 0) {
		const spans = sourceSpans(text);
		const lines = new Set(errors.map((offset) => lineOf(text, spans, offset)));
		throw new BindingsSyntaxError([...lines].sort((a, b) => a - b));
	}
	return facts;
}


function* referencesIn(expression: Expression): Generator<PatternReference> {
	switch (expression.$type) {
		case K.NamedNodePlain: {
			const name = expression.name();
			if (typeof name !== 'number' && name.$text !== 'ERROR') yield { kind: 'node', name: name.$text };
			yield* groupReferences(expression);
			return;
		}
		case K.NamedNodeSupertyped: {
			const name = expression.name();
			yield { kind: 'node', name: expression.supertype().$text };
			yield name.$type === K.ImmediateIdentifier
				? { kind: 'node', name: name.$text }
				: { kind: 'token', name: stringValue(name) };
			yield* groupReferences(expression);
			return;
		}
		case K.AnonymousNode: {
			const name = expression.name();
			if (typeof name !== 'number') yield { kind: 'token', name: stringValue(name) };
			return;
		}
		case K.MissingNode: {
			const name = expression.name();
			if (name === undefined) return;
			yield name.$type === K.Identifier
				? { kind: 'node', name: name.$text }
				: { kind: 'token', name: stringValue(name) };
			return;
		}
		case K.FieldDefinition:
			yield { kind: 'field', name: expression.name().$text };
			yield* referencesIn(expression.definition());
			return;
		case K.NegatedField:
			yield { kind: 'field', name: expression.identifier().$text };
			return;
		case K.List:
			for (const option of expression.definitions()) yield* referencesIn(option);
			return;
		case K.Grouping:
			for (const group of expression.groupingGroups()) yield* referencesIn(group.groupExpression());
			return;
		case K.NamedNodeExpressionArm:
		case K.GroupExpressionArm:
			yield* referencesIn(expression.left());
			yield* referencesIn(expression.right());
			return;
		case K.Predicate:
			return;
	}
}

function* groupReferences(node: NamedNode.Parsed): Generator<PatternReference> {
	const group = node.namedNodeGroup();
	if (group === undefined) return;
	const expressions =
		group.$type === K.NamedNodeGroupChildren
			? group.namedNodeExpressions()
			: [...group.namedNodeExpressions(), group.last()];
	for (const expression of expressions) yield* referencesIn(expression);
}

export async function bindingPatternsInProcess(text: string): Promise<BindingPattern[]> {
	return (await parsedPatterns(text)).map(({ line, source, definition }) => ({ line, source, references: [...referencesIn(definition)] }));
}

export async function roundTripBindingsInProcess(text: string): Promise<BindingsRoundTrip> {
	await ready();
	const root = engine.parse(text);
	return { errors: [...root.$errors], rendered: engine.render(root).toString() };
}
