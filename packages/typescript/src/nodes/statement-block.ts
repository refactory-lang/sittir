import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Statement, StatementBlock } from '../types.js';


class StatementBlockBuilder extends Builder<StatementBlock> {
  private _children: Builder<Statement>[] = [];

  constructor() { super(); }

  children(...value: Builder<Statement>[]): this {
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
      children: this._children.map(c => c.build(ctx)),
    } as StatementBlock;
  }

  override get nodeKind(): 'statement_block' { return 'statement_block'; }

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
  nodeKind: 'statement_block';
  children?: Builder<Statement> | (Builder<Statement>)[];
}

export namespace statement_block {
  export function from(input: Omit<StatementBlockOptions, 'nodeKind'> | Builder<Statement> | (Builder<Statement>)[]): StatementBlockBuilder {
    const options: Omit<StatementBlockOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<StatementBlockOptions, 'nodeKind'>
      : { children: input } as Omit<StatementBlockOptions, 'nodeKind'>;
    const b = new StatementBlockBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
