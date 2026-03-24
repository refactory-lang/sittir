import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractClassDeclaration, ClassBody, ClassHeritage, Decorator, TypeIdentifier, TypeParameters } from '../types.js';
import { decorator } from './decorator.js';
import type { DecoratorOptions } from './decorator.js';
import { type_parameters } from './type-parameters.js';
import type { TypeParametersOptions } from './type-parameters.js';
import { class_body } from './class-body.js';
import type { ClassBodyOptions } from './class-body.js';
import { class_heritage } from './class-heritage.js';
import type { ClassHeritageOptions } from './class-heritage.js';


class AbstractClassDeclarationBuilder extends Builder<AbstractClassDeclaration> {
  private _decorator: Builder<Decorator>[] = [];
  private _name: Builder<TypeIdentifier>;
  private _typeParameters?: Builder<TypeParameters>;
  private _body!: Builder<ClassBody>;
  private _children: Builder<ClassHeritage>[] = [];

  constructor(name: Builder<TypeIdentifier>) {
    super();
    this._name = name;
  }

  decorator(...value: Builder<Decorator>[]): this {
    this._decorator = value;
    return this;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
    return this;
  }

  body(value: Builder<ClassBody>): this {
    this._body = value;
    return this;
  }

  children(...value: Builder<ClassHeritage>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._decorator.length > 0) parts.push(this.renderChildren(this._decorator, ', ', ctx));
    parts.push('abstract');
    parts.push('class');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AbstractClassDeclaration {
    return {
      kind: 'abstract_class_declaration',
      decorator: this._decorator.map(c => c.build(ctx)),
      name: this._name.build(ctx),
      typeParameters: this._typeParameters ? this._typeParameters.build(ctx) : undefined,
      body: this._body ? this._body.build(ctx) : undefined,
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as AbstractClassDeclaration;
  }

  override get nodeKind(): 'abstract_class_declaration' { return 'abstract_class_declaration'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._decorator) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'decorator' });
    }
    parts.push({ kind: 'token', text: 'abstract', type: 'abstract' });
    parts.push({ kind: 'token', text: 'class', type: 'class' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { AbstractClassDeclarationBuilder };

export function abstract_class_declaration(name: Builder<TypeIdentifier>): AbstractClassDeclarationBuilder {
  return new AbstractClassDeclarationBuilder(name);
}

export interface AbstractClassDeclarationOptions {
  nodeKind: 'abstract_class_declaration';
  decorator?: Builder<Decorator> | Omit<DecoratorOptions, 'nodeKind'> | (Builder<Decorator> | Omit<DecoratorOptions, 'nodeKind'>)[];
  name: Builder<TypeIdentifier> | string;
  typeParameters?: Builder<TypeParameters> | Omit<TypeParametersOptions, 'nodeKind'>;
  body: Builder<ClassBody> | Omit<ClassBodyOptions, 'nodeKind'>;
  children?: Builder<ClassHeritage> | Omit<ClassHeritageOptions, 'nodeKind'> | (Builder<ClassHeritage> | Omit<ClassHeritageOptions, 'nodeKind'>)[];
}

export namespace abstract_class_declaration {
  export function from(options: Omit<AbstractClassDeclarationOptions, 'nodeKind'>): AbstractClassDeclarationBuilder {
    const _ctor = options.name;
    const b = new AbstractClassDeclarationBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.decorator !== undefined) {
      const _v = options.decorator;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.decorator(..._arr.map(_v => _v instanceof Builder ? _v : decorator.from(_v)));
    }
    if (options.typeParameters !== undefined) {
      const _v = options.typeParameters;
      b.typeParameters(_v instanceof Builder ? _v : type_parameters.from(_v));
    }
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : class_body.from(_v));
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : class_heritage.from(_x)));
    }
    return b;
  }
}
