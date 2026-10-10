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
	NodeMethodsOf,
	Predicate,
	ScmAPI,
	String as QueryString
} from '@sittir/scm';
import { loadPinnedScm, type PinnedScm } from '../scm/pinned.ts';
import {
	type Anchor,
	type BindingFacts,
	type BindingPattern,
	type BindingsRoundTrip,
	type PatternReference,
	type ClaimFact,
	type ContainerFact,
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

type Kinds = Awaited<ReturnType<PinnedScm['scm']['default']['load']>>['kinds'];
type Engine = LanguageEngine<ScmAPI>;

let K: Kinds;
let engine: Engine;
let sourceSpans: PinnedScm['common']['sourceSpans'];
let isErrorNode: PinnedScm['utils']['isErrorNode'];
let spanOf: PinnedScm['utils']['spanOf'];
let loaded: Promise<void> | undefined;

function ready(): Promise<void> {
	loaded ??= (async () => {
		const pinned = await loadPinnedScm();
		K = (await pinned.scm.default.load()).kinds;
		engine = await pinned.common.createEngine(pinned.scm.default);
		({ sourceSpans } = pinned.common);
		({ isErrorNode, spanOf } = pinned.utils);
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
	readonly parent: Visit | null;
	readonly alternative: boolean;
	readonly inherited: readonly ListElement.Parsed[];
	readonly children: Visit[];
}

interface Anchored {
	readonly expression: Expression;
	readonly anchor: Anchor | null;
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


function unparsed(node: NodeMethodsOf): number[] {
	const trivia: readonly unknown[] = [...node.$trivia.leading(), ...node.$trivia.trailing()];
	return trivia.flatMap((item) => {
		const span = isErrorNode(item) ? spanOf(item) : undefined;
		return span === undefined ? [] : [span.start];
	});
}

async function definitionsOf(text: string): Promise<readonly Definition.Parsed[]> {
	await ready();
	return engine.parse(text, { depth: Infinity }).definitions();
}

async function parsedPatterns(text: string): Promise<ParsedPattern[]> {
	const definitions = await definitionsOf(text);
	const spans = sourceSpans(text);
	return definitions.map((definition) => {
		const span = spanOf(definition);
		if (span === undefined) throw new Error('bindings.scm: a parsed definition carries no span');
		return { line: lineOf(text, spans, span.start), source: spans.slice(span), definition };
	});
}

function captures(v: Visit): string[] {
	return [...v.node.elements(), ...v.inherited].flatMap((e) => (e.$type === K.Capture ? [e.name().$text] : []));
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

function selector(v: Visit): SlotSelector {
	const kind = namedKind(v);
	if (v.field !== null || kind !== null) return { field: v.field, kind, after: null, anchor: v.anchor };
	const siblings = v.parent?.children ?? [];
	const previous = siblings
		.slice(0, siblings.indexOf(v))
		.filter((sibling) => tokenText(sibling) === null)
		.at(-1);
	return { field: null, kind: null, after: previous === undefined ? null : selector(previous), anchor: v.anchor };
}

function refuse(origin: PatternOrigin, reason: string): never {
	throw new Error(`bindings.scm line ${origin.line}: ${reason}`);
}

const SIBLING_ANCHOR = 'an anchor between siblings ties them together, which no step below a claim expresses';

function anchorAt(group: NamedNodeGroup.Parsed, index: number, count: number, origin: PatternOrigin): Anchor | null {
	const first = index === 0 && group.anchor() === true;
	const last = index === count - 1 && group.$type === K.NamedNodeGroupAnchoredLast;
	if (first && last) refuse(origin, 'an anchor on both sides of a parent\'s only child pins no single step');
	return first ? 'first' : last ? 'last' : null;
}

function expressionsOf(node: PatternNode, errors: number[], origin: PatternOrigin): readonly Anchored[] {
	switch (node.$type) {
		case K.NamedNodePlain:
		case K.NamedNodeSupertyped: {
			const group = node.namedNodeGroup();
			if (group === undefined) return [];
			errors.push(...unparsed(group));
			const expressions =
				group.$type === K.NamedNodeGroupChildren
					? group.namedNodeExpressions()
					: [...group.namedNodeExpressions(), group.last()];
			return expressions.map((expression, i) => ({ expression, anchor: anchorAt(group, i, expressions.length, origin) }));
		}
		case K.Grouping: {
			const groups = node.groupingGroups();
			if (groups.some((g) => g.anchor() === true)) refuse(origin, SIBLING_ANCHOR);
			return groups.map((g) => ({ expression: g.groupExpression(), anchor: null }));
		}
		case K.AnonymousNode:
			return [];
	}
}

function readPattern(top: PatternNode, errors: number[], inherited: readonly ListElement.Parsed[], origin: PatternOrigin): Pattern {
	const nodes: Visit[] = [];
	const predicates: Predicate.Parsed[] = [];
	const visit = (
		node: PatternNode,
		field: string | null,
		anchor: Anchor | null,
		parent: Visit | null,
		alternative: boolean,
		inherited: readonly ListElement.Parsed[]
	): Visit => {
		const v: Visit = { node, field, anchor, parent, alternative, inherited, children: [] };
		nodes.push(v);
		errors.push(...unparsed(node));
		for (const { expression, anchor } of expressionsOf(node, errors, origin)) place(expression, null, anchor, v, false, []);
		return v;
	};
	const place = (
		expression: Expression,
		field: string | null,
		anchor: Anchor | null,
		parent: Visit,
		alternative: boolean,
		inherited: readonly ListElement.Parsed[]
	): void => {
		switch (expression.$type) {
			case K.NamedNodePlain:
			case K.NamedNodeSupertyped:
			case K.AnonymousNode:
			case K.Grouping:
				parent.children.push(visit(expression, field, anchor, parent, alternative, inherited));
				return;
			case K.FieldDefinition:
				place(expression.definition(), expression.name().$text, anchor, parent, alternative, inherited);
				return;
			case K.List:
				for (const option of expression.definitions())
					place(option, field, anchor, parent, true, [...inherited, ...expression.elements()]);
				return;
			case K.NamedNodeExpressionArm:
			case K.GroupExpressionArm:
				return refuse(origin, SIBLING_ANCHOR);
			case K.Predicate:
			case K.NegatedField:
			case K.MissingNode:
				if (anchor !== null) refuse(origin, 'an anchor pins a child node; a predicate, negated field or missing node is none');
				if (expression.$type === K.Predicate) predicates.push(expression);
				return;
		}
	};
	return { top: visit(top, null, null, null, false, inherited), nodes, predicates };
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
	if (at === undefined) return null;
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

function claimFact(
	v: Visit,
	vocab: string,
	top: Visit,
	nodes: readonly Visit[],
	patternPredicates: readonly Omit<PredicateFact, 'subject'>[]
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
		if (text === null || child.alternative) continue;
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
	return { vocab, kind, field: v.field, predicates, toplevel, within, fieldLiterals, tokens };
}

function memberFact(v: Visit, name: string, top: Visit, topKind: string | null): MemberFact | null {
	const parent = v.parent;
	if (parent === null || isGroup(parent)) return null;
	const owner = kindOf(parent);
	if (owner === null) return null;
	const token = tokenText(v);
	if (parent === top || topKind === null) {
		if (token !== null && v.field === null) return { route: 'presence', owner, name, token, via: [] };
		return isGroup(v) && v.field === null ? null : { route: 'rename', owner, name, ...selector(v) };
	}
	const via: SlotSelector[] = [];
	for (let cursor: Visit | null = parent; cursor !== null && cursor !== top; cursor = cursor.parent)
		if (kindOf(cursor) !== null) via.push(selector(cursor));
	if (token !== null) return { route: 'presence', owner: topKind, name, token, via };
	return { route: 'nested', owner: topKind, name, parent: owner, multiple: quantified(v), via, ...selector(v) };
}

function containerFact(
	kind: string,
	element: Visit,
	nodes: readonly Visit[],
	reason: string | null,
	pattern: PatternOrigin
): ContainerFact {
	if (nodes.some((v) => v.anchor !== null)) refuse(pattern, 'a container reads every child of its kind; an anchor would pick one');
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
	for (const v of nodes) {
		const members: MemberFact[] = [];
		for (const name of captures(v)) {
			if (inClaimPosition(name, v === top)) {
				if (isClaim(name, v === top)) {
					refuseAnchoredPlacement(v, name, origin);
					facts.claims.push(claimFact(v, name, top, nodes, claimPredicates));
				}
			} else if (!name.startsWith('_') && name !== 'element') {
				const member: MemberFact | null = kindPresence(members[0], v, name) ?? memberFact(v, name, top, topKind);
				if (member !== null) members.push(member);
			}
		}
		facts.members.push(...slotNamed(members));
	}
}

function refuseAnchoredPlacement(claim: Visit, vocab: string, origin: PatternOrigin): void {
	for (let cursor: Visit | null = claim; cursor !== null; cursor = cursor.parent)
		if (cursor.anchor !== null)
			refuse(origin, `an anchor at ${kindOf(cursor) ?? 'a group'} places the claim @${vocab}; an anchor constrains only a step below the claimed node`);
}

function kindPresence(first: MemberFact | undefined, v: Visit, name: string): MemberFact | null {
	const kind = namedKind(v);
	if (first === undefined || kind === null || first.route === 'presence') return null;
	return { route: 'kind', owner: first.owner, name, member: first.name, kind };
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
	const errors: number[] = [];
	const patterns = await parsedPatterns(text);
	if (patterns.length === 0 && text.trim() !== '') errors.push(0);
	for (const { definition, ...origin } of patterns) {
		errors.push(...unparsed(definition));
		for (const [top, inherited] of patternsOf(definition, []))
			patternFacts(readPattern(top, errors, inherited, origin), facts, origin);
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
