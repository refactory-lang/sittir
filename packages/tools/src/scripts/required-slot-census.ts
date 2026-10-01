import { dirname, resolve } from 'node:path';
import ts from 'typescript6';
import { allGrammars } from '@sittir/codegen/grammars';
import { compileNodeMap, load } from '../codegen-surface.ts';

const root = resolve(import.meta.dirname, '../../../..');

const hasUndefined = (type: ts.Type): boolean =>
	(type.flags & ts.TypeFlags.Undefined) !== 0 || (type.isUnion() && type.types.some((member) => (member.flags & ts.TypeFlags.Undefined) !== 0));

export const admittingSlots = async (grammar: string, includeLoose: boolean): Promise<{ strict: string[]; loose: string[] }> => {
	const { AbstractAssembledCompound, isRequired, slotFilledWhenOmitted } = await load('modelNodeMap');
	const { lexedContentSlot } = await load('emittersShared');
	const nodeMap = await compileNodeMap(grammar);
	const configPath = resolve(root, `packages/${grammar}/tsconfig.json`);
	const parsed = ts.parseJsonConfigFileContent(ts.readConfigFile(configPath, ts.sys.readFile).config, ts.sys, dirname(configPath));
	const rawPath = resolve(root, `packages/${grammar}/src/factories/raw.ts`);
	const probePath = resolve(root, `packages/${grammar}/src/zz-loose-probe.ts`);
	const options = { ...parsed.options, strict: true, noEmit: true };
	const host = ts.createCompilerHost(options);
	const probeLines = [`import type * as T from './types-internal.ts';`];
	const probeIds: string[] = [];
	const readFile = host.readFile.bind(host);
	host.readFile = (name) => (name === probePath ? probeLines.join('\n') : readFile(name));
	host.fileExists = ((exists) => (name: string) => name === probePath || exists(name))(host.fileExists.bind(host));
	const strict: string[] = [];
	const checkProgram = ts.createProgram([rawPath], options, host);
	const checker = checkProgram.getTypeChecker();
	const source = checkProgram.getSourceFile(rawPath)!;
	const builders = new Map<string, ts.FunctionDeclaration>();
	for (const statement of source.statements) {
		if (ts.isFunctionDeclaration(statement) && statement.name?.text.startsWith('build') && !builders.has(statement.name.text)) builders.set(statement.name.text, statement);
	}
	for (const node of nodeMap.nodes.values()) {
		const builder = node.rawFactoryName === undefined ? undefined : builders.get(node.rawFactoryName);
		const param = builder?.parameters[0];
		if (builder === undefined || param === undefined || !(node instanceof AbstractAssembledCompound)) continue;
		const paramType = checker.getTypeAtLocation(param);
		const optionsParam = builder.parameters.find((candidate) => candidate.name.getText(source) === 'options');
		const optionsType = optionsParam === undefined ? undefined : checker.getNonNullableType(checker.getTypeAtLocation(optionsParam));
		const carriedByOptions = (key: string): boolean => optionsType?.getProperty(key) !== undefined;
		const callerSlots = node.configSlots.filter((slot) => !carriedByOptions(slot.configKey));
		for (const slot of callerSlots) {
			if (!isRequired(slot) || slotFilledWhenOmitted(slot, nodeMap)) continue;
			const property = checker.getPropertyOfType(checker.getNonNullableType(paramType), slot.configKey);
			const label = `${node.kind}.${slot.configKey}`;
			if (property === undefined) {
				const directParameter = callerSlots.length === 1 && param.name.getText(source) !== 'config';
				if (!directParameter || param.questionToken !== undefined || hasUndefined(paramType)) strict.push(label);
				continue;
			}
			if ((property.flags & ts.SymbolFlags.Optional) !== 0 || hasUndefined(checker.getTypeOfSymbolAtLocation(property, param))) strict.push(label);
			const affix = node.lexedInterior && slot !== lexedContentSlot(node);
			if (!affix) {
				probeIds.push(label);
				probeLines.push(
					`export const p${probeIds.length}: (undefined extends T.${node.typeName}.LooseConfig['${slot.configKey}'] ? 'U' : 'ok') & ({} extends Pick<T.${node.typeName}.LooseConfig, '${slot.configKey}'> ? 'O' : 'ok') = 'ok' as 'ok';`
				);
			}
		}
	}
	if (!includeLoose) return { strict, loose: [] };
	const probeProgram = ts.createProgram([probePath], options, host);
	const probeFile = probeProgram.getSourceFile(probePath)!;
	const loose = probeProgram
		.getSemanticDiagnostics(probeFile)
		.filter((diagnostic) => diagnostic.code === 2322 && diagnostic.start !== undefined)
		.map((diagnostic) => probeIds[probeFile.getLineAndCharacterOfPosition(diagnostic.start!).line - 1] ?? '?');
	return { strict, loose };
};

if (import.meta.url === `file://${process.argv[1]}`) {
	let failed = false;
	for (const grammar of allGrammars()) {
		const { strict, loose } = await admittingSlots(grammar, true);
		for (const slot of strict) console.error(`${grammar}: strict config admits undefined: ${slot}`);
		for (const slot of loose) console.error(`${grammar}: loose config admits undefined: ${slot}`);
		failed ||= strict.length + loose.length > 0;
	}
	process.exit(failed ? 1 : 0);
}
