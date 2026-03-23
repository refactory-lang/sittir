import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractClassDeclaration, ClassBody, ClassHeritage, Decorator, TypeIdentifier, TypeParameters } from '../types.js';


class AbstractClassBuilder extends Builder<AbstractClassDeclaration> {
  private _body!: Builder;
  private _decorator: Builder[] = [];
  private _name: Builder;
  private _typeParameters?: Builder;
  private _children: Builder[] = [];

  constructor(name: Builder) {
    super();
    this._name = name;
  }

  body(value: Builder): this {
    this._body = value;
    return this;
  }

  decorator(...value: Builder[]): this {
    this._decorator = value;
    return this;
  }

  typeParameters(value: Builder): this {
    this._typeParameters = value;
    return this;
  }

  children(...value: Builder[]): this {
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
      body: this._body ? this.renderChild(this._body, ctx) : undefined,
      decorator: this._decorator.map(c => this.renderChild(c, ctx)),
      name: this.renderChild(this._name, ctx),
      typeParameters: this._typeParameters ? this.renderChild(this._typeParameters, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as AbstractClassDeclaration;
  }

  override get nodeKind(): string { return 'abstract_class_declaration'; }

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

export type { AbstractClassBuilder };

export function abstract_class(name: Builder): AbstractClassBuilder {
  return new AbstractClassBuilder(name);
}

export interface AbstractClassDeclarationOptions {
  body: Builder<ClassBody>;
  decorator?: Builder<Decorator> | (Builder<Decorator>)[];
  name: Builder<TypeIdentifier> | string;
  typeParameters?: Builder<TypeParameters>;
  children?: Builder<ClassHeritage> | (Builder<ClassHeritage>)[];
}

export namespace abstract_class {
  export function from(options: AbstractClassDeclarationOptions): AbstractClassBuilder {
    const _ctor = options.name;
    const b = new AbstractClassBuilder(typeof _ctor === 'string' ? new LeafBuilder('type_identifier', _ctor) : _ctor);
    if (options.body !== undefined) b.body(options.body);
    if (options.decorator !== undefined) {
      const _v = options.decorator;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.decorator(..._arr);
    }
    if (options.typeParameters !== undefined) b.typeParameters(options.typeParameters);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
