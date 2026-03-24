import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('label', () => {
  it('should create a label node via builder', () => {
    const builder = ir.label(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('label');
  });

  it('should render without throwing', () => {
    const builder = ir.label(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
