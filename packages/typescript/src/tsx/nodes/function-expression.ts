import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssertsAnnotation, FormalParameters, FunctionExpression, Identifier, StatementBlock, TypeAnnotation, TypeParameters, TypePredicateAnnotation } from '../types.js';


class FunctionBuilder extends Builder<FunctionExpression> {
  private _body!: Builder<StatementBlock>;
  private _name?: Builder<Identifier>;
  private _parameters: Builder<FormalParameters>;
  private _returnType?: Builder<AssertsAnnotation | TypeAnnotation | TypePredicateAnnotation>;
  private _typeParameters?: Builder<TypeParameters>;

  constructor(parameters: Builder<FormalParameters>) {
    super();
    this._parameters = parameters;
  }

  body(value: Builder<StatementBlock>): this {
    this._body = value;
    return this;
  }

  name(value: Builder<Identifier>): this {
    this._name = value;
    return this;
  }

  returnType(value: Builder<AssertsAnnotation | TypeAnnotation | TypePredicateAnnotation>): this {
    this._returnType = value;
    return this;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('function');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    if (this._returnType) parts.push(this.renderChild(this._returnType, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FunctionExpression {
    return {
      kind: 'function_expression',
      body: this._body?.build(ctx),
      name: this._name?.build(ctx),
      parameters: this._parameters.build(ctx),
      returnType: this._returnType?.build(ctx),
      typeParameters: this._typeParameters?.build(ctx),
    } as FunctionExpression;
  }

  override get nodeKind(): string { return 'function_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'function', type: 'function' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    if (this._returnType) parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { FunctionBuilder };

export function function_(parameters: Builder<FormalParameters>): FunctionBuilder {
  return new FunctionBuilder(parameters);
}

export interface FunctionExpressionOptions {
  body: Builder<StatementBlock>;
  name?: Builder<Identifier> | string;
  parameters: Builder<FormalParameters>;
  returnType?: Builder<AssertsAnnotation | TypeAnnotation | TypePredicateAnnotation>;
  typeParameters?: Builder<TypeParameters>;
}

export namespace function_ {
  export function from(options: FunctionExpressionOptions): FunctionBuilder {
    const b = new FunctionBuilder(options.parameters);
    if (options.body !== undefined) b.body(options.body);
    if (options.name !== undefined) {
      const _v = options.name;
      b.name(typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v);
    }
    if (options.returnType !== undefined) b.returnType(options.returnType);
    if (options.typeParameters !== undefined) b.typeParameters(options.typeParameters);
    return b;
  }
}
