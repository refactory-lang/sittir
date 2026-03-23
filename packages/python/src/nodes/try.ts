import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, ElseClause, ExceptClause, FinallyClause, TryStatement } from '../types.js';


class TryBuilder extends Builder<TryStatement> {
  private _body: Builder<Block>;
  private _children: Builder<ElseClause | ExceptClause | FinallyClause>[] = [];

  constructor(body: Builder<Block>) {
    super();
    this._body = body;
  }

  children(...value: Builder<ElseClause | ExceptClause | FinallyClause>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('try');
    parts.push(':');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._children[2]) parts.push(this.renderChild(this._children[2]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TryStatement {
    return {
      kind: 'try_statement',
      body: this._body.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as TryStatement;
  }

  override get nodeKind(): string { return 'try_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'try', type: 'try' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._children[2]) parts.push({ kind: 'builder', builder: this._children[2]! });
    return parts;
  }
}

export type { TryBuilder };

export function try_(body: Builder<Block>): TryBuilder {
  return new TryBuilder(body);
}

export interface TryStatementOptions {
  body: Builder<Block>;
  children?: Builder<ElseClause | ExceptClause | FinallyClause> | (Builder<ElseClause | ExceptClause | FinallyClause>)[];
}

export namespace try_ {
  export function from(options: TryStatementOptions): TryBuilder {
    const b = new TryBuilder(options.body);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
