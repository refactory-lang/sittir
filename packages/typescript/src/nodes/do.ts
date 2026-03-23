import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DoStatement, ParenthesizedExpression, Statement } from '../types.js';


class DoBuilder extends Builder<DoStatement> {
  private _body: Builder;
  private _condition!: Builder;

  constructor(body: Builder) {
    super();
    this._body = body;
  }

  condition(value: Builder): this {
    this._condition = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('do');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    parts.push('while');
    if (this._condition) parts.push(this.renderChild(this._condition, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): DoStatement {
    return {
      kind: 'do_statement',
      body: this.renderChild(this._body, ctx),
      condition: this._condition ? this.renderChild(this._condition, ctx) : undefined,
    } as unknown as DoStatement;
  }

  override get nodeKind(): string { return 'do_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'do', type: 'do' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    parts.push({ kind: 'token', text: 'while', type: 'while' });
    if (this._condition) parts.push({ kind: 'builder', builder: this._condition, fieldName: 'condition' });
    return parts;
  }
}

export type { DoBuilder };

export function do_(body: Builder): DoBuilder {
  return new DoBuilder(body);
}

export interface DoStatementOptions {
  body: Builder<Statement>;
  condition: Builder<ParenthesizedExpression>;
}

export namespace do_ {
  export function from(options: DoStatementOptions): DoBuilder {
    const b = new DoBuilder(options.body);
    if (options.condition !== undefined) b.condition(options.condition);
    return b;
  }
}
