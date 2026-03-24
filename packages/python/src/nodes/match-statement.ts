import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, Expression, MatchStatement } from '../types.js';
import { block } from './block.js';
import type { BlockOptions } from './block.js';


class MatchStatementBuilder extends Builder<MatchStatement> {
  private _subject: Builder<Expression>[] = [];
  private _body!: Builder<Block>;

  constructor(...subject: Builder<Expression>[]) {
    super();
    this._subject = subject;
  }

  body(value: Builder<Block>): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('match');
    if (this._subject.length > 0) parts.push(this.renderChildren(this._subject, ', ', ctx));
    parts.push(':');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): MatchStatement {
    return {
      kind: 'match_statement',
      subject: this._subject.map(c => c.build(ctx)),
      body: this._body ? this._body.build(ctx) : undefined,
    } as MatchStatement;
  }

  override get nodeKind(): 'match_statement' { return 'match_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'match', type: 'match' });
    for (const child of this._subject) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'subject' });
    }
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { MatchStatementBuilder };

export function match_statement(...subject: Builder<Expression>[]): MatchStatementBuilder {
  return new MatchStatementBuilder(...subject);
}

export interface MatchStatementOptions {
  nodeKind: 'match_statement';
  subject: Builder<Expression> | (Builder<Expression>)[];
  body: Builder<Block> | Omit<BlockOptions, 'nodeKind'>;
}

export namespace match_statement {
  export function from(options: Omit<MatchStatementOptions, 'nodeKind'>): MatchStatementBuilder {
    const _ctor = options.subject;
    const _arr = Array.isArray(_ctor) ? _ctor : [_ctor];
    const b = new MatchStatementBuilder(..._arr);
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : block.from(_v));
    }
    return b;
  }
}
