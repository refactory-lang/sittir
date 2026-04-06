import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FieldPattern } from '../types.js';


class FieldPatternBuilder extends BaseBuilder<FieldPattern> {
  private _name: BaseBuilder;
  private _pattern?: BaseBuilder;
  private _children: BaseBuilder[] = [];

  constructor(name: BaseBuilder) {
    super();
    this._name = name;
  }

  pattern(value: BaseBuilder): this {
    this._pattern = value;
    return this;
  }

  children(value: BaseBuilder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FieldPattern {
    return {
      kind: 'field_pattern',
      name: this.renderChild(this._name, ctx),
      pattern: this._pattern ? this.renderChild(this._pattern, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as FieldPattern;
  }

  override get nodeKind(): string { return 'field_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    return parts;
  }
}

export function field_pattern(name: BaseBuilder): FieldPatternBuilder {
  return new FieldPatternBuilder(name);
}
