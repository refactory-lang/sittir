import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('match_arm', () => {
  it('should create a match_arm node via builder', () => {
    const builder = ir.match_arm(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('match_arm');
  });

  it('should render without throwing', () => {
    const builder = ir.match_arm(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
