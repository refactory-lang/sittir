import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ClosureExpression, ClosureParameters, Expression, Type } from '../types.js';


class ClosureBuilder extends Builder<ClosureExpression> {
  private _body!: Builder;
  private _parameters: Builder;
  private _returnType?: Builder;

  constructor(parameters: Builder) {
    super();
    this._parameters = parameters;
  }

  body(value: Builder): this {
    this._body = value;
    return this;
  }

  returnType(value: Builder): this {
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
      body: this._body ? this.renderChild(this._body, ctx) : undefined,
      parameters: this.renderChild(this._parameters, ctx),
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

export type { ClosureBuilder };

export function closure(parameters: Builder): ClosureBuilder {
  return new ClosureBuilder(parameters);
}

export interface ClosureExpressionOptions {
  body: Builder<Expression>;
  parameters: Builder<ClosureParameters>;
  returnType?: Builder<Type>;
}

export namespace closure {
  export function from(options: ClosureExpressionOptions): ClosureBuilder {
    const b = new ClosureBuilder(options.parameters);
    if (options.body !== undefined) b.body(options.body);
    if (options.returnType !== undefined) b.returnType(options.returnType);
    return b;
  }
}
