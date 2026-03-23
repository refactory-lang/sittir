import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('index_type_query', () => {
  it('should create a index_type_query node via builder', () => {
    const builder = ir.index_type_query(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('index_type_query');
  });

  it('should render without throwing', () => {
    const builder = ir.index_type_query(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
