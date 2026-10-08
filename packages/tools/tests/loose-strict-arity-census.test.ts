import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import ts from 'typescript6';
import { grammarModulePath } from '../src/grammar-internals.ts';

const grammars = ['rust', 'typescript', 'python'] as const;

const parse = (grammar: string, file: 'raw' | 'coerce' | 'bundle'): ts.SourceFile => {
	const path = grammarModulePath(grammar, `factories/${file}.ts`);
	if (path === undefined) throw new Error(`Missing ${file} factories for ${grammar}`);
	return ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
};

const visibleOverloads = (source: ts.SourceFile): Map<string, ts.FunctionDeclaration[]> => {
	const byName = new Map<string, ts.FunctionDeclaration[]>();
	for (const statement of source.statements) {
		if (!ts.isFunctionDeclaration(statement) || statement.name === undefined) continue;
		byName.set(statement.name.text, [...(byName.get(statement.name.text) ?? []), statement]);
	}
	for (const [name, declarations] of byName) {
		const signatures = declarations.filter((declaration) => declaration.body === undefined);
		byName.set(name, signatures.length > 0 ? signatures : declarations);
	}
	return byName;
};

const spanOfRest = (node: ts.TypeNode): number => {
	if (ts.isParenthesizedTypeNode(node)) return spanOfRest(node.type);
	if (ts.isUnionTypeNode(node)) return Math.max(...node.types.map(spanOfRest));
	if (!ts.isTupleTypeNode(node)) return Number.POSITIVE_INFINITY;
	const open = node.elements.some(
		(element) => ts.isRestTypeNode(element) || (ts.isNamedTupleMember(element) && element.dotDotDotToken !== undefined)
	);
	return open ? Number.POSITIVE_INFINITY : node.elements.length;
};

const widest = (overloads: readonly ts.FunctionDeclaration[]): number =>
	Math.max(
		...overloads.map((declaration) =>
			declaration.parameters.reduce(
				(count, parameter) =>
					count +
					(parameter.dotDotDotToken === undefined
						? 1
						: parameter.type === undefined
							? Number.POSITIVE_INFINITY
							: spanOfRest(parameter.type)),
				0
			)
		)
	);

const stampOf = (stamp: ts.Expression | undefined, source: ts.SourceFile): number | undefined => {
	if (stamp === undefined || !ts.isObjectLiteralExpression(stamp)) return undefined;
	const max = stamp.properties.find((property) => property.name?.getText(source) === 'max');
	return max !== undefined && ts.isPropertyAssignment(max) && ts.isNumericLiteral(max.initializer)
		? Number(max.initializer.text)
		: undefined;
};

describe.each(grammars)('%s: a loose builder takes exactly the arguments its strict builder takes', (grammar) => {
	it('every bundled kind agrees, and its arity stamp is the loose builder’s widest overload', () => {
		const bundle = parse(grammar, 'bundle');
		const strictOf = visibleOverloads(parse(grammar, 'raw'));
		const looseOf = visibleOverloads(parse(grammar, 'coerce'));
		const disagreements: string[] = [];
		let pairs = 0;
		for (const statement of bundle.statements) {
			if (!ts.isVariableStatement(statement)) continue;
			for (const declaration of statement.declarationList.declarations) {
				const call = declaration.initializer;
				if (call === undefined || !ts.isCallExpression(call) || call.expression.getText(bundle) !== 'bundle') continue;
				const [strict, coerce, stamp] = call.arguments;
				if (strict === undefined || coerce === undefined || coerce.getText(bundle) === 'undefined') continue;
				const name = declaration.name.getText(bundle);
				const strictOverloads = strictOf.get(strict.getText(bundle).replace(/^F\./, ''));
				const looseOverloads = looseOf.get(coerce.getText(bundle).replace(/^C\./, ''));
				if (strictOverloads === undefined || looseOverloads === undefined) {
					disagreements.push(`${name}: no declaration behind ${strict.getText(bundle)} / ${coerce.getText(bundle)}`);
					continue;
				}
				pairs += 1;
				const strictMax = widest(strictOverloads);
				const looseMax = widest(looseOverloads);
				if (strictMax !== looseMax) disagreements.push(`${name}: strict ${strictMax}, loose ${looseMax}`);
				else if (Number.isFinite(looseMax) && stampOf(stamp, bundle) !== looseMax) {
					disagreements.push(`${name}: stamp ${stampOf(stamp, bundle)}, widest ${looseMax}`);
				}
			}
		}
		expect(pairs).toBeGreaterThan(100);
		expect(disagreements).toEqual([]);
	});
});
