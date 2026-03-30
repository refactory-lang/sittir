import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('type_predicate_annotation', () => {
  it('should create a type_predicate_annotation node via builder', () => {
    const builder = ir.type_predicate_annotation(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('type_predicate_annotation');
  });

  it('should render without throwing', () => {
    const builder = ir.type_predicate_annotation(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
