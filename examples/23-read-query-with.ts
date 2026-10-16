import python from '@sittir/python';

const py = await python.createEngine();
const { kinds } = py;

/**
 * Read: each accessor returns a wrapped child, read lazily one level at a
 * time. Lists the top-level functions and classes, and each class's methods.
 * A class body is one of several suite forms, so reading into it narrows the
 * form first with the variant's guard.
 */
export function outline(source: string) {
	return py
		.parse(source)
		.statements()
		.flatMap((statement) => {
			if (py.is.functionDefinition(statement)) return [`def ${statement.name().$text}`];
			if (!py.is.classDefinition(statement)) return [];
			const body = statement.body();
			const members = py.is.suite.block(body) ? body.block().statements() : [];
			const methods = members.flatMap((member) =>
				py.is.functionDefinition(member) ? [`  def ${member.name().$text}`] : []
			);
			return [`class ${statement.name().$text}`, ...methods];
		});
}

/**
 * Query: `$descendants` walks every structural node under a node, at any
 * depth. `ofType` and `where` run in the native walk, so only the calls whose
 * `function` slot reads `callee` are hydrated.
 */
export function callsTo(source: string, callee: string) {
	return Array.from(
		py
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
		py
			.parse(source)
			.$query()
			.$descendants.ofType(kinds.FunctionDefinition)
			.where((fn) => fn.name.match(/^_/).and(fn.name.match(/^__/).not()))
			.map((fn) => fn.name().$text)
	);
}

/**
 * Query: `$children` takes one level, `$descendants` every level, and `find`
 * stops the walk at the first match. The class's functions are found without
 * narrowing the body's suite form, including any function nested in a method.
 */
export function methodsOf(source: string, className: string) {
	const cls = py
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
			.map((fn) => fn.name().$text)
	);
}

/**
 * Query: `py.query` returns the facet of any node; a slot on the facet is
 * a view of what the slot's accessor returns. A parameter list's children are
 * its parameters.
 */
export function parameterTexts(source: string, name: string) {
	const fn = py
		.parse(source)
		.$query()
		.$descendants.ofType(kinds.FunctionDefinition)
		.where((candidate) => candidate.name.eq(name))
		.find();
	const list = fn?.$query().parameters.find()?.elements();
	if (list === undefined) return [];
	return [...py.query(list).$children].map((parameter) => py.render(parameter).toString());
}

/**
 * With: `$with.<slot>(value)` returns a copy with one slot replaced. Every
 * child the edit did not touch renders the bytes it was read from.
 */
export function renameFunction(source: string, from: string, to: string) {
	const fn = py
		.parse(source)
		.$query()
		.$descendants.ofType(kinds.FunctionDefinition)
		.where((candidate) => candidate.name.eq(from))
		.find();
	return fn?.$with.name(py.build.identifier(to));
}

/**
 * With: an edited child goes back into its parent through the parent's
 * `$with`, so the whole file renders with only the renamed function's name
 * changed.
 */
export function renameInFile(source: string, from: string, to: string) {
	const root = py.parse(source);
	const statements = root
		.statements()
		.map((statement) =>
			py.is.functionDefinition(statement) && statement.name().$text === from
				? statement.$with.name(py.build.identifier(to))
				: statement
		);
	return root.$with.statements(...statements);
}
