import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssertsAnnotation, FormalParameters, GeneratorFunctionDeclaration, Identifier, StatementBlock, TypeAnnotation, TypeParameters, TypePredicateAnnotation } from '../types.js';
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


class GeneratorFunctionDeclarationBuilder extends Builder<GeneratorFunctionDeclaration> {
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
      name: this._name.build(ctx),
      typeParameters: this._typeParameters ? this._typeParameters.build(ctx) : undefined,
      parameters: this._parameters ? this._parameters.build(ctx) : undefined,
      returnType: this._returnType ? this._returnType.build(ctx) : undefined,
      body: this._body ? this._body.build(ctx) : undefined,
    } as GeneratorFunctionDeclaration;
  }

  override get nodeKind(): 'generator_function_declaration' { return 'generator_function_declaration'; }

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
  nodeKind: 'generator_function_declaration';
  name: Builder<Identifier> | string;
  typeParameters?: Builder<TypeParameters> | Omit<TypeParametersOptions, 'nodeKind'>;
  parameters: Builder<FormalParameters> | Omit<FormalParametersOptions, 'nodeKind'>;
  returnType?: Builder<TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation> | TypeAnnotationOptions | AssertsAnnotationOptions | TypePredicateAnnotationOptions;
  body: Builder<StatementBlock> | Omit<StatementBlockOptions, 'nodeKind'>;
}

export namespace generator_function_declaration {
  export function from(options: Omit<GeneratorFunctionDeclarationOptions, 'nodeKind'>): GeneratorFunctionDeclarationBuilder {
    const _ctor = options.name;
    const b = new GeneratorFunctionDeclarationBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
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
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : statement_block.from(_v));
    }
    return b;
  }
}
