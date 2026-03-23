import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { EmptyStatement, Expression, ForStatement, LexicalDeclaration, SequenceExpression, Statement, VariableDeclaration } from '../types.js';


class ForBuilder extends Builder<ForStatement> {
  private _body!: Builder;
  private _condition: Builder[] = [];
  private _increment?: Builder;
  private _initializer: Builder;

  constructor(initializer: Builder) {
    super();
    this._initializer = initializer;
  }

  body(value: Builder): this {
    this._body = value;
    return this;
  }

  condition(...value: Builder[]): this {
    this._condition = value;
    return this;
  }

  increment(value: Builder): this {
    this._increment = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('for');
    parts.push('(');
    if (this._initializer) parts.push(this.renderChild(this._initializer, ctx));
    if (this._condition.length > 0) parts.push(this.renderChildren(this._condition, ', ', ctx));
    if (this._increment) parts.push(this.renderChild(this._increment, ctx));
    parts.push(')');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ForStatement {
    return {
      kind: 'for_statement',
      body: this._body ? this.renderChild(this._body, ctx) : undefined,
      condition: this._condition.map(c => this.renderChild(c, ctx)),
      increment: this._increment ? this.renderChild(this._increment, ctx) : undefined,
      initializer: this.renderChild(this._initializer, ctx),
    } as unknown as ForStatement;
  }

  override get nodeKind(): string { return 'for_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'for', type: 'for' });
    parts.push({ kind: 'token', text: '(', type: '(' });
    if (this._initializer) parts.push({ kind: 'builder', builder: this._initializer, fieldName: 'initializer' });
    for (const child of this._condition) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'condition' });
    }
    if (this._increment) parts.push({ kind: 'builder', builder: this._increment, fieldName: 'increment' });
    parts.push({ kind: 'token', text: ')', type: ')' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { ForBuilder };

export function for_(initializer: Builder): ForBuilder {
  return new ForBuilder(initializer);
}

export interface ForStatementOptions {
  body: Builder<Statement>;
  condition: Builder<EmptyStatement | Expression | SequenceExpression> | (Builder<EmptyStatement | Expression | SequenceExpression>)[];
  increment?: Builder<Expression | SequenceExpression>;
  initializer: Builder<EmptyStatement | Expression | LexicalDeclaration | SequenceExpression | VariableDeclaration>;
}

export namespace for_ {
  export function from(options: ForStatementOptions): ForBuilder {
    const b = new ForBuilder(options.initializer);
    if (options.body !== undefined) b.body(options.body);
    if (options.condition !== undefined) {
      const _v = options.condition;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.condition(..._arr);
    }
    if (options.increment !== undefined) b.increment(options.increment);
    return b;
  }
}
