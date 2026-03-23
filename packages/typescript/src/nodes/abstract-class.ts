import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AbstractClassDeclaration } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class AbstractClassBuilder extends BaseBuilder<AbstractClassDeclaration> {
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
    if (this._children.length > 0) {
      parts.push(this.renderChildren(this._children, ' ', ctx));
    }
    parts.push('abstract class');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._decorator.length > 0) parts.push(this.renderChildren(this._decorator, ', ', ctx));
    if (this._body) {
      parts.push('{');
      parts.push(this.renderChild(this._body, ctx));
      parts.push('}');
    }
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
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: 'abstract class' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    for (const child of this._decorator) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'decorator' });
    }
    if (this._body) {
      parts.push({ kind: 'token', text: '{', type: '{' });
      parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
      parts.push({ kind: 'token', text: '}', type: '}' });
    }
    return parts;
  }
}

export function abstract_class(name: Child): AbstractClassBuilder {
  return new AbstractClassBuilder(name);
}
