import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TypeArguments } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class TypeArgumentsBuilder extends BaseBuilder<TypeArguments> {
  private _children: Child[] = [];

  constructor(children: Child[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('<');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('>');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeArguments {
    return {
      kind: 'type_arguments',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TypeArguments;
  }

  override get nodeKind(): string { return 'type_arguments'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '<', type: '<' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '>', type: '>' });
    return parts;
  }
}

export function type_arguments(children: Child[]): TypeArgumentsBuilder {
  return new TypeArgumentsBuilder(children);
}
