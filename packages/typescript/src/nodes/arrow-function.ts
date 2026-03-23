import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrowFunction, AssertsAnnotation, Expression, FormalParameters, Identifier, StatementBlock, TypeAnnotation, TypeParameters, TypePredicateAnnotation } from '../types.js';


class ArrowFunctionBuilder extends Builder<ArrowFunction> {
  private _body: Builder;
  private _parameter?: Builder;
  private _parameters?: Builder;
  private _returnType?: Builder;
  private _typeParameters?: Builder;

  constructor(body: Builder) {
    super();
    this._body = body;
  }

  parameter(value: Builder): this {
    this._parameter = value;
    return this;
  }

  parameters(value: Builder): this {
    this._parameters = value;
    return this;
  }

  returnType(value: Builder): this {
    this._returnType = value;
    return this;
  }

  typeParameters(value: Builder): this {
    this._typeParameters = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._parameter) parts.push(this.renderChild(this._parameter, ctx));
    parts.push('=>');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    if (this._returnType) parts.push(this.renderChild(this._returnType, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
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
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    if (this._returnType) parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    return parts;
  }
}

export type { ArrowFunctionBuilder };

export function arrow_function(body: Builder): ArrowFunctionBuilder {
  return new ArrowFunctionBuilder(body);
}

export interface ArrowFunctionOptions {
  body: Builder<Expression | StatementBlock>;
  parameter?: Builder<Identifier> | string;
  parameters?: Builder<FormalParameters>;
  returnType?: Builder<AssertsAnnotation | TypeAnnotation | TypePredicateAnnotation>;
  typeParameters?: Builder<TypeParameters>;
}

export namespace arrow_function {
  export function from(options: ArrowFunctionOptions): ArrowFunctionBuilder {
    const b = new ArrowFunctionBuilder(options.body);
    if (options.parameter !== undefined) {
      const _v = options.parameter;
      b.parameter(typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v);
    }
    if (options.parameters !== undefined) b.parameters(options.parameters);
    if (options.returnType !== undefined) b.returnType(options.returnType);
    if (options.typeParameters !== undefined) b.typeParameters(options.typeParameters);
    return b;
  }
}
