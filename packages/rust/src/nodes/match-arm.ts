import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MatchArm } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class MatchArmBuilder extends BaseBuilder<MatchArm> {
  private _pattern: Child;
  private _value!: Child;
  private _children: Child[] = [];

  constructor(pattern: Child) {
    super();
    this._pattern = pattern;
  }

  value(value: Child): this {
    this._value = value;
    return this;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._pattern) parts.push(this.renderChild(this._pattern, ctx));
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): MatchArm {
    return {
      kind: 'match_arm',
      pattern: this.renderChild(this._pattern, ctx),
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as MatchArm;
  }

  override get nodeKind(): string { return 'match_arm'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._pattern) parts.push({ kind: 'builder', builder: this._pattern, fieldName: 'pattern' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function match_arm(pattern: Child): MatchArmBuilder {
  return new MatchArmBuilder(pattern);
}
