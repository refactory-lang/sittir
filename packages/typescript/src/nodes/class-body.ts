import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ClassBody } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ClassBodyBuilder extends BaseBuilder<ClassBody> {
  private _decorator: Child[] = [];
  private _children: Child[] = [];

  constructor() { super(); }

  decorator(value: Child[]): this {
    this._decorator = value;
    return this;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._decorator.length > 0) parts.push(this.renderChildren(this._decorator, ', ', ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ClassBody {
    return {
      kind: 'class_body',
      decorator: this._decorator.map(c => this.renderChild(c, ctx)),
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ClassBody;
  }

  override get nodeKind(): string { return 'class_body'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    for (const child of this._decorator) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'decorator' });
    }
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export function class_body(): ClassBodyBuilder {
  return new ClassBodyBuilder();
}
