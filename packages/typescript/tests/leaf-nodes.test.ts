import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';
import { LeafBuilder } from '@sittir/types';

describe('leaf nodes', () => {
  it('build() should return an object with kind, not a string', () => {
    const leaf = new LeafBuilder('identifier', 'test');
    const node = leaf.build();
    expect(typeof node).toBe('object');
    expect(node).not.toBeNull();
    expect(node).toHaveProperty('kind', 'identifier');
    expect(typeof node).not.toBe('string');
  });

  it('ir.accessibilityModifier() should build a { kind } object', () => {
    const builder = ir.accessibilityModifier('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'accessibility_modifier');
  });

  it('ir.comment() should build a { kind } object', () => {
    const builder = ir.comment('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'comment');
  });

  it('ir.debuggerStatement() should build a { kind } object', () => {
    const builder = ir.debuggerStatement('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'debugger_statement');
  });

  it('ir.emptyStatement() should build a { kind } object', () => {
    const builder = ir.emptyStatement();
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'empty_statement');
  });

  it('ir.escapeSequence() should build a { kind } object', () => {
    const builder = ir.escapeSequence('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'escape_sequence');
  });

  it('ir.existentialType() should build a { kind } object', () => {
    const builder = ir.existentialType();
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'existential_type');
  });

  it('ir.false() should build a { kind } object', () => {
    const builder = ir.false();
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'false');
  });

  it('ir.hashBangLine() should build a { kind } object', () => {
    const builder = ir.hashBangLine('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'hash_bang_line');
  });

  it('ir.htmlComment() should build a { kind } object', () => {
    const builder = ir.htmlComment('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'html_comment');
  });

  it('ir.identifier() should build a { kind } object', () => {
    const builder = ir.identifier('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'identifier');
  });

  it('ir.import() should build a { kind } object', () => {
    const builder = ir.import();
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'import');
  });

  it('ir.metaProperty() should build a { kind } object', () => {
    const builder = ir.metaProperty('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'meta_property');
  });

  it('ir.null() should build a { kind } object', () => {
    const builder = ir.null();
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'null');
  });

  it('ir.number() should build a { kind } object', () => {
    const builder = ir.number('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'number');
  });

  it('ir.optionalChain() should build a { kind } object', () => {
    const builder = ir.optionalChain();
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'optional_chain');
  });

  it('ir.overrideModifier() should build a { kind } object', () => {
    const builder = ir.overrideModifier();
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'override_modifier');
  });

  it('ir.predefinedType() should build a { kind } object', () => {
    const builder = ir.predefinedType('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'predefined_type');
  });

  it('ir.privatePropertyIdentifier() should build a { kind } object', () => {
    const builder = ir.privatePropertyIdentifier('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'private_property_identifier');
  });

  it('ir.propertyIdentifier() should build a { kind } object', () => {
    const builder = ir.propertyIdentifier('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'property_identifier');
  });

  it('ir.regexFlags() should build a { kind } object', () => {
    const builder = ir.regexFlags('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'regex_flags');
  });

  it('ir.regexPattern() should build a { kind } object', () => {
    const builder = ir.regexPattern('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'regex_pattern');
  });

  it('ir.shorthandPropertyIdentifier() should build a { kind } object', () => {
    const builder = ir.shorthandPropertyIdentifier('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'shorthand_property_identifier');
  });

  it('ir.shorthandPropertyIdentifierPattern() should build a { kind } object', () => {
    const builder = ir.shorthandPropertyIdentifierPattern('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'shorthand_property_identifier_pattern');
  });

  it('ir.statementIdentifier() should build a { kind } object', () => {
    const builder = ir.statementIdentifier('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'statement_identifier');
  });

  it('ir.stringFragment() should build a { kind } object', () => {
    const builder = ir.stringFragment('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'string_fragment');
  });

  it('ir.super() should build a { kind } object', () => {
    const builder = ir.super();
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'super');
  });

  it('ir.this() should build a { kind } object', () => {
    const builder = ir.this();
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'this');
  });

  it('ir.thisType() should build a { kind } object', () => {
    const builder = ir.thisType('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'this_type');
  });

  it('ir.true() should build a { kind } object', () => {
    const builder = ir.true();
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'true');
  });

  it('ir.typeIdentifier() should build a { kind } object', () => {
    const builder = ir.typeIdentifier('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'type_identifier');
  });

  it('ir.undefined() should build a { kind } object', () => {
    const builder = ir.undefined();
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'undefined');
  });

  it('renderImpl() should return the leaf text', () => {
    const leaf = new LeafBuilder('identifier', 'hello');
    expect(leaf.renderImpl()).toBe('hello');
  });

  it('toCST() should produce a valid CST node', () => {
    const leaf = new LeafBuilder('identifier', 'test');
    const cst = leaf.toCST();
    expect(cst.type).toBe('identifier');
    expect(cst.isNamed).toBe(true);
    expect(cst.text).toBe('test');
  });
});
