import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FinallyClause } from '../types.js';


class FinallyClauseBuilder extends BaseBuilder<FinallyClause> {
  private _body: BaseBuilder;

  constructor(body: BaseBuilder) {
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
      body: this.renderChild(this._body, ctx),
    } as unknown as FinallyClause;
  }

  override get nodeKind(): string { return 'finally_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'finally', type: 'finally' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export function finally_clause(body: BaseBuilder): FinallyClauseBuilder {
  return new FinallyClauseBuilder(body);
}
