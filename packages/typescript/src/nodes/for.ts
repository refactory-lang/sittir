import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ForStatement } from '../types.js';


class ForBuilder extends BaseBuilder<ForStatement> {
  private _body: BaseBuilder;
  private _condition: BaseBuilder[] = [];
  private _increment?: BaseBuilder;
  private _initializer!: BaseBuilder;

  constructor(body: BaseBuilder) {
    super();
    this._body = body;
  }

  condition(value: BaseBuilder[]): this {
    this._condition = value;
    return this;
  }

  increment(value: BaseBuilder): this {
    this._increment = value;
    return this;
  }

  initializer(value: BaseBuilder): this {
    this._initializer = value;
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
      body: this.renderChild(this._body, ctx),
      condition: this._condition.map(c => this.renderChild(c, ctx)),
      increment: this._increment ? this.renderChild(this._increment, ctx) : undefined,
      initializer: this._initializer ? this.renderChild(this._initializer, ctx) : undefined,
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

export function for_(body: BaseBuilder): ForBuilder {
  return new ForBuilder(body);
}
