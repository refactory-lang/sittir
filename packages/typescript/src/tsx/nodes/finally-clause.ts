import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FinallyClause, StatementBlock } from '../types.js';


class FinallyClauseBuilder extends Builder<FinallyClause> {
  private _body: Builder<StatementBlock>;

  constructor(body: Builder<StatementBlock>) {
    super();
    this._body = body;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('finally');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FinallyClause {
    return {
      kind: 'finally_clause',
      body: this._body.build(ctx),
    } as FinallyClause;
  }

  override get nodeKind(): string { return 'finally_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'finally', type: 'finally' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { FinallyClauseBuilder };

export function finally_clause(body: Builder<StatementBlock>): FinallyClauseBuilder {
  return new FinallyClauseBuilder(body);
}

export interface FinallyClauseOptions {
  body: Builder<StatementBlock>;
}

export namespace finally_clause {
  export function from(options: FinallyClauseOptions): FinallyClauseBuilder {
    const b = new FinallyClauseBuilder(options.body);
    return b;
  }
}
