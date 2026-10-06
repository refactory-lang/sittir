import { type SourceSpans, createEngine, sourceSpans } from '@sittir/common';
import { isErrorNode, spanOf } from '@sittir/common/utils';
import scm, {
	type AnonymousNode,
	type Definition,
	type GroupExpressionArm,
	type Grouping,
	type ImmediateString,
	type ListElement,
	type NamedNode,
	type NamedNodeExpressionArm,
	type NegatedField,
	type NodeMethodsOf,
	type Predicate,
	type String as QueryString
} from '@sittir/scm';
import {
	type BindingFacts,
	type ClaimFact,
	type ContainerFact,
	type MemberFact,
	type PatternOrigin,
	type PredicateArgument,
	type PredicateFact,
	type SlotSelector,
	type TemplateFact,
	type UnclaimedFact,
	WILDCARD
} from '@sittir/codegen/bindings';
import { loadLanguageForGrammar } from '../validate/common.ts';

const engine = await createEngine(scm);
const { kinds: K } = engine;

type Expression = Definition.Parsed | NegatedField.Parsed | NamedNodeExpressionArm.Parsed | GroupExpressionArm.Parsed;
type PatternNode = NamedNode.Parsed | AnonymousNode.Parsed | Grouping.Parsed;

export interface BindingPattern extends PatternOrigin {
	readonly definition: Definition.Parsed;
}

export interface BindingIssue {
	readonly line: number;
	readonly message: string;
}

export interface CompiledQuery {
	readonly patterns: number;
	readonly captureNames: readonly string[];
}

export class BindingsSyntaxError extends Error {
	constructor(readonly lines: readonly number[]) {
		super(`bindings.scm does not parse at line ${lines.join(', ')}`);
	}
}

