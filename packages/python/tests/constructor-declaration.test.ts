import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portable } from '@sittir/common/portable';
import python from '../src/index.ts';

const py = await createEngine(python);
const { kinds } = py;

const constructorsIn = (source: string) => Array.from(py.parse(source).$query().$descendants.ofType(kinds.ConstructorDeclaration));
const functionsIn = (source: string) => Array.from(py.parse(source).$query().$descendants.ofType(kinds.FunctionDefinition));

describe('a python constructor declaration', () => {
	it('reads __init__ in a class body as the constructor, decorated or not, in every function form', () => {
		const [annotated] = constructorsIn('class A:\n    def __init__(self) -> None:\n        pass\n');
		expect(annotated?.returnType()?.$render().toString()).toBe('None');
		const [generic] = constructorsIn('class A:\n    async def __init__[T](self):\n        pass\n');
		expect(generic?.async()).toBe(true);
		expect(generic?.typeParameters()).toBeDefined();
		expect(constructorsIn('class A:\n    @overload\n    def __init__(self):\n        pass\n')).toHaveLength(1);
	});

	it('reads the fixed name as an identifier', () => {
		const source = 'class A:\n def __init__(self): pass';
		expect(Array.from(py.parse(source).$query().$descendants.ofType(kinds.Identifier)).map((node) => (typeof node === 'number' ? node : node.$text()))).toEqual(['A', '__init__', 'self']);
		const [ctor] = constructorsIn(source);
		const [name] = Array.from(ctor!.$query().$children);
		expect(typeof name === 'number' ? name : name?.$type).toBe(kinds.Identifier);
	});

	it('reads __init__ outside a class body, in a method body, or as an attribute as a function or a name', () => {
		const source = 'def __init__(self):\n    pass\nclass A:\n    def m(self):\n        def __init__():\n            pass\n        self.__init__()\n';
		expect(constructorsIn(source)).toHaveLength(0);
		expect(functionsIn(source).map((fn) => fn.name().$text())).toEqual(['__init__', '__init__']);
		const [attribute] = Array.from(py.parse(source).$query().$descendants.ofType(kinds.Attribute));
		expect(attribute?.property().$type).toBe(kinds.Identifier);
		expect(attribute?.property().$text()).toBe('__init__');
	});

	it("queries the constructor, a method and a function each by its own portable kind, function_definition's claim stopping at the constructor", () => {
		const nodes = py.parse('class A:\n    def __init__(self):\n        pass\n    def m(self):\n        pass\ndef f():\n    pass\n').$query().$descendants;
		const typesOf = (kind: Parameters<typeof nodes.ofType>[0]) => Array.from(nodes.ofType(kind)).map((node) => (typeof node === 'number' ? node : node.$type));
		expect(typesOf(portable.kinds.declaration.function)).toEqual([kinds.FunctionDefinition]);
		expect(typesOf(portable.kinds.declaration.constructor)).toEqual([kinds.ConstructorDeclaration]);
		expect(typesOf(portable.kinds.declaration.method)).toEqual([kinds.MethodDeclaration]);
	});

	it('builds from its parameters and body with the name stamped, and reads back as itself', () => {
		const [parsed] = constructorsIn('class A:\n    def __init__(self, x):\n        self.x = x\n');
		const built = py.build.constructorDeclaration({ parameters: parsed!.parameters(), body: parsed!.body() });
		const text = built.$render().toString();
		expect(text).toBe('def __init__(self, x):\n    self.x = x');
		const [reread] = constructorsIn(`class A:\n    ${text.replaceAll('\n', '\n    ')}\n`);
		expect(reread?.$render().toString()).toBe(text);
	});
});
