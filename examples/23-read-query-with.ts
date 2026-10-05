import { createEngine } from '@sittir/common';
import python from '@sittir/python';
import { nodeText } from './helpers.ts';

const engine = await createEngine(python);
const { kinds } = engine;

/**
 * Read: each accessor returns a wrapped child, read lazily one level at a
 * time. Lists the top-level functions and classes, and each class's methods.
 * A class body is one of several suite forms, so reading into it narrows the
 * form first.
 */
export function outline(source: string) {
	return engine
		.parse(source)
		.statements()
		.flatMap((statement) => {
			if (engine.is.functionDefinition(statement)) return [`def ${nodeText(statement.name())}`];
			if (!engine.is.classDefinition(statement)) return [];
			const body = statement.body();
			const members = body.$type === kinds.SuiteBlock ? body.block().statements() : [];
			const methods = members.flatMap((member) =>
				engine.is.functionDefinition(member) ? [`  def ${nodeText(member.name())}`] : []
			);
			return [`class ${nodeText(statement.name())}`, ...methods];
		});
}

/**
 * Query: `$descendants` walks every structural node under a node, at any
 * depth. `ofType` and `where` run in the native walk, so only the calls whose
 * `function` slot reads `callee` are hydrated.
 */
export function callsTo(source: string, callee: string) {
	return Array.from(
		engine
			.parse(source)
			.$query()
			.$descendants.ofType(kinds.Call)
			.where((call) => call.function.eq(callee))
	);
}

/**
 * Query: conditions combine with `and`, `or` and `not`, and `match` tests a
 * slot's text against a pattern. A view is lazy: `map` runs only on what the
 * condition kept.
 */
export function privateHelpers(source: string) {
	return Array.from(
		engine
			.parse(source)
			.$query()
			.$descendants.ofType(kinds.FunctionDefinition)
			.where((fn) => fn.name.match(/^_/).and(fn.name.match(/^__/).not()))
			.map((fn) => nodeText(fn.name()))
	);
}

/**
 * Query: `$children` takes one level, `$descendants` every level, and `find`
 * stops the walk at the first match. The class's functions are found without
 * narrowing the body's suite form, including any function nested in a method.
 */
export function methodsOf(source: string, className: string) {
	const cls = engine
		.parse(source)
		.$query()
		.$children.ofType(kinds.ClassDefinition)
		.where((candidate) => candidate.name.eq(className))
		.find();
	if (cls === undefined) return [];
	return Array.from(
		cls
			.$query()
			.$descendants.ofType(kinds.FunctionDefinition)
			.map((fn) => nodeText(fn.name()))
	);
}

/**
 * Query: `engine.query` returns the facet of any node; a slot on the facet is
 * a view of what the slot's accessor returns. A parameter list's children are
 * its parameters.
 */
export function parameterTexts(source: string, name: string) {
	const fn = engine
		.parse(source)
		.$query()
		.$descendants.ofType(kinds.FunctionDefinition)
		.where((candidate) => candidate.name.eq(name))
		.find();
	const list = fn?.$query().parameters.find()?.elements();
	if (list === undefined) return [];
	return [...engine.query(list).$children].map((parameter) => engine.render(parameter).toString());
}

/**
 * With: `$with.<slot>(value)` returns a copy with one slot replaced. Every
 * child the edit did not touch renders the bytes it was read from.
 */
export function renameFunction(source: string, from: string, to: string) {
	const fn = engine
		.parse(source)
		.$query()
		.$descendants.ofType(kinds.FunctionDefinition)
		.where((candidate) => candidate.name.eq(from))
		.find();
	return fn?.$with.name(engine.build.identifier(to));
}

/**
 * With: an edited child goes back into its parent through the parent's
 * `$with`, so the whole file renders with only the renamed function's name
 * changed.
 */
export function renameInFile(source: string, from: string, to: string) {
	const root = engine.parse(source);
	const statements = root
		.statements()
		.map((statement) =>
			engine.is.functionDefinition(statement) && nodeText(statement.name()) === from
				? statement.$with.name(engine.build.identifier(to))
				: statement
		);
	return root.$with.statements(...statements);
}