interface Visit {
	readonly node: PatternNode;
	readonly field: string | null;
	readonly parent: Visit | null;
	readonly alternative: boolean;
	readonly inherited: readonly ListElement.Parsed[];
	readonly children: Visit[];
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

function definitionsOf(text: string): readonly Definition.Parsed[] {
	return engine.parse(text, { deep: true }).definitions();
}

export function bindingPatterns(text: string): BindingPattern[] {
	const spans = sourceSpans(text);
	return definitionsOf(text).map((definition) => {
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
	if (v.field !== null || kind !== null) return { field: v.field, kind, after: null };
	const siblings = v.parent?.children ?? [];
	const previous = siblings
		.slice(0, siblings.indexOf(v))
		.filter((sibling) => tokenText(sibling) === null)
		.at(-1);
	return { field: null, kind: null, after: previous === undefined ? null : selector(previous) };
}

function expressionsOf(node: PatternNode, errors: number[]): readonly Expression[] {
	switch (node.$type) {
		case K.NamedNodePlain:
		case K.NamedNodeSupertyped: {
			const group = node.namedNodeGroup();
			if (group === undefined) return [];
			errors.push(...unparsed(group));
			return group.$type === K.NamedNodeGroupChildren
				? group.namedNodeExpressions()
				: [...group.namedNodeExpressions(), group.last()];
		}
		case K.Grouping:
			return node.groupingGroups().map((g) => g.groupExpression());
		case K.AnonymousNode:
			return [];
	}
}

function readPattern(top: PatternNode, errors: number[], inherited: readonly ListElement.Parsed[]): Pattern {
	const nodes: Visit[] = [];
	const predicates: Predicate.Parsed[] = [];
	const visit = (
		node: PatternNode,
		field: string | null,
		parent: Visit | null,
		alternative: boolean,
		inherited: readonly ListElement.Parsed[]
	): Visit => {
		const v: Visit = { node, field, parent, alternative, inherited, children: [] };
		nodes.push(v);
		errors.push(...unparsed(node));
		for (const expression of expressionsOf(node, errors)) place(expression, null, v, false, []);
		return v;
	};
	const place = (
		expression: Expression,
		field: string | null,
		parent: Visit,
		alternative: boolean,
		inherited: readonly ListElement.Parsed[]
	): void => {
		switch (expression.$type) {
			case K.NamedNodePlain:
			case K.NamedNodeSupertyped:
			case K.AnonymousNode:
			case K.Grouping:
				parent.children.push(visit(expression, field, parent, alternative, inherited));
				return;
			case K.FieldDefinition:
				place(expression.definition(), expression.name().$text, parent, alternative, inherited);
				return;
			case K.List:
				for (const option of expression.definitions())
					place(option, field, parent, true, [...inherited, ...expression.elements()]);
				return;
			case K.NamedNodeExpressionArm:
			case K.GroupExpressionArm:
				place(expression.left(), field, parent, alternative, inherited);
				place(expression.right(), field, parent, alternative, inherited);
				return;
			case K.Predicate:
				predicates.push(expression);
				return;
			case K.NegatedField:
			case K.MissingNode:
				return;
		}
	};
	return { top: visit(top, null, null, false, inherited), nodes, predicates };
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

function predicateFact(predicate: Predicate.Parsed): PredicateFact | null {
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

function claimFact(v: Visit, vocab: string, top: Visit, predicates: readonly PredicateFact[]): ClaimFact {
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
	return { vocab, kind, predicates, toplevel, within, fieldLiterals, tokens };
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
	const via: string[] = [];
	for (let cursor: Visit | null = parent; cursor !== null && cursor !== top; cursor = cursor.parent) {
		const kind = kindOf(cursor);
		if (kind !== null) via.push(kind);
	}
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
		for (const name of captures(v)) {
			if (inClaimPosition(name, v === top)) {
				if (isClaim(name, v === top)) facts.claims.push(claimFact(v, name, top, claimPredicates));
			} else if (!name.startsWith('_') && name !== 'element') {
				const member = memberFact(v, name, top, topKind);
				if (member !== null) facts.members.push(member);
			}
		}
	}
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

export function readBindings(text: string): BindingFacts {
	const facts: Facts = { claims: [], members: [], containers: [], templates: [], unclaimed: [] };
	const errors: number[] = [];
	const patterns = bindingPatterns(text);
	if (patterns.length === 0 && text.trim() !== '') errors.push(0);
	for (const { definition, ...origin } of patterns) {
		errors.push(...unparsed(definition));
		for (const [top, inherited] of patternsOf(definition, []))
			patternFacts(readPattern(top, errors, inherited), facts, origin);
	}
	if (errors.length > 0) {
		const spans = sourceSpans(text);
		const lines = new Set(errors.map((offset) => lineOf(text, spans, offset)));
		throw new BindingsSyntaxError([...lines].sort((a, b) => a - b));
	}
	return facts;
}

type Reference = { readonly kind: 'field' | 'node' | 'token'; readonly name: string };

function* referencesIn(expression: Expression): Generator<Reference> {
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

function* groupReferences(node: NamedNode.Parsed): Generator<Reference> {
	const group = node.namedNodeGroup();
	if (group === undefined) return;
	const expressions =
		group.$type === K.NamedNodeGroupChildren
			? group.namedNodeExpressions()
			: [...group.namedNodeExpressions(), group.last()];
	for (const expression of expressions) yield* referencesIn(expression);
}

export async function compileQuery(grammar: string, text: string): Promise<CompiledQuery> {
	const { lang } = await loadLanguageForGrammar(grammar);
	const { Query } = await import('web-tree-sitter');
	const query = new Query(lang, text);
	try {
		return { patterns: query.captureQuantifiers.length, captureNames: [...query.captureNames] };
	} finally {
		query.delete();
	}
}

export async function bindingIssues(grammar: string, text: string): Promise<BindingIssue[]> {
	const { lang } = await loadLanguageForGrammar(grammar);
	const { Query } = await import('web-tree-sitter');
	const issues: BindingIssue[] = [];
	for (const pattern of bindingPatterns(text)) {
		const unknown = new Set<string>();
		for (const { kind, name } of referencesIn(pattern.definition)) {
			const known =
				kind === 'field' ? lang.fieldIdForName(name) !== null : lang.idForNodeType(name, kind === 'node') !== null;
			if (!known) unknown.add(kind === 'token' ? `token "${name}"` : `${kind} ${name}`);
		}
		for (const name of unknown) issues.push({ line: pattern.line, message: `unknown ${name}` });
		if (unknown.size > 0) continue;
		try {
			new Query(lang, pattern.source).delete();
		} catch (e) {
			issues.push({ line: pattern.line, message: e instanceof Error ? e.message : String(e) });
		}
	}
	return issues;
}
