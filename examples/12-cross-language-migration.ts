import { createEngine as createTsEngine, ir as tsIr, is } from '@sittir/typescript';
import { nodeText } from './helpers.ts';

const typeMap: Record<string, string> = {
	string: 'str',
	number: 'int',
	boolean: 'bool',
};

export function interfaceToPythonDataclass(tsSource: string) {
	const tsEngine = createTsEngine();
	const program = tsEngine.parse(tsSource);
	const ifaceNode = (program.$children ?? []).find(is.interfaceDeclaration);
	if (!ifaceNode) {
		throw new Error('Expected a top-level TypeScript interface declaration.');
	}
	const iface = ifaceNode as ReturnType<typeof tsIr.interfaceDeclaration>;

	const fields = iface.body().$children.filter(is.propertySignature).map((member) => {
		const typedMember = member as ReturnType<typeof tsIr.propertySignature>;
		const name = nodeText(typedMember.name());
		const rawType = typedMember.type()?.type().$render() ?? 'Any';
		const pyType = typeMap[rawType] ?? rawType;
		return `    ${name}: ${pyType}`;
	});

	return [
		'@dataclass',
		`class ${iface.name().$render()}:`,
		...(fields.length > 0 ? fields : ['    pass']),
	].join('\n');
}
