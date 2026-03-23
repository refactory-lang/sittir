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

  it('ir.booleanLiteral() should build a { kind } object', () => {
    const builder = ir.booleanLiteral('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'boolean_literal');
  });

  it('ir.charLiteral() should build a { kind } object', () => {
    const builder = ir.charLiteral('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'char_literal');
  });

  it('ir.crate() should build a { kind } object', () => {
    const builder = ir.crate('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'crate');
  });

  it('ir.docComment() should build a { kind } object', () => {
    const builder = ir.docComment('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'doc_comment');
  });

  it('ir.emptyStatement() should build a { kind } object', () => {
    const builder = ir.emptyStatement('test');
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

  it('ir.fieldIdentifier() should build a { kind } object', () => {
    const builder = ir.fieldIdentifier('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'field_identifier');
  });

  it('ir.floatLiteral() should build a { kind } object', () => {
    const builder = ir.floatLiteral('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'float_literal');
  });

  it('ir.fragmentSpecifier() should build a { kind } object', () => {
    const builder = ir.fragmentSpecifier('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'fragment_specifier');
  });

  it('ir.identifier() should build a { kind } object', () => {
    const builder = ir.identifier('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'identifier');
  });

  it('ir.innerDocCommentMarker() should build a { kind } object', () => {
    const builder = ir.innerDocCommentMarker('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'inner_doc_comment_marker');
  });

  it('ir.integerLiteral() should build a { kind } object', () => {
    const builder = ir.integerLiteral('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'integer_literal');
  });

  it('ir.metavariable() should build a { kind } object', () => {
    const builder = ir.metavariable('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'metavariable');
  });

  it('ir.mutableSpecifier() should build a { kind } object', () => {
    const builder = ir.mutableSpecifier('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'mutable_specifier');
  });

  it('ir.neverType() should build a { kind } object', () => {
    const builder = ir.neverType('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'never_type');
  });

  it('ir.outerDocCommentMarker() should build a { kind } object', () => {
    const builder = ir.outerDocCommentMarker('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'outer_doc_comment_marker');
  });

  it('ir.primitiveType() should build a { kind } object', () => {
    const builder = ir.primitiveType('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'primitive_type');
  });

  it('ir.remainingFieldPattern() should build a { kind } object', () => {
    const builder = ir.remainingFieldPattern('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'remaining_field_pattern');
  });

  it('ir.self() should build a { kind } object', () => {
    const builder = ir.self('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'self');
  });

  it('ir.shebang() should build a { kind } object', () => {
    const builder = ir.shebang('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'shebang');
  });

  it('ir.shorthandFieldIdentifier() should build a { kind } object', () => {
    const builder = ir.shorthandFieldIdentifier('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'shorthand_field_identifier');
  });

  it('ir.stringContent() should build a { kind } object', () => {
    const builder = ir.stringContent('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'string_content');
  });

  it('ir.super() should build a { kind } object', () => {
    const builder = ir.super('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'super');
  });

  it('ir.typeIdentifier() should build a { kind } object', () => {
    const builder = ir.typeIdentifier('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'type_identifier');
  });

  it('ir.unitExpression() should build a { kind } object', () => {
    const builder = ir.unitExpression('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'unit_expression');
  });

  it('ir.unitType() should build a { kind } object', () => {
    const builder = ir.unitType('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'unit_type');
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
