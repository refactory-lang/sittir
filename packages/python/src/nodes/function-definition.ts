import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, FunctionDefinition, Identifier, Parameters, TypeParameter } from '../types.js';


class FunctionDefinitionBuilder extends Builder<FunctionDefinition> {
  private _body!: Builder<Block>;
  private _name: Builder<Identifier>;
  private _parameters!: Builder<Parameters>;
  private _returnType?: Builder;
  private _typeParameters?: Builder<TypeParameter>;

  constructor(name: Builder<Identifier>) {
    super();
    this._name = name;
  }

  body(value: Builder<Block>): this {
    this._body = value;
    return this;
  }

  parameters(value: Builder<Parameters>): this {
    this._parameters = value;
    return this;
  }

  returnType(value: Builder): this {
    this._returnType = value;
    return this;
  }

  typeParameters(value: Builder<TypeParameter>): this {
    this._typeParameters = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('def');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    if (this._returnType) {
      parts.push('->');
      if (this._returnType) parts.push(this.renderChild(this._returnType, ctx));
    }
    parts.push(':');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FunctionDefinition {
    return {
      kind: 'function_definition',
      body: this._body?.build(ctx),
      name: this._name.build(ctx),
      parameters: this._parameters?.build(ctx),
      returnType: this._returnType?.build(ctx),
      typeParameters: this._typeParameters?.build(ctx),
    } as FunctionDefinition;
  }

  override get nodeKind(): string { return 'function_definition'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'def', type: 'def' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    if (this._returnType) {
      parts.push({ kind: 'token', text: '->', type: '->' });
      if (this._returnType) parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
    }
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { FunctionDefinitionBuilder };

export function function_definition(name: Builder<Identifier>): FunctionDefinitionBuilder {
  return new FunctionDefinitionBuilder(name);
}

export interface FunctionDefinitionOptions {
  body: Builder<Block>;
  name: Builder<Identifier> | string;
  parameters: Builder<Parameters>;
  returnType?: Builder;
  typeParameters?: Builder<TypeParameter>;
}

export namespace function_definition {
  export function from(options: FunctionDefinitionOptions): FunctionDefinitionBuilder {
    const _ctor = options.name;
    const b = new FunctionDefinitionBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.body !== undefined) b.body(options.body);
    if (options.parameters !== undefined) b.parameters(options.parameters);
    if (options.returnType !== undefined) b.returnType(options.returnType);
    if (options.typeParameters !== undefined) b.typeParameters(options.typeParameters);
    return b;
  }
}
