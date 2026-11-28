import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import language from '../src/index.ts';

const engines = {
	record: await sharedEngine(() => createEngine(language)),
	object: await sharedEngine(() => createEngine(language, { nodeStorage: 'object' }))
};

describe.each(Object.entries(engines))('%s source file', (_, { build }) => {
	const declaration = () => ({ topLevelDeclaration: build.packageClause({ packageIdentifier: 'main' }), terminator: build.sourceFileText('\n') });
	const statement = () => ({ statement: build.breakStatement(), terminator: build.sourceFileText('\n') });

	it('builds each element from its arm config, the arm told apart by its keys', () => {
		expect(build.sourceFile({ elements: [declaration(), statement()] }).$render()).toBe('package main\nbreak\n');
	});

	it('takes the arm configs through its elements setter', () => {
		expect(build.sourceFile({}).$with.elements(declaration(), statement()).$render()).toBe('package main\nbreak\n');
	});
});
