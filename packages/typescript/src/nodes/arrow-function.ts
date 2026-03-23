import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrowFunction, AssertsAnnotation, Expression, FormalParameters, Identifier, StatementBlock, TypeAnnotation, TypeParameters, TypePredicateAnnotation } from '../types.js';
import { type_parameters } from './type-parameters.js';
import type { TypeParametersOptions } from './type-parameters.js';
import { formal_parameters } from './formal-parameters.js';
import type { FormalParametersOptions } from './formal-parameters.js';


class ArrowFunctionBuilder extends Builder<ArrowFunction> {
  private _parameter?: Builder<Identifier>;
  private _typeParameters?: Builder<TypeParameters>;
  private _parameters?: Builder<FormalParameters>;
  private _returnType?: Builder<TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation>;
  private _body: Builder<Expression | StatementBlock>;

  constructor(body: Builder<Expression | StatementBlock>) {
    super();
    this._body = body;
  }

  parameter(value: Builder<Identifier>): this {
    this._parameter = value;
    return this;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
    return this;
  }

  parameters(value: Builder<FormalParameters>): this {
    this._parameters = value;
    return this;
  }

  returnType(value: Builder<TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation>): this {
    this._returnType = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    if (this._returnType) parts.push(this.renderChild(this._returnType, ctx));
    if (this._parameter) parts.push(this.renderChild(this._parameter, ctx));
    parts.push('=>');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ArrowFunction {
    return {
      kind: 'arrow_function',
      parameter: this._parameter?.build(ctx),
      typeParameters: this._typeParameters?.build(ctx),
      parameters: this._parameters?.build(ctx),
      returnType: this._returnType?.build(ctx),
      body: this._body.build(ctx),
    } as ArrowFunction;
  }

  override get nodeKind(): string { return 'arrow_function'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    if (this._returnType) parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
    if (this._parameter) parts.push({ kind: 'builder', builder: this._parameter, fieldName: 'parameter' });
    parts.push({ kind: 'token', text: '=>', type: '=>' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { ArrowFunctionBuilder };

export function arrow_function(body: Builder<Expression | StatementBlock>): ArrowFunctionBuilder {
  return new ArrowFunctionBuilder(body);
}

export interface ArrowFunctionOptions {
  parameter?: Builder<Identifier> | string;
  typeParameters?: Builder<TypeParameters> | TypeParametersOptions;
  parameters?: Builder<FormalParameters> | FormalParametersOptions;
  returnType?: Builder<TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation>;
  body: Builder<Expression | StatementBlock>;
}

export namespace arrow_function {
  export function from(options: ArrowFunctionOptions): ArrowFunctionBuilder {
    const b = new ArrowFunctionBuilder(options.body);
    if (options.parameter !== undefined) {
      const _v = options.parameter;
      b.parameter(typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v);
    }
    if (options.typeParameters !== undefined) {
      const _v = options.typeParameters;
      b.typeParameters(_v instanceof Builder ? _v : type_parameters.from(_v as TypeParametersOptions));
    }
    if (options.parameters !== undefined) {
      const _v = options.parameters;
      b.parameters(_v instanceof Builder ? _v : formal_parameters.from(_v as FormalParametersOptions));
    }
    if (options.returnType !== undefined) b.returnType(options.returnType);
    return b;
  }
}
