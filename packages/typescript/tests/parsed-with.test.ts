import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { useRecordConstruction } from '@sittir/common/engine';
import typescript from '../src/index.ts';

const object = await createEngine(typescript, { nodeStorage: 'object' });
const arenaObjects = await createEngine(typescript, { nodeStorage: 'arena' });
const arenaRecords = await createEngine(typescript, { nodeStorage: 'arena' });
type Engine = typeof object;
useRecordConstruction(arenaRecords, await import('../src/factories/records.ts'));

const engines: readonly (readonly [string, Engine])[] = [
	['object storage', object],
	['arena storage, object construction', arenaObjects],
	['arena storage, record construction', arenaRecords]
];

function typeArgument(ts: Engine, source: string, index: number) {
	const declaration = ts.parse(source).statements()[0];
	if (declaration === undefined || !ts.is.typeAliasDeclaration(declaration)) throw new Error('expected a type alias');
	const value = declaration.value();
	if (!ts.is.genericType(value)) throw new Error('expected a generic type');
	const argument = value.typeArguments().types().items()[index];
	if (argument === undefined || !ts.is.typeIdentifier(argument)) throw new Error('expected a type identifier');
	return argument;
}

function fieldName(ts: Engine, source: string) {
	const declaration = ts.parse(source).statements()[0];
	if (declaration === undefined || !ts.is.classDeclaration(declaration)) throw new Error('expected a class');
	const holder = declaration.body().members()[0];
	if (holder === undefined || !ts.is.classBodyMemberDeclaration(holder)) throw new Error('expected a class member');
	const member = holder.member();
	if (!ts.is.publicFieldDefinition(member)) throw new Error('expected a field');
	const name = member.name();
	if (!ts.is.propertyIdentifier(name)) throw new Error('expected a property identifier');
	return name;
}

function editedBody(ts: Engine, source: string, edit: (statements: readonly unknown[]) => readonly unknown[]): string {
	const file = ts.parse(source);
	const declaration = file.statements()[0];
	if (declaration === undefined || !ts.is.functionDeclaration(declaration)) throw new Error('expected a function');
	const body = declaration.body();
	const statements = edit(body.statements()) as Parameters<typeof body.$with.statements>;
	return ts.render(file.$with.statements(declaration.$with.body(body.$with.statements(...statements)))).toString();
}

const moved: readonly (readonly [string, (statements: readonly unknown[]) => readonly unknown[], string])[] = [
	['reversed', (statements) => [...statements].reverse(), 'function f() {\n c()\n b++\n a();\n}\n'],
	['the first dropped', (statements) => statements.slice(1), 'function f() {\n b++\n c() }\n'],
	['the middle dropped', (statements) => [statements[0], ...statements.slice(2)], 'function f() { a();\n c() }\n']
];

describe('a parsed body whose statements move or go renders as it does under object storage', () => {
	for (const [label, ts] of engines) {
		for (const [name, edit, expected] of moved) {
			it(`${label}: ${name}, and the result parses`, () => {
				const text = editedBody(ts, 'function f() { a(); b++\n c() }\n', edit);
				expect(text).toBe(expected);
				expect(ts.parse(text).$errors).toEqual([]);
			});
		}
	}
});

describe('an alias envelope rebuilt around its read content renders as it does under object storage', () => {
	for (const [label, ts] of engines) {
		it(`${label}: a type argument that opens a line renders its bytes`, () => {
			const second = typeArgument(ts, 'type T = A<\n  X,\n  Y,\n>;\n', 1);
			expect(ts.render(second.$with.content(second.content())).toString()).toBe('Y');
		});

		it(`${label}: a leading comment the envelope owns still renders`, () => {
			const second = typeArgument(ts, 'type T = A<\n  X,\n  // c\n  Y,\n>;\n', 1);
			expect(ts.render(second.$with.content(second.content())).toString()).toBe('// c\nY');
		});

		it(`${label}: a padded field name renders without its padding as a render root`, () => {
			const name = fieldName(ts, 'class C {\n  public readonly id = 1\n}\n');
			expect(ts.render(name.$with.content(name.content())).toString()).toBe('id');
		});
	}
});
