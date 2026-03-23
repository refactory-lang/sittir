import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BreakStatement, StatementIdentifier } from '../types.js';


class BreakBuilder extends Builder<BreakStatement> {
  private _label?: Builder;

  constructor() { super(); }

  label(value: Builder): this {
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

export type { BreakBuilder };

export function break_(): BreakBuilder {
  return new BreakBuilder();
}

export interface BreakStatementOptions {
  label?: Builder<StatementIdentifier> | string;
}

export namespace break_ {
  export function from(options: BreakStatementOptions): BreakBuilder {
    const b = new BreakBuilder();
    if (options.label !== undefined) {
      const _v = options.label;
      b.label(typeof _v === 'string' ? new LeafBuilder('statement_identifier', _v) : _v);
    }
    return b;
  }
}
