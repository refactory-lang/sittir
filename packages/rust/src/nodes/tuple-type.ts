import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TupleType } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class TupleTypeBuilder extends BaseBuilder<TupleType> {
  private _children: Child[] = [];

  constructor(children: Child[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TupleType {
    return {
      kind: 'tuple_type',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TupleType;
  }

  override get nodeKind(): string { return 'tuple_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export function tuple_type(children: Child[]): TupleTypeBuilder {
  return new TupleTypeBuilder(children);
}
