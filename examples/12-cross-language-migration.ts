import typescript from '@sittir/typescript';

const ts = await typescript.createEngine();

const typeMap: Record<string, string> = {
	string: 'str',
	number: 'int',
	boolean: 'bool',
};

/** Read a TypeScript interface and print the equivalent Python dataclass. */
export function interfaceToPythonDataclass(tsSource: string) {
	const program = ts.parse(tsSource);
	const iface = program.statements().find(ts.is.interfaceDeclaration);
	if (iface === undefined) {
		throw new Error('Expected a top-level TypeScript interface declaration.');
	}

	const fields = (iface.body().content().members()?.items() ?? []).flatMap((member) => {
		if (!ts.is.propertySignature(member)) return [];
		const annotation = member.type()?.type();
		const rawType = annotation === undefined ? 'Any' : ts.render(annotation).toString();
		return [`    ${ts.render(member.name())}: ${typeMap[rawType] ?? rawType}`];
	});

	return ['@dataclass', `class ${ts.render(iface.name())}:`, ...(fields.length > 0 ? fields : ['    pass'])].join('\n');
}
