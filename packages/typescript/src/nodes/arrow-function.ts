import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrowFunction, AssertsAnnotation, Expression, FormalParameters, Identifier, StatementBlock, TypeAnnotation, TypeParameters, TypePredicateAnnotation } from '../types.js';
import { type_parameters } from './type-parameters.js';
import type { TypeParametersOptions } from './type-parameters.js';
import { formal_parameters } from './formal-parameters.js';
import type { FormalParametersOptions } from './formal-parameters.js';
import { type_annotation } from './type-annotation.js';
import type { TypeAnnotationOptions } from './type-annotation.js';
import { asserts_annotation } from './asserts-annotation.js';
import type { AssertsAnnotationOptions } from './asserts-annotation.js';
import { type_predicate_annotation } from './type-predicate-annotation.js';
import type { TypePredicateAnnotationOptions } from './type-predicate-annotation.js';
import { statement_block } from './statement-block.js';
import type { StatementBlockOptions } from './statement-block.js';


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
    if (this._parameter) parts.push(this.renderChild(this._parameter, ctx));
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    if (this._returnType) parts.push(this.renderChild(this._returnType, ctx));
    parts.push('=>');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ArrowFunction {
    return {
      kind: 'arrow_function',
      parameter: this._parameter ? this._parameter.build(ctx) : undefined,
      typeParameters: this._typeParameters ? this._typeParameters.build(ctx) : undefined,
      parameters: this._parameters ? this._parameters.build(ctx) : undefined,
      returnType: this._returnType ? this._returnType.build(ctx) : undefined,
      body: this._body.build(ctx),
    } as ArrowFunction;
  }

  override get nodeKind(): 'arrow_function' { return 'arrow_function'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._parameter) parts.push({ kind: 'builder', builder: this._parameter, fieldName: 'parameter' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    if (this._returnType) parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
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
  nodeKind: 'arrow_function';
  parameter?: Builder<Identifier> | string;
  typeParameters?: Builder<TypeParameters> | Omit<TypeParametersOptions, 'nodeKind'>;
  parameters?: Builder<FormalParameters> | Omit<FormalParametersOptions, 'nodeKind'>;
  returnType?: Builder<TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation> | TypeAnnotationOptions | AssertsAnnotationOptions | TypePredicateAnnotationOptions;
  body: Builder<Expression | StatementBlock> | Omit<StatementBlockOptions, 'nodeKind'>;
}

export namespace arrow_function {
  export function from(options: Omit<ArrowFunctionOptions, 'nodeKind'>): ArrowFunctionBuilder {
    const _ctor = options.body;
    const b = new ArrowFunctionBuilder(_ctor instanceof Builder ? _ctor : statement_block.from(_ctor));
    if (options.parameter !== undefined) {
      const _v = options.parameter;
      b.parameter(typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v);
    }
    if (options.typeParameters !== undefined) {
      const _v = options.typeParameters;
      b.typeParameters(_v instanceof Builder ? _v : type_parameters.from(_v));
    }
    if (options.parameters !== undefined) {
      const _v = options.parameters;
      b.parameters(_v instanceof Builder ? _v : formal_parameters.from(_v));
    }
    if (options.returnType !== undefined) {
      const _v = options.returnType;
      if (_v instanceof Builder) {
        b.returnType(_v);
      } else {
        switch (_v.nodeKind) {
          case 'type_annotation': b.returnType(type_annotation.from(_v)); break;
          case 'asserts_annotation': b.returnType(asserts_annotation.from(_v)); break;
          case 'type_predicate_annotation': b.returnType(type_predicate_annotation.from(_v)); break;
        }
      }
    }
    return b;
  }
}
