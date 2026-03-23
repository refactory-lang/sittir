import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AttributeItem, Expression, InnerAttributeItem, MatchArm, MatchPattern } from '../types.js';


class MatchArmBuilder extends Builder<MatchArm> {
  private _pattern: Builder<MatchPattern>;
  private _value!: Builder<Expression>;
  private _children: Builder<AttributeItem | InnerAttributeItem>[] = [];

  constructor(pattern: Builder<MatchPattern>) {
    super();
    this._pattern = pattern;
  }

  value(value: Builder<Expression>): this {
    this._value = value;
    return this;
  }

  children(...value: Builder<AttributeItem | InnerAttributeItem>[]): this {
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
      pattern: this._pattern.build(ctx),
      value: this._value?.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as MatchArm;
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

export type { MatchArmBuilder };

export function match_arm(pattern: Builder<MatchPattern>): MatchArmBuilder {
  return new MatchArmBuilder(pattern);
}

export interface MatchArmOptions {
  pattern: Builder<MatchPattern>;
  value: Builder<Expression>;
  children?: Builder<AttributeItem | InnerAttributeItem> | (Builder<AttributeItem | InnerAttributeItem>)[];
}

export namespace match_arm {
  export function from(options: MatchArmOptions): MatchArmBuilder {
    const b = new MatchArmBuilder(options.pattern);
    if (options.value !== undefined) b.value(options.value);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
