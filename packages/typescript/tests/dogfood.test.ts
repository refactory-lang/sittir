/**
 * Dogfooding tests: build real TypeScript patterns using the IR API.
 * Validates that the builder API can compose meaningful TypeScript output.
 */
import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';
import { LeafBuilder } from '@sittir/types';

const str = (text: string) => new LeafBuilder('string', text);
const num = (n: number) => new LeafBuilder('number', String(n));
const id = ir.identifier;
const typeId = ir.typeIdentifier;
const predefined = ir.predefinedType;

describe('dogfood: variable declarations', () => {
  it('should render const x = 42', () => {
    const node = ir.lexical(id('const')).children(
      ir.variable_declarator(id('x')).value(num(42)),
    );
    const source = node.renderImpl();
    expect(source).toContain('const');
    expect(source).toContain('x');
    expect(source).toContain('42');
  });

  it('should render let name = "hello"', () => {
    const node = ir.lexical(id('let')).children(
      ir.variable_declarator(id('name')).value(str("'hello'")),
    );
    const source = node.renderImpl();
    expect(source).toContain('let');
    expect(source).toContain('name');
  });
});

describe('dogfood: function declarations', () => {
  it('should render function foo() { }', () => {
    const node = ir.functionDeclaration(id('foo'))
      .parameters(ir.formal_parameters())
      .body(ir.statement_block());
    const source = node.renderImpl();
    expect(source).toContain('function');
    expect(source).toContain('foo');
  });

  it('should render function with return type', () => {
    const node = ir.functionDeclaration(id('greet'))
      .parameters(ir.formal_parameters())
      .returnType(ir.type_annotation(predefined('string')))
      .body(ir.statement_block());
    const source = node.renderImpl();
    expect(source).toContain('function');
    expect(source).toContain('greet');
    expect(source).toContain('string');
  });
});

describe('dogfood: class declarations', () => {
  it('should render class Foo { }', () => {
    const node = ir.class(typeId('Foo')).body(ir.class_body());
    const source = node.renderImpl();
    expect(source).toContain('class');
    expect(source).toContain('Foo');
  });

  it('should render class with extends', () => {
    const node = ir.class(typeId('Bar'))
      .body(ir.class_body())
      .children(ir.extends_clause(id('Base')));
    const source = node.renderImpl();
    expect(source).toContain('class');
    expect(source).toContain('Bar');
    expect(source).toContain('extends');
    expect(source).toContain('Base');
  });
});

describe('dogfood: type aliases', () => {
  it('should render type Foo = string', () => {
    const node = ir.type_alias(typeId('Foo')).value(predefined('string'));
    const source = node.renderImpl();
    expect(source).toContain('type');
    expect(source).toContain('Foo');
    expect(source).toContain('string');
  });

  it('should render union type', () => {
    const union = ir.union_type(predefined('string'));
    const source = union.renderImpl();
    expect(source).toContain('|');
    expect(source).toContain('string');
  });
});

describe('dogfood: interfaces', () => {
  it('should render interface Foo { }', () => {
    const node = ir.interface(typeId('Foo')).body(ir.interface_body());
    const source = node.renderImpl();
    expect(source).toContain('interface');
    expect(source).toContain('Foo');
  });
});

describe('dogfood: import statements', () => {
  it('should render import { x } from "mod"', () => {
    const spec = ir.import_specifier(id('x'));
    const ni = ir.named_imports().children(spec);
    const clause = ir.import_clause(ni);
    const node = ir.import().children(clause).source(str("'mod'"));
    const source = node.renderImpl();
    expect(source).toContain('import');
    expect(source).toContain('x');
    expect(source).toContain('from');
    expect(source).toContain("'mod'");
  });
});

describe('dogfood: export statements', () => {
  it('should render export declaration', () => {
    const decl = ir.lexical(id('const')).children(
      ir.variable_declarator(id('x')).value(num(1)),
    );
    const node = ir.export().declaration(decl);
    const source = node.renderImpl();
    expect(source).toContain('export');
    expect(source).toContain('const');
    expect(source).toContain('x');
  });
});

describe('dogfood: control flow', () => {
  it('should render if statement', () => {
    const node = ir.if(ir.parenthesized(id('x')))
      .consequence(ir.statement_block());
    const source = node.renderImpl();
    expect(source).toContain('if');
    expect(source).toContain('x');
  });

  it('should render for...in statement', () => {
    const node = ir.for_in(id('item'))
      .right(id('items'))
      .body(ir.statement_block());
    const source = node.renderImpl();
    expect(source).toContain('for');
    expect(source).toContain('item');
  });

  it('should render return with value', () => {
    const node = ir.return().children(id('result'));
    const source = node.renderImpl();
    expect(source).toContain('return');
    expect(source).toContain('result');
  });
});

describe('dogfood: expressions', () => {
  it('should render binary expression', () => {
    const node = ir.binary(id('a')).right(id('b')).operator(id('+'));
    const source = node.renderImpl();
    expect(source).toContain('a');
    expect(source).toContain('+');
    expect(source).toContain('b');
  });

  it('should render call expression', () => {
    const node = ir.call(id('foo')).arguments(ir.arguments().children(id('x')));
    const source = node.renderImpl();
    expect(source).toContain('foo');
    expect(source).toContain('x');
  });

  it('should render member expression', () => {
    const node = ir.member(id('obj')).property(ir.propertyIdentifier('name'));
    const source = node.renderImpl();
    expect(source).toContain('obj');
    expect(source).toContain('name');
  });
});

describe('dogfood: CST round-trip', () => {
  it('should produce CST for composed tree', () => {
    const node = ir.lexical(id('const')).children(
      ir.variable_declarator(id('x')).value(num(42)),
    );
    const cst = node.toCST();
    expect(cst.type).toBe('lexical_declaration');
    expect(cst.children.length).toBeGreaterThan(0);
    expect(cst.text).toContain('const');
  });
});
