import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ClassDeclaration } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ClassBuilder extends BaseBuilder<ClassDeclaration> {
  private _body!: Child;
  private _decorator: Child[] = [];
  private _name: Child;
  private _typeParameters?: Child;
  private _children: Child[] = [];

  constructor(name: Child) {
    super();
    this._name = name;
  }

  body(value: Child): this {
    this._body = value;
    return this;
  }

  decorator(value: Child[]): this {
    this._decorator = value;
    return this;
  }

  typeParameters(value: Child): this {
    this._typeParameters = value;
    return this;
  }

  children(value: Child[]): this {
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
      body: this._body ? this.renderChild(this._body, ctx) : undefined,
      decorator: this._decorator.map(c => this.renderChild(c, ctx)),
      name: this.renderChild(this._name, ctx),
      typeParameters: this._typeParameters ? this.renderChild(this._typeParameters, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ClassDeclaration;
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

export function class_(name: Child): ClassBuilder {
  return new ClassBuilder(name);
}
