import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('interface_declaration', () => {
  it('should create a interface_declaration node via builder', () => {
    const builder = ir.interface(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('interface_declaration');
  });

  it('should render without throwing', () => {
    const builder = ir.interface(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
