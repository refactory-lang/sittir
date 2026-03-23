import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TupleStructPattern } from '../types.js';


class TupleStructPatternBuilder extends BaseBuilder<TupleStructPattern> {
  private _type: BaseBuilder;
  private _children: BaseBuilder[] = [];

  constructor(type_: BaseBuilder) {
    super();
    this._type = type_;
  }

  children(value: BaseBuilder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(')');
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
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export function tuple_struct_pattern(type_: BaseBuilder): TupleStructPatternBuilder {
  return new TupleStructPatternBuilder(type_);
}
