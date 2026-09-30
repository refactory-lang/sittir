import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import ts from 'typescript6';

const root = resolve(import.meta.dirname, '../../..');
const grammars = ['rust', 'typescript', 'python'] as const;
const bundlePath = (grammar: string): string => resolve(root, `packages/${grammar}/src/factories/bundle.ts`);

const program = (() => {
	const config = ts.readConfigFile(resolve(root, 'tsconfig.json'), ts.sys.readFile);
	const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
	return ts.createProgram({
		rootNames: grammars.map(bundlePath),
		options: { ...parsed.options, noEmit: true, skipLibCheck: true }
	});
})();
const checker = program.getTypeChecker();

const isArrayLike = (node: ts.TypeNode): boolean =>
	ts.isArrayTypeNode(node) ||
	(ts.isTypeReferenceNode(node) && ['Array', 'ReadonlyArray', 'NonEmptyArray'].includes(node.typeName.getText()));

const spanOfRest = (node: ts.TypeNode): number => {
	if (ts.isParenthesizedTypeNode(node)) return spanOfRest(node.type);
	if (ts.isUnionTypeNode(node)) return Math.max(...node.types.map(spanOfRest));
	if (ts.isTupleTypeNode(node)) {
		const open = node.elements.some(
			(element) => ts.isRestTypeNode(element) || (ts.isNamedTupleMember(element) && element.dotDotDotToken !== undefined)
		);
		return open ? Number.POSITIVE_INFINITY : node.elements.length;
	}
	if (isArrayLike(node)) return Number.POSITIVE_INFINITY;
	const type = checker.getTypeFromTypeNode(node);
	const members = type.isUnion() ? type.types : [type];
	return Math.max(
		...members.map((member) => {
			if (!checker.isTupleType(member)) return Number.POSITIVE_INFINITY;
			const target = (member as ts.TypeReference).target as ts.TupleType;
			return target.hasRestElement ? Number.POSITIVE_INFINITY : target.fixedLength;
		})
	);
};

const widest = (expression: ts.Expression): number => {
	const access = ts.isPropertyAccessExpression(expression) ? expression.name : expression;
	let symbol = checker.getSymbolAtLocation(access);
	if (symbol !== undefined && symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
	const functions = (symbol?.declarations ?? []).filter(ts.isFunctionDeclaration);
	const overloads = functions.some((declaration) => declaration.body === undefined)
		? functions.filter((declaration) => declaration.body === undefined)
		: functions;
	if (overloads.length === 0) throw new Error(`no function declaration behind ${expression.getText()}`);
	return Math.max(
		...overloads.map((declaration) =>
			declaration.parameters.reduce(
				(count, parameter) =>
					count +
					(parameter.dotDotDotToken === undefined ? 1 : parameter.type === undefined ? Number.POSITIVE_INFINITY : spanOfRest(parameter.type)),
				0
			)
		)
	);
};

interface BundledPair {
	readonly name: string;
	readonly strict: ts.Expression;
	readonly coerce: ts.Expression;
	readonly stamp: number | undefined;
}

const bundles = (source: ts.SourceFile): BundledPair[] => {
	const out: BundledPair[] = [];
	for (const statement of source.statements) {
		if (!ts.isVariableStatement(statement)) continue;
		for (const declaration of statement.declarationList.declarations) {
			const call = declaration.initializer;
			if (call === undefined || !ts.isCallExpression(call) || call.expression.getText(source) !== 'bundle') continue;
			const [strict, coerce, stamp] = call.arguments;
			if (strict === undefined || coerce === undefined || coerce.getText(source) === 'undefined') continue;
			const max =
				stamp !== undefined && ts.isObjectLiteralExpression(stamp)
					? stamp.properties.find((property) => property.name?.getText(source) === 'max')
					: undefined;
			const value = max !== undefined && ts.isPropertyAssignment(max) && ts.isNumericLiteral(max.initializer) ? Number(max.initializer.text) : undefined;
			out.push({ name: declaration.name.getText(source), strict, coerce, stamp: value });
		}
	}
	return out;
};

describe.each(grammars)('%s: a loose builder takes exactly the arguments its strict builder takes', (grammar) => {
	it('every bundled kind agrees, and its arity stamp is the loose builder’s widest overload', () => {
		const pairs = bundles(program.getSourceFile(bundlePath(grammar))!);
		const disagreements: string[] = [];
		for (const { name, strict, coerce, stamp } of pairs) {
			const strictMax = widest(strict);
			const looseMax = widest(coerce);
			if (strictMax !== looseMax) disagreements.push(`${name}: strict ${strictMax}, loose ${looseMax}`);
			else if (Number.isFinite(looseMax) && stamp !== looseMax) disagreements.push(`${name}: stamp ${stamp}, widest ${looseMax}`);
		}
		expect(pairs.length).toBeGreaterThan(100);
		expect(disagreements).toEqual([]);
	});
});
