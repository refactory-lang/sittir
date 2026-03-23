import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CatchClause, FinallyClause, StatementBlock, TryStatement } from '../types.js';


class TryBuilder extends Builder<TryStatement> {
  private _body: Builder;
  private _finalizer?: Builder;
  private _handler?: Builder;

  constructor(body: Builder) {
    super();
    this._body = body;
  }

  finalizer(value: Builder): this {
    this._finalizer = value;
    return this;
  }

  handler(value: Builder): this {
    this._handler = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('try');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    if (this._handler) parts.push(this.renderChild(this._handler, ctx));
    if (this._finalizer) parts.push(this.renderChild(this._finalizer, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TryStatement {
    return {
      kind: 'try_statement',
      body: this.renderChild(this._body, ctx),
      finalizer: this._finalizer ? this.renderChild(this._finalizer, ctx) : undefined,
      handler: this._handler ? this.renderChild(this._handler, ctx) : undefined,
    } as unknown as TryStatement;
  }

  override get nodeKind(): string { return 'try_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'try', type: 'try' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    if (this._handler) parts.push({ kind: 'builder', builder: this._handler, fieldName: 'handler' });
    if (this._finalizer) parts.push({ kind: 'builder', builder: this._finalizer, fieldName: 'finalizer' });
    return parts;
  }
}

export type { TryBuilder };

export function try_(body: Builder): TryBuilder {
  return new TryBuilder(body);
}

export interface TryStatementOptions {
  body: Builder<StatementBlock>;
  finalizer?: Builder<FinallyClause>;
  handler?: Builder<CatchClause>;
}

export namespace try_ {
  export function from(options: TryStatementOptions): TryBuilder {
    const b = new TryBuilder(options.body);
    if (options.finalizer !== undefined) b.finalizer(options.finalizer);
    if (options.handler !== undefined) b.handler(options.handler);
    return b;
  }
}
