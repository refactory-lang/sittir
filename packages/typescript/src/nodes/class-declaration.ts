import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ClassBody, ClassDeclaration, ClassHeritage, Decorator, TypeIdentifier, TypeParameters } from '../types.js';
import { decorator } from './decorator.js';
import type { DecoratorOptions } from './decorator.js';
import { type_parameters } from './type-parameters.js';
import type { TypeParametersOptions } from './type-parameters.js';
import { class_body } from './class-body.js';
import type { ClassBodyOptions } from './class-body.js';
import { class_heritage } from './class-heritage.js';
import type { ClassHeritageOptions } from './class-heritage.js';


class ClassDeclarationBuilder extends Builder<ClassDeclaration> {
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
    parts.push('class');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ClassDeclaration {
    return {
      kind: 'class_declaration',
      decorator: this._decorator.map(c => c.build(ctx)),
      name: this._name.build(ctx),
      typeParameters: this._typeParameters?.build(ctx),
      body: this._body?.build(ctx),
      children: this._children[0]?.build(ctx),
    } as ClassDeclaration;
  }

  override get nodeKind(): string { return 'class_declaration'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._decorator) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'decorator' });
    }
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

export type { ClassDeclarationBuilder };

export function class_declaration(name: Builder<TypeIdentifier>): ClassDeclarationBuilder {
  return new ClassDeclarationBuilder(name);
}

export interface ClassDeclarationOptions {
  decorator?: Builder<Decorator> | DecoratorOptions | (Builder<Decorator> | DecoratorOptions)[];
  name: Builder<TypeIdentifier> | string;
  typeParameters?: Builder<TypeParameters> | TypeParametersOptions;
  body: Builder<ClassBody> | ClassBodyOptions;
  children?: Builder<ClassHeritage> | ClassHeritageOptions | (Builder<ClassHeritage> | ClassHeritageOptions)[];
}

export namespace class_declaration {
  export function from(options: ClassDeclarationOptions): ClassDeclarationBuilder {
    const _ctor = options.name;
    const b = new ClassDeclarationBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.decorator !== undefined) {
      const _v = options.decorator;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.decorator(..._arr.map(_v => _v instanceof Builder ? _v : decorator.from(_v as DecoratorOptions)));
    }
    if (options.typeParameters !== undefined) {
      const _v = options.typeParameters;
      b.typeParameters(_v instanceof Builder ? _v : type_parameters.from(_v as TypeParametersOptions));
    }
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : class_body.from(_v as ClassBodyOptions));
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : class_heritage.from(_x as ClassHeritageOptions)));
    }
    return b;
  }
}
