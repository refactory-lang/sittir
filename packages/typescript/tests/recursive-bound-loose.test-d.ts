import { createEngine } from '@sittir/common';
import typescript, { type Statement, type TypescriptAPI } from '../src/index.ts';

type ExportIr = ReturnType<TypescriptAPI['build']['default']['exportStatement']['default']['declaration']>;

async function acceptsRecursiveNodes(items: ExportIr[], statements: Statement.Bound[]): Promise<void> {
	const engine = await createEngine(typescript);
	const { build } = engine;
	const { build: strict } = await createEngine(typescript, { api: 'strict' });
	strict.statementBlock(...items);
	build.statementBlock({ statements: items });
	strict.statementBlock(...statements);
	build.statementBlock({ statements });
	build.program({ statements: items });
}

void acceptsRecursiveNodes;
