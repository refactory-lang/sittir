import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayPattern, CatchClause, Identifier, ObjectPattern, StatementBlock, TypeAnnotation } from '../types.js';


class CatchClauseBuilder extends Builder<CatchClause> {
  private _body: Builder<StatementBlock>;
  private _parameter?: Builder<ArrayPattern | Identifier | ObjectPattern>;
  private _type?: Builder<TypeAnnotation>;

  constructor(body: Builder<StatementBlock>) {
    super();
    this._body = body;
  }

  parameter(value: Builder<ArrayPattern | Identifier | ObjectPattern>): this {
    this._parameter = value;
    return this;
  }

  type(value: Builder<TypeAnnotation>): this {
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
      body: this._body.build(ctx),
      parameter: this._parameter?.build(ctx),
      type: this._type?.build(ctx),
    } as CatchClause;
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

export type { CatchClauseBuilder };

export function catch_clause(body: Builder<StatementBlock>): CatchClauseBuilder {
  return new CatchClauseBuilder(body);
}

export interface CatchClauseOptions {
  body: Builder<StatementBlock>;
  parameter?: Builder<ArrayPattern | Identifier | ObjectPattern>;
  type?: Builder<TypeAnnotation>;
}

export namespace catch_clause {
  export function from(options: CatchClauseOptions): CatchClauseBuilder {
    const b = new CatchClauseBuilder(options.body);
    if (options.parameter !== undefined) b.parameter(options.parameter);
    if (options.type !== undefined) b.type(options.type);
    return b;
  }
}
