import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrowFunction } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ArrowFunctionBuilder extends BaseBuilder<ArrowFunction> {
  private _body: Child;
  private _parameter?: Child;
  private _parameters?: Child;
  private _returnType?: Child;
  private _typeParameters?: Child;

  constructor(body: Child) {
    super();
    this._body = body;
  }

  parameter(value: Child): this {
    this._parameter = value;
    return this;
  }

  parameters(value: Child): this {
    this._parameters = value;
    return this;
  }

  returnType(value: Child): this {
    this._returnType = value;
    return this;
  }

  typeParameters(value: Child): this {
    this._typeParameters = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._parameter) parts.push(this.renderChild(this._parameter, ctx));
    parts.push('=>');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ArrowFunction {
    return {
      kind: 'arrow_function',
      body: this.renderChild(this._body, ctx),
      parameter: this._parameter ? this.renderChild(this._parameter, ctx) : undefined,
      parameters: this._parameters ? this.renderChild(this._parameters, ctx) : undefined,
      returnType: this._returnType ? this.renderChild(this._returnType, ctx) : undefined,
      typeParameters: this._typeParameters ? this.renderChild(this._typeParameters, ctx) : undefined,
    } as unknown as ArrowFunction;
  }

  override get nodeKind(): string { return 'arrow_function'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._parameter) parts.push({ kind: 'builder', builder: this._parameter, fieldName: 'parameter' });
    parts.push({ kind: 'token', text: '=>', type: '=>' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export function arrow_function(body: Child): ArrowFunctionBuilder {
  return new ArrowFunctionBuilder(body);
}
