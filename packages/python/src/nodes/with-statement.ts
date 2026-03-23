import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, WithClause, WithStatement } from '../types.js';


class WithStatementBuilder extends Builder<WithStatement> {
  private _body: Builder<Block>;
  private _children: Builder<WithClause>[] = [];

  constructor(body: Builder<Block>) {
    super();
    this._body = body;
  }

  children(...value: Builder<WithClause>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('with');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(':');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): WithStatement {
    return {
      kind: 'with_statement',
      body: this._body.build(ctx),
      children: this._children[0]?.build(ctx),
    } as WithStatement;
  }

  override get nodeKind(): string { return 'with_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'with', type: 'with' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { WithStatementBuilder };

export function with_statement(body: Builder<Block>): WithStatementBuilder {
  return new WithStatementBuilder(body);
}

export interface WithStatementOptions {
  body: Builder<Block>;
  children?: Builder<WithClause> | (Builder<WithClause>)[];
}

export namespace with_statement {
  export function from(options: WithStatementOptions): WithStatementBuilder {
    const b = new WithStatementBuilder(options.body);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
