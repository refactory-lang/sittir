import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Statement, StatementBlock } from '../types.js';


class StatementBlockBuilder extends Builder<StatementBlock> {
  private _children: Builder[] = [];

  constructor() { super(); }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('}');
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
    parts.push({ kind: 'token', text: '{', type: '{' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { StatementBlockBuilder };

export function statement_block(): StatementBlockBuilder {
  return new StatementBlockBuilder();
}

export interface StatementBlockOptions {
  children?: Builder<Statement> | (Builder<Statement>)[];
}

export namespace statement_block {
  export function from(options: StatementBlockOptions): StatementBlockBuilder {
    const b = new StatementBlockBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
