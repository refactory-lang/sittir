import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('regex', () => {
  it('should create a regex node via builder', () => {
    const builder = ir.regex(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('regex');
  });

  it('should render without throwing', () => {
    const builder = ir.regex(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
