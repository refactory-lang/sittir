import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MatchArm } from '../types.js';


class MatchArmBuilder extends BaseBuilder<MatchArm> {
  private _pattern: BaseBuilder;
  private _value!: BaseBuilder;
  private _children: BaseBuilder[] = [];

  constructor(pattern: BaseBuilder) {
    super();
    this._pattern = pattern;
  }

  value(value: BaseBuilder): this {
    this._value = value;
    return this;
  }

  children(value: BaseBuilder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._pattern) parts.push(this.renderChild(this._pattern, ctx));
    parts.push('=>');
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    parts.push(',');
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
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._pattern) parts.push({ kind: 'builder', builder: this._pattern, fieldName: 'pattern' });
    parts.push({ kind: 'token', text: '=>', type: '=>' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    parts.push({ kind: 'token', text: ',', type: ',' });
    return parts;
  }
}

export function match_arm(pattern: BaseBuilder): MatchArmBuilder {
  return new MatchArmBuilder(pattern);
}
