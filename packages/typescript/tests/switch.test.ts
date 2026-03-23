import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('switch_statement', () => {
  it('should create a switch_statement node via builder', () => {
    const builder = ir.switch(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('switch_statement');
  });

  it('should render without throwing', () => {
    const builder = ir.switch(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
