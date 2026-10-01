import { describe, expect, it } from 'vitest';
import { dirname, resolve } from 'node:path';
import ts from 'typescript6';
import { allGrammars } from '@sittir/codegen/grammars';
import { isRequired, registeredSlots } from '../../codegen/src/emitters/shared.ts';
import { buildNodeMap } from '../src/codegen-surface.ts';

const root = resolve(import.meta.dirname, '../../..');

const hasUndefined = (type: ts.Type): boolean =>
	(type.flags & ts.TypeFlags.Undefined) !== 0 || (type.isUnion() && type.types.some((member) => (member.flags & ts.TypeFlags.Undefined) !== 0));

const admittingSlots = async (grammar: string): Promise<string[]> => {
	const nodeMap = await buildNodeMap(grammar);
	const configPath = resolve(root, `packages/${grammar}/tsconfig.json`);
	const parsed = ts.parseJsonConfigFileContent(ts.readConfigFile(configPath, ts.sys.readFile).config, ts.sys, dirname(configPath));
	const rawPath = resolve(root, `packages/${grammar}/src/factories/raw.ts`);
	const program = ts.createProgram([rawPath], { ...parsed.options, strict: true, noEmit: true });
	const checker = program.getTypeChecker();
	const source = program.getSourceFile(rawPath)!;
	const builders = new Map<string, ts.FunctionDeclaration>();
	for (const statement of source.statements) {
		if (ts.isFunctionDeclaration(statement) && statement.name?.text.startsWith('build')) builders.set(statement.name.text, statement);
	}
	const admitting: string[] = [];
	for (const node of nodeMap.nodes.values()) {
		const builder = node.rawFactoryName === undefined ? undefined : builders.get(node.rawFactoryName);
		const param = builder?.parameters[0];
		if (builder === undefined || param === undefined) continue;
		const paramType = checker.getTypeAtLocation(param);
		if (checker.typeToString(paramType).startsWith('Partial<')) continue;
		const carried = new Set(registeredSlots(node));
		const body = builder.body?.getText() ?? '';
		for (const slot of node.slots) {
			if (!isRequired(slot) || carried.has(slot)) continue;
			const defaulted = body.match(new RegExp(`const ${slot.storageKey} = ([\\s\\S]*?);\\n\\t(?:const|if|return)`))?.[1]?.includes('orDefault(') ?? false;
			if (defaulted) continue;
			const property = checker.getPropertyOfType(checker.getNonNullableType(paramType), slot.configKey);
			if (property === undefined) continue;
			if ((property.flags & ts.SymbolFlags.Optional) !== 0 || hasUndefined(checker.getTypeOfSymbolAtLocation(property, param))) {
				admitting.push(`${node.kind}.${slot.configKey}`);
			}
		}
	}
	return admitting;
};

describe.each(allGrammars())('%s: a required slot of a strict config does not admit undefined', (grammar) => {
	it('every required, option-free, non-defaulted slot rejects undefined and an omitted key', async () => {
		expect(await admittingSlots(grammar)).toEqual([]);
	}, 240000);
});
