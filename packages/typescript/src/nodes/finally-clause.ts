import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FinallyClause } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class FinallyClauseBuilder extends BaseBuilder<FinallyClause> {
  private _body: Child;

  constructor(body: Child) {
    super();
    this._body = body;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('finally');
    if (this._body) {
      parts.push('{');
      parts.push(this.renderChild(this._body, ctx));
      parts.push('}');
    }
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
    parts.push({ kind: 'token', text: 'finally' });
    if (this._body) {
      parts.push({ kind: 'token', text: '{', type: '{' });
      parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
      parts.push({ kind: 'token', text: '}', type: '}' });
    }
    return parts;
  }
}

export function finally_clause(body: Child): FinallyClauseBuilder {
  return new FinallyClauseBuilder(body);
}
