import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CatchClause, FinallyClause, StatementBlock, TryStatement } from '../types.js';
import { statement_block } from './statement-block.js';
import type { StatementBlockOptions } from './statement-block.js';
import { catch_clause } from './catch-clause.js';
import type { CatchClauseOptions } from './catch-clause.js';
import { finally_clause } from './finally-clause.js';
import type { FinallyClauseOptions } from './finally-clause.js';


class TryStatementBuilder extends Builder<TryStatement> {
  private _body: Builder<StatementBlock>;
  private _handler?: Builder<CatchClause>;
  private _finalizer?: Builder<FinallyClause>;

  constructor(body: Builder<StatementBlock>) {
    super();
    this._body = body;
  }

  handler(value: Builder<CatchClause>): this {
    this._handler = value;
    return this;
  }

  finalizer(value: Builder<FinallyClause>): this {
    this._finalizer = value;
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
      body: this._body.build(ctx),
      handler: this._handler?.build(ctx),
      finalizer: this._finalizer?.build(ctx),
    } as TryStatement;
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

export type { TryStatementBuilder };

export function try_statement(body: Builder<StatementBlock>): TryStatementBuilder {
  return new TryStatementBuilder(body);
}

export interface TryStatementOptions {
  body: Builder<StatementBlock> | StatementBlockOptions;
  handler?: Builder<CatchClause> | CatchClauseOptions;
  finalizer?: Builder<FinallyClause> | FinallyClauseOptions;
}

export namespace try_statement {
  export function from(options: TryStatementOptions): TryStatementBuilder {
    const _ctor = options.body;
    const b = new TryStatementBuilder(_ctor instanceof Builder ? _ctor : statement_block.from(_ctor as StatementBlockOptions));
    if (options.handler !== undefined) {
      const _v = options.handler;
      b.handler(_v instanceof Builder ? _v : catch_clause.from(_v as CatchClauseOptions));
    }
    if (options.finalizer !== undefined) {
      const _v = options.finalizer;
      b.finalizer(_v instanceof Builder ? _v : finally_clause.from(_v as FinallyClauseOptions));
    }
    return b;
  }
}
