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

  it('ir.breakStatement() should build a { kind } object', () => {
    const builder = ir.breakStatement('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'break_statement');
  });

  it('ir.comment() should build a { kind } object', () => {
    const builder = ir.comment('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'comment');
  });

  it('ir.continueStatement() should build a { kind } object', () => {
    const builder = ir.continueStatement('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'continue_statement');
  });

  it('ir.ellipsis() should build a { kind } object', () => {
    const builder = ir.ellipsis('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'ellipsis');
  });

  it('ir.escapeInterpolation() should build a { kind } object', () => {
    const builder = ir.escapeInterpolation('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'escape_interpolation');
  });

  it('ir.escapeSequence() should build a { kind } object', () => {
    const builder = ir.escapeSequence('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'escape_sequence');
  });

  it('ir.false() should build a { kind } object', () => {
    const builder = ir.false('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'false');
  });

  it('ir.float() should build a { kind } object', () => {
    const builder = ir.float('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'float');
  });

  it('ir.identifier() should build a { kind } object', () => {
    const builder = ir.identifier('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'identifier');
  });

  it('ir.importPrefix() should build a { kind } object', () => {
    const builder = ir.importPrefix('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'import_prefix');
  });

  it('ir.integer() should build a { kind } object', () => {
    const builder = ir.integer('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'integer');
  });

  it('ir.keywordSeparator() should build a { kind } object', () => {
    const builder = ir.keywordSeparator('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'keyword_separator');
  });

  it('ir.lineContinuation() should build a { kind } object', () => {
    const builder = ir.lineContinuation('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'line_continuation');
  });

  it('ir.none() should build a { kind } object', () => {
    const builder = ir.none('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'none');
  });

  it('ir.passStatement() should build a { kind } object', () => {
    const builder = ir.passStatement('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'pass_statement');
  });

  it('ir.positionalSeparator() should build a { kind } object', () => {
    const builder = ir.positionalSeparator('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'positional_separator');
  });

  it('ir.stringEnd() should build a { kind } object', () => {
    const builder = ir.stringEnd('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'string_end');
  });

  it('ir.stringStart() should build a { kind } object', () => {
    const builder = ir.stringStart('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'string_start');
  });

  it('ir.true() should build a { kind } object', () => {
    const builder = ir.true('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'true');
  });

  it('ir.typeConversion() should build a { kind } object', () => {
    const builder = ir.typeConversion('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'type_conversion');
  });

  it('ir.wildcardImport() should build a { kind } object', () => {
    const builder = ir.wildcardImport('test');
    const node = builder.build();
    expect(typeof node).toBe('object');
    expect(node).toHaveProperty('kind', 'wildcard_import');
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
