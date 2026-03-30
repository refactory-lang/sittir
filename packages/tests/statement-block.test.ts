import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('statement_block', () => {
  it('should create a statement_block node via builder', () => {
    const builder = ir.statement_block();
    const node = builder.build();
    expect(node.kind).toBe('statement_block');
  });

  it('should render without throwing', () => {
    const builder = ir.statement_block();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
