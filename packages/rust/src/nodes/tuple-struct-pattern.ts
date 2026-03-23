import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TupleStructPattern } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class TupleStructPatternBuilder extends BaseBuilder<TupleStructPattern> {
  private _type: Child;
  private _children: Child[] = [];

  constructor(type_: Child) {
    super();
    this._type = type_;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('tuple struct');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TupleStructPattern {
    return {
      kind: 'tuple_struct_pattern',
      type: this.renderChild(this._type, ctx),
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TupleStructPattern;
  }

  override get nodeKind(): string { return 'tuple_struct_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'tuple struct' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function tuple_struct_pattern(type_: Child): TupleStructPatternBuilder {
  return new TupleStructPatternBuilder(type_);
}
