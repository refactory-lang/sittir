import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ClosureExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ClosureBuilder extends BaseBuilder<ClosureExpression> {
  private _body: Child;
  private _parameters!: Child;
  private _returnType?: Child;

  constructor(body: Child) {
    super();
    this._body = body;
  }

  parameters(value: Child): this {
    this._parameters = value;
    return this;
  }

  returnType(value: Child): this {
    this._returnType = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    if (this._returnType) {
      parts.push('->');
      if (this._returnType) parts.push(this.renderChild(this._returnType, ctx));
    }
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ClosureExpression {
    return {
      kind: 'closure_expression',
      body: this.renderChild(this._body, ctx),
      parameters: this._parameters ? this.renderChild(this._parameters, ctx) : undefined,
      returnType: this._returnType ? this.renderChild(this._returnType, ctx) : undefined,
    } as unknown as ClosureExpression;
  }

  override get nodeKind(): string { return 'closure_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    if (this._returnType) {
      parts.push({ kind: 'token', text: '->', type: '->' });
      if (this._returnType) parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
    }
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export function closure(body: Child): ClosureBuilder {
  return new ClosureBuilder(body);
}
