import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('scoped_identifier', () => {
  it('should create a scoped_identifier node via builder', () => {
    const builder = ir.scoped_identifier(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('scoped_identifier');
  });

  it('should render without throwing', () => {
    const builder = ir.scoped_identifier(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
