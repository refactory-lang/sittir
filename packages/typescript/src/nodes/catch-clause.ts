import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CatchClause } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class CatchClauseBuilder extends BaseBuilder<CatchClause> {
  private _body: Child;
  private _parameter?: Child;
  private _type?: Child;

  constructor(body: Child) {
    super();
    this._body = body;
  }

  parameter(value: Child): this {
    this._parameter = value;
    return this;
  }

  type(value: Child): this {
    this._type = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('catch');
    if (this._parameter) {
      parts.push('(');
      if (this._parameter) parts.push(this.renderChild(this._parameter, ctx));
      if (this._type) parts.push(this.renderChild(this._type, ctx));
      parts.push(')');
    }
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): CatchClause {
    return {
      kind: 'catch_clause',
      body: this.renderChild(this._body, ctx),
      parameter: this._parameter ? this.renderChild(this._parameter, ctx) : undefined,
      type: this._type ? this.renderChild(this._type, ctx) : undefined,
    } as unknown as CatchClause;
  }

  override get nodeKind(): string { return 'catch_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'catch', type: 'catch' });
    if (this._parameter) {
      parts.push({ kind: 'token', text: '(', type: '(' });
      if (this._parameter) parts.push({ kind: 'builder', builder: this._parameter, fieldName: 'parameter' });
      if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
      parts.push({ kind: 'token', text: ')', type: ')' });
    }
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export function catch_clause(body: Child): CatchClauseBuilder {
  return new CatchClauseBuilder(body);
}
