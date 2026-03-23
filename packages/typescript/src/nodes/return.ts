import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ReturnStatement, SequenceExpression } from '../types.js';


class ReturnBuilder extends Builder<ReturnStatement> {
  private _children: Builder[] = [];

  constructor() { super(); }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('return');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ReturnStatement {
    return {
      kind: 'return_statement',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ReturnStatement;
  }

  override get nodeKind(): string { return 'return_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'return', type: 'return' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ReturnBuilder };

export function return_(): ReturnBuilder {
  return new ReturnBuilder();
}

export interface ReturnStatementOptions {
  children?: Builder<Expression | SequenceExpression> | (Builder<Expression | SequenceExpression>)[];
}

export namespace return_ {
  export function from(options: ReturnStatementOptions): ReturnBuilder {
    const b = new ReturnBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
