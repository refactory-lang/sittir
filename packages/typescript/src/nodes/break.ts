import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BreakStatement } from '../types.js';


class BreakBuilder extends BaseBuilder<BreakStatement> {
  private _label?: BaseBuilder;

  constructor() { super(); }

  label(value: BaseBuilder): this {
    this._label = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('break');
    if (this._label) parts.push(this.renderChild(this._label, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): BreakStatement {
    return {
      kind: 'break_statement',
      label: this._label ? this.renderChild(this._label, ctx) : undefined,
    } as unknown as BreakStatement;
  }

  override get nodeKind(): string { return 'break_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'break', type: 'break' });
    if (this._label) parts.push({ kind: 'builder', builder: this._label, fieldName: 'label' });
    return parts;
  }
}

export function break_(): BreakBuilder {
  return new BreakBuilder();
}
