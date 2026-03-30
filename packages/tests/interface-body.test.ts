import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('interface_body', () => {
  it('should create a interface_body node via builder', () => {
    const builder = ir.interface_body();
    const node = builder.build();
    expect(node.kind).toBe('interface_body');
  });

  it('should render without throwing', () => {
    const builder = ir.interface_body();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
