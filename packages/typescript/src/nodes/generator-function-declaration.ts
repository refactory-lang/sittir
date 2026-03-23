import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssertsAnnotation, FormalParameters, GeneratorFunctionDeclaration, Identifier, StatementBlock, TypeAnnotation, TypeParameters, TypePredicateAnnotation } from '../types.js';


class GeneratorFunctionDeclarationBuilder extends Builder<GeneratorFunctionDeclaration> {
  private _body!: Builder<StatementBlock>;
  private _name: Builder<Identifier>;
  private _parameters!: Builder<FormalParameters>;
  private _returnType?: Builder<AssertsAnnotation | TypeAnnotation | TypePredicateAnnotation>;
  private _typeParameters?: Builder<TypeParameters>;

  constructor(name: Builder<Identifier>) {
    super();
    this._name = name;
  }

  body(value: Builder<StatementBlock>): this {
    this._body = value;
    return this;
  }

  parameters(value: Builder<FormalParameters>): this {
    this._parameters = value;
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
    parts.push('*');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    if (this._returnType) parts.push(this.renderChild(this._returnType, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): GeneratorFunctionDeclaration {
    return {
      kind: 'generator_function_declaration',
      body: this._body?.build(ctx),
      name: this._name.build(ctx),
      parameters: this._parameters?.build(ctx),
      returnType: this._returnType?.build(ctx),
      typeParameters: this._typeParameters?.build(ctx),
    } as GeneratorFunctionDeclaration;
  }

  override get nodeKind(): string { return 'generator_function_declaration'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'function', type: 'function' });
    parts.push({ kind: 'token', text: '*', type: '*' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    if (this._returnType) parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { GeneratorFunctionDeclarationBuilder };

export function generator_function_declaration(name: Builder<Identifier>): GeneratorFunctionDeclarationBuilder {
  return new GeneratorFunctionDeclarationBuilder(name);
}

export interface GeneratorFunctionDeclarationOptions {
  body: Builder<StatementBlock>;
  name: Builder<Identifier> | string;
  parameters: Builder<FormalParameters>;
  returnType?: Builder<AssertsAnnotation | TypeAnnotation | TypePredicateAnnotation>;
  typeParameters?: Builder<TypeParameters>;
}

export namespace generator_function_declaration {
  export function from(options: GeneratorFunctionDeclarationOptions): GeneratorFunctionDeclarationBuilder {
    const _ctor = options.name;
    const b = new GeneratorFunctionDeclarationBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.body !== undefined) b.body(options.body);
    if (options.parameters !== undefined) b.parameters(options.parameters);
    if (options.returnType !== undefined) b.returnType(options.returnType);
    if (options.typeParameters !== undefined) b.typeParameters(options.typeParameters);
    return b;
  }
}
