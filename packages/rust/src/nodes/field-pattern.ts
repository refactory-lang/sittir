import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { FieldPattern } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class FieldPatternBuilder extends BaseBuilder<FieldPattern> {
  private _name: Child;
  private _pattern?: Child;
  private _children: Child[] = [];

  constructor(name: Child) {
    super();
    this._name = name;
  }

  pattern(value: Child): this {
    this._pattern = value;
    return this;
  }

  children(value: Child[]): this {
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

export function field_pattern(name: Child): FieldPatternBuilder {
  return new FieldPatternBuilder(name);
}
