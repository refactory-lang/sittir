import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import ts from 'typescript6';

const root = resolve(import.meta.dirname, '../../..');

const program = (grammar: string): ts.Program => {
	const configPath = resolve(root, 'tsconfig.json');
	const config = ts.readConfigFile(configPath, ts.sys.readFile);
	const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
	return ts.createProgram({
		rootNames: [resolve(root, `packages/${grammar}/src/factories/bundle.ts`)],
		options: { ...parsed.options, noEmit: true, skipLibCheck: true }
	});
};

const widest = (checker: ts.TypeChecker, type: ts.Type): number => {
	const counts = type.getCallSignatures().map((signature) => {
		let count = 0;
		for (const parameter of signature.getParameters()) {
			const declaration = parameter.valueDeclaration as ts.ParameterDeclaration | undefined;
			const parameterType = checker.getTypeOfSymbol(parameter);
			if (declaration?.dotDotDotToken === undefined) {
				count += 1;
				continue;
			}
			const members = parameterType.isUnion() ? parameterType.types : [parameterType];
			const spans = members.map((member) => {
				if (!checker.isTupleType(member)) return Number.POSITIVE_INFINITY;
				const target = (member as ts.TypeReference).target as ts.TupleType;
				return target.hasRestElement ? Number.POSITIVE_INFINITY : target.fixedLength;
			});
			count += Math.max(...spans);
		}
		return count;
	});
	return counts.length === 0 ? 0 : Math.max(...counts);
};

const stampsIn = (source: ts.SourceFile): Map<string, number | undefined> => {
	const stamps = new Map<string, number | undefined>();
	for (const statement of source.statements) {
		if (!ts.isVariableStatement(statement)) continue;
		for (const declaration of statement.declarationList.declarations) {
			const call = declaration.initializer;
			if (call === undefined || !ts.isCallExpression(call) || call.expression.getText(source) !== 'bundle') continue;
			const stamp = call.arguments[2];
			const max =
				stamp !== undefined && ts.isObjectLiteralExpression(stamp)
					? stamp.properties.find((property) => property.name?.getText(source) === 'max')
					: undefined;
			const value = max !== undefined && ts.isPropertyAssignment(max) && ts.isNumericLiteral(max.initializer) ? Number(max.initializer.text) : undefined;
			stamps.set(declaration.name.getText(source), value);
		}
	}
	return stamps;
};

describe.each(['rust', 'typescript', 'python'])('%s: a loose builder takes exactly the arguments its strict builder takes', (grammar) => {
	it('every bundled kind agrees, and its arity stamp is the loose builder’s widest overload', () => {
		const built = program(grammar);
		const checker = built.getTypeChecker();
		const source = built.getSourceFile(resolve(root, `packages/${grammar}/src/factories/bundle.ts`))!;
		const module = checker.getSymbolAtLocation(source)!;
		const stamps = stampsIn(source);
		const disagreements: string[] = [];
		let pairs = 0;
		for (const exported of checker.getExportsOfModule(module)) {
			const type = checker.getTypeOfSymbolAtLocation(exported, source);
			const strict = type.getProperty('strict');
			const coerce = type.getProperty('coerce');
			if (strict === undefined || coerce === undefined) continue;
			pairs += 1;
			const strictMax = widest(checker, checker.getTypeOfSymbolAtLocation(strict, source));
			const looseMax = widest(checker, checker.getTypeOfSymbolAtLocation(coerce, source));
			const stamp = stamps.get(exported.name);
			if (strictMax !== looseMax) disagreements.push(`${exported.name}: strict ${strictMax}, loose ${looseMax}`);
			else if (Number.isFinite(looseMax) && stamp !== looseMax) disagreements.push(`${exported.name}: stamp ${stamp}, widest ${looseMax}`);
		}
		expect(pairs).toBeGreaterThan(100);
		expect(disagreements).toEqual([]);
	}, 300_000);
});
