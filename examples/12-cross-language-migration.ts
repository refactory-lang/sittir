import { createEngine } from '@sittir/common';
import typescript from '@sittir/typescript';

const engine = await createEngine(typescript);

const typeMap: Record<string, string> = {
	string: 'str',
	number: 'int',
	boolean: 'bool',
};

/** Read a TypeScript interface and print the equivalent Python dataclass. */
export function interfaceToPythonDataclass(tsSource: string) {
	const program = engine.parse(tsSource);
	const iface = program.statements().find(engine.is.interfaceDeclaration);
	if (iface === undefined) {
		throw new Error('Expected a top-level TypeScript interface declaration.');
	}

	const fields = (iface.body().content().members()?.items() ?? []).flatMap((member) => {
		if (!engine.is.propertySignature(member)) return [];
		const annotation = member.type()?.type();
		const rawType = annotation === undefined ? 'Any' : engine.render(annotation).toString();
		return [`    ${engine.render(member.name())}: ${typeMap[rawType] ?? rawType}`];
	});

	return ['@dataclass', `class ${engine.render(iface.name())}:`, ...(fields.length > 0 ? fields : ['    pass'])].join('\n');
}
