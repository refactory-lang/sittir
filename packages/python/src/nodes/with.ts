import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, WithItem } from '../types.js';


class WithBuilder extends Builder<WithItem> {
  private _value: Builder<Expression>;

  constructor(value: Builder<Expression>) {
    super();
    this._value = value;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): WithItem {
    return {
      kind: 'with_item',
      value: this._value.build(ctx),
    } as WithItem;
  }

  override get nodeKind(): string { return 'with_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export type { WithBuilder };

export function with_(value: Builder<Expression>): WithBuilder {
  return new WithBuilder(value);
}

export interface WithItemOptions {
  value: Builder<Expression>;
}

export namespace with_ {
  export function from(options: WithItemOptions): WithBuilder {
    const b = new WithBuilder(options.value);
    return b;
  }
}
