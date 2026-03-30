import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('labeled_statement', () => {
  it('should create a labeled_statement node via builder', () => {
    const builder = ir.labeled(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('labeled_statement');
  });

  it('should render without throwing', () => {
    const builder = ir.labeled(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
