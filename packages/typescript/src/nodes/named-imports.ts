import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { NamedImports } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class NamedImportsBuilder extends BaseBuilder<NamedImports> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): NamedImports {
    return {
      kind: 'named_imports',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as NamedImports;
  }

  override get nodeKind(): string { return 'named_imports'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export function named_imports(): NamedImportsBuilder {
  return new NamedImportsBuilder();
}
