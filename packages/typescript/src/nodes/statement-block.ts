import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { StatementBlock } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class StatementBlockBuilder extends BaseBuilder<StatementBlock> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): StatementBlock {
    return {
      kind: 'statement_block',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as StatementBlock;
  }

  override get nodeKind(): string { return 'statement_block'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function statement_block(): StatementBlockBuilder {
  return new StatementBlockBuilder();
}
