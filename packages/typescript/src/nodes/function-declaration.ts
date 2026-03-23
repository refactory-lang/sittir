import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssertsAnnotation, FormalParameters, FunctionDeclaration, Identifier, StatementBlock, TypeAnnotation, TypeParameters, TypePredicateAnnotation } from '../types.js';
import { type_parameters } from './type-parameters.js';
import type { TypeParametersOptions } from './type-parameters.js';
import { formal_parameters } from './formal-parameters.js';
import type { FormalParametersOptions } from './formal-parameters.js';
import { statement_block } from './statement-block.js';
import type { StatementBlockOptions } from './statement-block.js';


class FunctionDeclarationBuilder extends Builder<FunctionDeclaration> {
  private _name: Builder<Identifier>;
  private _typeParameters?: Builder<TypeParameters>;
  private _parameters!: Builder<FormalParameters>;
  private _returnType?: Builder<TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation>;
  private _body!: Builder<StatementBlock>;

  constructor(name: Builder<Identifier>) {
    super();
    this._name = name;
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

  body(value: Builder<StatementBlock>): this {
    this._body = value;
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

  build(ctx?: RenderContext): FunctionDeclaration {
    return {
      kind: 'function_declaration',
      name: this._name.build(ctx),
      typeParameters: this._typeParameters?.build(ctx),
      parameters: this._parameters?.build(ctx),
      returnType: this._returnType?.build(ctx),
      body: this._body?.build(ctx),
    } as FunctionDeclaration;
  }

  override get nodeKind(): string { return 'function_declaration'; }

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

export type { FunctionDeclarationBuilder };

export function function_declaration(name: Builder<Identifier>): FunctionDeclarationBuilder {
  return new FunctionDeclarationBuilder(name);
}

export interface FunctionDeclarationOptions {
  name: Builder<Identifier> | string;
  typeParameters?: Builder<TypeParameters> | TypeParametersOptions;
  parameters: Builder<FormalParameters> | FormalParametersOptions;
  returnType?: Builder<TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation>;
  body: Builder<StatementBlock> | StatementBlockOptions;
}

export namespace function_declaration {
  export function from(options: FunctionDeclarationOptions): FunctionDeclarationBuilder {
    const _ctor = options.name;
    const b = new FunctionDeclarationBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.typeParameters !== undefined) {
      const _v = options.typeParameters;
      b.typeParameters(_v instanceof Builder ? _v : type_parameters.from(_v as TypeParametersOptions));
    }
    if (options.parameters !== undefined) {
      const _v = options.parameters;
      b.parameters(_v instanceof Builder ? _v : formal_parameters.from(_v as FormalParametersOptions));
    }
    if (options.returnType !== undefined) b.returnType(options.returnType);
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : statement_block.from(_v as StatementBlockOptions));
    }
    return b;
  }
}
