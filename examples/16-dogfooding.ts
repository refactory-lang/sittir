import { createEngine } from '@sittir/common';
import typescript from '@sittir/typescript';

const engine = await createEngine(typescript);

interface GrammarModel {
	kinds: string[];
}

function pascalCase(value: string) {
	return value
		.split(/[_-]/u)
		.filter(Boolean)
		.map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
		.join('');
}

export function emitIsModule(grammar: GrammarModel): string {
	const [first, ...rest] = grammar.kinds.map((kind) =>
		engine.build.propertySignature({
			name: `is${pascalCase(kind)}`,
			type: { type: 'boolean' },
		}),
	);
	return engine.build.program({
		statements: [
			engine.build.interfaceDeclaration({
				name: 'IsGuards',
				body: engine.build.objectType.curly(first === undefined ? {} : { members: engine.build.objectTypeContent(first, ...rest) }),
			}),
		],
	}).$render();
}
