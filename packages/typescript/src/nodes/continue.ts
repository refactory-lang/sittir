import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ContinueStatement } from '../types.js';


class ContinueBuilder extends BaseBuilder<ContinueStatement> {
  private _label?: BaseBuilder;

  constructor() { super(); }

  label(value: BaseBuilder): this {
    this._label = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('continue');
    if (this._label) parts.push(this.renderChild(this._label, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ContinueStatement {
    return {
      kind: 'continue_statement',
      label: this._label ? this.renderChild(this._label, ctx) : undefined,
    } as unknown as ContinueStatement;
  }

  override get nodeKind(): string { return 'continue_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'continue', type: 'continue' });
    if (this._label) parts.push({ kind: 'builder', builder: this._label, fieldName: 'label' });
    return parts;
  }
}

export function continue_(): ContinueBuilder {
  return new ContinueBuilder();
}
