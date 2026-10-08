import { createEngine } from '@sittir/common';
import typescript, { type Statement, type TypescriptAPI } from '../src/index.ts';

type ExportIr = ReturnType<TypescriptAPI['build']['exportStatement']['default']['declaration']>;

async function acceptsRecursiveNodes(items: ExportIr[], statements: Statement.Bound[]): Promise<void> {
	const engine = await createEngine(typescript);
	const { build } = engine;
	build.statementBlock.strict(...items);
	build.statementBlock({ statements: items });
	build.statementBlock.strict(...statements);
	build.statementBlock({ statements });
	build.program({ statements: items });
}

void acceptsRecursiveNodes;
