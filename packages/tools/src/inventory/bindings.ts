import { type ByteSpan, type SourceSpans, createEngine, sourceSpans } from '@sittir/common';
import { ERROR_KIND_ID } from '@sittir/common/utils';
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
import { loadLanguageForGrammar } from '../validate/common.ts';

const engine = await createEngine(scm);
const { kinds: K } = engine;

type Expression = Definition.Parsed | NegatedField.Parsed | NamedNodeExpressionArm.Parsed | GroupExpressionArm.Parsed;
type PatternNode = NamedNode.Parsed | AnonymousNode.Parsed | Grouping.Parsed;

export const WILDCARD = '_';

export interface SlotSelector {
	readonly field: string | null;
	readonly kind: string | null;
}

export interface ClaimFact {
	readonly vocab: string;
	readonly kind: string | null;
	readonly predicate: boolean;
	readonly toplevel: boolean;
	readonly fieldLiterals: Readonly<Record<string, string>>;
	readonly tokens: readonly string[];
}

export type MemberFact =
	| { readonly route: 'rename'; readonly owner: string; readonly key: string; readonly name: string }
	| { readonly route: 'presence'; readonly owner: string; readonly name: string; readonly via: readonly string[] }
	| ({
			readonly route: 'nested';
			readonly owner: string;
			readonly name: string;
			readonly parent: string;
			readonly multiple: boolean;
			readonly via: readonly string[];
	  } & SlotSelector);

export interface ContainerCapture extends SlotSelector {
	readonly name: string;
	readonly token: boolean;
	readonly multiple: boolean;
}

export interface ContainerFact {
	readonly kind: string;
	readonly element: SlotSelector;
	readonly captures: readonly ContainerCapture[];
}

export interface TemplateFact {
	readonly vocabs: readonly string[];
	readonly target: string;
	readonly template: string;
	readonly holes: readonly string[];
}

export interface BindingFacts {
	readonly claims: readonly ClaimFact[];
	readonly members: readonly MemberFact[];
	readonly containers: readonly ContainerFact[];
	readonly templates: readonly TemplateFact[];
}

export interface BindingPattern {
	readonly line: number;
	readonly source: string;
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
}

function stringValue(node: QueryString.Parsed | ImmediateString.Parsed): string {
	return (node.stringContent()?.contents() ?? [])
		.map((piece) => (piece.$type === K.EscapeSequence ? piece.content() : piece.$text))
		.join('');
}

const isByteSpan = (value: unknown): value is ByteSpan =>
	typeof value === 'object' &&
	value !== null &&
	'start' in value &&
	'end' in value &&
	typeof value.start === 'number' &&
	typeof value.end === 'number';

function spanOf(node: object): ByteSpan {
	if ('$span' in node && isByteSpan(node.$span)) return node.$span;
	throw new Error('bindings.scm: a parsed node carries no span');
}

function lineOf(text: string, spans: SourceSpans, offset: number): number {
	const index = spans.toIndices({ start: offset, end: offset }).start;
	let line = 1;
	for (let i = text.indexOf('\n'); i !== -1 && i < index; i = text.indexOf('\n', i + 1)) line += 1;
	return line;
}

function unparsed(node: NodeMethodsOf): number[] {
	const trivia: readonly unknown[] = [...node.$trivia.leading(), ...node.$trivia.trailing()];
	return trivia.flatMap((item) =>
		typeof item === 'object' && item !== null && '$type' in item && item.$type === ERROR_KIND_ID
			? [spanOf(item).start]
			: []
	);
}

function definitionsOf(text: string): readonly Definition.Parsed[] {
	return engine.parse(text, { deep: true }).definitions();
}

export function bindingPatterns(text: string): BindingPattern[] {
	const spans = sourceSpans(text);
	return definitionsOf(text).map((definition) => {
		const span = spanOf(definition);
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
const isPath = (capture: string): boolean => capture.includes('.');
const TOKEN_CLASSES: ReadonlySet<string> = new Set(['keyword', 'punctuation']);
const inClaimPosition = (capture: string, atTop: boolean): boolean =>
	isPath(capture) || (atTop && !capture.startsWith('_'));
const isTokenClass = (capture: string): boolean => TOKEN_CLASSES.has(capture.split('.')[0] ?? capture);
const isClaim = (capture: string, atTop: boolean): boolean => inClaimPosition(capture, atTop) && !isTokenClass(capture);
const selector = (v: Visit): SlotSelector => ({ field: v.field, kind: namedKind(v) });

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

function claimFact(v: Visit, vocab: string, top: Visit, predicate: boolean): ClaimFact {
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
	const toplevel = v === top || (isGroup(top) && v.parent === top);
	return { vocab, kind, predicate, toplevel, fieldLiterals, tokens };
}

function memberFact(v: Visit, name: string, top: Visit, topKind: string | null): MemberFact | null {
	const parent = v.parent;
	if (parent === null || isGroup(parent)) return null;
	const owner = kindOf(parent);
	if (owner === null) return null;
	const token = tokenText(v) !== null;
	if (parent === top || topKind === null) {
		if (token && v.field === null) return { route: 'presence', owner, name, via: [] };
		const key = v.field ?? kindOf(v);
		return key === null ? null : { route: 'rename', owner, key, name };
	}
	const via: string[] = [];
	for (let cursor: Visit | null = parent; cursor !== null && cursor !== top; cursor = cursor.parent) {
		const kind = kindOf(cursor);
		if (kind !== null) via.push(kind);
	}
	if (token) return { route: 'presence', owner: topKind, name, via };
	return { route: 'nested', owner: topKind, name, parent: owner, multiple: quantified(v), via, ...selector(v) };
}

function containerFact(kind: string, element: Visit, nodes: readonly Visit[]): ContainerFact {
	return {
		kind,
		element: selector(element),
		captures: nodes.flatMap((v) =>
			captures(v)
				.filter((name) => name !== 'element' && !name.startsWith('_'))
				.map((name) => ({ name, token: tokenText(v) !== null, multiple: quantified(v), ...selector(v) }))
		)
	};
}

function patternFacts({ top, nodes, predicates }: Pattern, facts: Facts): void {
	const topKind = kindOf(top);
	const element = nodes.find((v) => captures(v).includes('element'));
	if (topKind !== null && element !== undefined && !captures(top).some((name) => isPath(name) && !isTokenClass(name))) {
		facts.containers.push(containerFact(topKind, element, nodes));
		return;
	}
	const vocabs = nodes.flatMap((v) => captures(v).filter((name) => isPath(name) && !isTokenClass(name)));
	for (const predicate of predicates) {
		const template = templateOf(predicate);
		if (template !== null) facts.templates.push({ vocabs, ...template });
	}
	const predicated = predicates.length > 0;
	for (const v of nodes) {
		for (const name of captures(v)) {
			if (inClaimPosition(name, v === top)) {
				if (isClaim(name, v === top)) facts.claims.push(claimFact(v, name, top, predicated));
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
	const facts: Facts = { claims: [], members: [], containers: [], templates: [] };
	const errors: number[] = [];
	const definitions = definitionsOf(text);
	if (definitions.length === 0 && text.trim() !== '') errors.push(0);
	for (const definition of definitions) {
		errors.push(...unparsed(definition));
		for (const [top, inherited] of patternsOf(definition, [])) patternFacts(readPattern(top, errors, inherited), facts);
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
