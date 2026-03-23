import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, ElseClause } from '../types.js';


class ElseClauseBuilder extends Builder<ElseClause> {
  private _body: Builder<Block>;

  constructor(body: Builder<Block>) {
    super();
    this._body = body;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('else');
    parts.push(':');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ElseClause {
    return {
      kind: 'else_clause',
      body: this._body.build(ctx),
    } as ElseClause;
  }

  override get nodeKind(): string { return 'else_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'else', type: 'else' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { ElseClauseBuilder };

export function else_clause(body: Builder<Block>): ElseClauseBuilder {
  return new ElseClauseBuilder(body);
}

export interface ElseClauseOptions {
  body: Builder<Block>;
}

export namespace else_clause {
  export function from(options: ElseClauseOptions): ElseClauseBuilder {
    const b = new ElseClauseBuilder(options.body);
    return b;
  }
}
