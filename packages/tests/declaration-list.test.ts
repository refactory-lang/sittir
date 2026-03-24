import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('declaration_list', () => {
  it('should create a declaration_list node via builder', () => {
    const builder = ir.declaration_list();
    const node = builder.build();
    expect(node.kind).toBe('declaration_list');
  });

  it('should render without throwing', () => {
    const builder = ir.declaration_list();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
