import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ExternCrateDeclaration } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ExternCrateBuilder extends BaseBuilder<ExternCrateDeclaration> {
  private _alias?: Child;
  private _name: Child;
  private _children: Child[] = [];

  constructor(name: Child) {
    super();
    this._name = name;
  }

  alias(value: Child): this {
    this._alias = value;
    return this;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('extern');
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._alias) {
      parts.push('as');
      if (this._alias) parts.push(this.renderChild(this._alias, ctx));
    }
    parts.push(';');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExternCrateDeclaration {
    return {
      kind: 'extern_crate_declaration',
      alias: this._alias ? this.renderChild(this._alias, ctx) : undefined,
      name: this.renderChild(this._name, ctx),
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ExternCrateDeclaration;
  }

  override get nodeKind(): string { return 'extern_crate_declaration'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: 'extern', type: 'extern' });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._alias) {
      parts.push({ kind: 'token', text: 'as', type: 'as' });
      if (this._alias) parts.push({ kind: 'builder', builder: this._alias, fieldName: 'alias' });
    }
    parts.push({ kind: 'token', text: ';', type: ';' });
    return parts;
  }
}

export function extern_crate(name: Child): ExternCrateBuilder {
  return new ExternCrateBuilder(name);
}
